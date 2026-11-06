// Verificação da assinatura da chave de licença. A chave privada correspondente fica em
// keys/private.pem (fora do git) e também precisa estar na variável de ambiente
// LICENSE_PRIVATE_KEY na Vercel. Se o par for trocado, atualize a chave pública aqui também.

import crypto from 'crypto'

const PUBLIC_KEY = crypto.createPublicKey(`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAz0gFUiYAWxgjt6fe2ocMxVXRvsoYOhv6dr/TlGWzU3E=
-----END PUBLIC KEY-----`)

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64')
}

export function base64UrlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function verifySignature(licenseKey) {
  const parts = (licenseKey || '').trim().split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts
  try {
    const ok = crypto.verify(null, Buffer.from(payloadB64), PUBLIC_KEY, base64UrlDecode(sigB64))
    if (!ok) return null
    return JSON.parse(base64UrlDecode(payloadB64).toString('utf8'))
  } catch {
    return null
  }
}

// Lê LICENSE_PRIVATE_KEY (o mesmo par Ed25519 da chave pública acima). Devolve null se a
// variável não existir ou estiver inválida.
export function loadPrivateKey() {
  const rawPem = process.env.LICENSE_PRIVATE_KEY
  if (!rawPem) return null
  let pem = rawPem.trim()
  // Algumas UIs de variáveis de ambiente colapsam as quebras de linha do PEM em "\n" literal.
  if (!pem.includes('\n')) pem = pem.replace(/\\n/g, '\n')
  // Se só o corpo base64 foi colado (sem as linhas BEGIN/END), reconstrói o PEM.
  if (!pem.includes('-----BEGIN')) {
    pem = `-----BEGIN PRIVATE KEY-----\n${pem}\n-----END PRIVATE KEY-----`
  }
  try {
    return crypto.createPrivateKey(pem)
  } catch {
    return null
  }
}

export function requireAdmin(req, res) {
  const token = req.query?.token || req.headers['x-admin-token']
  if (!process.env.ADMIN_TOKEN) {
    res.status(503).json({ error: 'ADMIN_TOKEN não configurado no projeto Vercel.' })
    return false
  }
  if (token !== process.env.ADMIN_TOKEN) {
    res.status(401).json({ error: 'Não autorizado.' })
    return false
  }
  return true
}
