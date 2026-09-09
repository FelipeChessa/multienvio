// GET /api/admin/activations?token=SEU_ADMIN_TOKEN — lista todas as chaves já ativadas e em
// qual computador.

import { redis } from '../../lib/redis.js'
import { requireAdmin, verifySignature } from '../../lib/verify.js'

// A data de expiração não fica salva no Redis — ela já vem embutida na própria chave de
// licença (payload assinado), e a chave completa é o próprio nome do registro no Redis
// (activation:<chave>). Por isso decodifica aqui em vez de guardar duplicado.
function computeStatus(expiresAt, activation) {
  if (activation?.revoked) return 'revogada'
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return 'expirada'
  return 'ativa'
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  const keys = await redis.keys('activation:*')
  const result = {}
  for (const redisKey of keys) {
    const licenseKey = redisKey.replace('activation:', '')
    const activation = await redis.get(redisKey)
    const expiresAt = verifySignature(licenseKey)?.expiresAt || null
    result[licenseKey] = {
      ...activation,
      expiresAt,
      status: computeStatus(expiresAt, activation)
    }
  }
  res.status(200).json(result)
}
