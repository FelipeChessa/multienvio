import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))

// Ponte entre electron/main.js (dono do autoUpdater de verdade) e src/server.js (expõe o
// estado via API pra UI) — os dois rodam no mesmo processo Node (main.js importa server.js
// diretamente, sem subprocess), então um módulo compartilhado resolve sem precisar de IPC.
// Rodando como `node src/server.js` puro (sem Electron), ninguém chama registerHandlers() e
// checar/instalar atualização vira erro tratado — só a versão atual continua disponível.
let state = {
  currentVersion: pkg.version,
  checking: false,
  updateAvailable: false,
  latestVersion: null,
  downloaded: false,
  progress: 0, // % do download da versão nova
  releaseNotes: '', // "o que mudou", vem do texto do release no GitHub (build/release-notes.md)
  error: null
}

let checkHandler = null
let installHandler = null
let busyCheck = () => null // devolve um texto quando não dá pra fechar o programa agora

// O texto do release vem do GitHub como HTML (ou lista, em atualizações que pulam versões).
// Vira texto simples, uma novidade por linha, para a UI mostrar com segurança.
export function notesToText(notes) {
  if (!notes) return ''
  const raw = Array.isArray(notes) ? notes.map((n) => n?.note || '').join('\n') : String(notes)
  return raw
    .replace(/<\/(p|li|h\d|div)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .split('\n').map((l) => l.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean)
    .slice(0, 12)
    .join('\n')
    .slice(0, 1500)
}

export function setBusyCheck(fn) {
  busyCheck = fn
}

export function getState() {
  return { ...state }
}

export function setState(patch) {
  state = { ...state, ...patch }
}

export function registerHandlers({ onCheck, onInstall }) {
  checkHandler = onCheck
  installHandler = onInstall
}

export function requestCheck() {
  if (!checkHandler) throw new Error('Checagem de atualização não disponível neste modo (rode o app instalado, não node src/server.js).')
  return checkHandler()
}

export function requestInstall() {
  if (!installHandler) throw new Error('Atualização não disponível neste modo (rode o app instalado, não node src/server.js).')
  if (!state.downloaded) throw new Error('A atualização ainda não terminou de baixar.')
  const busy = busyCheck()
  if (busy) throw new Error(busy)
  return installHandler()
}
