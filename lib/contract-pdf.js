// Monta o PDF do contrato: o texto, uma página de registro das assinaturas eletrônicas
// (nome, CPF, e-mail, IP, data/hora, imagem da assinatura e hash do documento) e os mesmos dados
// gravados nos metadados do arquivo, junto com o selo Ed25519 do servidor.
//
// Formato do texto do contrato (o mesmo que o painel e a página de assinatura exibem):
//   "## Título"  → seção      "- item" → lista      linha em branco → novo parágrafo
//   **trecho**   → negrito

import {
  PDFDocument, StandardFonts, rgb, PDFName, PDFHexString,
  pushGraphicsState, popGraphicsState, beginText, endText, setFillingRgbColor, moveText, setFontAndSize, showText
} from 'pdf-lib'
import { auditRecord, serverSeal, formatCpf } from './contracts.js'

const PAGE = { width: 595.28, height: 841.89 } // A4
const MARGIN = 56
const BODY_SIZE = 10.5
const LINE = 15
const INK = rgb(0.06, 0.09, 0.16)
const MUTED = rgb(0.39, 0.45, 0.55)
const BRAND = rgb(0.02, 0.37, 0.27)

export function parseBody(body) {
  const blocks = []
  let para = []
  const flush = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') })
    para = []
  }
  for (const raw of String(body || '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    if (line.startsWith('## ')) { flush(); blocks.push({ type: 'h', text: line.slice(3) }); continue }
    if (line.startsWith('# ')) { flush(); blocks.push({ type: 'h', text: line.slice(2) }); continue }
    if (line.startsWith('- ')) { flush(); blocks.push({ type: 'li', text: line.slice(2) }); continue }
    para.push(line)
  }
  flush()
  return blocks
}

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' (horário de Brasília)'
}

export async function buildContractPdf(contract) {
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  // As fontes padrão do PDF só cobrem o alfabeto WinAnsi (acentos do português incluídos);
  // qualquer outro caractere vira "?" em vez de derrubar a geração.
  const okChars = new Map()
  const safe = (text) =>
    Array.from(String(text ?? ''))
      .map((ch) => {
        if (!okChars.has(ch)) {
          try { regular.widthOfTextAtSize(ch, 10); okChars.set(ch, true) } catch { okChars.set(ch, false) }
        }
        return okChars.get(ch) ? ch : '?'
      })
      .join('')

  let page = null
  let pageFonts = new Map()
  let y = 0
  const pages = []
  const newPage = () => {
    page = pdf.addPage([PAGE.width, PAGE.height])
    pages.push(page)
    pageFonts = new Map()
    y = PAGE.height - MARGIN
  }
  // Registra a fonte nos recursos da página atual (o mesmo que drawText faz por dentro).
  const fontKey = (font) => {
    if (!pageFonts.has(font)) pageFonts.set(font, page.node.newFontDictionary(font.name, font.ref))
    return pageFonts.get(font)
  }
  const ensure = (needed) => { if (!page || y - needed < MARGIN + 20) newPage() }

  // Texto corrido com **negrito** e quebra de linha automática.
  const drawRich = (text, { size = BODY_SIZE, x = MARGIN, width = PAGE.width - 2 * MARGIN, forceBold = false, color = INK } = {}) => {
    const words = []
    String(text).split(/(\*\*[^*]+\*\*)/).forEach((part) => {
      if (!part) return
      const isBold = forceBold || (part.startsWith('**') && part.endsWith('**'))
      const clean = isBold && part.startsWith('**') ? part.slice(2, -2) : part
      clean.split(/(\s+)/).forEach((w) => { if (w) words.push({ text: safe(w), font: isBold ? bold : regular }) })
    })
    let line = []
    let lineWidth = 0
    const lineHeight = size * 1.45
    const flushLine = () => {
      while (line.length && /^\s+$/.test(line[line.length - 1].text)) line.pop()
      ensure(lineHeight)
      // Junta as palavras seguidas de mesma fonte num único texto: o leitor de PDF usa os
      // espaços da própria fonte e o espaçamento não quebra se ele trocar a Helvetica por outra.
      const runs = []
      for (const w of line) {
        const last = runs[runs.length - 1]
        if (last && last.font === w.font) last.text += w.text
        else runs.push({ text: w.text, font: w.font })
      }
      // Uma linha = um único bloco de texto (BT…ET) que só troca de fonte entre os trechos:
      // o leitor avança pelas próprias métricas, então negrito e normal nunca se sobrepõem.
      page.pushOperators(
        pushGraphicsState(),
        beginText(),
        setFillingRgbColor(color.red, color.green, color.blue),
        moveText(x, y - size),
        ...runs.flatMap((r) => [setFontAndSize(fontKey(r.font), size), showText(r.font.encodeText(r.text))]),
        endText(),
        popGraphicsState()
      )
      y -= lineHeight
      line = []
      lineWidth = 0
    }
    for (const w of words) {
      const wWidth = w.font.widthOfTextAtSize(w.text, size)
      const isSpace = /^\s+$/.test(w.text)
      if (isSpace && line.length === 0) continue
      if (!isSpace && lineWidth + wWidth > width && line.length) flushLine()
      if (isSpace && line.length === 0) continue
      line.push(w)
      lineWidth += wWidth
    }
    if (line.length) flushLine()
  }

  // Corpo do contrato
  newPage()
  drawRich(contract.title, { size: 15, forceBold: true, color: BRAND })
  y -= 6
  for (const block of parseBody(contract.body)) {
    if (block.type === 'h') {
      y -= 8
      ensure(LINE * 3)
      drawRich(block.text, { size: 11.5, forceBold: true })
      y -= 2
    } else if (block.type === 'li') {
      ensure(LINE)
      page.drawText('•', { x: MARGIN + 6, y: y - BODY_SIZE, size: BODY_SIZE, font: regular, color: INK })
      drawRich(block.text, { x: MARGIN + 18, width: PAGE.width - 2 * MARGIN - 18 })
    } else {
      drawRich(block.text)
      y -= 5
    }
  }

  // Registro das assinaturas
  const record = auditRecord(contract)
  const seal = serverSeal(record)
  newPage()
  drawRich('Registro de assinaturas eletrônicas', { size: 14, forceBold: true, color: BRAND })
  drawRich(
    'Este documento foi assinado eletronicamente pelo sistema de contratos do MultiEnvio. ' +
      'Cada assinatura registra a identificação informada pelo signatário, o endereço IP, a data e a hora ' +
      'e o hash SHA-256 do texto exibido no momento da assinatura (Lei nº 14.063/2020 e MP nº 2.200-2/2001).',
    { size: 9.5, color: MUTED }
  )
  y -= 6
  drawRich(`**Contrato:** ${contract.id}`, { size: 9.5 })
  drawRich(`**Hash SHA-256 do texto:** ${contract.docHash}`, { size: 9.5 })
  y -= 10

  for (const signer of contract.signers) {
    ensure(150)
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE.width - MARGIN, y }, thickness: 0.6, color: rgb(0.88, 0.9, 0.93) })
    y -= 12
    drawRich(signer.role, { size: 11, forceBold: true })
    const s = signer.signature
    if (!s) {
      drawRich(`${signer.name || ''} — assinatura pendente`, { size: 10, color: MUTED })
      y -= 10
      continue
    }
    if (s.image && s.image.startsWith('data:image/png;base64,')) {
      try {
        const png = await pdf.embedPng(Buffer.from(s.image.split(',')[1], 'base64'))
        const dims = png.scaleToFit(200, 60)
        ensure(dims.height + 8)
        page.drawImage(png, { x: MARGIN, y: y - dims.height, width: dims.width, height: dims.height })
        y -= dims.height + 6
      } catch {
        // imagem inválida: o registro textual abaixo continua valendo
      }
    }
    drawRich(`**Nome:** ${s.name}`, { size: 9.5 })
    drawRich(`**CPF:** ${formatCpf(s.cpf)}`, { size: 9.5 })
    drawRich(`**E-mail:** ${s.email}`, { size: 9.5 })
    drawRich(`**Data e hora:** ${fmtDateTime(s.signedAt)}`, { size: 9.5 })
    drawRich(`**IP:** ${s.ip || '-'}`, { size: 9.5 })
    drawRich(`**Navegador:** ${String(s.userAgent || '-').slice(0, 140)}`, { size: 8.5, color: MUTED })
    drawRich(`**Hash do texto assinado:** ${s.docHash}`, { size: 8.5, color: MUTED })
    y -= 10
  }

  if (seal) {
    ensure(60)
    y -= 4
    drawRich('**Selo do servidor (Ed25519):**', { size: 8.5, color: MUTED })
    drawRich(seal, { size: 7.5, color: MUTED })
  }

  // Rodapé com numeração e hash curto em todas as páginas
  pages.forEach((p, i) => {
    const text = safe(`Contrato ${contract.id} · SHA-256 ${contract.docHash.slice(0, 16)}… · página ${i + 1} de ${pages.length}`)
    p.drawText(text, { x: MARGIN, y: 28, size: 7.5, font: regular, color: MUTED })
  })

  // Metadados do arquivo
  const parties = contract.signers.map((sg) => sg.signature?.name || sg.name).filter(Boolean)
  pdf.setTitle(safe(contract.title))
  pdf.setAuthor(safe(parties.join(' e ')))
  pdf.setSubject(safe(`Contrato ${contract.id} — assinado eletronicamente`))
  pdf.setKeywords([`contrato:${contract.id}`, `sha256:${contract.docHash}`, 'assinatura-eletronica'])
  pdf.setProducer('MultiEnvio Contratos')
  pdf.setCreator('MultiEnvio Contratos')
  pdf.setCreationDate(new Date(contract.createdAt))
  pdf.setModificationDate(new Date())
  const info = pdf.getInfoDict()
  info.set(PDFName.of('MultiEnvioAssinaturas'), PDFHexString.fromText(JSON.stringify(record)))
  if (seal) info.set(PDFName.of('MultiEnvioSeloServidor'), PDFHexString.fromText(seal))

  return Buffer.from(await pdf.save())
}
