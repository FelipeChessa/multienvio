// POST /api/license-check — chamado periodicamente pelo programa do cliente para saber se a
// chave continua valendo naquele computador. Não ativa nada e não registra computador novo.
//
// Só "revoked" e "other_device" fazem o programa travar. Chave sem registro responde ok: pode
// ter sido ativada antes de este servidor existir, ou ter passado por um reset (nesse caso o
// próximo computador a ativar vira o dono, e os demais recebem "other_device").

import { redis } from '../lib/redis.js'
import { verifySignature } from '../lib/verify.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido.' })

  const { key, deviceId } = req.body || {}
  if (typeof key !== 'string' || !verifySignature(key)) {
    return res.status(400).json({ ok: false, reason: 'invalid' })
  }
  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({ ok: false, reason: 'bad_request' })
  }

  const redisKey = `activation:${key.trim()}`
  const existing = await redis.get(redisKey)

  if (!existing) return res.status(200).json({ ok: true, registered: false })
  if (existing.revoked) return res.status(200).json({ ok: false, reason: 'revoked' })
  if (existing.deviceId !== deviceId) return res.status(200).json({ ok: false, reason: 'other_device' })

  // o programa confere a cada poucos minutos: só regrava o "último uso" de 10 em 10 minutos
  // para não gastar uma escrita no banco a cada consulta
  const lastSeen = existing.lastSeenAt ? new Date(existing.lastSeenAt).getTime() : 0
  if (!(Date.now() - lastSeen < 10 * 60 * 1000)) {
    await redis.set(redisKey, { ...existing, lastSeenAt: new Date().toISOString() })
  }
  res.status(200).json({ ok: true, registered: true })
}
