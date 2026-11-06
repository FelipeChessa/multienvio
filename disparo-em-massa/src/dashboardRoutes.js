import express from 'express'
import * as store from './db.js'
import * as whatsapp from './whatsapp.js'
import { listProspectSummaries } from './prospecting.js'

// Painel de início: em vez de contadores soltos, responde "o que eu faço agora?" —
// quem respondeu e está esperando, quanto vendeu, quanto ainda dá pra enviar hoje e se o
// número está saudável (risco de bloqueio).

const router = express.Router()
const DAY = 24 * 60 * 60 * 1000

function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

router.get('/api/dashboard', (req, res) => {
  const now = Date.now()
  const weekAgo = now - 7 * DAY

  // ----- respostas aguardando, vendas, taxa de resposta (todas as campanhas) -----
  const waiting = []
  let won7d = 0
  let negotiating = 0
  let sent7d = 0
  let replied7d = 0
  let followupsToday = 0
  for (const c of store.listCampaigns()) {
    for (const e of Object.values(c.contacts)) {
      if (e.stage === 'replied') {
        waiting.push({ name: e.name, phone: (e.keys || []).concat(e.jid).find((k) => k && k.endsWith('@s.whatsapp.net'))?.split('@')[0] || null, lastReply: e.lastReply, lastReplyAt: e.lastReplyAt, campaignId: c.id, campaignName: c.name })
      }
      if (e.stage === 'negotiating') negotiating++
      if (e.stage === 'won' && (e.stageChangedAt || 0) >= weekAgo) won7d++
      if (e.firstSentAt >= weekAgo) {
        sent7d++
        if (e.repliedAt) replied7d++
      }
      const step = c.steps[e.followupsSent]
      if (c.status === 'active' && e.stage === 'waiting' && !e.stoppedReason && step && e.lastSentAt + step.delayDays * DAY <= endOfToday()) followupsToday++
    }
  }
  waiting.sort((a, b) => (b.lastReplyAt || 0) - (a.lastReplyAt || 0))

  // ----- envios e limite -----
  const settings = store.getSettings()
  const usage = store.countSendsInWindow(24)
  const prospects = listProspectSummaries()
  const prospectToday = prospects.filter((p) => p.status === 'active').reduce((sum, p) => sum + Math.max(0, p.todayCap - p.todaySent), 0)
  const nextScheduled = store.listScheduledMessages().find((m) => m.status === 'pending' && new Date(m.scheduledFor).getTime() > now)

  // ----- saúde do número -----
  const reasons = []
  let level = 'ok'
  const bump = (to, text) => {
    reasons.push(text)
    if (to === 'risk' || (to === 'attention' && level === 'ok')) level = to
  }
  const status = whatsapp.getStatus().status
  if (status === 'logged_out') bump('risk', 'O WhatsApp encerrou a sessão — confira se o número não foi bloqueado.')
  const failRate = usage.total >= 10 ? usage.failed / usage.total : 0
  if (failRate >= 0.25) bump('risk', `${Math.round(failRate * 100)}% dos envios das últimas 24h falharam.`)
  else if (failRate >= 0.1) bump('attention', `${Math.round(failRate * 100)}% dos envios das últimas 24h falharam.`)
  const optOuts7d = store.listOptOuts().filter((o) => new Date(o.at).getTime() >= weekAgo).length
  if (sent7d >= 20 && optOuts7d / sent7d >= 0.05) bump('attention', `${optOuts7d} pessoas pediram para sair nos últimos 7 dias — revise as mensagens.`)
  const pausedForSafety = prospects.filter((p) => p.status === 'paused' && p.pausedReason)
  if (pausedForSafety.length) bump('risk', `${pausedForSafety.length} prospecção(ões) pausada(s) por segurança.`)
  if (settings.dailyLimit === 0 || settings.dailyLimit > 300) bump('attention', 'Sem limite diário (ou limite muito alto) nas Configurações de envio.')
  if (settings.delayMinSec < 3) bump('attention', 'Intervalo entre mensagens muito curto nas Configurações de envio.')

  res.json({
    waiting: { count: waiting.length, items: waiting.slice(0, 4) },
    sales: { won7d, negotiating, replyRate7d: sent7d > 0 ? replied7d / sent7d : null, sent7d },
    sending: {
      last24h: usage.total,
      dailyLimit: settings.dailyLimit,
      followupsToday,
      prospectToday,
      nextScheduledAt: nextScheduled ? nextScheduled.scheduledFor : null
    },
    health: { level, reasons, optOuts7d }
  })
})

// Tela inicial (área central quando nenhum destinatário está selecionado): o que está em
// andamento, os últimos envios e — para quem está começando — os primeiros passos.
router.get('/api/home', (req, res) => {
  const now = Date.now()

  const running = []
  for (const c of store.listCampaigns()) {
    if (c.name.startsWith('Prospecção: ')) continue // aparece pela prospecção
    const entries = Object.values(c.contacts)
    const pending = entries.some((e) => e.stage === 'waiting' && !e.stoppedReason && e.followupsSent < c.steps.length)
    if (c.status !== 'active' && !c.initialSending) continue
    if (!pending && !c.initialSending && entries.length > 0 && c.steps.length > 0) continue
    running.push({
      kind: 'campaign', id: c.id, name: c.name, status: c.status,
      detail: `${entries.length} receberam · ${entries.filter((e) => e.repliedAt).length} responderam`
    })
  }
  for (const p of listProspectSummaries()) {
    if (p.status === 'done') continue
    const sent = p.total - p.counts.pending - p.counts.skipped
    running.push({
      kind: 'prospect', id: p.id, name: p.name, status: p.status, pausedReason: p.pausedReason,
      detail: `${sent}/${p.total} enviados · hoje ${p.todaySent}/${p.todayCap}`, progress: p.total ? sent / p.total : 0
    })
  }
  for (const m of store.listScheduledMessages()) {
    if (m.status !== 'pending') continue
    running.push({
      kind: 'scheduled', id: m.id, name: m.payload?.campaign?.name || m.payload?.labelName || 'Envio programado',
      status: 'scheduled', when: m.scheduledFor, detail: `${(m.payload?.contacts || []).length || ''} programado para ${new Date(m.scheduledFor).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`.trim()
    })
  }

  // últimos envios, agrupados por disparo
  const jobs = new Map()
  for (const log of store.listSendLogsForExport()) {
    if (!log.jobId) continue
    const j = jobs.get(log.jobId) || { name: log.labelName || 'Envio', sent: 0, failed: 0, at: log.createdAt }
    if (log.status === 'sent') j.sent++
    else if (log.status === 'failed') j.failed++
    if (log.createdAt > j.at) j.at = log.createdAt
    jobs.set(log.jobId, j)
  }
  const recent = Array.from(jobs.values()).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5)

  const profile = store.getMessagingProfile()
  const labels = store.listLabels()
  const firstSteps = {
    connected: whatsapp.getStatus().status === 'connected',
    hasLabels: labels.some((l) => l.contactCount > 0),
    firstSend: jobs.size > 0,
    hasCampaign: store.listCampaigns().length > 0,
    profileReady: !!(profile.businessCard?.name)
  }

  res.json({ running: running.slice(0, 8), recent, firstSteps, now })
})

export default router
