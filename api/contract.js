// /api/contract — usada pela página pública /assinar/?t=<token>. O token é o próprio link de
// assinatura de uma das partes; não há outra autenticação.
//
//   GET  ?t=<token>             texto do contrato e situação das assinaturas
//   GET  ?t=<token>&format=pdf  PDF com o registro das assinaturas
//   POST { t, name, cpf, email, image, accept, docHash }   registra a assinatura dessa parte

import {
  MAX_SIGNATURE_IMAGE_CHARS, findByToken, saveContract, publicView, getContract,
  isValidCpf, onlyDigits, clientIp
} from '../lib/contracts.js'
import { buildContractPdf } from '../lib/contract-pdf.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const token = req.method === 'GET' ? req.query?.t : req.body?.t
  const found = await findByToken(String(token || ''))
  if (!found) return res.status(404).json({ error: 'Link de assinatura inválido ou contrato removido.' })
  const { contract, signer } = found

  if (req.method === 'GET') {
    if (req.query.format === 'pdf') {
      const pdf = await buildContractPdf(contract)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="contrato-${contract.id}.pdf"`)
      return res.status(200).send(pdf)
    }
    return res.status(200).json(publicView(contract, signer))
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })

  if (signer.signature) return res.status(409).json({ error: 'Você já assinou este contrato.' })

  const { name, cpf, email, image, accept, docHash } = req.body || {}
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 200)
  const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 200)

  if (cleanName.split(' ').length < 2) return res.status(400).json({ error: 'Digite seu nome completo.' })
  if (!isValidCpf(cpf)) return res.status(400).json({ error: 'CPF inválido.' })
  if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: 'E-mail inválido.' })
  if (accept !== true) return res.status(400).json({ error: 'É preciso marcar que leu e concorda com o contrato.' })
  if (typeof image !== 'string' || !image.startsWith('data:image/png;base64,') || image.length > MAX_SIGNATURE_IMAGE_CHARS) {
    return res.status(400).json({ error: 'Desenhe sua assinatura no quadro.' })
  }
  // Garante que a pessoa assinou exatamente o texto que está salvo agora.
  if (docHash !== contract.docHash) {
    return res.status(409).json({ error: 'O contrato foi alterado enquanto você lia. Recarregue a página.' })
  }

  // Relê o registro logo antes de gravar, para não apagar uma assinatura da outra parte feita
  // ao mesmo tempo.
  const fresh = (await getContract(contract.id)) || contract
  const freshSigner = fresh.signers.find((s) => s.token === signer.token)
  if (freshSigner.signature) return res.status(409).json({ error: 'Você já assinou este contrato.' })

  freshSigner.signature = {
    name: cleanName,
    cpf: onlyDigits(cpf),
    email: cleanEmail,
    image,
    ip: clientIp(req),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
    signedAt: new Date().toISOString(),
    docHash: fresh.docHash
  }
  await saveContract(fresh)

  return res.status(200).json(publicView(fresh, freshSigner))
}
