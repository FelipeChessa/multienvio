import fs from 'fs'
import path from 'path'
import { DATA_DIR } from './paths.js'

const dataDir = DATA_DIR
const dataFile = path.join(dataDir, 'app.json')

// poda de sendLogs por idade (não só por contagem) para o limite diário de envios
// não sub-contar em lojas de alto volume — ver countSendsInWindow() mais abaixo.
const MAX_SEND_LOG_AGE_DAYS = 35
const MAX_SEND_LOGS_HARD_CAP = 20000

// faixas recomendadas exibidas na interface como aviso (não são limites travados —
// o usuário pode configurar fora delas, só fica visualmente sinalizado).
const RECOMMENDED_RANGES = {
  delayMinSec: { min: 3, max: 15 },
  delayMaxSec: { min: 5, max: 20 },
  batchSize: { min: 10, max: 50 },
  batchPauseMinutes: { min: 3, max: 15 },
  dailyLimit: { min: 20, max: 250 }
}

function buildDefaultSettings() {
  // semeia os defaults a partir das variáveis de ambiente antigas (SEND_DELAY_MIN_MS/MAX_MS)
  // só na primeira migração, pra quem já tinha customizado via .env não ter o comportamento
  // resetado silenciosamente quando essa funcionalidade chegar.
  const envMin = Number(process.env.SEND_DELAY_MIN_MS)
  const envMax = Number(process.env.SEND_DELAY_MAX_MS)
  return {
    delayMinSec: Number.isFinite(envMin) && envMin > 0 ? envMin / 1000 : 4,
    delayMaxSec: Number.isFinite(envMax) && envMax > 0 ? envMax / 1000 : 9,
    batchSize: 20,
    batchPauseMinutes: 5,
    dailyLimit: 200, // 0 = sem limite
    circuitBreaker: {
      enabled: true,
      consecutiveFailures: 3,
      minSampleForRate: 10,
      failureRateThreshold: 0.2
    }
  }
}

function mergeSettings(saved) {
  const defaults = buildDefaultSettings()
  if (!saved || typeof saved !== 'object') return { settings: defaults, migrated: true }
  const merged = { ...defaults, ...saved }
  merged.circuitBreaker = { ...defaults.circuitBreaker, ...(saved.circuitBreaker || {}) }
  const migrated = JSON.stringify(merged) !== JSON.stringify(saved)
  return { settings: merged, migrated }
}

// Perfil usado pelos tipos de mensagem "localização" e "cartão de contato" — separado de
// `settings` (ritmo de envio/disjuntor) de propósito, pra não arriscar a validação estrita
// que já existe em updateSettings().
function buildDefaultMessagingProfile() {
  return {
    businessCard: { name: '', phone: '' },
    location: { lat: null, lng: null, name: '', address: '' }
  }
}

function mergeMessagingProfile(saved) {
  const defaults = buildDefaultMessagingProfile()
  if (!saved || typeof saved !== 'object') return { profile: defaults, migrated: true }
  const merged = {
    businessCard: { ...defaults.businessCard, ...(saved.businessCard || {}) },
    location: { ...defaults.location, ...(saved.location || {}) }
  }
  const migrated = JSON.stringify(merged) !== JSON.stringify(saved)
  return { profile: merged, migrated }
}

fs.mkdirSync(dataDir, { recursive: true })

function emptyState() {
  return {
    labels: {},
    associations: [],
    contacts: {},
    sendLogs: [],
    settings: buildDefaultSettings(),
    optOuts: {},
    messagingProfile: buildDefaultMessagingProfile(),
    scheduledMessages: []
  }
}

function loadState() {
  if (!fs.existsSync(dataFile)) {
    return { migrated: true, state: emptyState() }
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
    const { settings, migrated } = mergeSettings(parsed.settings)
    const { profile, migrated: profileMigrated } = mergeMessagingProfile(parsed.messagingProfile)
    return {
      migrated: migrated || profileMigrated || !parsed.optOuts,
      state: {
        labels: parsed.labels || {},
        associations: parsed.associations || [],
        contacts: parsed.contacts || {},
        sendLogs: parsed.sendLogs || [],
        settings,
        optOuts: parsed.optOuts || {},
        messagingProfile: profile,
        scheduledMessages: parsed.scheduledMessages || []
      }
    }
  } catch (err) {
    console.error('Não foi possível ler data/app.json, começando do zero:', err.message)
    return { migrated: true, state: emptyState() }
  }
}

const loaded = loadState()
const state = loaded.state

let persistTimer = null
let persistPending = false

// Escreve de fato em disco. No Windows, renameSync logo após um writeFileSync pode falhar
// com EPERM/EBUSY quando algo (antivírus, indexação, sync de nuvem) segura o arquivo recém
// criado por alguns ms — é transitório, não motivo pra derrubar o app inteiro (era isso que
// causava o "Uncaught Exception" no processo principal do Electron ao atualizar etiquetas,
// já que contacts.upsert chega em lote e cada contato disparava uma escrita síncrona).
function writeStateToDisk() {
  const tmpFile = dataFile + '.tmp'
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2))
  fs.renameSync(tmpFile, dataFile)
}

function persistNow() {
  persistPending = false
  try {
    writeStateToDisk()
  } catch (err) {
    console.error('Falha ao persistir data/app.json (tentando de novo na próxima alteração):', err.message)
  }
}

// Agrupa escritas próximas no tempo num único write+rename — evita tanto o martelamento
// do disco quanto a corrida acima quando um lote grande de contatos/etiquetas chega de uma vez.
function persist() {
  persistPending = true
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    persistNow()
  }, 150)
}

process.on('exit', () => {
  if (!persistPending) return
  if (persistTimer) clearTimeout(persistTimer)
  persistNow()
})

if (loaded.migrated) persist() // garante que um data/app.json novo ou recém-migrado já nasça completo em disco

function upsertLabel(label) {
  state.labels[label.id] = {
    id: label.id,
    name: label.name,
    color: label.color ?? null,
    deleted: !!label.deleted
  }
  persist()
}

function applyAssociation(association, type) {
  if (association.type !== 'label_jid') return // só nos interessa associação chat<->etiqueta
  const { chatId, labelId } = association
  const idx = state.associations.findIndex((a) => a.chatId === chatId && a.labelId === labelId)
  if (type === 'add') {
    if (idx === -1) state.associations.push({ chatId, labelId })
  } else if (idx !== -1) {
    state.associations.splice(idx, 1)
  }
  persist()
}

function upsertContact(jid, name) {
  if (!jid) return
  const existing = state.contacts[jid]
  state.contacts[jid] = { jid, name: name || existing?.name || null }
  persist()
}

function listLabels() {
  const counts = new Map()
  for (const a of state.associations) {
    if (state.optOuts[a.chatId]) continue // não conta quem pediu pra não receber mais
    counts.set(a.labelId, (counts.get(a.labelId) || 0) + 1)
  }
  return Object.values(state.labels)
    .filter((l) => !l.deleted)
    .map((l) => ({ id: l.id, name: l.name, color: l.color, contactCount: counts.get(l.id) || 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
}

function listContactsForLabel(labelId) {
  return state.associations
    .filter((a) => a.labelId === labelId && !state.optOuts[a.chatId])
    .map((a) => ({ jid: a.chatId, name: state.contacts[a.chatId]?.name || null }))
    .sort((a, b) => (a.name || a.jid).localeCompare(b.name || b.jid, 'pt-BR', { sensitivity: 'base' }))
}

// Todos os contatos individuais já sincronizados, não só os que estão em alguma etiqueta —
// usado pela aba "Todos os contatos". Exclui grupos, broadcast e quem já pediu pra sair.
function listAllContacts({ q } = {}) {
  let contacts = Object.values(state.contacts).filter((c) => !c.jid.endsWith('@g.us') && !c.jid.endsWith('@broadcast') && !state.optOuts[c.jid])
  if (q) {
    const needle = q.toLowerCase()
    contacts = contacts.filter((c) => (c.name && c.name.toLowerCase().includes(needle)) || c.jid.toLowerCase().includes(needle))
  }
  return contacts.sort((a, b) => (a.name || a.jid).localeCompare(b.name || b.jid, 'pt-BR', { sensitivity: 'base' }))
}

// Combina os contatos de várias etiquetas, sem duplicar quem está em mais de uma
// (listContactsForLabel já filtra opt-outs).
function listContactsForLabels(labelIds) {
  const seen = new Map()
  for (const labelId of labelIds) {
    for (const contact of listContactsForLabel(labelId)) {
      if (!seen.has(contact.jid)) seen.set(contact.jid, contact)
    }
  }
  return Array.from(seen.values())
    .sort((a, b) => (a.name || a.jid).localeCompare(b.name || b.jid, 'pt-BR', { sensitivity: 'base' }))
}

function addOptOut(jid) {
  if (!jid || state.optOuts[jid]) return
  state.optOuts[jid] = { at: new Date().toISOString() }
  persist()
}

function removeOptOut(jid) {
  if (!jid || !state.optOuts[jid]) return
  delete state.optOuts[jid]
  persist()
}

function isOptedOut(jid) {
  return !!state.optOuts[jid]
}

function listOptOuts() {
  return Object.entries(state.optOuts)
    .map(([jid, info]) => ({
      jid,
      phone: phoneFromJid(jid),
      name: state.contacts[jid]?.name || null,
      at: info.at
    }))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
}

function phoneFromJid(jid) {
  if (!jid) return null
  const [user, server] = jid.split('@')
  if (server === 'g.us') return null // grupo, não tem número de telefone associado
  return user.split(':')[0] // remove sufixo de dispositivo, ex: "5511999999999:12"
}

function logSend(jobId, labelId, labelName, chatId, name, status, error) {
  state.sendLogs.push({
    jobId,
    labelId,
    labelName: labelName || null,
    chatId,
    name: name || null,
    status,
    error: error || null,
    createdAt: new Date().toISOString()
  })

  // poda por idade (mantém histórico recente para o limite diário funcionar corretamente
  // mesmo em lojas de alto volume), com um teto absoluto só como proteção contra crescimento infinito
  if (state.sendLogs.length > MAX_SEND_LOGS_HARD_CAP) {
    state.sendLogs.splice(0, state.sendLogs.length - MAX_SEND_LOGS_HARD_CAP)
  }
  const cutoff = Date.now() - MAX_SEND_LOG_AGE_DAYS * 24 * 60 * 60 * 1000
  while (state.sendLogs.length > 0 && new Date(state.sendLogs[0].createdAt).getTime() < cutoff) {
    state.sendLogs.shift()
  }

  persist()
}

function getSettings() {
  return JSON.parse(JSON.stringify(state.settings))
}

function getMessagingProfile() {
  return JSON.parse(JSON.stringify(state.messagingProfile))
}

function updateMessagingProfile(partial) {
  state.messagingProfile = {
    businessCard: { ...state.messagingProfile.businessCard, ...(partial.businessCard || {}) },
    location: { ...state.messagingProfile.location, ...(partial.location || {}) }
  }
  persist()
  return getMessagingProfile()
}

function updateSettings(partial) {
  const next = { ...state.settings, ...partial }
  next.circuitBreaker = { ...state.settings.circuitBreaker, ...(partial.circuitBreaker || {}) }

  if (!(next.delayMinSec > 0) || !(next.delayMaxSec > 0)) {
    throw new Error('Os tempos de espera precisam ser maiores que zero.')
  }
  if (next.delayMinSec > next.delayMaxSec) {
    throw new Error('O tempo mínimo não pode ser maior que o máximo.')
  }
  if (!Number.isInteger(next.batchSize) || next.batchSize < 1) {
    throw new Error('O tamanho do lote precisa ser um número inteiro maior ou igual a 1.')
  }
  if (!(next.batchPauseMinutes >= 0)) {
    throw new Error('A pausa entre lotes não pode ser negativa.')
  }
  if (!Number.isInteger(next.dailyLimit) || next.dailyLimit < 0) {
    throw new Error('O limite diário precisa ser um número inteiro (0 para sem limite).')
  }
  const cb = next.circuitBreaker
  if (!Number.isInteger(cb.consecutiveFailures) || cb.consecutiveFailures < 1) {
    throw new Error('O número de falhas seguidas do disjuntor precisa ser um inteiro >= 1.')
  }
  if (!Number.isInteger(cb.minSampleForRate) || cb.minSampleForRate < 1) {
    throw new Error('A amostra mínima do disjuntor precisa ser um inteiro >= 1.')
  }
  if (!(cb.failureRateThreshold > 0) || cb.failureRateThreshold > 1) {
    throw new Error('A taxa de falha do disjuntor precisa estar entre 0 (exclusivo) e 1.')
  }

  state.settings = next
  persist()
  return getSettings()
}

function countSendsInWindow(hours = 24) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  let sent = 0
  let failed = 0
  for (const log of state.sendLogs) {
    if (new Date(log.createdAt).getTime() < cutoff) continue
    if (log.status === 'sent') sent += 1
    else if (log.status === 'failed') failed += 1
  }
  return { sent, failed, total: sent + failed }
}

function resetPairingData() {
  // zera etiquetas/associações/contatos para forçar uma ressincronização completa
  // após um novo pareamento (o histórico de envios em sendLogs é mantido).
  state.labels = {}
  state.associations = []
  state.contacts = {}
  persist()
}

function listFailedSends(limit = 200) {
  // considera só o envio mais recente por contato — se um reenvio deu certo depois,
  // o contato some da lista de falhas em vez de continuar aparecendo com o erro antigo
  const latestByContact = new Map()
  for (const log of state.sendLogs) {
    const existing = latestByContact.get(log.chatId)
    if (!existing || new Date(log.createdAt) > new Date(existing.createdAt)) {
      latestByContact.set(log.chatId, log)
    }
  }
  return Array.from(latestByContact.values())
    .filter((l) => l.status === 'failed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map((l) => ({
      jobId: l.jobId,
      labelName: l.labelName,
      jid: l.chatId,
      phone: phoneFromJid(l.chatId),
      name: l.name,
      error: l.error,
      createdAt: l.createdAt
    }))
}

function listSendLogsForExport() {
  return state.sendLogs
    .slice()
    .reverse()
    .map((l) => ({
      createdAt: l.createdAt,
      labelName: l.labelName,
      name: l.name,
      phone: phoneFromJid(l.chatId),
      status: l.status,
      error: l.error
    }))
}

// Mensagens agendadas — ver src/scheduler.js pra quem realmente dispara no horário certo e
// rearma os timers ao iniciar o app. Aqui é só a persistência (mesmo padrão do resto do
// arquivo: mutar state em memória + persist()).
function listScheduledMessages() {
  return state.scheduledMessages
    .slice()
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
}

function getScheduledMessage(id) {
  return state.scheduledMessages.find((m) => m.id === id) || null
}

function addScheduledMessage(entry) {
  state.scheduledMessages.push(entry)
  persist()
  return entry
}

function updateScheduledMessage(id, patch) {
  const idx = state.scheduledMessages.findIndex((m) => m.id === id)
  if (idx === -1) return null
  state.scheduledMessages[idx] = { ...state.scheduledMessages[idx], ...patch }
  persist()
  return state.scheduledMessages[idx]
}

function removeScheduledMessage(id) {
  const idx = state.scheduledMessages.findIndex((m) => m.id === id)
  if (idx === -1) return false
  state.scheduledMessages.splice(idx, 1)
  persist()
  return true
}

export {
  upsertLabel,
  applyAssociation,
  upsertContact,
  listLabels,
  listContactsForLabel,
  listContactsForLabels,
  listAllContacts,
  logSend,
  listFailedSends,
  listSendLogsForExport,
  resetPairingData,
  getSettings,
  updateSettings,
  getMessagingProfile,
  updateMessagingProfile,
  countSendsInWindow,
  RECOMMENDED_RANGES,
  addOptOut,
  removeOptOut,
  isOptedOut,
  listOptOuts,
  listScheduledMessages,
  getScheduledMessage,
  addScheduledMessage,
  updateScheduledMessage,
  removeScheduledMessage
}
