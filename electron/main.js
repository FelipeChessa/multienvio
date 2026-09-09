// Processo principal do Electron: roda o servidor Express (src/server.js) dentro do próprio
// processo (sem subprocess) e mostra o app numa janela nativa, em vez de abrir no navegador.
// Isso resolve dois problemas do modo "navegador + cmd": não aparece "localhost" na barra de
// endereço, e não existe janela preta de terminal — fechar a janela só minimiza para a bandeja,
// e sair de verdade é pelo ícone da bandeja (como qualquer app de mensagens de verdade).

import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

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

function createTray() {
  const trayIcon = nativeImage.createFromPath(ICON_PATH).resize({ width: 32, height: 32 })
  tray = new Tray(trayIcon)
  tray.setToolTip('Disparo em Massa - WhatsApp')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Abrir',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
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
  tray.on('double-click', () => {
    mainWindow.show()
    mainWindow.focus()
  })
}
