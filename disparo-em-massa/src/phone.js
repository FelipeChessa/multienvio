// Gera candidatos de número de telefone a testar no WhatsApp a partir de uma célula de
// planilha em formato livre. NÃO decide sozinho qual número está certo — isso fica por conta
// do sock.onWhatsApp() (src/server.js), que consulta o WhatsApp de verdade. Aqui só resolvemos
// as duas ambiguidades mais comuns em planilha brasileira: DDI 55 presente ou não, e o 9º
// dígito do celular presente ou não.
function normalizePhoneCandidates(raw) {
  const text = String(raw || '')
  const hasExplicitPlus = /^\s*\+/.test(text)
  const digits = text.replace(/\D/g, '')

  if (digits.length < 8 || digits.length > 15) return []

  let ddi = null
  let ddd = null
  let rest = null

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    // já veio com DDI 55 explícito
    ddi = '55'
    ddd = digits.slice(2, 4)
    rest = digits.slice(4)
  } else if (!hasExplicitPlus && (digits.length === 10 || digits.length === 11)) {
    // sem "+" e sem DDI reconhecível: assume Brasil, que é o mercado deste app
    ddi = '55'
    ddd = digits.slice(0, 2)
    rest = digits.slice(2)
  } else {
    // número com "+" explícito, ou tamanho que não bate com um número brasileiro "cru" —
    // provavelmente já é de outro país. Não forçamos DDI por cima, deixamos o WhatsApp
    // confirmar (ou rejeitar) como veio.
    return [digits]
  }

  const candidates = new Set([ddi + ddd + rest])
  if (rest.length === 9 && rest[0] === '9') {
    candidates.add(ddi + ddd + rest.slice(1))
  } else if (rest.length === 8) {
    candidates.add(ddi + ddd + '9' + rest)
  }

  return Array.from(candidates)
}

export { normalizePhoneCandidates }
