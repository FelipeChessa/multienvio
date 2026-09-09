import './env.js' // precisa carregar antes dos módulos que leem process.env no topo do arquivo

import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import multer from 'multer'

import * as whatsapp from './whatsapp.js'
import * as store from './db.js'
import * as license from './license.js'
import { startDispatch, subscribeToJob } from './sender.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.PORT || 3210)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } })

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

app.get('/api/labels', (req, res) => {
  res.json(store.listLabels())
})

app.get('/api/labels/:id/contacts', (req, res) => {
  res.json(store.listContactsForLabel(req.params.id))
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

app.post('/api/dispatch', upload.single('file'), (req, res) => {
  if (!license.isActivated()) {
    return res.status(403).json({ error: 'Licença não ativada.' })
  }

  const { labelId, message, contactsJson } = req.body
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Mensagem é obrigatória.' })
  }

  // reenvio rápido a partir da tabela de falhas manda uma lista explícita de contatos
  // (contactsJson), em vez de uma etiqueta inteira
  let explicitContacts = null
  if (contactsJson) {
    try {
      explicitContacts = JSON.parse(contactsJson)
    } catch {
      return res.status(400).json({ error: 'Lista de contatos para reenvio inválida.' })
    }
    if (!Array.isArray(explicitContacts) || explicitContacts.length === 0) {
      return res.status(400).json({ error: 'Selecione ao menos um contato para reenviar.' })
    }
  }

  let labelName = null
  if (!explicitContacts) {
    if (!labelId) {
      return res.status(400).json({ error: 'Etiqueta é obrigatória.' })
    }
    const labels = store.listLabels()
    const label = labels.find((l) => l.id === labelId)
    if (!label) {
      return res.status(404).json({ error: 'Etiqueta não encontrada.' })
    }
    if (label.contactCount === 0) {
      return res.status(400).json({ error: 'Essa etiqueta não tem contatos associados.' })
    }
    labelName = label.name
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

  let jobId
  try {
    jobId = startDispatch({
      labelId: explicitContacts ? null : labelId,
      labelName,
      message: message.trim(),
      file: req.file || null,
      contacts: explicitContacts
    })
  } catch (err) {
    return res.status(409).json({ error: err.message })
  }

  res.json({ jobId })
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})

if (license.isActivated()) {
  startWhatsappOnce()
} else {
  console.log('Licença não ativada — aguardando ativação pela interface web.')
}
