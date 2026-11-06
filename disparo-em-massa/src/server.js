import './env.js' // precisa carregar antes dos módulos que leem process.env no topo do arquivo

import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import multer from 'multer'

import * as whatsapp from './whatsapp.js'
import * as store from './db.js'
import * as license from './license.js'
import { startDispatch, subscribeToJob, isBusy } from './sender.js'
import { parseSpreadsheetRows } from './spreadsheet.js'
import { normalizePhoneCandidates } from './phone.js'
import { convertWebmToOggOpus } from './audio.js'
import * as updateState from './updateState.js'
import scheduledRoutes from './scheduledRoutes.js'
import { initScheduler } from './scheduler.js'
import templateRoutes from './templateRoutes.js'
import productRoutes from './productRoutes.js'
import campaignRoutes from './campaignRoutes.js'
import prospectRoutes from './prospectRoutes.js'
import dashboardRoutes from './dashboardRoutes.js'
import { initProspecting } from './prospecting.js'
import { prepareAttachments, MAX_ATTACHMENTS } from './attachments.js'
import { initCampaigns, parseCampaignInput, persistCampaignInput, createCampaign, deleteCampaign, initialDispatchHooks, describeInitialMessage, MAX_FOLLOWUPS } from './campaigns.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.PORT || 3210)
const MAX_ALBUM_FILES = 5
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } })
const uploadDispatchFiles = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'attachments', maxCount: MAX_ATTACHMENTS },
  { name: 'files', maxCount: MAX_ALBUM_FILES },
  { name: 'followupFiles', maxCount: MAX_FOLLOWUPS }
])

let whatsappStarted = false

function startWhatsappOnce() {
  if (whatsappStarted) return
  whatsappStarted = true
  whatsapp.start().catch((err) => {
    console.error('Falha ao iniciar conexão com o WhatsApp:', err)
  })
}

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(scheduledRoutes)
app.use(templateRoutes)
app.use(productRoutes)
app.use(campaignRoutes)
app.use(prospectRoutes)
app.use(dashboardRoutes)

// rearma os agendamentos pendentes salvos em data/app.json — precisa vir depois que o app
// (express) já existe mas independe de licença/conexão WhatsApp (a checagem é no disparo)
initScheduler()
// liga a detecção de respostas e a fila de follow-ups das campanhas
initCampaigns()
// envio gota a gota das listas de prospecção (leads frios)
initProspecting()

app.get('/api/license/status', (req, res) => {
  res.json(license.getStatus())
})

app.post('/api/license/activate', async (req, res) => {
  try {
    const info = await license.activate((req.body && req.body.key) || '')
    startWhatsappOnce()
    res.json({ ok: true, ...info })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/status', (req, res) => {
  if (!license.isActivated()) {
    return res.json({ status: 'unlicensed', qrDataUrl: null })
  }
  res.json(whatsapp.getStatus())
})

// Versão instalada + farol de atualização (verde = em dia, amarelo = tem versão nova),
// consumido pelo indicador no cabeçalho da UI.
app.get('/api/app-version', (req, res) => {
  res.json(updateState.getState())
})

// Atualizar fecha o programa: nunca no meio de um envio (disparo, follow-up ou prospecção).
updateState.setBusyCheck(() => (isBusy() ? 'Tem um envio em andamento. Atualize quando ele terminar.' : null))

app.post('/api/app-version/check', (req, res) => {
  try {
    updateState.requestCheck()
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/app-version/install', (req, res) => {
  try {
    updateState.requestInstall()
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/labels', (req, res) => {
  res.json(store.listLabels())
})

app.get('/api/labels/:id/contacts', (req, res) => {
  res.json(store.listContactsForLabel(req.params.id))
})

app.get('/api/labels/contacts-count', (req, res) => {
  const ids = String(req.query.ids || '').split(',').map((s) => s.trim()).filter(Boolean)
  res.json({ count: store.listContactsForLabels(ids).length })
})

app.get('/api/contacts', (req, res) => {
  res.json(store.listAllContacts({ q: req.query.q }))
})

// "Clientes frios" — disparo pra quem ainda não é contato, a partir de uma planilha. Lê a
// planilha só pra mostrar as primeiras linhas e os nomes das colunas — não valida nada ainda.
// Deixa o usuário escolher à mão qual coluna é o telefone, em vez de adivinhar (adivinhar
// errado aqui significa mandar mensagem pro número errado).
const PREVIEW_ROW_LIMIT = 5

app.post('/api/cold-contacts/preview', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Envie um arquivo de planilha (.xlsx ou .csv).' })
  }
  try {
    const { headers, rows } = await parseSpreadsheetRows(req.file.buffer, req.file.originalname)
    if (headers.length === 0) {
      return res.status(400).json({ error: 'Não encontrei nenhuma linha com dados nessa planilha.' })
    }
    res.json({ headers, previewRows: rows.slice(0, PREVIEW_ROW_LIMIT), totalRows: rows.length })
  } catch (err) {
    res.status(400).json({ error: 'Não consegui ler essa planilha (use .xlsx ou .csv): ' + err.message })
  }
})

// Lê a planilha de novo (o front reenvia o mesmo arquivo — nada fica salvo no servidor entre
// o preview e a validação), normaliza cada telefone e confere no WhatsApp de verdade via
// sock.onWhatsApp antes de deixar qualquer linha selecionável pra disparo. NÃO envia nada.
app.post('/api/cold-contacts/validate', upload.single('file'), async (req, res) => {
  if (!license.isActivated()) {
    return res.status(403).json({ error: 'Licença não ativada.' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Envie um arquivo de planilha (.xlsx ou .csv).' })
  }
  const phoneColumn = Number(req.body.phoneColumn)
  if (!Number.isInteger(phoneColumn) || phoneColumn < 0) {
    return res.status(400).json({ error: 'Selecione qual coluna é o telefone.' })
  }
  const nameColumn = req.body.nameColumn !== undefined && req.body.nameColumn !== ''
    ? Number(req.body.nameColumn)
    : null

  let sock
  try {
    sock = whatsapp.getSock()
  } catch (err) {
    return res.status(409).json({ error: err.message })
  }

  let parsed
  try {
    parsed = await parseSpreadsheetRows(req.file.buffer, req.file.originalname)
  } catch (err) {
    return res.status(400).json({ error: 'Não consegui ler essa planilha (use .xlsx ou .csv): ' + err.message })
  }

  const rowInfo = parsed.rows.map((row) => {
    const rawPhone = (row[phoneColumn] || '').trim()
    const name = nameColumn != null ? (row[nameColumn] || '').trim() || null : null
    return { rawPhone, name, candidates: normalizePhoneCandidates(rawPhone) }
  })

  const allCandidates = Array.from(new Set(rowInfo.flatMap((r) => r.candidates)))

  // onWhatsApp só devolve os números que EXISTEM de verdade (os inexistentes somem da
  // resposta, não voltam como {exists:false}) — por isso montamos um mapa dos que vieram e
  // tratamos "não apareceu" como inválido.
  const existingByDigits = new Map()
  if (allCandidates.length > 0) {
    let results
    try {
      results = await sock.onWhatsApp(...allCandidates)
    } catch (err) {
      return res.status(502).json({ error: 'Falha ao validar números no WhatsApp: ' + err.message })
    }
    for (const r of results || []) {
      if (!r?.exists || !r.jid) continue
      const digits = r.jid.split('@')[0].replace(/^\+/, '')
      existingByDigits.set(digits, r.jid)
    }
  }

  let validCount = 0
  let invalidCount = 0
  let unparseableCount = 0
  let optedOutCount = 0

  const results = rowInfo.map((info) => {
    if (info.candidates.length === 0) {
      unparseableCount += 1
      return { rawPhone: info.rawPhone, name: info.name, status: 'unparseable', jid: null }
    }
    const matchedCandidate = info.candidates.find((c) => existingByDigits.has(c))
    if (!matchedCandidate) {
      invalidCount += 1
      return { rawPhone: info.rawPhone, name: info.name, status: 'invalid', jid: null }
    }
    const jid = existingByDigits.get(matchedCandidate)
    // não sugere como selecionável quem já pediu pra não receber mais — mesmo que o número
    // exista de verdade no WhatsApp.
    if (store.isOptedOut(jid)) {
      optedOutCount += 1
      return { rawPhone: info.rawPhone, name: info.name, status: 'opted_out', jid: null }
    }
    validCount += 1
    return { rawPhone: info.rawPhone, name: info.name, status: 'valid', jid }
  })

  res.json({
    results,
    summary: { total: results.length, valid: validCount, invalid: invalidCount, unparseable: unparseableCount, optedOut: optedOutCount }
  })
})

app.post('/api/labels/resync', async (req, res) => {
  try {
    await whatsapp.resyncLabels()
    res.json({ ok: true })
  } catch (err) {
    res.status(409).json({ error: err.message })
  }
})

app.post('/api/connection/disconnect', (req, res) => {
  try {
    whatsapp.disconnect()
    res.json({ ok: true })
  } catch (err) {
    res.status(409).json({ error: err.message })
  }
})

app.post('/api/connection/reconnect', (req, res) => {
  try {
    whatsapp.reconnect().catch((err) => console.error('Falha ao reconectar:', err))
    res.json({ ok: true })
  } catch (err) {
    res.status(409).json({ error: err.message })
  }
})

app.post('/api/connection/reset', (req, res) => {
  try {
    whatsapp.resetSession().catch((err) => console.error('Falha ao reiniciar sessão:', err))
    res.json({ ok: true })
  } catch (err) {
    res.status(409).json({ error: err.message })
  }
})

app.get('/api/logs/failed', (req, res) => {
  res.json(store.listFailedSends())
})

app.get('/api/logs/export.csv', (req, res) => {
  const rows = store.listSendLogsForExport()
  const escapeCsv = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const header = ['Data', 'Etiqueta', 'Contato', 'Numero', 'Status', 'Erro']
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push([
      new Date(r.createdAt).toLocaleString('pt-BR'),
      r.labelName || '',
      r.name || '',
      r.phone || '',
      r.status === 'sent' ? 'Enviado' : 'Falhou',
      r.error || ''
    ].map(escapeCsv).join(','))
  }
  const csv = String.fromCharCode(0xfeff) + lines.join('\r\n') // BOM para o Excel abrir acentos corretamente
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="historico-envios.csv"'
  })
  res.send(csv)
})

app.get('/api/optouts', (req, res) => {
  res.json(store.listOptOuts())
})

app.delete('/api/optouts/:jid', (req, res) => {
  store.removeOptOut(req.params.jid)
  res.json({ ok: true })
})

app.get('/api/settings', (req, res) => {
  res.json({ settings: store.getSettings(), recommended: store.RECOMMENDED_RANGES })
})

app.put('/api/settings', (req, res) => {
  try {
    const settings = store.updateSettings(req.body || {})
    res.json({ settings })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/settings/usage', (req, res) => {
  const settings = store.getSettings()
  const last24h = store.countSendsInWindow(24)
  const remaining = settings.dailyLimit > 0 ? Math.max(0, settings.dailyLimit - last24h.total) : null
  res.json({ last24h, dailyLimit: settings.dailyLimit, remaining })
})

// Perfil usado pelos tipos de mensagem "localização" e "cartão de contato" — separado de
// /api/settings (ritmo de envio/disjuntor) de propósito.
app.get('/api/messaging-profile', (req, res) => {
  res.json(store.getMessagingProfile())
})

app.put('/api/messaging-profile', (req, res) => {
  res.json(store.updateMessagingProfile(req.body || {}))
})

// Link curto do Google Maps (maps.app.goo.gl/...) não tem as coordenadas no texto — só depois
// do redirecionamento. Aqui seguimos o redirecionamento e devolvemos o endereço final, para a
// tela tirar a latitude/longitude dele. Só aceita domínios do Google Maps.
const MAPS_HOSTS = /^(maps\.app\.goo\.gl|goo\.gl|maps\.google\.[a-z.]+|(www\.)?google\.[a-z.]+)$/i
app.get('/api/resolve-maps-link', async (req, res) => {
  let url
  try {
    url = new URL(String(req.query.url || ''))
  } catch {
    return res.status(400).json({ error: 'Link inválido.' })
  }
  if (url.protocol !== 'https:' || !MAPS_HOSTS.test(url.hostname)) {
    return res.status(400).json({ error: 'Use um link do Google Maps.' })
  }
  try {
    const response = await fetch(url.href, { redirect: 'follow', signal: AbortSignal.timeout(8000) })
    res.json({ finalUrl: response.url })
  } catch {
    res.status(502).json({ error: 'Não consegui abrir esse link agora. Confira a internet ou cole o link completo.' })
  }
})

app.post('/api/dispatch', uploadDispatchFiles, (req, res) => {
  if (!license.isActivated()) {
    return res.status(403).json({ error: 'Licença não ativada.' })
  }

  const { message, contactsJson } = req.body
  const messageType = req.body.messageType || 'media'
  const asVoiceNote = req.body.asVoiceNote === 'true'
  let labelIds = req.body.labelIds
  if (!labelIds) labelIds = []
  else if (!Array.isArray(labelIds)) labelIds = [labelIds]

  // naturalidade do envio e etiqueta automática pós-envio — todos opcionais
  const simulateTyping = req.body.simulateTyping !== 'false' // true por padrão
  const skipBlocked = req.body.skipBlocked !== 'false' // true por padrão
  const markAsRead = req.body.markAsRead === 'true' // false por padrão
  const applyLabelId = req.body.applyLabelId || null
  const removeLabelId = req.body.removeLabelId || null

  // enquete/localização/cartão de contato não têm um "texto livre" obrigatório — cada um tem
  // sua própria validação abaixo. Só o tipo "media" (o padrão) exige mensagem.
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
      return res.status(400).json({ error: 'Configure a localização antes de disparar.' })
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
  if (messageType === 'contact') {
    const card = store.getMessagingProfile().businessCard
    if (!card.name || !card.phone) {
      return res.status(400).json({ error: 'Configure o cartão de contato antes de disparar.' })
    }
  }

  // reenvio rápido a partir da tabela de falhas (ou as abas "Todos os contatos"/"Clientes
  // frios") manda uma lista explícita de contatos (contactsJson), em vez de etiqueta(s)
  let explicitContacts = null
  if (contactsJson) {
    try {
      explicitContacts = JSON.parse(contactsJson)
    } catch {
      return res.status(400).json({ error: 'Lista de contatos inválida.' })
    }
    if (!Array.isArray(explicitContacts) || explicitContacts.length === 0) {
      return res.status(400).json({ error: 'Selecione ao menos um contato para disparar.' })
    }
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
    if (store.listContactsForLabels(labelIds).length === 0) {
      return res.status(400).json({ error: 'As etiquetas selecionadas não têm contatos associados.' })
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

  try {
    whatsapp.getSock()
  } catch (err) {
    return res.status(409).json({ error: err.message })
  }

  const settings = store.getSettings()
  if (settings.dailyLimit > 0) {
    const usage = store.countSendsInWindow(24)
    if (usage.total >= settings.dailyLimit) {
      return res.status(429).json({ error: `Limite diário de ${settings.dailyLimit} envios já foi atingido. Ajuste em Configurações ou tente novamente amanhã.` })
    }
  }

  // gravação feita dentro do app chega como audio/webm (formato do MediaRecorder do
  // navegador) — remuxa pra ogg/opus antes de mandar, senão o WhatsApp não reconhece como
  // nota de voz de verdade (ver src/audio.js). Se a conversão falhar por algum motivo, manda
  // o webm original mesmo assim — pior um áudio que talvez não vire bolha de nota de voz do
  // que o disparo inteiro falhar.
  const files = prepareAttachments(req.files, asVoiceNote)
  const file = files[0] || null

  // campanha: criada antes do disparo começar, e quem receber a primeira mensagem entra no
  // funil (initialDispatchHooks). Se o disparo for recusado, desfaz a campanha.
  let campaign = null
  if (campaignInput) {
    const persisted = persistCampaignInput(campaignInput)
    campaign = createCampaign(persisted, {
      origin: labelName || (explicitContacts ? `${explicitContacts.length} contato(s) selecionado(s)` : null),
      initialPreview: describeInitialMessage(messageType, message, pollQuestion, file, albumFiles, files.length)
    })
  }

  let jobId
  try {
    jobId = startDispatch({
      ...(campaign ? initialDispatchHooks(campaign.id) : {}),
      labelIds: explicitContacts ? null : labelIds,
      labelName,
      message: (message || '').trim(),
      files,
      albumFiles,
      contacts: explicitContacts,
      messageType,
      asVoiceNote,
      pollQuestion,
      pollOptions,
      simulateTyping,
      skipBlocked,
      markAsRead,
      applyLabelId,
      removeLabelId
    })
  } catch (err) {
    if (campaign) {
      try {
        deleteCampaign(campaign.id)
      } catch {
        // já não existe — nada a desfazer
      }
    }
    return res.status(409).json({ error: err.message })
  }

  res.json({ jobId, campaignId: campaign?.id || null })
})

app.get('/api/dispatch/:jobId/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })
  res.flushHeaders()

  const send = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
    if (event.type === 'done' || event.type === 'error' || event.type === 'aborted') {
      res.end()
    }
  }

  const unsubscribe = subscribeToJob(req.params.jobId, send)
  if (!unsubscribe) {
    res.status(404).end()
    return
  }

  req.on('close', () => unsubscribe())
})

// Erros do multer (arquivo grande demais, mais arquivos que o permitido no álbum, etc.) não
// devem virar uma página de erro HTML — o front sempre espera JSON de volta.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: `Arquivos demais: o máximo é ${MAX_ATTACHMENTS} anexos (ou ${MAX_ALBUM_FILES} no álbum).` })
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Um dos arquivos passa de 30 MB, o limite do envio.' })
    }
    return res.status(400).json({ error: 'Erro no arquivo enviado: ' + err.message })
  }
  next(err)
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})

if (license.isActivated()) {
  startWhatsappOnce()
} else {
  console.log('Licença não ativada — aguardando ativação pela interface web.')
}
