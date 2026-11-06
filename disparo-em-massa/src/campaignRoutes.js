import express from 'express'
import multer from 'multer'
import * as store from './db.js'
import * as license from './license.js'
import * as whatsapp from './whatsapp.js'
import * as campaigns from './campaigns.js'
import { startDispatch } from './sender.js'
import { scheduleMessage, cancelScheduledMessage } from './scheduler.js'
import { convertWebmToOggOpus } from './audio.js'

// Rotas da tela "Campanhas": criar pelo assistente (POST /api/campaigns), listar, funil,
// pausar/retomar, mover contato de etapa, anotação e horário padrão dos follow-ups.
//
// A opção rápida "Criar como campanha" do painel de disparo continua passando por
// POST /api/dispatch e /api/scheduled — esta rota é a do assistente completo, com público,
// variáveis, horário próprio e etiquetas automáticas.

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } })
const uploadCampaignFiles = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'followupFiles', maxCount: campaigns.MAX_FOLLOWUPS }
])

function parseJson(raw, fallback, errorMessage) {
  if (raw === undefined || raw === null || raw === '') return fallback
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(errorMessage)
  }
}

// Resolve o público escolhido no assistente numa lista única de contatos { jid, name }.
function resolveAudience(audience, { excludeActive }) {
  if (!audience || typeof audience !== 'object') throw new Error('Escolha quem vai receber a campanha.')
  let contacts = []
  let origin = ''
  if (audience.type === 'labels') {
    const labelIds = Array.isArray(audience.labelIds) ? audience.labelIds.map(String) : []
    if (labelIds.length === 0) throw new Error('Selecione pelo menos uma etiqueta.')
    const labels = store.listLabels()
    const selected = labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean)
    if (selected.length !== labelIds.length) throw new Error('Uma ou mais etiquetas não foram encontradas.')
    contacts = store.listContactsForLabels(labelIds)
    origin = `Etiquetas: ${selected.map((l) => l.name).join(', ')}`
  } else if (audience.type === 'contacts' || audience.type === 'spreadsheet') {
    if (!Array.isArray(audience.contacts) || audience.contacts.length === 0) {
      throw new Error('Selecione pelo menos um contato.')
    }
    contacts = audience.contacts
      .filter((c) => c && typeof c.jid === 'string' && c.jid.includes('@'))
      .map((c) => ({ jid: c.jid, name: c.name ? String(c.name).slice(0, 120) : null }))
    origin = audience.type === 'spreadsheet' ? `Planilha (${contacts.length} contatos)` : `${contacts.length} contato(s) selecionado(s)`
  } else {
    throw new Error('Escolha quem vai receber a campanha.')
  }

  const seen = new Map()
  for (const c of contacts) {
    if (store.isOptedOut(c.jid)) continue
    if (!seen.has(c.jid)) seen.set(c.jid, c)
  }
  let result = Array.from(seen.values())
  let excludedActive = 0
  if (excludeActive) {
    const busy = campaigns.jidsInActiveFollowup()
    const before = result.length
    result = result.filter((c) => !busy.has(c.jid))
    excludedActive = before - result.length
  }
  return { contacts: result, origin, excludedActive }
}

router.post('/api/campaigns', uploadCampaignFiles, (req, res) => {
  if (!license.isActivated()) {
    return res.status(403).json({ error: 'Licença não ativada.' })
  }

  let input
  let variables
  let sendWindow
  let audience
  let scheduledFor = null
  try {
    const name = String(req.body.name || '').trim()
    // reaproveita a validação de nome + follow-ups (prazos, texto/arquivo) da opção rápida
    input = campaigns.parseCampaignInput(
      { createCampaign: 'true', campaignName: name, followupsJson: req.body.followupsJson },
      req.files
    ).input
    variables = campaigns.parseVariables(req.body.variablesJson)
    const rawWindow = parseJson(req.body.sendWindowJson, null, 'Horário inválido.')
    sendWindow = rawWindow ? campaigns.validateSendWindow(rawWindow) : null
    audience = resolveAudience(
      parseJson(req.body.audienceJson, null, 'Público inválido.'),
      { excludeActive: req.body.excludeActive === 'true' }
    )
    if (req.body.scheduledFor) {
      scheduledFor = new Date(req.body.scheduledFor)
      if (Number.isNaN(scheduledFor.getTime())) throw new Error('Data/hora de início inválida.')
      if (scheduledFor.getTime() <= Date.now()) throw new Error('Escolha um horário de início no futuro.')
    }
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  if (audience.contacts.length === 0) {
    const why = audience.excludedActive > 0
      ? ' Todos já estão recebendo follow-up de outra campanha ativa.'
      : ' (Quem pediu para não receber mais mensagens é sempre removido.)'
    return res.status(400).json({ error: 'Nenhum contato para enviar.' + why })
  }

  const message = String(req.body.message || '').trim()
  let file = req.files?.file?.[0] || null
  if (!message && !file) {
    return res.status(400).json({ error: 'Escreva a primeira mensagem ou anexe um arquivo.' })
  }
  const missing = campaigns.findMissingVariables([message, ...input.steps.map((s) => s.message)], variables)
  if (missing.length > 0) {
    return res.status(400).json({ error: `Preencha o valor de: ${missing.map((k) => `{{${k}}}`).join(', ')}.` })
  }

  const labels = store.listLabels()
  const applyLabelId = req.body.applyLabelId || null
  const replyLabelId = req.body.replyLabelId || null
  if (applyLabelId && !labels.some((l) => l.id === applyLabelId)) {
    return res.status(400).json({ error: 'Etiqueta para aplicar após o envio não encontrada.' })
  }
  if (replyLabelId && !labels.some((l) => l.id === replyLabelId)) {
    return res.status(400).json({ error: 'Etiqueta para quem responder não encontrada.' })
  }

  const asVoiceNote = !!file && file.mimetype.startsWith('audio/')
  if (file && asVoiceNote && file.mimetype.startsWith('audio/webm')) {
    const ogg = convertWebmToOggOpus(file.buffer)
    if (ogg) file = { ...file, buffer: ogg, mimetype: 'audio/ogg; codecs=opus' }
  }

  const simulateTyping = req.body.simulateTyping !== 'false'
  const skipBlocked = req.body.skipBlocked !== 'false'
  const markAsRead = req.body.markAsRead === 'true'
  const finalMessage = campaigns.applyVariables(message, variables)
  const extras = {
    description: String(req.body.description || '').trim().slice(0, 500),
    variables,
    sendWindow,
    replyLabelId,
    templateId: req.body.templateId || null
  }

  // ----- Agendada: a campanha nasce quando o horário chegar (src/scheduler.js) -----
  if (scheduledFor) {
    try {
      const entry = scheduleMessage({
        scheduledFor: scheduledFor.toISOString(),
        labelIds: null,
        labelName: audience.origin,
        contacts: audience.contacts,
        message: finalMessage,
        messageType: 'media',
        asVoiceNote,
        pollQuestion: null,
        pollOptions: [],
        simulateTyping,
        skipBlocked,
        markAsRead,
        applyLabelId,
        removeLabelId: null,
        file,
        albumFiles: [],
        campaign: campaigns.persistCampaignInput(input, extras)
      })
      return res.json({ scheduled: true, scheduledId: entry.id, total: audience.contacts.length })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
  }

  // ----- Agora -----
  try {
    whatsapp.getSock()
  } catch (err) {
    return res.status(409).json({ error: err.message })
  }
  const settings = store.getSettings()
  if (settings.dailyLimit > 0 && store.countSendsInWindow(24).total >= settings.dailyLimit) {
    return res.status(429).json({ error: `Limite diário de ${settings.dailyLimit} envios já foi atingido. Agende a campanha para amanhã ou ajuste em Configurações de envio.` })
  }

  const campaign = campaigns.createCampaign(campaigns.persistCampaignInput(input, extras), {
    origin: audience.origin,
    initialPreview: campaigns.describeInitialMessage('media', finalMessage, null, file, [])
  })

  let jobId
  try {
    jobId = startDispatch({
      ...campaigns.initialDispatchHooks(campaign.id, audience.contacts.length),
      labelIds: null,
      labelName: `Campanha "${campaign.name}"`,
      contacts: audience.contacts,
      message: finalMessage,
      file,
      albumFiles: [],
      messageType: 'media',
      asVoiceNote,
      simulateTyping,
      skipBlocked,
      markAsRead,
      applyLabelId,
      removeLabelId: null
    })
  } catch (err) {
    try {
      campaigns.deleteCampaign(campaign.id)
    } catch {
      // já não existe
    }
    return res.status(409).json({ error: err.message })
  }

  res.json({ jobId, campaignId: campaign.id, total: audience.contacts.length, excludedActive: audience.excludedActive })
})

// Lista: campanhas criadas + campanhas agendadas que ainda não começaram (essas só existem
// como agendamento até o horário chegar, mas o usuário espera vê-las aqui).
router.get('/api/campaigns', (req, res) => {
  const scheduled = store.listScheduledMessages()
    .filter((m) => m.status === 'pending' && m.payload?.campaign)
    .map((m) => ({
      id: `scheduled:${m.id}`,
      scheduledId: m.id,
      name: m.payload.campaign.name,
      description: m.payload.campaign.description || '',
      status: 'scheduled',
      scheduledFor: m.scheduledFor,
      createdAt: m.createdAt,
      origin: m.payload.labelName,
      total: (m.payload.contacts || []).length,
      followupCount: m.payload.campaign.steps.length,
      initialPreview: (m.payload.message || '').slice(0, 300)
    }))
  res.json([...scheduled, ...campaigns.listCampaignSummaries()])
})

router.delete('/api/campaigns/scheduled/:id', (req, res) => {
  try {
    cancelScheduledMessage(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/api/campaigns/:id', (req, res) => {
  const detail = campaigns.getCampaignDetail(req.params.id)
  if (!detail) return res.status(404).json({ error: 'Campanha não encontrada.' })
  res.json(detail)
})

router.post('/api/campaigns/:id/pause', (req, res) => {
  try {
    res.json(campaigns.setCampaignStatus(req.params.id, 'paused'))
  } catch (err) {
    res.status(404).json({ error: err.message })
  }
})

router.post('/api/campaigns/:id/resume', (req, res) => {
  try {
    res.json(campaigns.setCampaignStatus(req.params.id, 'active'))
  } catch (err) {
    res.status(404).json({ error: err.message })
  }
})

router.delete('/api/campaigns/:id', (req, res) => {
  try {
    campaigns.deleteCampaign(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(409).json({ error: err.message })
  }
})

router.patch('/api/campaigns/:id/contacts/:jid', (req, res) => {
  const { stage, note } = req.body || {}
  try {
    res.json(campaigns.updateCampaignContact(req.params.id, req.params.jid, { stage, note }))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/api/campaign-settings', (req, res) => {
  res.json(store.getCampaignSettings())
})

router.put('/api/campaign-settings', (req, res) => {
  try {
    const sendWindow = campaigns.validateSendWindow(req.body?.sendWindow)
    res.json(store.updateCampaignSettings({ sendWindow }))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router
