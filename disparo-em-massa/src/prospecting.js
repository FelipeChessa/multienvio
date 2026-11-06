// Prospecção de leads frios: disparo para quem NÃO tem o seu número salvo (lista de planilha).
//
// É o tipo de envio com maior risco de bloqueio do WhatsApp — cada mensagem pra um
// desconhecido pode virar denúncia de spam. Por isso este módulo é mais travado que o disparo
// normal:
// - triagem: cada número é conferido no WhatsApp em lotes pequenos (checar centenas de uma vez
//   também chama atenção) e marcado: tem WhatsApp, sem WhatsApp, inválido, repetido, já é
//   contato, pediu pra sair, ou já foi prospectado nos últimos 30 dias;
// - variações obrigatórias (mín. 2) + trechos variáveis {Oi|Olá} + colunas da planilha como
//   variáveis — nenhum lead recebe exatamente o mesmo texto que o anterior;
// - envio "gota a gota" ao longo dos dias: ritmo bem mais lento que o normal, teto diário com
//   aquecimento (começa baixo e sobe aos poucos), lotes pequenos com pausa longa entre eles,
//   só na janela de horário;
// - pausa automática: falhas seguidas (disjuntor), taxa de "SAIR" alta, ou sessão encerrada
//   pelo WhatsApp (o sinal mais comum de banimento);
// - quem recebe entra num funil de campanha (src/campaigns.js): respostas e follow-ups
//   funcionam igual às campanhas.

import crypto from 'crypto'
import * as store from './db.js'
import * as whatsapp from './whatsapp.js'
import { startDispatch, isBusy } from './sender.js'
import * as campaigns from './campaigns.js'
import { normalizePhoneCandidates } from './phone.js'

export const PRESETS = {
  conservador: {
    label: 'Conservador',
    description: 'Recomendado. Para número novo ou pouco usado em vendas.',
    dailyCap: 30, warmupStart: 10, warmupStep: 5, delayMinSec: 45, delayMaxSec: 120, batchSize: 8, batchPauseMinutes: 15
  },
  moderado: {
    label: 'Moderado',
    description: 'Para número com alguns meses de uso e conversas ativas.',
    dailyCap: 60, warmupStart: 20, warmupStep: 10, delayMinSec: 30, delayMaxSec: 80, batchSize: 10, batchPauseMinutes: 10
  },
  acelerado: {
    label: 'Acelerado',
    description: 'Só para número antigo, com muito histórico. Maior risco.',
    dailyCap: 100, warmupStart: 30, warmupStep: 15, delayMinSec: 20, delayMaxSec: 50, batchSize: 15, batchPauseMinutes: 8
  }
}

// Travas que nem o ajuste manual ultrapassa
export const HARD_LIMITS = { dailyCapMax: 150, delayMinSec: 15, batchSizeMax: 20, batchPauseMinMinutes: 3, maxLeads: 5000 }
export const MIN_VARIANTS = 2
export const MAX_VARIANTS = 5
const MAX_FOLLOWUPS = 2
const RECONTACT_DAYS = 30
const OPTOUT_MIN_SAMPLE = 25
const OPTOUT_PAUSE_RATE = 0.08
const VALIDATE_CHUNK = 40
const VALIDATE_GAP_MS = 1500
const TICK_MS = 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_WINDOW = { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }

let running = null // id da lista com lote em andamento
let tickTimer = null
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ===== Variações e qualidade =====

// {Oi|Olá|E aí} -> um dos trechos, sorteado. {{variavel}} é preservado (é outra coisa).
export function resolveSpintax(text, rand = Math.random) {
  const kept = []
  let out = String(text || '').replace(/\{\{[^{}]*\}\}/g, (m) => { kept.push(m); return `\u0000${kept.length - 1}\u0000` })
  for (let guard = 0; guard < 50 && /\{[^{}]*\}/.test(out); guard++) {
    out = out.replace(/\{([^{}]*)\}/g, (m, inner) => {
      const options = inner.split('|')
      return options[Math.floor(rand() * options.length)]
    })
  }
  return out.replace(/\u0000(\d+)\u0000/g, (m, i) => kept[Number(i)])
}

function words(text) {
  return new Set(resolveSpintax(text, () => 0).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]{3,}/g) || [])
}

function similarity(a, b) {
  const A = words(a), B = words(b)
  if (A.size === 0 && B.size === 0) return 1
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  return inter / (A.size + B.size - inter)
}

// Verificador de qualidade das variações: critical bloqueia o início; warning e tip só avisam.
export function analyzeMessages(variants) {
  const issues = []
  const list = (variants || []).map((v) => String(v || '').trim())
  if (list.length < MIN_VARIANTS) issues.push({ level: 'critical', text: `Escreva pelo menos ${MIN_VARIANTS} variações da mensagem — mandar o mesmo texto para muitos desconhecidos é o que mais causa bloqueio.` })
  list.forEach((v, i) => { if (!v) issues.push({ level: 'critical', text: `A variação ${i + 1} está vazia.` }) })
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (!list[i] || !list[j]) continue
      const sim = similarity(list[i], list[j])
      if (sim >= 0.95) issues.push({ level: 'critical', text: `As variações ${i + 1} e ${j + 1} são praticamente iguais. Mude o texto, não só uma palavra.` })
      else if (sim >= 0.75) issues.push({ level: 'warning', text: `As variações ${i + 1} e ${j + 1} estão muito parecidas (${Math.round(sim * 100)}%). Varie a abertura, a ordem e a pergunta.` })
    }
  }
  const all = list.join('\n')
  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|br|net|app|link|ly)\b/i.test(all)) issues.push({ level: 'warning', text: 'Evite link na primeira mensagem para quem não te conhece — envie o link quando a pessoa responder.' })
  if (!/\{\{\s*(primeiro_nome|nome)\s*\}\}/.test(all)) issues.push({ level: 'tip', text: 'Use {{primeiro_nome}} — mensagem com o nome da pessoa parece conversa, não disparo.' })
  if (list.some((v) => v && !/\?/.test(v))) issues.push({ level: 'tip', text: 'Termine com uma pergunta fácil de responder. Resposta gera conversa e conversa protege o número.' })
  if (!/\bsair\b/i.test(all)) issues.push({ level: 'warning', text: 'Inclua "Se não quiser receber, responda SAIR" — reduz denúncias de spam.' })
  for (const [i, v] of list.entries()) {
    const letters = v.replace(/[^A-Za-zÀ-ÿ]/g, '')
    const upper = v.replace(/[^A-ZÀ-Þ]/g, '')
    if (letters.length > 20 && upper.length / letters.length > 0.3) issues.push({ level: 'warning', text: `A variação ${i + 1} tem muita LETRA MAIÚSCULA — parece propaganda.` })
    const emojis = (v.match(/\p{Extended_Pictographic}/gu) || []).length
    if (emojis > 4) issues.push({ level: 'warning', text: `A variação ${i + 1} tem ${emojis} emojis. Use no máximo 2 ou 3.` })
    if (v.length > 600) issues.push({ level: 'warning', text: `A variação ${i + 1} está longa (${v.length} caracteres). Primeira mensagem curta tem mais resposta.` })
    if (/gr[aá]tis|imperd[ií]vel|clique aqui|ganhe|100%|promo[cç][aã]o rel[aâ]mpago|[uú]ltimas? vagas/i.test(v)) issues.push({ level: 'tip', text: `A variação ${i + 1} usa palavras típicas de spam (grátis, imperdível, clique aqui…).` })
  }
  const score = Math.max(0, 100
    - 40 * issues.filter((x) => x.level === 'critical').length
    - 12 * issues.filter((x) => x.level === 'warning').length
    - 5 * issues.filter((x) => x.level === 'tip').length)
  return { score, issues }
}

// ===== Triagem da planilha =====

export function slugifyHeader(header, index) {
  const s = String(header || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30)
  const key = /^[a-z]/.test(s) ? s : `coluna_${index + 1}`
  return key === 'nome' || key === 'primeiro_nome' ? `${key}_planilha` : key
}

function recentlyProspectedSet(exceptProspectId = null) {
  const since = Date.now() - RECONTACT_DAYS * DAY_MS
  const set = new Set()
  for (const p of store.listProspects()) {
    if (p.id === exceptProspectId) continue
    for (const l of p.leads) if (l.sentAt && l.sentAt >= since) set.add(l.jid)
  }
  return set
}

// Confere os números no WhatsApp em lotes pequenos, com pausa entre eles.
export async function triageRows(parsed, { phoneColumn, nameColumn, manualFrom = Infinity, sock: sockOverride }) {
  const sock = sockOverride || whatsapp.getSock() // sockOverride: só para testes
  const headers = parsed.headers
  const varKeys = headers.map((h, i) => slugifyHeader(h, i))

  const rows = parsed.rows.map((row, idx) => {
    const rawPhone = String(row[phoneColumn] || '').trim()
    const name = nameColumn != null ? String(row[nameColumn] || '').trim() || null : null
    const vars = {}
    headers.forEach((h, i) => {
      if (i === phoneColumn) return
      const value = String(row[i] || '').trim()
      if (value) vars[varKeys[i]] = value
    })
    // manual: número digitado à mão no assistente (não veio da planilha)
    return { row: idx + 2, rawPhone, name, vars, manual: idx >= manualFrom, candidates: normalizePhoneCandidates(rawPhone) }
  })

  // duplicados dentro da própria lista (mesmo número escrito de jeitos diferentes)
  const seen = new Map()
  for (const r of rows) {
    const key = r.candidates[0]
    if (!key) continue
    if (seen.has(key)) r.duplicateOf = seen.get(key)
    else seen.set(key, r.row)
  }

  const toCheck = Array.from(new Set(rows.filter((r) => !r.duplicateOf).flatMap((r) => r.candidates)))
  const existing = new Map()
  for (let i = 0; i < toCheck.length; i += VALIDATE_CHUNK) {
    const chunk = toCheck.slice(i, i + VALIDATE_CHUNK)
    let results = []
    try {
      results = await sock.onWhatsApp(...chunk)
    } catch (err) {
      throw new Error('Falha ao conferir números no WhatsApp: ' + err.message)
    }
    for (const r of results || []) {
      if (r?.exists && r.jid) existing.set(r.jid.split('@')[0].replace(/^\+/, ''), r.jid)
    }
    if (i + VALIDATE_CHUNK < toCheck.length) await sleep(VALIDATE_GAP_MS)
  }

  const recent = recentlyProspectedSet()
  const contacts = new Set(store.listAllContacts().map((c) => c.jid))
  const results = rows.map((r) => {
    const base = { row: r.row, rawPhone: r.rawPhone, name: r.name, vars: r.vars, manual: r.manual, jid: null, phone: null }
    if (r.candidates.length === 0) return { ...base, status: 'invalid' }
    if (r.duplicateOf) return { ...base, status: 'duplicate', note: `repete a linha ${r.duplicateOf}` }
    const match = r.candidates.find((c) => existing.has(c))
    if (!match) return { ...base, status: 'no_whatsapp' }
    const jid = existing.get(match)
    const withJid = { ...base, jid, phone: jid.split('@')[0] }
    if (store.isOptedOut(jid)) return { ...withJid, status: 'optout' }
    if (recent.has(jid)) return { ...withJid, status: 'recent' }
    if (contacts.has(jid)) return { ...withJid, status: 'contact' }
    return { ...withJid, status: 'valid' }
  })

  const summary = {}
  for (const r of results) summary[r.status] = (summary[r.status] || 0) + 1
  return { results, summary, varKeys: Array.from(new Set(varKeys.filter((k, i) => i !== phoneColumn))) }
}

// ===== Criação =====

function buildSafety(raw) {
  const preset = PRESETS[raw?.preset] ? raw.preset : 'conservador'
  const base = PRESETS[preset]
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d)
  const safety = {
    preset,
    dailyCap: Math.min(HARD_LIMITS.dailyCapMax, Math.max(1, Math.round(num(raw?.dailyCap, base.dailyCap)))),
    warmupStart: Math.max(1, Math.round(num(raw?.warmupStart, base.warmupStart))),
    warmupStep: Math.max(0, Math.round(num(raw?.warmupStep, base.warmupStep))),
    delayMinSec: Math.max(HARD_LIMITS.delayMinSec, num(raw?.delayMinSec, base.delayMinSec)),
    delayMaxSec: Math.max(HARD_LIMITS.delayMinSec, num(raw?.delayMaxSec, base.delayMaxSec)),
    batchSize: Math.min(HARD_LIMITS.batchSizeMax, Math.max(1, Math.round(num(raw?.batchSize, base.batchSize)))),
    batchPauseMinutes: Math.max(HARD_LIMITS.batchPauseMinMinutes, num(raw?.batchPauseMinutes, base.batchPauseMinutes)),
    sendWindow: campaigns.validateSendWindow(raw?.sendWindow || DEFAULT_WINDOW)
  }
  if (safety.delayMaxSec < safety.delayMinSec) safety.delayMaxSec = safety.delayMinSec
  if (safety.warmupStart > safety.dailyCap) safety.warmupStart = safety.dailyCap
  return safety
}

export function createProspect(input) {
  const name = String(input?.name || '').trim()
  if (!name) throw new Error('Dê um nome para a lista.')
  if (name.length > 80) throw new Error('O nome pode ter no máximo 80 caracteres.')

  const leadsIn = Array.isArray(input?.leads) ? input.leads : []
  if (leadsIn.length === 0) throw new Error('Selecione pelo menos um lead.')
  if (leadsIn.length > HARD_LIMITS.maxLeads) throw new Error(`No máximo ${HARD_LIMITS.maxLeads} leads por lista.`)
  const recent = recentlyProspectedSet()
  const seenJids = new Set()
  const leads = []
  for (const l of leadsIn) {
    if (!l || typeof l.jid !== 'string' || !l.jid.endsWith('@s.whatsapp.net')) continue
    if (seenJids.has(l.jid) || store.isOptedOut(l.jid) || recent.has(l.jid)) continue
    seenJids.add(l.jid)
    leads.push({
      jid: l.jid,
      phone: l.jid.split('@')[0],
      name: l.name ? String(l.name).slice(0, 120) : null,
      vars: l.vars && typeof l.vars === 'object' ? Object.fromEntries(Object.entries(l.vars).slice(0, 30).map(([k, v]) => [String(k).slice(0, 30), String(v).slice(0, 300)])) : {},
      status: 'pending', variant: null, sentAt: null, error: null
    })
  }
  if (leads.length === 0) throw new Error('Nenhum lead pode receber: todos são repetidos, pediram para sair ou já foram prospectados nos últimos 30 dias.')

  const variants = (Array.isArray(input?.variants) ? input.variants : []).map((v) => String(v || '').trim()).slice(0, MAX_VARIANTS)
  const quality = analyzeMessages(variants)
  const critical = quality.issues.find((i) => i.level === 'critical')
  if (critical) throw new Error(critical.text)

  const followups = (Array.isArray(input?.followups) ? input.followups : []).slice(0, MAX_FOLLOWUPS).map((f, i) => {
    const delayDays = Number(f?.delayDays)
    const message = String(f?.message || '').trim()
    if (!Number.isInteger(delayDays) || delayDays < 1 || delayDays > 30) throw new Error(`Follow-up ${i + 1}: o prazo precisa ser de 1 a 30 dias.`)
    if (!message) throw new Error(`Follow-up ${i + 1}: escreva a mensagem.`)
    const missing = campaigns.findMissingVariables([message], {})
    if (missing.length) throw new Error(`Follow-up ${i + 1}: só {{nome}} e {{primeiro_nome}} funcionam em follow-up (tem {{${missing[0]}}}).`)
    return { delayDays, message: resolveSpintax(message), file: null }
  })

  let startAt = null
  if (input?.startAt) {
    const d = new Date(input.startAt)
    if (Number.isNaN(d.getTime())) throw new Error('Data de início inválida.')
    startAt = d.getTime()
  }

  const safety = buildSafety(input?.safety)
  const campaign = campaigns.createCampaign(
    campaigns.persistCampaignInput({ name: `Prospecção: ${name}`, steps: followups }, { description: 'Prospecção de leads frios', sendWindow: safety.sendWindow }),
    { origin: `Prospecção (${leads.length} leads)`, initialPreview: variants[0] }
  )

  const prospect = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    status: 'active',
    pausedReason: null,
    startAt,
    campaignId: campaign.id,
    variants,
    followupCount: followups.length,
    safety,
    leads,
    lastBatchEndedAt: null,
    nextGapMs: 0,
    lastVariant: -1
  }
  store.addProspect(prospect)
  return prospect
}

// ===== Ritmo diário e aquecimento =====

const dayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }

function dayStats(prospect, now = Date.now()) {
  const today = dayKey(now)
  const days = new Set()
  let todaySent = 0
  for (const l of prospect.leads) {
    if (!l.sentAt) continue
    const k = dayKey(l.sentAt)
    if (k === today) todaySent++
    else days.add(k)
  }
  const s = prospect.safety
  const todayCap = Math.min(s.dailyCap, s.warmupStart + s.warmupStep * days.size)
  return { todaySent, todayCap, daysActive: days.size }
}

// Estimativa de quantos dias úteis (da janela) faltam, respeitando o aquecimento.
function estimateDays(prospect) {
  let remaining = prospect.leads.filter((l) => l.status === 'pending').length
  if (remaining === 0) return 0
  const s = prospect.safety
  const { todaySent, todayCap, daysActive } = dayStats(prospect)
  let days = 0
  let index = daysActive
  remaining -= Math.max(0, todayCap - todaySent)
  if (todaySent > 0 || todayCap > 0) days = 1
  while (remaining > 0 && days < 3650) {
    index++
    days++
    remaining -= Math.min(s.dailyCap, s.warmupStart + s.warmupStep * index)
  }
  return days
}

function pickVariant(prospect) {
  const n = prospect.variants.length
  if (n <= 1) return 0
  let v = Math.floor(Math.random() * n)
  if (v === prospect.lastVariant) v = (v + 1) % n // nunca a mesma variação duas vezes seguidas
  prospect.lastVariant = v
  return v
}

function campaignContactOf(prospect, jid) {
  return store.getCampaign(prospect.campaignId)?.contacts[jid] || null
}

function optOutRate(prospect) {
  const sent = prospect.leads.filter((l) => l.status === 'sent')
  if (sent.length < OPTOUT_MIN_SAMPLE) return null
  const optouts = sent.filter((l) => store.isOptedOut(l.jid) || campaignContactOf(prospect, l.jid)?.stoppedReason === 'optout').length
  return optouts / sent.length
}

function pause(prospect, reason) {
  prospect.status = 'paused'
  prospect.pausedReason = reason
  const campaign = store.getCampaign(prospect.campaignId)
  if (campaign && campaign.status === 'active') {
    campaign.status = 'paused'
    campaign.pausedReason = 'Pausada junto com a prospecção: ' + reason
  }
  store.saveProspects()
  store.saveCampaigns()
}

// ===== Execução (a cada minuto) =====

export function processProspects() {
  if (running || isBusy()) return
  const status = whatsapp.getStatus().status
  if (status === 'logged_out') {
    for (const p of store.listProspects()) {
      if (p.status === 'active') pause(p, 'O WhatsApp encerrou a sessão do aparelho — isso costuma acontecer quando o número é bloqueado ou recebe muitas denúncias. Confira o número no celular antes de retomar.')
    }
    return
  }
  try { whatsapp.getSock() } catch { return }

  const settings = store.getSettings()
  if (settings.dailyLimit > 0 && store.countSendsInWindow(24).total >= settings.dailyLimit) return

  const now = Date.now()
  const queue = store.listProspects().filter((p) => p.status === 'active').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  for (const prospect of queue) {
    const pending = prospect.leads.filter((l) => l.status === 'pending')
    if (pending.length === 0) { prospect.status = 'done'; store.saveProspects(); continue }
    if (prospect.startAt && now < prospect.startAt) continue
    if (!campaigns.inSendWindow(new Date(now), prospect.safety.sendWindow)) continue
    if (prospect.lastBatchEndedAt && now - prospect.lastBatchEndedAt < prospect.nextGapMs) continue

    const rate = optOutRate(prospect)
    if (rate !== null && rate >= OPTOUT_PAUSE_RATE) {
      pause(prospect, `${Math.round(rate * 100)}% de quem recebeu pediu para sair. Isso indica que a mensagem está sendo vista como spam — revise o texto e o público antes de retomar.`)
      continue
    }

    const { todaySent, todayCap } = dayStats(prospect, now)
    const room = todayCap - todaySent
    if (room <= 0) continue

    // revalida na hora: pode ter pedido pra sair ou entrado em outra lista desde a importação
    const recent = recentlyProspectedSet(prospect.id)
    const batch = []
    for (const lead of pending) {
      if (batch.length >= Math.min(room, prospect.safety.batchSize)) break
      if (store.isOptedOut(lead.jid) || recent.has(lead.jid)) {
        lead.status = 'skipped'
        lead.error = store.isOptedOut(lead.jid) ? 'Pediu para não receber mensagens' : 'Já recebeu prospecção nos últimos 30 dias'
        continue
      }
      batch.push(lead)
    }
    store.saveProspects()
    if (batch.length === 0) continue
    startBatch(prospect, batch)
    return // um lote por vez
  }
}

function startBatch(prospect, batch) {
  const byJid = new Map(batch.map((l) => [l.jid, l]))
  const hooks = campaigns.initialDispatchHooks(prospect.campaignId, prospect.leads.length)
  const s = prospect.safety
  running = prospect.id
  try {
    startDispatch({
      contacts: batch.map((l) => ({ jid: l.jid, name: l.name })),
      labelName: `Prospecção "${prospect.name}"`,
      message: prospect.variants[0],
      messageType: 'media',
      simulateTyping: true,
      skipBlocked: true,
      markAsRead: false,
      // lote pequeno, sem pausa interna: a pausa longa é entre um lote e outro (nextGapMs)
      pacing: { delayMinSec: s.delayMinSec, delayMaxSec: s.delayMaxSec, batchSize: 100000, batchPauseMinutes: 0 },
      messageFor: (contact) => {
        const lead = byJid.get(contact.jid)
        if (!lead) return null
        const v = pickVariant(prospect)
        lead.variant = v
        return campaigns.applyVariables(resolveSpintax(prospect.variants[v]), lead.vars)
      },
      shouldSend: (contact) => {
        const current = store.getProspect(prospect.id)
        const lead = byJid.get(contact.jid)
        return !!current && current.status === 'active' && lead?.status === 'pending' &&
          !store.isOptedOut(contact.jid) && campaigns.inSendWindow(new Date(), current.safety.sendWindow)
      },
      onResult: (contact, status) => {
        const lead = byJid.get(contact.jid)
        if (lead) {
          lead.status = status === 'sent' ? 'sent' : 'failed'
          lead.sentAt = status === 'sent' ? Date.now() : null
          if (status !== 'sent') lead.error = 'Falha no envio'
        }
        hooks.onResult(contact, status)
        store.saveProspects()
      },
      onFinish: (summary) => {
        running = null
        hooks.onFinish(summary)
        const current = store.getProspect(prospect.id)
        if (!current) return
        current.lastBatchEndedAt = Date.now()
        // pausa entre lotes com variação (0,8x a 1,4x), pra não ter um padrão fixo
        current.nextGapMs = current.safety.batchPauseMinutes * 60 * 1000 * (0.8 + Math.random() * 0.6)
        if (summary?.aborted && ['consecutive_failures', 'failure_rate', 'error'].includes(summary.reason)) {
          pause(current, 'Muitos envios falharam seguidos. Pode ser instabilidade ou o início de um bloqueio — confira o WhatsApp no celular antes de retomar.')
          return
        }
        if (!current.leads.some((l) => l.status === 'pending')) current.status = 'done'
        store.saveProspects()
      }
    })
  } catch (err) {
    running = null
    hooks.onFinish({ aborted: true, reason: 'busy' })
    console.error('Lote de prospecção adiado:', err.message)
  }
}

export function initProspecting() {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(processProspects, TICK_MS)
  setTimeout(processProspects, 20 * 1000)
}

// ===== Leitura e controle pela tela =====

function leadView(prospect, lead) {
  const cc = campaignContactOf(prospect, lead.jid)
  let status = lead.status
  if (store.isOptedOut(lead.jid) || cc?.stoppedReason === 'optout') status = lead.status === 'sent' ? 'optout' : status
  else if (cc?.repliedAt) status = 'replied'
  return {
    jid: lead.jid, phone: lead.phone, name: lead.name, status, variant: lead.variant,
    sentAt: lead.sentAt, error: lead.error, lastReply: cc?.lastReply || null, stage: cc?.stage || null
  }
}

function summarize(prospect) {
  const counts = { pending: 0, sent: 0, failed: 0, skipped: 0, replied: 0, optout: 0 }
  for (const l of prospect.leads) {
    const v = leadView(prospect, l)
    if (v.status === 'replied' || v.status === 'optout') counts.sent++
    counts[v.status] = (counts[v.status] || 0) + 1
  }
  const { todaySent, todayCap } = dayStats(prospect)
  const delivered = counts.sent
  return {
    id: prospect.id,
    name: prospect.name,
    createdAt: prospect.createdAt,
    status: prospect.status,
    pausedReason: prospect.pausedReason,
    startAt: prospect.startAt,
    campaignId: prospect.campaignId,
    total: prospect.leads.length,
    counts,
    replyRate: delivered > 0 ? counts.replied / delivered : 0,
    optOutRate: delivered > 0 ? counts.optout / delivered : 0,
    todaySent,
    todayCap,
    etaDays: prospect.status === 'active' ? estimateDays(prospect) : null,
    preset: prospect.safety.preset,
    sendingNow: running === prospect.id
  }
}

export function listProspectSummaries() {
  return store.listProspects().map(summarize).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getProspectDetail(id) {
  const p = store.getProspect(id)
  if (!p) return null
  return {
    ...summarize(p),
    variants: p.variants,
    safety: p.safety,
    quality: analyzeMessages(p.variants),
    leads: p.leads.map((l) => leadView(p, l))
  }
}

export function setProspectStatus(id, status) {
  const p = store.getProspect(id)
  if (!p) throw new Error('Lista não encontrada.')
  if (status === 'active') {
    if (!p.leads.some((l) => l.status === 'pending')) throw new Error('Não há mais leads para enviar nesta lista.')
    p.status = 'active'
    p.pausedReason = null
    const campaign = store.getCampaign(p.campaignId)
    if (campaign && campaign.status === 'paused') { campaign.status = 'active'; campaign.pausedReason = null }
  } else {
    p.status = 'paused'
    p.pausedReason = null
  }
  store.saveProspects()
  store.saveCampaigns()
  return summarize(p)
}

export function deleteProspect(id) {
  if (running === id) throw new Error('Um lote desta lista está sendo enviado agora. Pause e tente de novo quando terminar.')
  const p = store.removeProspect(id)
  if (!p) throw new Error('Lista não encontrada.')
  try { campaigns.deleteCampaign(p.campaignId) } catch { /* funil já removido */ }
}

// Pré-visualização: como alguns leads reais vão receber (variação + trechos + variáveis)
export function previewMessages(variants, leads, count = 4) {
  const sample = (leads || []).slice(0, Math.max(count, 1))
  const out = []
  for (let i = 0; i < count; i++) {
    const lead = sample[i % Math.max(sample.length, 1)] || { name: 'Maria Souza', vars: {} }
    const v = i % Math.max(variants.length, 1)
    const text = campaigns.applyVariables(resolveSpintax(variants[v] || ''), lead.vars || {})
    const first = lead.name && /\p{L}/u.test(lead.name) ? lead.name.trim().split(/\s+/)[0] : 'cliente'
    out.push({
      variant: v,
      leadName: lead.name || lead.phone || 'Lead',
      text: text.replace(/\{\{\s*primeiro_nome\s*\}\}/gi, first).replace(/\{\{\s*nome\s*\}\}/gi, lead.name || 'cliente')
    })
  }
  return out
}

export { PRESETS as SAFETY_PRESETS }
