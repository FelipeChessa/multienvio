// POST /api/admin/revoke?token=SEU_ADMIN_TOKEN  body: { "key": "..." }
// Bloqueia uma chave (ex: cliente pediu reembolso). Ela para de ativar em qualquer computador, e
// o programa onde ela já está ativa trava na próxima conferência (api/license-check.js, a cada
// 5 minutos). Funciona também com chave que nunca foi ativada: o registro é criado já revogado.

import { redis } from '../../lib/redis.js'
import { requireAdmin, verifySignature } from '../../lib/verify.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })
  if (!requireAdmin(req, res)) return

  const { key } = req.body || {}
  const redisKey = `activation:${(key || '').trim()}`
  const existing = await redis.get(redisKey)
  if (!existing) {
    const payload = verifySignature(key)
    if (!payload) return res.status(400).json({ error: 'Chave inválida.' })
    await redis.set(redisKey, { customer: payload.customer, revoked: true, revokedAt: new Date().toISOString() })
    return res.status(200).json({ ok: true })
  }
  await redis.set(redisKey, { ...existing, revoked: true, revokedAt: new Date().toISOString() })
  res.status(200).json({ ok: true })
}
