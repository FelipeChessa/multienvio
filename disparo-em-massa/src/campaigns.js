// Campanhas: follow-up automático + funil de vendas (mini CRM).
//
// Como funciona:
// - A PRIMEIRA mensagem de uma campanha é um disparo normal (POST /api/dispatch ou agendado),
//   com todos os tipos de mensagem. Quem recebeu com sucesso entra no funil, na etapa
//   "Aguardando resposta".
// - Os FOLLOW-UPS (até 5) saem sozinhos: cada um N dias depois do envio anterior, só para quem
//   continua sem responder, só dentro da janela de horário comercial, e sempre pelo mesmo motor
//   de envio do disparo normal (src/sender.js) — então ritmo, limite diário e disjuntor valem
//   igual. Como o motor só roda um disparo por vez, os follow-ups esperam a vez.
// - Quando o contato responde qualquer coisa depois de receber a campanha, ele vai sozinho
//   para "Respondeu" e para de receber follow-up. Daí em diante o usuário move manualmente
//   (Negociando / Venda fechada / Perdido).
// - Tudo depende do app estar aberto: follow-up que venceu com o app fechado sai na próxima vez
//   que o app abrir (dentro da janela de horário). Diferente da mensagem agendada, atraso aqui
//   não é problema — "2 dias sem resposta" virar "2 dias e 3 horas" não muda o sentido.

import crypto from 'crypto'
import * as store from './db.js'
import * as whatsapp from './whatsapp.js'
import { startDispatch, isBusy } from './sender.js'
import * as scheduledFiles from './scheduledFiles.js'
import { convertWebmToOggOpus } from './audio.js'

export const STAGES = ['waiting', 'replied', 'negotiating', 'won', 'lost']
export const MAX_FOLLOWUPS = 5
const MAX_DELAY_DAYS = 60
const MAX_FOLLOWUP_FAILURES = 2
const MAX_NOTE_LENGTH = 2000
const TICK_MS = 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
// tolerância pra diferença de relógio entre o computador e o servidor do WhatsApp na hora de
// decidir se uma mensagem recebida é posterior ao envio da campanha
const CLOCK_SKEW_MS = 2 * 60 * 1000

let runningFollowup = null // { campaignId, stepIndex } enquanto um lote de follow-up está saindo
let tickTimer = null

// ===== Entrada (vinda do formulário de disparo) =====

// Lê os campos da campanha que vêm junto do formulário de disparo/agendamento. Devolve
// { input: null } quando o usuário não marcou "criar campanha". Lança Error com mensagem
// pronta pra mostrar na tela quando algo estiver inválido.
export function parseCampaignInput(body, files) {
  if (body.createCampaign !== 'true') return { input: null }

  const name = String(body.campaignName || '').trim()
  if (!name) throw new Error('Dê um nome para a campanha.')
  if (name.length > 80) throw new Error('O nome da campanha pode ter no máximo 80 caracteres.')

  let rawSteps
  try {
    rawSteps = JSON.parse(body.followupsJson || '[]')
  } catch {
    throw new Error('Follow-ups inválidos.')
  }
  if (!Array.isArray(rawSteps)) throw new Error('Follow-ups inválidos.')
  if (rawSteps.length > MAX_FOLLOWUPS) throw new Error(`No máximo ${MAX_FOLLOWUPS} follow-ups por campanha.`)

  const uploaded = files?.followupFiles || []
  const steps = rawSteps.map((raw, i) => {
    const delayDays = Number(raw?.delayDays)
    if (!Number.isInteger(delayDays) || delayDays < 1 || delayDays > MAX_DELAY_DAYS) {
      throw new Error(`Follow-up ${i + 1}: o prazo precisa ser de 1 a ${MAX_DELAY_DAYS} dias.`)
    }
    const message = String(raw?.message || '').trim()
    let file = null
    if (raw?.fileIndex !== null && raw?.fileIndex !== undefined) {
      file = uploaded[Number(raw.fileIndex)] || null
      if (!file) throw new Error(`Follow-up ${i + 1}: o arquivo anexado não chegou. Selecione de novo.`)
    }
    if (!message && !file) throw new Error(`Follow-up ${i + 1}: escreva uma mensagem ou anexe um arquivo.`)
    return { delayDays, message, file }
  })

  return { input: { name, steps } }
}

// Grava em disco os anexos dos follow-ups (o upload só existe em memória durante a
// requisição, e o follow-up pode sair dias depois). Áudio gravado no app (webm) é convertido
// pra ogg/opus pra virar nota de voz de verdade, igual ao disparo normal.
// extras: parâmetros que só o assistente "Nova campanha" preenche — objetivo, variáveis
// ({{cupom}}, {{link}}...), horário próprio dos follow-ups, etiqueta para quem responder e
// o modelo de origem. A opção rápida do painel de disparo não manda nenhum deles.
export function persistCampaignInput(input, extras = {}) {
  return {
    description: extras.description || '',
    variables: extras.variables || {},
    sendWindow: extras.sendWindow || null,
    replyLabelId: extras.replyLabelId || null,
    templateId: extras.templateId || null,
    name: input.name,
    steps: input.steps.map((step) => {
      let file = step.file
      if (file && file.mimetype.startsWith('audio/webm')) {
        const ogg = convertWebmToOggOpus(file.buffer)
        if (ogg) file = { ...file, buffer: ogg, mimetype: 'audio/ogg; codecs=opus' }
      }
      return { delayDays: step.delayDays, message: step.message, fileRef: scheduledFiles.storeFile(file) }
    })
  }
}

// Descarta anexos já gravados de uma campanha que não chegou a ser criada (agendamento
// cancelado, disparo recusado etc.).
export function discardPersistedInput(persisted) {
  for (const step of persisted?.steps || []) scheduledFiles.deleteFile(step.fileRef)
}

// ===== Variáveis e horário =====

const VARIABLE_KEY_RE = /^[a-z][a-z0-9_]{0,29}$/
const RESERVED_VARIABLES = new Set(['nome', 'primeiro_nome'])
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

// Variáveis da campanha ({{cupom}}, {{link}}...) — um valor fixo, igual para todos os
// contatos, trocado no texto antes de enviar. {{nome}}/{{primeiro_nome}} ficam de fora daqui:
// são por contato e quem troca é o motor de envio (src/sender.js).
export function applyVariables(text, variables) {
  if (!text || !variables) return text || ''
  return text.replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/gi, (match, key) => {
    const k = key.toLowerCase()
    if (RESERVED_VARIABLES.has(k)) return match
    return Object.prototype.hasOwnProperty.call(variables, k) ? variables[k] : match
  })
}

export function parseVariables(raw) {
  if (!raw) return {}
  let obj
  try {
    obj = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    throw new Error('Variáveis inválidas.')
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('Variáveis inválidas.')
  const out = {}
  for (const [rawKey, value] of Object.entries(obj)) {
    const key = String(rawKey).trim().toLowerCase()
    if (!VARIABLE_KEY_RE.test(key)) throw new Error(`Nome de variável inválido: "${rawKey}". Use só letras minúsculas, números e _.`)
    if (RESERVED_VARIABLES.has(key)) continue
    const text = String(value ?? '').trim()
    if (!text) throw new Error(`Preencha o valor da variável {{${key}}}.`)
    if (text.length > 1000) throw new Error(`O valor de {{${key}}} está longo demais.`)
    out[key] = text
  }
  return out
}

// Variáveis usadas no texto que não têm valor — evita mandar "{{cupom}}" literal pro cliente.
export function findMissingVariables(texts, variables) {
  const missing = new Set()
  for (const text of texts) {
    for (const [, key] of String(text || '').matchAll(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/gi)) {
      const k = key.toLowerCase()
      if (!RESERVED_VARIABLES.has(k) && !Object.prototype.hasOwnProperty.call(variables || {}, k)) missing.add(k)
    }
  }
  return Array.from(missing)
}

// Valida e normaliza uma janela de horário { days, start, end }. Lança Error com mensagem pronta.
export function validateSendWindow(sendWindow) {
  if (!sendWindow || typeof sendWindow !== 'object') throw new Error('Horário inválido.')
  const days = Array.isArray(sendWindow.days)
    ? Array.from(new Set(sendWindow.days.map(Number))).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort()
    : []
  if (days.length === 0) throw new Error('Escolha pelo menos um dia da semana para os follow-ups.')
  if (!TIME_RE.test(sendWindow.start || '') || !TIME_RE.test(sendWindow.end || '')) {
    throw new Error('Use o formato de hora HH:MM.')
  }
  if (sendWindow.start >= sendWindow.end) {
    throw new Error('O horário de início precisa ser antes do horário de fim.')
  }
  return { days, start: sendWindow.start, end: sendWindow.end }
}

// Contatos que hoje estão recebendo follow-up em alguma campanha ativa — usado pra não colocar
// a mesma pessoa em duas sequências ao mesmo tempo (opção do assistente).
export function jidsInActiveFollowup() {
  const jids = new Set()
  for (const campaign of store.listCampaigns()) {
    if (campaign.status !== 'active') continue
    for (const entry of Object.values(campaign.contacts)) {
      if (nextDueAt(campaign, entry) !== null) {
        jids.add(entry.jid)
        for (const k of entry.keys) jids.add(k)
      }
    }
  }
  return jids
}

// ===== Criação e primeira mensagem =====

// Resumo curto da primeira mensagem, mostrado no card da campanha.
export function describeInitialMessage(messageType, message, pollQuestion, file, albumFiles, attachmentCount = 0) {
  const text = (message || '').trim()
  if (messageType === 'poll') return `Enquete: ${pollQuestion}`
  if (messageType === 'location') return 'Localização'
  if (messageType === 'contact') return 'Cartão de contato'
  if (messageType === 'album') return `Álbum com ${(albumFiles || []).length} itens${text ? ' — ' + text : ''}`
  if (attachmentCount > 1) return `[${attachmentCount} anexos]${text ? ' ' + text : ''}`
  if (file) return `[${file.originalname}]${text ? ' ' + text : ''}`
  return text
}

export function createCampaign(persisted, { origin, initialPreview } = {}) {
  const campaign = {
    id: crypto.randomUUID(),
    name: persisted.name,
    createdAt: new Date().toISOString(),
    status: 'active', // 'active' | 'paused'
    pausedReason: null,
    origin: origin || null,
    initialPreview: (initialPreview || '').slice(0, 300),
    initialFailed: 0,
    description: persisted.description || '',
    variables: persisted.variables || {},
    sendWindow: persisted.sendWindow || null, // null = usa o horário padrão das campanhas
    replyLabelId: persisted.replyLabelId || null,
    templateId: persisted.templateId || null,
    steps: persisted.steps,
    contacts: {}
  }
  store.addCampaign(campaign)
  return campaign
}

export function deleteCampaign(id) {
  if (runningFollowup?.campaignId === id) {
    throw new Error('Um follow-up desta campanha está sendo enviado agora. Pause a campanha e tente de novo quando o envio terminar.')
  }
  const removed = store.removeCampaign(id)
  if (!removed) throw new Error('Campanha não encontrada.')
  discardPersistedInput(removed)
}

// Ganchos pro disparo da primeira mensagem — quem recebeu entra no funil.
export function initialDispatchHooks(campaignId, expectedCount = null) {
  const campaign = store.getCampaign(campaignId)
  if (campaign) {
    campaign.initialSending = true
    campaign.audienceCount = expectedCount
    store.saveCampaigns()
  }
  return {
    onFinish: (summary) => {
      const current = store.getCampaign(campaignId)
      if (!current) return
      current.initialSending = false
      current.initialAborted = summary?.aborted ? (summary.reason || 'error') : null
      store.saveCampaigns()
    },
    onResult: (contact, status) => {
      const campaign = store.getCampaign(campaignId)
      if (!campaign) return
      if (status !== 'sent') {
        campaign.initialFailed += 1
        store.saveCampaigns()
        return
      }
      const now = Date.now()
      const entry = {
        jid: contact.jid,
        name: contact.name || null,
        keys: [whatsapp.normalizeJid(contact.jid)].filter(Boolean),
        stage: 'waiting',
        followupsSent: 0,
        firstSentAt: now,
        lastSentAt: now,
        repliedAt: null,
        lastReply: null,
        lastReplyAt: null,
        replyCount: 0,
        note: '',
        followupFailures: 0,
        stoppedReason: null,
        stageChangedAt: now
      }
      campaign.contacts[contact.jid] = entry
      store.saveCampaigns()
      // completa as chaves de identidade (número <-> LID) em segundo plano
      whatsapp.contactIdentityKeys(contact.jid).then((keys) => {
        entry.keys = Array.from(new Set([...entry.keys, ...keys]))
        store.saveCampaigns()
      }).catch(() => {})
    }
  }
}

// ===== Respostas =====

// Etiqueta automática no WhatsApp pra quem respondeu (ex: "Lead quente") — best-effort, um
// erro aqui nunca atrapalha o registro da resposta.
function applyReplyLabel(jid, labelId) {
  try {
    whatsapp.getSock().addChatLabel(jid, labelId).catch((err) => {
      console.error(`Falha ao aplicar etiqueta de resposta em ${jid}:`, err.message)
    })
  } catch {
    // desconectado — sem etiqueta desta vez
  }
}

export function handleIncomingMessage(event) {
  let changed = false
  for (const campaign of store.listCampaigns()) {
    for (const entry of Object.values(campaign.contacts)) {
      if (!entry.keys.some((k) => event.keys.has(k))) continue
      if (event.timestamp < entry.firstSentAt - CLOCK_SKEW_MS) continue

      if (!entry.lastReplyAt || event.timestamp >= entry.lastReplyAt) {
        entry.lastReply = event.preview
        entry.lastReplyAt = event.timestamp
      }
      entry.replyCount = (entry.replyCount || 0) + 1
      if (!entry.repliedAt) entry.repliedAt = event.timestamp
      if (entry.stage === 'waiting') {
        entry.stage = 'replied'
        entry.stageChangedAt = Date.now()
        if (campaign.replyLabelId) applyReplyLabel(entry.jid, campaign.replyLabelId)
      }
      changed = true
    }
  }
  if (changed) store.saveCampaigns()
}

// ===== Follow-ups =====

function minutesOf(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Horário em que os follow-ups desta campanha podem sair: o próprio da campanha (definido no
// assistente) ou, se não tiver, o padrão de todas as campanhas.
function campaignWindow(campaign) {
  return campaign?.sendWindow || store.getCampaignSettings().sendWindow
}

export function inSendWindow(date = new Date(), sendWindow = store.getCampaignSettings().sendWindow) {
  if (!sendWindow.days.includes(date.getDay())) return false
  const now = date.getHours() * 60 + date.getMinutes()
  return now >= minutesOf(sendWindow.start) && now < minutesOf(sendWindow.end)
}

function isOptedOut(entry) {
  return [entry.jid, ...entry.keys].some((k) => store.isOptedOut(k))
}

function nextDueAt(campaign, entry) {
  if (entry.stage !== 'waiting' || entry.stoppedReason) return null
  const step = campaign.steps[entry.followupsSent]
  if (!step) return null
  return entry.lastSentAt + step.delayDays * DAY_MS
}

function isDue(campaign, entry, stepIndex, now = Date.now()) {
  if (campaign.status !== 'active') return false
  if (entry.followupsSent !== stepIndex) return false
  const due = nextDueAt(campaign, entry)
  return due !== null && due <= now
}

// Quem pediu pra sair ("parar", "sair"...) sai do funil como perdido e nunca mais recebe nada.
function applyOptOuts() {
  let changed = false
  for (const campaign of store.listCampaigns()) {
    for (const entry of Object.values(campaign.contacts)) {
      if (entry.stoppedReason === 'optout' || !isOptedOut(entry)) continue
      entry.stoppedReason = 'optout'
      entry.stage = 'lost'
      entry.stageChangedAt = Date.now()
      changed = true
    }
  }
  if (changed) store.saveCampaigns()
}

function pauseCampaignInternal(campaign, reason) {
  campaign.status = 'paused'
  campaign.pausedReason = reason
  store.saveCampaigns()
}

// Roda a cada minuto (e uma vez logo depois de abrir o app): aplica opt-outs e, se for
// horário de envio e o WhatsApp estiver livre, solta o próximo lote de follow-ups vencidos.
export function processFollowups() {
  if (runningFollowup || isBusy()) return
  applyOptOuts()
  try {
    whatsapp.getSock()
  } catch {
    return
  }
  const settings = store.getSettings()
  if (settings.dailyLimit > 0 && store.countSendsInWindow(24).total >= settings.dailyLimit) return

  const now = Date.now()
  const nowDate = new Date(now)
  for (const campaign of store.listCampaigns()) {
    if (campaign.status !== 'active') continue
    if (!inSendWindow(nowDate, campaignWindow(campaign))) continue
    for (let stepIndex = 0; stepIndex < campaign.steps.length; stepIndex++) {
      const due = Object.values(campaign.contacts).filter((e) => isDue(campaign, e, stepIndex, now))
      if (due.length === 0) continue
      startFollowupBatch(campaign, stepIndex, due)
      return // um lote por vez — o próximo sai no próximo tick, depois que este terminar
    }
  }
}

function startFollowupBatch(campaign, stepIndex, entries) {
  const step = campaign.steps[stepIndex]
  let file = null
  try {
    file = scheduledFiles.readFile(step.fileRef)
  } catch {
    pauseCampaignInternal(campaign, `O arquivo do follow-up ${stepIndex + 1} não foi encontrado no computador. Edite a campanha ou crie outra.`)
    return
  }

  runningFollowup = { campaignId: campaign.id, stepIndex }
  try {
    startDispatch({
      contacts: entries.map((e) => ({ jid: e.jid, name: e.name })),
      labelName: `Campanha "${campaign.name}" — follow-up ${stepIndex + 1}`,
      message: applyVariables(step.message, campaign.variables),
      file,
      messageType: 'media',
      asVoiceNote: !!file && file.mimetype.startsWith('audio/'),
      simulateTyping: true,
      skipBlocked: true,
      markAsRead: false,
      // confere de novo na hora de cada envio: o contato pode ter respondido, a campanha pode
      // ter sido pausada ou o horário comercial pode ter acabado no meio do lote
      shouldSend: (contact) => {
        const current = store.getCampaign(campaign.id)
        const entry = current?.contacts[contact.jid]
        return !!entry && isDue(current, entry, stepIndex) && !isOptedOut(entry) && inSendWindow(new Date(), campaignWindow(current))
      },
      onResult: (contact, status) => {
        const entry = store.getCampaign(campaign.id)?.contacts[contact.jid]
        if (!entry) return
        if (status === 'sent') {
          entry.followupsSent = stepIndex + 1
          entry.lastSentAt = Date.now()
          entry.followupFailures = 0
        } else {
          entry.followupFailures = (entry.followupFailures || 0) + 1
          if (entry.followupFailures >= MAX_FOLLOWUP_FAILURES) entry.stoppedReason = 'failed'
        }
        store.saveCampaigns()
      },
      onFinish: (summary) => {
        runningFollowup = null
        const current = store.getCampaign(campaign.id)
        if (current && summary?.aborted && ['consecutive_failures', 'failure_rate', 'error'].includes(summary.reason)) {
          pauseCampaignInternal(current, 'Pausada automaticamente: muitos follow-ups falharam seguidos. Confira a conexão do WhatsApp antes de retomar.')
        }
      }
    })
  } catch (err) {
    // outro disparo começou entre a checagem e agora — tenta de novo no próximo tick
    runningFollowup = null
    console.error('Follow-up adiado:', err.message)
  }
}

export function initCampaigns() {
  whatsapp.onIncomingMessage(handleIncomingMessage)
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(processFollowups, TICK_MS)
  setTimeout(processFollowups, 15 * 1000)
}

// ===== Leitura e edição pela tela =====

function phoneOf(entry) {
  const pn = [entry.jid, ...entry.keys].find((k) => k && k.endsWith('@s.whatsapp.net'))
  return pn ? pn.split('@')[0] : null
}

function serializeContact(campaign, entry) {
  const due = campaign.status === 'active' ? nextDueAt(campaign, entry) : null
  // nome consultado agora (não o do dia do envio): agenda do celular > nome da planilha/envio >
  // nome do perfil do WhatsApp
  const info = store.getContactInfo([entry.jid, ...(entry.keys || [])])
  return {
    jid: entry.jid,
    name: info.savedName || entry.name || info.name || info.pushName || null,
    savedName: info.savedName,
    labels: info.labels,
    phone: phoneOf(entry),
    stage: entry.stage,
    followupsSent: entry.followupsSent,
    totalFollowups: campaign.steps.length,
    firstSentAt: entry.firstSentAt,
    lastSentAt: entry.lastSentAt,
    nextDueAt: due,
    repliedAt: entry.repliedAt,
    lastReply: entry.lastReply,
    lastReplyAt: entry.lastReplyAt,
    replyCount: entry.replyCount || 0,
    note: entry.note || '',
    stoppedReason: entry.stoppedReason,
    stageChangedAt: entry.stageChangedAt
  }
}

function summarize(campaign) {
  const entries = Object.values(campaign.contacts)
  const counts = Object.fromEntries(STAGES.map((s) => [s, 0]))
  let replied = 0
  let finishedWithoutReply = 0
  let nextDue = null
  for (const e of entries) {
    counts[e.stage] = (counts[e.stage] || 0) + 1
    if (e.repliedAt) replied += 1
    if (e.stage === 'waiting' && (e.stoppedReason || e.followupsSent >= campaign.steps.length)) finishedWithoutReply += 1
    const due = campaign.status === 'active' ? nextDueAt(campaign, e) : null
    if (due !== null && (nextDue === null || due < nextDue)) nextDue = due
  }
  return {
    id: campaign.id,
    name: campaign.name,
    createdAt: campaign.createdAt,
    status: campaign.status,
    pausedReason: campaign.pausedReason,
    origin: campaign.origin,
    initialPreview: campaign.initialPreview,
    initialFailed: campaign.initialFailed,
    followupCount: campaign.steps.length,
    total: entries.length,
    replied,
    replyRate: entries.length > 0 ? replied / entries.length : 0,
    finishedWithoutReply,
    counts,
    nextDueAt: nextDue,
    sendingNow: runningFollowup?.campaignId === campaign.id,
    initialSending: !!campaign.initialSending,
    initialAborted: campaign.initialAborted || null,
    audienceCount: campaign.audienceCount ?? null,
    description: campaign.description || ''
  }
}

export function listCampaignSummaries() {
  return store.listCampaigns()
    .map(summarize)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getCampaignDetail(id) {
  const campaign = store.getCampaign(id)
  if (!campaign) return null
  return {
    ...summarize(campaign),
    description: campaign.description || '',
    variables: campaign.variables || {},
    sendWindow: campaignWindow(campaign),
    customSendWindow: !!campaign.sendWindow,
    replyLabelId: campaign.replyLabelId || null,
    steps: campaign.steps.map((s) => ({
      delayDays: s.delayDays,
      message: s.message,
      fileName: s.fileRef?.originalname || null
    })),
    contacts: Object.values(campaign.contacts).map((e) => serializeContact(campaign, e))
  }
}

export function setCampaignStatus(id, status) {
  const campaign = store.getCampaign(id)
  if (!campaign) throw new Error('Campanha não encontrada.')
  campaign.status = status === 'active' ? 'active' : 'paused'
  campaign.pausedReason = null
  store.saveCampaigns()
  return summarize(campaign)
}

export function updateCampaignContact(id, jid, { stage, note }) {
  const campaign = store.getCampaign(id)
  if (!campaign) throw new Error('Campanha não encontrada.')
  const entry = campaign.contacts[jid]
  if (!entry) throw new Error('Contato não encontrado nesta campanha.')
  if (stage !== undefined) {
    if (!STAGES.includes(stage)) throw new Error('Etapa inválida.')
    if (entry.stoppedReason === 'optout' && stage === 'waiting') {
      throw new Error('Este contato pediu para não receber mais mensagens — não dá para voltar para "Aguardando resposta".')
    }
    if (stage !== entry.stage) {
      entry.stage = stage
      entry.stageChangedAt = Date.now()
    }
  }
  if (note !== undefined) {
    entry.note = String(note).slice(0, MAX_NOTE_LENGTH)
  }
  store.saveCampaigns()
  return serializeContact(campaign, entry)
}
