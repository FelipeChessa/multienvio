import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { DATA_DIR } from './paths.js'

// Anexos de mensagens agendadas precisam sobreviver até o horário disparar — que pode ser
// horas ou dias depois, atravessando reinícios do app — então o buffer do upload (que só
// existe em memória durante a requisição) precisa ser gravado em disco. Fica dentro de
// data/, que já é gitignored e específico da instalação do usuário.
const DIR = path.join(DATA_DIR, 'scheduled-attachments')
fs.mkdirSync(DIR, { recursive: true })

export function storeFile(file) {
  if (!file) return null
  const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const storedName = `${crypto.randomUUID()}-${safeName}`
  fs.writeFileSync(path.join(DIR, storedName), file.buffer)
  return { storedName, originalname: file.originalname, mimetype: file.mimetype }
}

export function readFile(ref) {
  if (!ref) return null
  return { buffer: fs.readFileSync(path.join(DIR, ref.storedName)), mimetype: ref.mimetype, originalname: ref.originalname }
}

export function deleteFile(ref) {
  if (!ref) return
  try {
    fs.unlinkSync(path.join(DIR, ref.storedName))
  } catch {
    // já não existe — tudo bem, não é motivo pra travar o cancelamento/disparo
  }
}
