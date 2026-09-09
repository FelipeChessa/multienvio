// Resolve onde ficam as pastas graváveis do app (auth/, data/).
//
// No uso normal (node src/server.js, ou dentro do repositório) elas ficam ao lado de src/,
// como sempre foi. Mas dentro do app empacotado pelo Electron, o código roda de dentro do
// app.asar (somente leitura) ou da pasta de instalação (que pode não ser gravável sem admin,
// dependendo de como foi instalado) — nesse caso o processo principal do Electron
// (electron/main.js) define ELECTRON_USER_DATA_DIR antes de importar o servidor, apontando
// para uma pasta de dados do usuário de verdade (ex: %APPDATA%\Disparo em Massa).

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')
const base = process.env.ELECTRON_USER_DATA_DIR || projectRoot

const AUTH_DIR = path.join(base, 'auth')
const DATA_DIR = path.join(base, 'data')

export { AUTH_DIR, DATA_DIR }
