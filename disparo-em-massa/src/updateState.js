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
  error: null
}

let checkHandler = null
let installHandler = null

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
  return installHandler()
}
