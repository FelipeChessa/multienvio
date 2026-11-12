import express from 'express'
import multer from 'multer'
import * as store from './db.js'
import * as license from './license.js'
import { prepareAttachments, MAX_ATTACHMENTS } from './attachments.js'
import { scheduleMessage, cancelScheduledMessage } from './scheduler.js'
import { parseCampaignInput, persistCampaignInput, MAX_FOLLOWUPS } from './campaigns.js'
import { sanitizeVars, contactVarKeys, findUnknownVariables, unknownVariablesMessage } from './variables.js'

// Rotas de mensagem agendada, num router separado pra não inchar mais src/server.js. A
// validação aqui espelha a de POST /api/dispatch (mesmos tipos de mensagem, mesmas regras) —
// não reaproveita o handler de lá porque ele já dispara de verdade em vez de só agendar.
const MAX_ALBUM_FILES = 5
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } })
const uploadFiles = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'attachments', maxCount: MAX_ATTACHMENTS },
  { name: 'files', maxCount: MAX_ALBUM_FILES },
  { name: 'followupFiles', maxCount: MAX_FOLLOWUPS }
])

const router = express.Router()

router.get('/api/scheduled', (req, res) => {
  res.json(store.listScheduledMessages())
})

router.post('/api/scheduled', uploadFiles, (req, res) => {
  if (!license.isActivated()) {
    return res.status(403).json({ error: 'Licença não ativada.' })
  }

  const { message, contactsJson, scheduledFor } = req.body
  const messageType = req.body.messageType || 'media'
  const asVoiceNote = req.body.asVoiceNote === 'true'
  let labelIds = req.body.labelIds
  if (!labelIds) labelIds = []
  else if (!Array.isArray(labelIds)) labelIds = [labelIds]

  const simulateTyping = req.body.simulateTyping !== 'false'
  const skipBlocked = req.body.skipBlocked !== 'false'
  const markAsRead = req.body.markAsRead === 'true'
  const applyLabelId = req.body.applyLabelId || null
  const removeLabelId = req.body.removeLabelId || null

  const when = new Date(scheduledFor)
  if (!scheduledFor || Number.isNaN(when.getTime())) {
    return res.status(400).json({ error: 'Data/hora de agendamento inválida.' })
  }
  if (when.getTime() <= Date.now()) {
    return res.status(400).json({ error: 'Escolha um horário no futuro.' })
  }

  const hasAttachments = (req.files?.file?.length || 0) + (req.files?.attachments?.length || 0) > 0
  if (messageType === 'media' && (!message || !message.trim()) && !hasAttachments) {
    return res.status(400).json({ error: 'Escreva a mensagem ou anexe um arquivo.' })
  }

  let pollQuestion = null
  let pollOptions = []
  if (messageType === 'poll') {
    pollQuestion = (req.body.pollQuestion || '').trim()
    pollOptions = req.body.pollOptions
    if (!pollOptions) pollOptions = []
    else if (!Array.isArray(pollOptions)) pollOptions = [pollOptions]
    pollOptions = pollOptions.map((o) => String(o).trim()).filter(Boolean)
    if (!pollQuestion || pollOptions.length < 2) {
      return res.status(400).json({ error: 'Enquete precisa de uma pergunta e pelo menos 2 opções.' })
    }
  }
  if (messageType === 'location') {
    const loc = store.getMessagingProfile().location
    if (loc.lat == null || loc.lng == null) {
      return res.status(400).json({ error: 'Configure a localização antes de agendar.' })
    }
  }
  if (messageType === 'contact') {
    const card = store.getMessagingProfile().businessCard
    if (!card.name || !card.phone) {
      return res.status(400).json({ error: 'Configure o cartão de contato antes de agendar.' })
    }
  }

  const albumFiles = req.files?.files || []
  if (messageType === 'album') {
    if (albumFiles.length < 2) {
      return res.status(400).json({ error: 'Selecione pelo menos 2 fotos/vídeos para o álbum.' })
    }
    const invalid = albumFiles.find((f) => !f.mimetype.startsWith('image/') && !f.mimetype.startsWith('video/'))
    if (invalid) {
      return res.status(400).json({ error: 'Álbum só aceita imagens e vídeos.' })
    }
  }

  let explicitContacts = null
  if (contactsJson) {
    try {
      explicitContacts = JSON.parse(contactsJson)
    } catch {
      return res.status(400).json({ error: 'Lista de contatos inválida.' })
    }
    if (!Array.isArray(explicitContacts) || explicitContacts.length === 0) {
      return res.status(400).json({ error: 'Selecione ao menos um contato para agendar.' })
    }
    explicitContacts = explicitContacts.map((c) => ({ ...c, vars: sanitizeVars(c?.vars) }))
  }

  {
    const available = contactVarKeys(explicitContacts)
    const unknown = findUnknownVariables([message, req.body.pollQuestion], available)
    if (unknown.length > 0) return res.status(400).json({ error: unknownVariablesMessage(unknown, available) })
  }

  let labelName = null
  if (!explicitContacts) {
    if (labelIds.length === 0) {
      return res.status(400).json({ error: 'Selecione ao menos uma etiqueta.' })
    }
    const labels = store.listLabels()
    const selectedLabels = labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean)
    if (selectedLabels.length !== labelIds.length) {
      return res.status(404).json({ error: 'Uma ou mais etiquetas não foram encontradas.' })
    }
    labelName = selectedLabels.map((l) => l.name).join(', ')
  }

  if (applyLabelId || removeLabelId) {
    const labels = store.listLabels()
    if (applyLabelId && !labels.some((l) => l.id === applyLabelId)) {
      return res.status(400).json({ error: 'Etiqueta para aplicar após envio não encontrada.' })
    }
    if (removeLabelId && !labels.some((l) => l.id === removeLabelId)) {
      return res.status(400).json({ error: 'Etiqueta para remover após envio não encontrada.' })
    }
  }

  let campaignInput = null
  try {
    campaignInput = parseCampaignInput(req.body, req.files).input
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
  if (campaignInput) {
    const available = contactVarKeys(explicitContacts)
    const unknown = findUnknownVariables(campaignInput.steps.map((st) => st.message), available)
    if (unknown.length > 0) return res.status(400).json({ error: 'Follow-up: ' + unknownVariablesMessage(unknown, available) })
  }

  // mesma remuxagem de nota de voz gravada que POST /api/dispatch faz (ver src/audio.js) —
  // feita agora, na criação do agendamento, não no disparo futuro, pra já persistir o arquivo
  // final certo em disco.
  const files = prepareAttachments(req.files, asVoiceNote)

  try {
    const entry = scheduleMessage({
      scheduledFor: when.toISOString(),
      labelIds: explicitContacts ? null : labelIds,
      labelName,
      contacts: explicitContacts,
      message: (message || '').trim(),
      messageType,
      asVoiceNote,
      pollQuestion,
      pollOptions,
      simulateTyping,
      skipBlocked,
      markAsRead,
      applyLabelId,
      removeLabelId,
      files,
      albumFiles,
      // a campanha só é criada quando o envio sair de fato (src/scheduler.js); até lá os
      // anexos dos follow-ups ficam gravados em disco junto com o agendamento
      campaign: campaignInput ? persistCampaignInput(campaignInput) : null
    })
    res.json({ ok: true, scheduled: entry })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/api/scheduled/:id', (req, res) => {
  try {
    cancelScheduledMessage(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router
