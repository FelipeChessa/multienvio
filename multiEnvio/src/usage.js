// Dados de uso do programa, enviados junto com a conferência da licença (license.js) e
// mostrados no painel admin. SÓ CONTAGENS: nunca o texto das mensagens, números ou nomes de
// contatos. Mensagens de erro passam por sanitize() antes de sair do computador.
//
// Guardado em data/usage.json, por dia (AAAA-MM-DD, horário do computador). Os envios de cada dia
// vêm do histórico de envios (db.js guarda 35 dias); aqui ficam copiados para não se perderem.

import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { DATA_DIR } from './paths.js'
import * as store from './db.js'
import { getStatus as getWhatsappStatus } from './whatsapp.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const usageFile = path.join(DATA_DIR, 'usage.json')
const KEEP_DAYS = 400
const SNAPSHOT_DAYS = 30
const MAX_ERRORS = 10
// telas que a interface pode informar (qualquer outro nome é ignorado)
const SCREENS = new Set(['whatsapp', 'dispatch', 'campaigns', 'prospects', 'settings', 'products', 'profile', 'tutorial'])

let appVersion = null
try {
  appVersion = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version
} catch {
  appVersion = null
}

function load() {
  try {
    const s = JSON.parse(fs.readFileSync(usageFile, 'utf8'))
    if (s && typeof s === 'object' && s.days) return s
  } catch {
    // primeira vez ou arquivo corrompido: começa do zero
  }
  return { firstSeenAt: new Date().toISOString(), days: {}, errors: [], whatsappLastConnectedAt: null }
}

const state = load()
let saveTimer = null

function save() {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    try {
      fs.mkdirSync(path.dirname(usageFile), { recursive: true })
      fs.writeFileSync(usageFile, JSON.stringify(state))
    } catch (err) {
      console.error('Falha ao gravar dados de uso:', err.message)
    }
  }, 10000)
  saveTimer.unref?.()
}

function dayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function day(key = dayKey()) {
  if (!state.days[key]) state.days[key] = { opens: 0, activeMin: 0, waMin: 0, sent: 0, failed: 0, errors: 0, screens: {} }
  return state.days[key]
}

// tira números longos (telefones, IDs), e-mails e caminhos com nome de usuário
function sanitize(text) {
  return String(text || '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
    .replace(/\d{6,}/g, '[num]')
    .replace(/[A-Z]:\\Users\\[^\\\s]+/gi, '[pasta]')
    .slice(0, 180)
}

function recordError(message, source = 'servidor') {
  const msg = sanitize(message)
  if (!msg) return
  day().errors += 1
  state.errors.push({ at: new Date().toISOString(), source, msg })
  if (state.errors.length > MAX_ERRORS) state.errors.splice(0, state.errors.length - MAX_ERRORS)
  save()
}

// chamado pela tela uma vez por minuto (POST /api/usage/ping)
function recordPing(body) {
  const d = day()
  if (body?.active === true && d.activeMin < 1440) d.activeMin += 1
  if (body?.screens && typeof body.screens === 'object') {
    for (const [name, count] of Object.entries(body.screens)) {
      const n = Number(count)
      if (SCREENS.has(name) && Number.isFinite(n) && n > 0) d.screens[name] = (d.screens[name] || 0) + Math.min(n, 100)
    }
  }
  if (Array.isArray(body?.errors)) {
    for (const e of body.errors.slice(0, 5)) recordError(e, 'tela')
  }
  save()
}

// envios por dia, a partir do histórico de envios (db.js guarda os últimos 35 dias)
function syncSendsFromLog() {
  const perDay = {}
  for (const log of store.listSendLogsForExport()) {
    const key = dayKey(new Date(log.createdAt))
    perDay[key] ||= { sent: 0, failed: 0 }
    if (log.status === 'sent') perDay[key].sent += 1
    else if (log.status === 'failed') perDay[key].failed += 1
  }
  for (const [key, v] of Object.entries(perDay)) {
    const d = day(key)
    d.sent = v.sent
    d.failed = v.failed
  }
}

function prune() {
  const cutoff = dayKey(new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000))
  for (const key of Object.keys(state.days)) if (key < cutoff) delete state.days[key]
}

function safeCount(fn) {
  try {
    return fn()
  } catch {
    return null
  }
}

// Resumo enviado ao servidor de licenças (license.js). Pequeno: uns poucos KB.
function getUsageSnapshot() {
  syncSendsFromLog()
  prune()
  save()

  const totals = { sent: 0, failed: 0, activeMin: 0, waMin: 0, opens: 0, days: 0 }
  for (const d of Object.values(state.days)) {
    totals.sent += d.sent
    totals.failed += d.failed
    totals.activeMin += d.activeMin
    totals.waMin += d.waMin
    totals.opens += d.opens
    if (d.opens || d.activeMin || d.sent) totals.days += 1
  }

  const days = []
  const screens30 = {}
  let errors30 = 0
  for (let i = SNAPSHOT_DAYS - 1; i >= 0; i--) {
    const key = dayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000))
    const d = state.days[key]
    days.push({ d: key, sent: d?.sent || 0, failed: d?.failed || 0, activeMin: d?.activeMin || 0, waMin: d?.waMin || 0, opens: d?.opens || 0 })
    if (d) {
      errors30 += d.errors
      for (const [name, n] of Object.entries(d.screens)) screens30[name] = (screens30[name] || 0) + n
    }
  }

  const campaigns = safeCount(() => store.listCampaigns()) || []
  return {
    v: 1,
    at: new Date().toISOString(),
    appVersion,
    electron: process.versions.electron || null,
    system: {
      os: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      memGb: Math.round(os.totalmem() / 1e9),
      cpus: os.cpus().length
    },
    whatsapp: { status: safeCount(() => getWhatsappStatus().status), lastConnectedAt: state.whatsappLastConnectedAt },
    counts: {
      contacts: safeCount(() => store.listAllContacts().length),
      labels: safeCount(() => store.listLabels().length),
      campaigns: campaigns.length,
      campaignsActive: campaigns.filter((c) => c.status === 'active').length,
      prospects: safeCount(() => store.listProspects().length),
      scheduledPending: safeCount(() => store.listScheduledMessages().filter((m) => m.status === 'pending').length),
      templates: safeCount(() => store.templatesCrud.list().length),
      products: safeCount(() => store.productsCrud.list().length),
      optOuts: safeCount(() => store.listOptOuts().length)
    },
    firstSeenAt: state.firstSeenAt,
    totals,
    days,
    screens30,
    errors30,
    lastErrors: state.errors.slice(-5)
  }
}

// abriu o programa
day().opens += 1
save()

// minutos com o WhatsApp conectado (conta mesmo com a janela fechada na bandeja)
const waTimer = setInterval(() => {
  if (safeCount(() => getWhatsappStatus().status) === 'connected') {
    day().waMin += 1
    state.whatsappLastConnectedAt = new Date().toISOString()
    save()
  }
}, 60 * 1000)
waTimer.unref?.()

process.on('uncaughtExceptionMonitor', (err) => recordError(err?.message || err))
process.on('unhandledRejection', (reason) => recordError(reason?.message || reason))

export { getUsageSnapshot, recordPing, recordError, sanitize }
