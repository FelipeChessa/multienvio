// Variáveis por contato ({{nome}}, {{primeiro_nome}} e as colunas de uma planilha, como
// {{empresa}}) — a mesma regra para envio comum, campanhas (1ª mensagem e follow-ups),
// agendamentos e prospecção.
//
// - O nome da variável é comparado "normalizado": {{Empresa}}, {{ empresa }} e {{empresa}} são
//   a mesma coisa; {{endereço}} casa com a coluna "Endereço" (vira "endereco").
// - Coluna vazia para um contato vira texto vazio (não sai "{{empresa}}" para o cliente).
// - Variável que não existe para os contatos é barrada antes do envio (findUnknownVariables).

export const RESERVED_VARIABLES = ['nome', 'primeiro_nome']
const MAX_VARS = 30
const MAX_VALUE = 300

// {{ chave }} ou {{ chave | texto reserva }} — a chave é normalizada antes de comparar; o texto
// reserva vai no lugar quando o contato não tem esse dado (ex: {{empresa|sua empresa}}).
const VAR_RE = /\{\{\s*([^{}|\n]{1,40}?)\s*(?:\|\s*([^{}\n]{0,80}?)\s*)?\}\}/g
// marca onde uma variável sem dado e sem texto reserva foi tirada, para arrumar os espaços
const GAP = '\u0000'

// "Olá {{empresa}}, tudo bem?" sem empresa → "Olá, tudo bem?" (e não "Olá , tudo bem?")
function tidyGaps(text) {
  if (!text.includes(GAP)) return text
  return text
    .replace(/[ \t]*\u0000[ \t]*([,.!?;:)])/g, '$1')
    .replace(/([ \t(])\u0000[ \t]+/g, '$1')
    .replace(/\u0000[ \t]*/g, '')
    .replace(/[ \t]+$/gm, '')
}

export function normalizeVarKey(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30)
}

// Nome da variável para uma coluna da planilha ("Empresa" → empresa). Colunas chamadas
// "Nome" viram nome_planilha, porque {{nome}} já é o nome do contato.
export function variableKeyFromHeader(header, index) {
  const s = normalizeVarKey(header)
  const key = /^[a-z]/.test(s) ? s : `coluna_${index + 1}`
  return RESERVED_VARIABLES.includes(key) ? `${key}_planilha` : key
}

// Colunas de uma linha da planilha como variáveis (menos telefone e nome). keepEmpty: guarda
// também as colunas vazias (como ""), para o texto não sair com "{{coluna}}" literal.
export function rowVars(headers, row, { phoneColumn, nameColumn, keepEmpty = false } = {}) {
  const vars = {}
  headers.forEach((h, i) => {
    if (i === phoneColumn || i === nameColumn) return
    const key = variableKeyFromHeader(h, i)
    const value = String(row[i] ?? '').trim().slice(0, MAX_VALUE)
    if (value || keepEmpty) vars[key] = value
  })
  return vars
}

// Limpa o que vem do navegador: chaves válidas, valores de texto curtos, no máximo 30.
export function sanitizeVars(vars) {
  if (!vars || typeof vars !== 'object' || Array.isArray(vars)) return {}
  const out = {}
  for (const [rawKey, value] of Object.entries(vars).slice(0, MAX_VARS)) {
    const key = normalizeVarKey(rawKey)
    if (!/^[a-z]/.test(key) || RESERVED_VARIABLES.includes(key)) continue
    out[key] = String(value ?? '').trim().slice(0, MAX_VALUE)
  }
  return out
}

// Troca {{nome}}, {{primeiro_nome}} e as variáveis do contato — é a última etapa antes de
// enviar (as variáveis da campanha já foram trocadas em campaigns.applyVariables), então nada
// pode sobrar: dado vazio ou inexistente vira o texto reserva ({{empresa|sua empresa}}) ou,
// sem ele, some com os espaços arrumados. Nome sem valor continua virando "cliente".
export function personalize(text, contact = {}) {
  const rawName = contact.name && /\p{L}/u.test(contact.name) ? String(contact.name).trim() : ''
  const firstName = rawName ? rawName.split(/\s+/)[0] : ''
  const vars = contact.vars && typeof contact.vars === 'object' ? contact.vars : {}
  const out = String(text || '').replace(VAR_RE, (match, rawKey, fallback) => {
    const key = normalizeVarKey(rawKey)
    const reserve = fallback !== undefined ? fallback : null
    if (key === 'primeiro_nome') return firstName || reserve || 'cliente'
    if (key === 'nome') return rawName || reserve || 'cliente'
    const value = Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key] ?? '').trim() : ''
    if (value) return value
    return reserve !== null ? reserve : GAP
  })
  return tidyGaps(out)
}

// Variáveis usadas nos textos que não existem para NENHUM contato (nem nome/primeiro_nome, nem
// em `availableKeys`) e não têm texto reserva — quase sempre erro de digitação ({{empresaa}}).
export function findUnknownVariables(texts, availableKeys = []) {
  const known = new Set([...RESERVED_VARIABLES, ...availableKeys.map(normalizeVarKey)])
  const unknown = new Set()
  for (const text of texts) {
    for (const [, rawKey, fallback] of String(text || '').matchAll(VAR_RE)) {
      const key = normalizeVarKey(rawKey)
      if (key && fallback === undefined && !known.has(key)) unknown.add(key)
    }
  }
  return Array.from(unknown)
}

// Chaves de variável que existem em pelo menos um dos contatos
export function contactVarKeys(contacts) {
  const keys = new Set()
  for (const c of contacts || []) for (const k of Object.keys(c?.vars || {})) keys.add(k)
  return Array.from(keys)
}

export function unknownVariablesMessage(unknown, availableKeys) {
  const list = unknown.map((k) => `{{${k}}}`).join(', ')
  const extra = availableKeys.filter((k) => !RESERVED_VARIABLES.includes(k))
  const options = ['{{nome}}', '{{primeiro_nome}}', ...extra.map((k) => `{{${k}}}`)].join(', ')
  return `A mensagem usa ${list}, mas esse dado não existe para esses contatos. Variáveis disponíveis: ${options}. ` +
    'Se quiser manter mesmo assim, coloque um texto reserva, ex: {{empresa|sua empresa}}.' +
    (extra.length === 0 ? ' Para usar outros dados de cada cliente (empresa, cidade...), envie para uma planilha com essas colunas.' : '')
}
