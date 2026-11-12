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
const DEFAULT_ACTIVATION_SERVER_URL = 'https://multienvio.vercel.app/api'
const ACTIVATION_SERVER_URL = process.env.ACTIVATION_SERVER_URL || DEFAULT_ACTIVATION_SERVER_URL || null

// Chave pública usada só para VALIDAR licenças — gerar novas licenças exige a chave
// privada correspondente (keys/private.pem), que fica só com o vendedor e nunca é
// distribuída junto com o programa. Trocar essa chave aqui invalida todas as licenças
// já emitidas com o par antigo.
const PUBLIC_KEY = crypto.createPublicKey(`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAz0gFUiYAWxgjt6fe2ocMxVXRvsoYOhv6dr/TlGWzU3E=
-----END PUBLIC KEY-----`)

// Verificação online: a chave é conferida no servidor ao abrir o programa e a cada
// CHECK_OK_INTERVAL_MS, para que uma chave revogada pare de funcionar em poucos minutos.
// Resposta "revogada" ou "outro computador" trava na hora. Sem resposta do servidor (sem
// internet, ou o endereço bloqueado de propósito), trava quando passar OFFLINE_GRACE_MS desde a
// última confirmação — e destrava sozinho na primeira confirmação depois disso.
const CHECK_OK_INTERVAL_MS = 5 * 60 * 1000
const CHECK_RETRY_MS = 20 * 1000
const CHECK_BLOCKED_RETRY_MS = 2 * 60 * 1000
const CHECK_TIMEOUT_MS = 15 * 1000
const OFFLINE_GRACE_MS = 10 * 60 * 1000
// conferência a cada ação (confirmNow): no máximo uma consulta a cada 30 s, esperando até 4 s
const CONFIRM_MAX_AGE_MS = 30 * 1000
const CONFIRM_WAIT_MS = 4 * 1000
const SUPPORT = 'Fale com o suporte pelo WhatsApp (11) 99287-6042.'
const BLOCK_MESSAGES = {
  revoked: `Esta licença foi desativada. ${SUPPORT}`,
  other_device: `Esta licença está ativa em outro computador. ${SUPPORT}`
}

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

function readLicenseFile() {
  if (!fs.existsSync(licenseFile)) return null
  try {
    return JSON.parse(fs.readFileSync(licenseFile, 'utf8'))
  } catch {
    return null
  }
}

// Estado da verificação desta sessão. Vale o que está em memória: mexer no license.json com o
// programa aberto não muda nada. O arquivo só leva o resultado de uma abertura para a outra.
const session = { key: null, lastOkAt: null, blocked: null, failedSinceOk: false, inFlight: null, lastAttemptAt: 0 }

function syncSession(stored) {
  if (session.key === stored.key) return
  session.key = stored.key
  session.lastOkAt = stored.check?.lastOkAt || null
  session.blocked = stored.check?.blocked || null
  session.failedSinceOk = false
  session.lastAttemptAt = 0
}

// valor absoluto: atrasar o relógio do computador não estende a tolerância
function isStale() {
  return !session.lastOkAt || Math.abs(Date.now() - session.lastOkAt) > OFFLINE_GRACE_MS
}

function getStatus() {
  const stored = readLicenseFile()
  const key = stored?.key
  if (!key) return { activated: false, error: 'Nenhuma licença ativada.' }
  const result = verifyLicenseKey(key)
  if (!result.valid) return { activated: false, error: result.error }
  syncSession(stored)
  if (session.blocked) return { activated: false, error: BLOCK_MESSAGES[session.blocked] || BLOCK_MESSAGES.revoked }
  if (ACTIVATION_SERVER_URL && isStale()) {
    // ficou tempo demais sem confirmar (acabou de abrir, voltou do modo de espera): confere agora
    if (!session.inFlight && Date.now() - session.lastAttemptAt > CHECK_RETRY_MS) checkOnline().catch(() => {})
    // só trava depois que uma tentativa falhar: quem abre o programa ou acorda o computador
    // não vê a tela de bloqueio piscar enquanto a conferência roda
    if (session.failedSinceOk) {
      return { activated: false, error: 'Não foi possível confirmar sua licença com o servidor. Verifique a internet do computador: o programa libera sozinho assim que a conexão voltar.' }
    }
  }
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
  fs.writeFileSync(licenseFile, JSON.stringify({ key: licenseKey.trim(), check: { lastOkAt: Date.now() } }, null, 2))
  session.key = null // chave nova: a sessão recomeça do arquivo recém-gravado
  return { customer: result.payload.customer, expiresAt: result.payload.expiresAt || null }
}

function isActivated() {
  return getStatus().activated
}

function saveCheck(key) {
  const stored = readLicenseFile()
  if (stored?.key !== key || session.key !== key) return // a chave foi trocada enquanto a verificação rodava
  const check = {}
  if (session.lastOkAt) check.lastOkAt = session.lastOkAt
  if (session.blocked) check.blocked = session.blocked
  try {
    fs.writeFileSync(licenseFile, JSON.stringify({ ...stored, check }, null, 2))
  } catch (err) {
    console.error('Falha ao gravar a verificação da licença:', err.message)
  }
}

// Devolve 'ok', 'blocked', 'offline' ou 'skipped'. Chamadas ao mesmo tempo dividem a mesma consulta.
function checkOnline() {
  if (!session.inFlight) {
    session.inFlight = runCheck().finally(() => { session.inFlight = null })
  }
  return session.inFlight
}

async function runCheck() {
  const stored = readLicenseFile()
  const key = stored?.key
  if (!ACTIVATION_SERVER_URL || !key || !verifyLicenseKey(key).valid) return 'skipped'
  syncSession(stored)
  session.lastAttemptAt = Date.now()

  let data = null
  try {
    const response = await fetch(`${ACTIVATION_SERVER_URL}/license-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, deviceId: getDeviceId() }),
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS)
    })
    data = await response.json()
  } catch {
    data = null
  }
  if (session.key !== key) return 'skipped' // a chave foi trocada enquanto a verificação rodava

  if (data?.ok === true) {
    session.lastOkAt = Date.now()
    session.blocked = null
    session.failedSinceOk = false
    saveCheck(key)
    return 'ok'
  }
  if (data?.reason && BLOCK_MESSAGES[data.reason]) {
    session.blocked = data.reason
    saveCheck(key)
    return 'blocked'
  }
  // sem internet, servidor fora do ar ou resposta inesperada: não trava na hora; trava se isso
  // durar mais que OFFLINE_GRACE_MS desde a última confirmação (getStatus)
  session.failedSinceOk = true
  return 'offline'
}

// Conferência na hora, antes de cada ação da pessoa (server.js) e durante os disparos (sender.js):
// só consulta o servidor se a última tentativa tiver mais de maxAgeMs, e espera no máximo waitMs —
// se o servidor demorar, a ação segue e a conferência termina sozinha em segundo plano (e trava
// tudo assim que responder "revogada"). Nunca lança erro.
async function confirmNow({ maxAgeMs = CONFIRM_MAX_AGE_MS, waitMs = CONFIRM_WAIT_MS } = {}) {
  if (!session.inFlight && Date.now() - session.lastAttemptAt < maxAgeMs) return
  let timer
  await Promise.race([
    checkOnline().catch(() => {}),
    new Promise((resolve) => { timer = setTimeout(resolve, waitMs) })
  ])
  clearTimeout(timer)
}

// Verifica em seguida e depois sozinho, para sempre. onChecked: chamado ao fim de cada verificação.
function startOnlineChecks(onChecked) {
  const run = async () => {
    let result = 'offline'
    try {
      result = await checkOnline()
      onChecked?.(result)
    } catch (err) {
      console.error('Falha ao verificar a licença:', err.message)
    }
    const next = result === 'blocked' ? CHECK_BLOCKED_RETRY_MS : result === 'offline' ? CHECK_RETRY_MS : CHECK_OK_INTERVAL_MS
    setTimeout(run, next)
  }
  run()
}

export { getStatus, activate, isActivated, verifyLicenseKey, checkOnline, confirmNow, startOnlineChecks }
