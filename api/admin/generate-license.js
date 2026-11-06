// POST /api/admin/generate-license?token=SEU_ADMIN_TOKEN  body: { "customerName": "...", "expiryDays": 365 }
// Gera uma chave de licença nova, de qualquer lugar com internet — sem precisar do computador
// que tem keys/private.pem. Para isso funcionar, a MESMA chave privada precisa estar salva
// também como variável de ambiente LICENSE_PRIVATE_KEY neste projeto Vercel (Settings →
// Environment Variables — cole o conteúdo inteiro de keys/private.pem, com "BEGIN/END
// PRIVATE KEY" e tudo). Deixe expiryDays de fora (ou null) para licença vitalícia.

import crypto from 'crypto'
import { requireAdmin, base64UrlEncode, loadPrivateKey } from '../../lib/verify.js'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })
  if (!requireAdmin(req, res)) return

  const { customerName, expiryDays } = req.body || {}
  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    return res.status(400).json({ error: 'Nome do cliente é obrigatório.' })
  }

  if (!process.env.LICENSE_PRIVATE_KEY) {
    return res.status(503).json({ error: 'LICENSE_PRIVATE_KEY não configurada nas variáveis de ambiente do projeto.' })
  }
  const privateKey = loadPrivateKey()
  if (!privateKey) {
    return res.status(500).json({ error: 'A chave privada configurada no servidor é inválida.' })
  }

  const days = expiryDays ? Number(expiryDays) : null
  const payload = {
    customer: customerName.trim(),
    issuedAt: new Date().toISOString(),
    expiresAt: days && days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null
  }

  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)))
  const signature = crypto.sign(null, Buffer.from(payloadB64), privateKey)
  const licenseKey = `${payloadB64}.${base64UrlEncode(signature)}`

  res.status(200).json({ key: licenseKey, customer: payload.customer, expiresAt: payload.expiresAt })
}
