import express from 'express'
import crypto from 'crypto'
import { templatesCrud } from './db.js'

// Templates de mensagem — texto reutilizável (com placeholders tipo {{nome}}) que o
// usuário salva e reaproveita no compositor. Sem anexos: só o texto e, se for enquete,
// a pergunta/opções — mantém o escopo simples (agendamento é que lida com arquivo).
const router = express.Router()

router.get('/api/templates', (req, res) => {
  res.json(templatesCrud.list())
})

router.post('/api/templates', (req, res) => {
  const name = (req.body.name || '').trim()
  const message = (req.body.message || '').trim()
  if (!name) return res.status(400).json({ error: 'Dê um nome pro modelo.' })
  if (!message) return res.status(400).json({ error: 'O modelo precisa ter uma mensagem.' })

  const entry = {
    id: crypto.randomUUID(),
    name,
    message,
    messageType: req.body.messageType || 'media',
    pollQuestion: req.body.pollQuestion || null,
    pollOptions: Array.isArray(req.body.pollOptions) ? req.body.pollOptions : [],
    createdAt: new Date().toISOString()
  }
  templatesCrud.add(entry)
  res.json({ ok: true, template: entry })
})

router.put('/api/templates/:id', (req, res) => {
  const name = (req.body.name || '').trim()
  const message = (req.body.message || '').trim()
  if (!name) return res.status(400).json({ error: 'Dê um nome pro modelo.' })
  if (!message) return res.status(400).json({ error: 'O modelo precisa ter uma mensagem.' })

  const updated = templatesCrud.update(req.params.id, {
    name,
    message,
    messageType: req.body.messageType || 'media',
    pollQuestion: req.body.pollQuestion || null,
    pollOptions: Array.isArray(req.body.pollOptions) ? req.body.pollOptions : []
  })
  if (!updated) return res.status(404).json({ error: 'Modelo não encontrado.' })
  res.json({ ok: true, template: updated })
})

router.delete('/api/templates/:id', (req, res) => {
  const removed = templatesCrud.remove(req.params.id)
  if (!removed) return res.status(404).json({ error: 'Modelo não encontrado.' })
  res.json({ ok: true })
})

export default router
