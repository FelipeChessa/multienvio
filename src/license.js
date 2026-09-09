import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { DATA_DIR } from './paths.js'

const licenseFile = path.join(DATA_DIR, 'license.json')
const deviceIdFile = path.join(DATA_DIR, 'device-id.json')

// endereço do servidor de ativação (impede a mesma chave de ser usada em dois computadores).
// Preencha aqui depois de hospedar activation-server/ em algum lugar, ou defina a variável de
// ambiente ACTIVATION_SERVER_URL (útil pra testar local sem mexer no código). Deixando vazio,
// a ativação funciona só localmente, sem checar reuso — é o modo antigo, usado como fallback
// enquanto o servidor não estiver no ar.
const DEFAULT_ACTIVATION_SERVER_URL = 'https://disparo-em-massa-releases.vercel.app/api'
const ACTIVATION_SERVER_URL = process.env.ACTIVATION_SERVER_URL || DEFAULT_ACTIVATION_SERVER_URL || null

// Chave pública usada só para VALIDAR licenças — gerar novas licenças exige a chave
// privada correspondente (keys/private.pem), que fica só com o vendedor e nunca é
// distribuída junto com o programa. Trocar essa chave aqui invalida todas as licenças
// já emitidas com o par antigo.
const PUBLIC_KEY = crypto.createPublicKey(`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAz0gFUiYAWxgjt6fe2ocMxVXRvsoYOhv6dr/TlGWzU3E=
-----END PUBLIC KEY-----`)

function base64UrlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64')
}

function verifyLicenseKey(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, error: 'Chave de licença ausente.' }
  }
  const parts = licenseKey.trim().split('.')
  if (parts.length !== 2) {
    return { valid: false, error: 'Formato de chave inválido.' }
  }
  const [payloadB64, sigB64] = parts

  let payload
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'))
  } catch {
    return { valid: false, error: 'Chave corrompida.' }
  }

  let signatureOk = false
  try {
    signatureOk = crypto.verify(null, Buffer.from(payloadB64), PUBLIC_KEY, base64UrlDecode(sigB64))
  } catch {
    signatureOk = false
  }
  if (!signatureOk) {
    return { valid: false, error: 'Chave inválida — assinatura não confere.' }
  }

  if (payload.expiresAt && new Date(payload.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: `Licença expirada em ${new Date(payload.expiresAt).toLocaleDateString('pt-BR')}.`, payload }
  }

  return { valid: true, payload }
}

function getDeviceId() {
  if (fs.existsSync(deviceIdFile)) {
    try {
      const stored = JSON.parse(fs.readFileSync(deviceIdFile, 'utf8'))
      if (stored.id) return stored.id
    } catch {
      // arquivo corrompido — gera um novo abaixo
    }
  }
  const id = crypto.randomUUID()
  fs.mkdirSync(path.dirname(deviceIdFile), { recursive: true })
  fs.writeFileSync(deviceIdFile, JSON.stringify({ id }))
  return id
}

function getStoredLicense() {
  if (!fs.existsSync(licenseFile)) return null
  try {
    const stored = JSON.parse(fs.readFileSync(licenseFile, 'utf8'))
    return stored.key || null
  } catch {
    return null
  }
}

function getStatus() {
  const key = getStoredLicense()
  if (!key) return { activated: false, error: 'Nenhuma licença ativada.' }
  const result = verifyLicenseKey(key)
  if (!result.valid) return { activated: false, error: result.error }
  return { activated: true, customer: result.payload.customer, expiresAt: result.payload.expiresAt || null }
}

async function activate(licenseKey) {
  const result = verifyLicenseKey(licenseKey)
  if (!result.valid) {
    throw new Error(result.error)
  }

  if (ACTIVATION_SERVER_URL) {
    const deviceId = getDeviceId()
    let response
    try {
      response = await fetch(`${ACTIVATION_SERVER_URL}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: licenseKey.trim(), deviceId })
      })
    } catch {
      throw new Error('Não foi possível conectar ao servidor de ativação. Verifique sua internet e tente de novo.')
    }
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Não foi possível ativar a licença.')
    }
  } else {
    console.warn('ACTIVATION_SERVER_URL não configurado — ativando apenas localmente (sem checagem contra reuso em outro computador).')
  }

  fs.mkdirSync(path.dirname(licenseFile), { recursive: true })
  fs.writeFileSync(licenseFile, JSON.stringify({ key: licenseKey.trim() }, null, 2))
  return { customer: result.payload.customer, expiresAt: result.payload.expiresAt || null }
}

function isActivated() {
  return getStatus().activated
}

export { getStatus, activate, isActivated, verifyLicenseKey }
