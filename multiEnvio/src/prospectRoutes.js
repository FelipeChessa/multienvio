import express from 'express'
import multer from 'multer'
import * as license from './license.js'
import { parseSpreadsheetRows } from './spreadsheet.js'
import * as prospecting from './prospecting.js'

// Rotas do módulo "Prospecção" (leads frios). A lógica e as travas estão em src/prospecting.js.

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

router.get('/api/prospects/presets', (req, res) => {
  res.json({ presets: prospecting.PRESETS, limits: prospecting.HARD_LIMITS, minVariants: prospecting.MIN_VARIANTS, maxVariants: prospecting.MAX_VARIANTS })
})

// 1ª etapa: só lê a planilha (colunas + primeiras linhas), sem consultar o WhatsApp
router.post('/api/prospects/preview', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie uma planilha (.xlsx ou .csv).' })
  try {
    const { headers, rows } = await parseSpreadsheetRows(req.file.buffer, req.file.originalname)
    if (headers.length === 0) return res.status(400).json({ error: 'Não encontrei nenhuma linha com dados nessa planilha.' })
    res.json({ headers, previewRows: rows.slice(0, 5), totalRows: rows.length })
  } catch (err) {
    res.status(400).json({ error: 'Não consegui ler essa planilha (use .xlsx ou .csv): ' + err.message })
  }
})

// 2ª etapa: triagem — confere cada número no WhatsApp (em lotes) e classifica. NÃO envia nada.
router.post('/api/prospects/triage', upload.single('file'), async (req, res) => {
  if (!license.isActivated()) return res.status(403).json({ error: 'Licença não ativada.' })
  // números digitados à mão (manualJson: [{ name, phone }]) — sozinhos ou junto com a planilha
  let manual = []
  try {
    manual = JSON.parse(req.body.manualJson || '[]')
  } catch {
    return res.status(400).json({ error: 'Lista de números digitados inválida.' })
  }
  manual = (Array.isArray(manual) ? manual : [])
    .map((m) => ({ name: String(m?.name || '').trim().slice(0, 120), phone: String(m?.phone || '').trim().slice(0, 40) }))
    .filter((m) => m.phone)
  if (!req.file && manual.length === 0) return res.status(400).json({ error: 'Envie uma planilha ou digite pelo menos um número.' })

  let parsed
  let phoneColumn
  let nameColumn
  if (req.file) {
    phoneColumn = Number(req.body.phoneColumn)
    if (!Number.isInteger(phoneColumn) || phoneColumn < 0) return res.status(400).json({ error: 'Escolha qual coluna é o telefone.' })
    nameColumn = req.body.nameColumn !== undefined && req.body.nameColumn !== '' ? Number(req.body.nameColumn) : null
    try {
      parsed = await parseSpreadsheetRows(req.file.buffer, req.file.originalname)
    } catch (err) {
      return res.status(400).json({ error: 'Não consegui ler essa planilha: ' + err.message })
    }
  } else {
    parsed = { headers: ['Nome', 'Telefone'], rows: [] }
    phoneColumn = 1
    nameColumn = 0
  }
  // linhas digitadas entram depois das da planilha, nas mesmas colunas de telefone e nome
  const manualFrom = parsed.rows.length
  for (const m of manual) {
    const row = new Array(parsed.headers.length).fill('')
    row[phoneColumn] = m.phone
    if (nameColumn != null) row[nameColumn] = m.name
    parsed.rows.push(row)
  }
  if (parsed.rows.length > prospecting.HARD_LIMITS.maxLeads) {
    return res.status(400).json({ error: `A planilha tem ${parsed.rows.length} linhas. O máximo por lista é ${prospecting.HARD_LIMITS.maxLeads} — divida em listas menores.` })
  }
  try {
    res.json(await prospecting.triageRows(parsed, { phoneColumn, nameColumn, manualFrom }))
  } catch (err) {
    res.status(409).json({ error: err.message })
  }
})

router.post('/api/prospects/analyze', (req, res) => {
  const variants = Array.isArray(req.body?.variants) ? req.body.variants : []
  res.json({
    ...prospecting.analyzeMessages(variants),
    preview: prospecting.previewMessages(variants, req.body?.sampleLeads || [], 4)
  })
})

router.post('/api/prospects', (req, res) => {
  if (!license.isActivated()) return res.status(403).json({ error: 'Licença não ativada.' })
  try {
    const p = prospecting.createProspect(req.body || {})
    res.json({ id: p.id, total: p.leads.length })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/api/prospects', (req, res) => {
  res.json(prospecting.listProspectSummaries())
})

router.get('/api/prospects/:id', (req, res) => {
  const detail = prospecting.getProspectDetail(req.params.id)
  if (!detail) return res.status(404).json({ error: 'Lista não encontrada.' })
  res.json(detail)
})

router.post('/api/prospects/:id/pause', (req, res) => {
  try { res.json(prospecting.setProspectStatus(req.params.id, 'paused')) } catch (err) { res.status(400).json({ error: err.message }) }
})

router.post('/api/prospects/:id/resume', (req, res) => {
  try { res.json(prospecting.setProspectStatus(req.params.id, 'active')) } catch (err) { res.status(400).json({ error: err.message }) }
})

router.delete('/api/prospects/:id', (req, res) => {
  try { prospecting.deleteProspect(req.params.id); res.json({ ok: true }) } catch (err) { res.status(409).json({ error: err.message }) }
})

export default router
