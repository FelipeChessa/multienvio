// POST /api/license-check — chamado pelo programa do cliente ao abrir, a cada 5 minutos e a cada
// ação, para saber se a chave continua valendo naquele computador. Não ativa nada e não registra
// computador novo.
//
// Só "revoked" e "other_device" fazem o programa travar ("expired" ele já trava sozinho pela data
// da chave). Chave sem registro responde ok: pode ter sido ativada antes de este servidor existir,
// ou ter passado por um reset (o próximo computador a ativar vira o dono, e os demais recebem
// "other_device").
//
// Também guarda, para o painel admin:
//   - lastSeenAt: último uso liberado (de 10 em 10 minutos)
//   - lastCheck: última conferência de qualquer tipo (inclusive revogada/vencida) e a versão do
//     programa — é a prova de que o programa do cliente travou
//   - usage:<chave>: dados de uso enviados pelo programa (só contagens; src/usage.js no app)

import { redis } from '../lib/redis.js'
import { verifySignature } from '../lib/verify.js'

const WRITE_EVERY_MS = 10 * 60 * 1000
const MAX_USAGE_BYTES = 30 * 1024

function cleanVersion(v) {
  return typeof v === 'string' && /^\d+\.\d+\.\d+$/.test(v) ? v : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido.' })

  const { key, deviceId, appVersion, usage } = req.body || {}
  const payload = typeof key === 'string' ? verifySignature(key) : null
  if (!payload) return res.status(400).json({ ok: false, reason: 'invalid' })
  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({ ok: false, reason: 'bad_request' })
  }

  const licenseKey = key.trim()
  const redisKey = `activation:${licenseKey}`
  const existing = await redis.get(redisKey)

  const expired = !!payload.expiresAt && new Date(payload.expiresAt).getTime() < Date.now()
  let result
  if (!existing) result = expired ? 'expired' : 'ok'
  else if (existing.revoked) result = 'revoked'
  else if (existing.deviceId !== deviceId) result = 'other_device'
  else if (expired) result = 'expired'
  else result = 'ok'

  if (existing) {
    const now = Date.now()
    const nowIso = new Date(now).toISOString()
    const version = cleanVersion(appVersion)
    const sameDevice = existing.deviceId === deviceId
    const last = existing.lastCheck
    const changed = !last || last.result !== result || last.appVersion !== version
    const stale = (iso) => !iso || now - new Date(iso).getTime() >= WRITE_EVERY_MS
    // grava no máximo de 10 em 10 minutos (o programa confere bem mais que isso), salvo mudança
    if (sameDevice && (changed || stale(last?.at))) {
      const next = { ...existing, lastCheck: { at: nowIso, result, appVersion: version } }
      if (result === 'ok') next.lastSeenAt = nowIso
      await redis.set(redisKey, next)
    } else if (!sameDevice && stale(existing.otherDeviceAt)) {
      // conferência de outro computador não sobrescreve a do dono: fica registrada à parte
      await redis.set(redisKey, { ...existing, otherDeviceAt: nowIso })
    }

    // dados de uso: só do computador dono da chave, e com tamanho limitado
    if (sameDevice && usage && typeof usage === 'object' && !Array.isArray(usage)) {
      if (JSON.stringify(usage).length <= MAX_USAGE_BYTES) {
        await redis.set(`usage:${licenseKey}`, { ...usage, receivedAt: nowIso })
      }
    }
  }

  if (result === 'ok') return res.status(200).json({ ok: true, registered: !!existing })
  return res.status(200).json({ ok: false, reason: result })
}
