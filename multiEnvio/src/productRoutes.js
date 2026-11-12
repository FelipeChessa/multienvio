import express from 'express'
import crypto from 'crypto'
import { productsCrud } from './db.js'

// Catálogo de produtos — cadastro simples (nome/preço/descrição) inserido como texto
// formatado na mensagem pelo compositor (ver botão "Produto" em public/app.js). Sem
// foto: essa versão não gera uma mensagem de mídia pronta, só o texto do produto.
const router = express.Router()

router.get('/api/products', (req, res) => {
  res.json(productsCrud.list())
})

router.post('/api/products', (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Dê um nome pro produto.' })

  const entry = {
    id: crypto.randomUUID(),
    name,
    price: (req.body.price || '').trim(),
    description: (req.body.description || '').trim(),
    createdAt: new Date().toISOString()
  }
  productsCrud.add(entry)
  res.json({ ok: true, product: entry })
})

router.put('/api/products/:id', (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Dê um nome pro produto.' })

  const updated = productsCrud.update(req.params.id, {
    name,
    price: (req.body.price || '').trim(),
    description: (req.body.description || '').trim()
  })
  if (!updated) return res.status(404).json({ error: 'Produto não encontrado.' })
  res.json({ ok: true, product: updated })
})

router.delete('/api/products/:id', (req, res) => {
  const removed = productsCrud.remove(req.params.id)
  if (!removed) return res.status(404).json({ error: 'Produto não encontrado.' })
  res.json({ ok: true })
})

export default router
