// /api/admin/contracts — contratos do painel admin (header X-Admin-Token).
//
//   GET                       lista os contratos
//   GET  ?id=<id>             um contrato completo
//   GET  ?id=<id>&format=pdf  PDF com o registro das assinaturas e os metadados
//   GET  ?id=<id>&file=<fid>  baixa um anexo (comprovante de pagamento)
//   POST { action: "create", ...campos }             cria o contrato e os dois links de assinatura
//   POST { action: "update", id, ...campos }          edita (só enquanto ninguém assinou)
//   POST { action: "delete", id }                     exclui (só enquanto ninguém assinou)
//   POST { action: "upload", id, name, type, data, description }   anexa um arquivo (data em base64)
//   POST { action: "deleteFile", id, fileId }         remove um anexo

import { redis } from '../../lib/redis.js'
import { requireAdmin } from '../../lib/verify.js'
import {
  INDEX_KEY, MAX_ATTACHMENT_BYTES, contractKey, tokenKey, fileKey,
  newId, newToken, sha256, getContract, saveContract, hasSignatures, adminSummary
} from '../../lib/contracts.js'
import { buildContractPdf } from '../../lib/contract-pdf.js'

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic']

const str = (v, max = 300) => String(v ?? '').trim().slice(0, max)

function readFields(body) {
  const fields = {
    title: str(body.title, 200),
    clientName: str(body.clientName, 200),
    clientEmail: str(body.clientEmail, 200),
    contratadaName: str(body.contratadaName, 200),
    contratanteName: str(body.contratanteName, 200),
    monthlyValue: Number(body.monthlyValue) || 0,
    months: Math.max(0, Math.round(Number(body.months) || 0)),
    startDate: str(body.startDate, 10),
    form: body.form && typeof body.form === 'object' ? body.form : {},
    body: String(body.body ?? '').slice(0, 100000)
  }
  if (!fields.title) return { error: 'Informe o título do contrato.' }
  if (!fields.clientName) return { error: 'Informe o nome do cliente.' }
  if (!fields.body.trim()) return { error: 'O texto do contrato está vazio.' }
  return { fields }
}

function attachmentFileName(name) {
  return String(name || 'arquivo').replace(/[^\w.\- ()]/g, '_').slice(0, 120)
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const { id, format, file } = req.query || {}

    if (!id) {
      const ids = (await redis.smembers(INDEX_KEY)) || []
      const list = []
      for (const cid of ids) {
        const c = await getContract(String(cid))
        if (c) list.push(adminSummary(c))
      }
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      return res.status(200).json(list)
    }

    const contract = await getContract(String(id))
    if (!contract) return res.status(404).json({ error: 'Contrato não encontrado.' })

    if (file) {
      const meta = (contract.attachments || []).find((a) => a.id === file)
      const stored = meta && (await redis.get(fileKey(contract.id, meta.id)))
      if (!stored) return res.status(404).json({ error: 'Anexo não encontrado.' })
      res.setHeader('Content-Type', meta.type)
      res.setHeader('Content-Disposition', `attachment; filename="${attachmentFileName(meta.name)}"`)
      return res.status(200).send(Buffer.from(stored.data, 'base64'))
    }

    if (format === 'pdf') {
      const pdf = await buildContractPdf(contract)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="contrato-${contract.id}.pdf"`)
      return res.status(200).send(pdf)
    }

    // A imagem da assinatura vai só no PDF; aqui ficaria pesado à toa.
    return res.status(200).json({
      ...contract,
      status: adminSummary(contract).status,
      signers: contract.signers.map((s) => ({
        ...s,
        signature: s.signature ? { ...s.signature, image: undefined } : null
      }))
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })

  const body = req.body || {}
  const action = body.action

  if (action === 'create') {
    const { fields, error } = readFields(body)
    if (error) return res.status(400).json({ error })
    const now = new Date().toISOString()
    const contract = {
      id: newId('ct'),
      createdAt: now,
      updatedAt: now,
      title: fields.title,
      clientName: fields.clientName,
      monthlyValue: fields.monthlyValue,
      months: fields.months,
      startDate: fields.startDate,
      form: fields.form,
      body: fields.body,
      docHash: sha256(fields.body),
      signers: [
        { role: 'CONTRATADA', name: fields.contratadaName, email: '', token: newToken(), signature: null },
        { role: 'CONTRATANTE', name: fields.contratanteName || fields.clientName, email: fields.clientEmail, token: newToken(), signature: null }
      ],
      attachments: []
    }
    await saveContract(contract)
    for (const s of contract.signers) await redis.set(tokenKey(s.token), contract.id)
    await redis.sadd(INDEX_KEY, contract.id)
    return res.status(200).json(adminSummary(contract))
  }

  const contract = await getContract(String(body.id || ''))
  if (!contract) return res.status(404).json({ error: 'Contrato não encontrado.' })

  if (action === 'update') {
    if (hasSignatures(contract)) {
      return res.status(409).json({ error: 'Este contrato já tem assinatura e não pode mais ser alterado.' })
    }
    const { fields, error } = readFields(body)
    if (error) return res.status(400).json({ error })
    Object.assign(contract, {
      title: fields.title,
      clientName: fields.clientName,
      monthlyValue: fields.monthlyValue,
      months: fields.months,
      startDate: fields.startDate,
      form: fields.form,
      body: fields.body,
      docHash: sha256(fields.body)
    })
    contract.signers[0].name = fields.contratadaName
    contract.signers[1].name = fields.contratanteName || fields.clientName
    contract.signers[1].email = fields.clientEmail
    await saveContract(contract)
    return res.status(200).json(adminSummary(contract))
  }

  if (action === 'delete') {
    if (hasSignatures(contract)) {
      return res.status(409).json({ error: 'Contrato com assinatura não pode ser excluído.' })
    }
    for (const s of contract.signers) await redis.del(tokenKey(s.token))
    for (const a of contract.attachments || []) await redis.del(fileKey(contract.id, a.id))
    await redis.del(contractKey(contract.id))
    await redis.srem(INDEX_KEY, contract.id)
    return res.status(200).json({ ok: true })
  }

  if (action === 'upload') {
    const type = str(body.type, 100).toLowerCase()
    const data = String(body.data || '').replace(/^data:[^,]*,/, '')
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Envie um PDF ou uma imagem (PNG, JPG, WEBP ou HEIC).' })
    }
    const size = Buffer.byteLength(data, 'base64')
    if (!data || size === 0) return res.status(400).json({ error: 'Arquivo vazio.' })
    if (size > MAX_ATTACHMENT_BYTES) return res.status(413).json({ error: 'Arquivo maior que 3 MB.' })
    const meta = {
      id: newId('fl'),
      name: attachmentFileName(body.name),
      type,
      size,
      description: str(body.description, 200),
      uploadedAt: new Date().toISOString()
    }
    await redis.set(fileKey(contract.id, meta.id), { data })
    contract.attachments = [...(contract.attachments || []), meta]
    await saveContract(contract)
    return res.status(200).json(meta)
  }

  if (action === 'deleteFile') {
    const fileId = String(body.fileId || '')
    if (!(contract.attachments || []).some((a) => a.id === fileId)) {
      return res.status(404).json({ error: 'Anexo não encontrado.' })
    }
    await redis.del(fileKey(contract.id, fileId))
    contract.attachments = contract.attachments.filter((a) => a.id !== fileId)
    await saveContract(contract)
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'Ação desconhecida.' })
}
