// Contratos com assinatura eletrônica — dados no Redis.
//
//   contract:<id>               registro do contrato (texto, partes, assinaturas, lista de anexos)
//   contracts:index             conjunto com os ids de todos os contratos
//   contract-token:<token>      id do contrato dono daquele link de assinatura
//   contract:<id>:file:<fileId> conteúdo de um anexo (base64), separado para o registro ficar leve
//
// Depois que alguém assina, o texto do contrato fica travado: cada assinatura guarda o SHA-256
// do texto que a pessoa viu, e o PDF final traz esse hash e o selo do servidor.

import crypto from 'crypto'
import { redis } from './redis.js'
import { loadPrivateKey, base64UrlEncode } from './verify.js'

export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024
export const MAX_SIGNATURE_IMAGE_CHARS = 400 * 1024

export const contractKey = (id) => `contract:${id}`
export const tokenKey = (token) => `contract-token:${token}`
export const fileKey = (id, fileId) => `contract:${id}:file:${fileId}`
export const INDEX_KEY = 'contracts:index'

export function newId(prefix) {
  return `${prefix}_${base64UrlEncode(crypto.randomBytes(9))}`
}

export function newToken() {
  return base64UrlEncode(crypto.randomBytes(24))
}

export function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

export function contractStatus(contract) {
  const signed = contract.signers.filter((s) => s.signature).length
  if (signed === 0) return 'aguardando'
  if (signed < contract.signers.length) return 'parcial'
  return 'assinado'
}

export function hasSignatures(contract) {
  return contract.signers.some((s) => s.signature)
}

export async function getContract(id) {
  if (!id || typeof id !== 'string') return null
  return (await redis.get(contractKey(id))) || null
}

export async function saveContract(contract) {
  contract.updatedAt = new Date().toISOString()
  await redis.set(contractKey(contract.id), contract)
}

export async function findByToken(token) {
  if (!token || typeof token !== 'string') return null
  const id = await redis.get(tokenKey(token))
  if (!id) return null
  const contract = await getContract(String(id))
  if (!contract) return null
  const signer = contract.signers.find((s) => s.token === token)
  if (!signer) return null
  return { contract, signer }
}

export function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

export function isValidCpf(value) {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const digit = (len) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

export function formatCpf(value) {
  const d = onlyDigits(value)
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : String(value || '')
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (fwd) return String(fwd).split(',')[0].trim()
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || ''
}

// Dados que o PDF e o selo do servidor registram de cada assinatura (sem a imagem).
export function auditRecord(contract) {
  return {
    contractId: contract.id,
    title: contract.title,
    docHash: contract.docHash,
    signatures: contract.signers
      .filter((s) => s.signature)
      .map((s) => ({
        role: s.role,
        name: s.signature.name,
        cpf: formatCpf(s.signature.cpf),
        email: s.signature.email,
        ip: s.signature.ip,
        userAgent: s.signature.userAgent,
        signedAt: s.signature.signedAt,
        docHash: s.signature.docHash,
        imageHash: s.signature.image ? sha256(s.signature.image) : null
      }))
  }
}

// Selo Ed25519 do servidor sobre o registro de auditoria. Confere com a chave pública que já
// está em lib/verify.js. Null se LICENSE_PRIVATE_KEY não estiver configurada.
export function serverSeal(record) {
  const key = loadPrivateKey()
  if (!key) return null
  const payload = JSON.stringify(record)
  return base64UrlEncode(crypto.sign(null, Buffer.from(payload, 'utf8'), key))
}

// O que o painel admin recebe na listagem.
export function adminSummary(contract) {
  return {
    id: contract.id,
    title: contract.title,
    clientName: contract.clientName,
    monthlyValue: contract.monthlyValue,
    months: contract.months,
    startDate: contract.startDate,
    createdAt: contract.createdAt,
    status: contractStatus(contract),
    signers: contract.signers.map((s) => ({
      role: s.role,
      name: s.name,
      token: s.token,
      signedAt: s.signature?.signedAt || null
    })),
    attachmentsCount: (contract.attachments || []).length
  }
}

// O que a pessoa que abre o link de assinatura recebe: nada de tokens nem dados das outras partes
// além do nome e da data em que assinaram.
export function publicView(contract, signer) {
  return {
    title: contract.title,
    body: contract.body,
    docHash: contract.docHash,
    status: contractStatus(contract),
    signers: contract.signers.map((s) => ({
      role: s.role,
      name: s.signature?.name || s.name,
      signedAt: s.signature?.signedAt || null
    })),
    me: {
      role: signer.role,
      name: signer.name,
      email: signer.email || '',
      signed: Boolean(signer.signature),
      signedAt: signer.signature?.signedAt || null
    }
  }
}
