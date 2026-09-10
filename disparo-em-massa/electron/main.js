// Processo principal do Electron: roda o servidor Express (src/server.js) dentro do próprio
// processo (sem subprocess) e mostra o app numa janela nativa, em vez de abrir no navegador.
// Isso resolve dois problemas do modo "navegador + cmd": não aparece "localhost" na barra de
// endereço, e não existe janela preta de terminal — fechar a janela só minimiza para a bandeja,
// e sair de verdade é pelo ícone da bandeja (como qualquer app de mensagens de verdade).

import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import electronUpdaterPkg from 'electron-updater'
import path from 'path'
import { fileURLToPath } from 'url'
import * as updateState from '../src/updateState.js'

// electron-updater é CommonJS puro (module.exports = {...}) — o Node não consegue detectar
// os named exports estaticamente pra interop ESM, então precisa importar o pacote inteiro e
// desestruturar em runtime (é o que a própria mensagem de erro do Node recomenda).
const { autoUpdater } = electronUpdaterPkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3210)
const ICON_PATH = path.join(__dirname, '..', 'build', 'icon.ico')

let mainWindow = null
let tray = null

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  // já tem uma instância aberta — não inicia outra (evita dois processos brigando pela
  // mesma sessão do WhatsApp), só foca a janela existente
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    // define onde ficam auth/ e data/ ANTES de importar o servidor — dentro do app
    // empacotado, o código roda de um lugar que pode não ser gravável (asar ou Program
    // Files), então usamos a pasta de dados do usuário de verdade do Windows
    process.env.ELECTRON_USER_DATA_DIR = app.getPath('userData')
    await import('../src/server.js')
    createWindow()
    createTray()
    setupAutoUpdater()
  })

  app.on('window-all-closed', () => {
    // não sai automaticamente — o app continua rodando na bandeja, como um app de
    // mensagens de verdade. Sair de fato é só pelo menu da bandeja ("Sair").
  })

  app.on('before-quit', () => {
    app.isQuitting = true
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 820,
    minHeight: 560,
    icon: ICON_PATH,
    autoHideMenuBar: true,
    backgroundColor: '#eef1f5',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
}

let updateReadyToInstall = false

function createTray() {
  const trayIcon = nativeImage.createFromPath(ICON_PATH).resize({ width: 32, height: 32 })
  tray = new Tray(trayIcon)
  tray.setToolTip('Disparo em Massa - WhatsApp')
  refreshTrayMenu()
  tray.on('double-click', () => {
    mainWindow.show()
    mainWindow.focus()
  })
}

function refreshTrayMenu() {
  if (!tray) return
  const menu = Menu.buildFromTemplate([
    {
      label: 'Abrir',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    { type: 'separator' },
    ...(updateReadyToInstall
      ? [{
          label: 'Reiniciar para atualizar',
          click: () => {
            app.isQuitting = true
            autoUpdater.quitAndInstall()
          }
        }]
      : [{ label: 'Verificar atualizações', click: () => autoUpdater.checkForUpdatesAndNotify().catch(() => {}) }]),
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
}

// Atualização automática: usa o provider GitHub já configurado em package.json ("build.publish",
// repositório FelipeChessa/multienvio, onde os releases .exe/.msi já são publicados) — não tem
// relação com multienvio/api/latest-version.js (esse endpoint fica pausado de propósito desde
// o incidente de 2026-09-09, ver INCIDENTE-2026-09-09.md). Baixa em segundo plano e só instala
// de fato na próxima vez que o app fechar de verdade (menu da bandeja "Sair" ou "Reiniciar para
// atualizar"), nunca no meio de um disparo em andamento.
function setupAutoUpdater() {
  if (!app.isPackaged) return // sem build publicado, checar update em dev só gera erro no console
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  updateState.registerHandlers({
    onCheck: () => autoUpdater.checkForUpdates(),
    onInstall: () => {
      app.isQuitting = true
      autoUpdater.quitAndInstall()
    }
  })

  autoUpdater.on('checking-for-update', () => updateState.setState({ checking: true, error: null }))
  autoUpdater.on('update-not-available', () => updateState.setState({ checking: false, updateAvailable: false, latestVersion: null }))
  autoUpdater.on('error', (err) => {
    console.error('[autoUpdater] erro:', err.message)
    updateState.setState({ checking: false, error: err.message })
  })
  autoUpdater.on('update-available', (info) => {
    console.log('[autoUpdater] atualização disponível:', info.version)
    updateState.setState({ checking: false, updateAvailable: true, latestVersion: info.version })
  })
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[autoUpdater] atualização baixada, será instalada ao sair:', info.version)
    updateReadyToInstall = true
    updateState.setState({ downloaded: true })
    refreshTrayMenu()
  })

  const check = () => autoUpdater.checkForUpdatesAndNotify().catch((err) => console.error('[autoUpdater] falha ao checar atualização:', err.message))
  check()
  setInterval(check, 4 * 60 * 60 * 1000) // o app fica rodando na bandeja por dias — reconfere periodicamente
}
