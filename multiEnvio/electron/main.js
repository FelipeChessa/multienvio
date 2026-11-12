// Processo principal do Electron: roda o servidor Express (src/server.js) dentro do próprio
// processo (sem subprocess) e mostra o app numa janela nativa, em vez de abrir no navegador.
// Isso resolve dois problemas do modo "navegador + cmd": não aparece "localhost" na barra de
// endereço, e não existe janela preta de terminal — fechar a janela só minimiza para a bandeja,
// e sair de verdade é pelo ícone da bandeja (como qualquer app de mensagens de verdade).

import { app, BrowserWindow, Tray, Menu, Notification, nativeImage, shell, session } from 'electron'
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
// O ícone fica em electron/assets/ porque só electron/, src/ e public/ entram no programa
// instalado — build/ é só para montar o instalador. Antes ele era lido de build/ e, no programa
// instalado, o ícone da bandeja (perto do relógio) ficava em branco.
const ICON_PATH = path.join(__dirname, 'assets', 'icon.ico')

let mainWindow = null
let tray = null
let licenseModule = null // carregado depois que a pasta de dados estiver definida

// Só para desenvolvimento/testes: roda o app com outra pasta de dados (auth/, data/, sessão do
// WhatsApp Web), sem misturar com a instalação de verdade do usuário.
if (process.env.DISPARO_USER_DATA_DIR) {
  app.setPath('userData', process.env.DISPARO_USER_DATA_DIR)
}

// `npm run app:teste`: abre a janela do programa usando os dados do repositório (auth/ e data/,
// os mesmos do `node src/server.js`), para testar o WhatsApp embutido com as campanhas de teste.
// A sessão do WhatsApp Web fica numa pasta própria de caminho curto (caminhos longos quebram o
// banco de dados dele no Windows). Nunca vale no programa instalado.
const USE_PROJECT_DATA = !app.isPackaged && process.argv.includes('--dados-do-projeto')
if (USE_PROJECT_DATA && !process.env.DISPARO_USER_DATA_DIR) {
  app.setPath('userData', path.join(process.env.LOCALAPPDATA || app.getPath('temp'), 'DisparoTeste'))
}

// Pasta de dados dos clientes (licença, sessão do WhatsApp, campanhas): FIXA em
// %APPDATA%\tabelas-whatsapp, o nome interno do pacote desde a primeira versão. O nome que
// aparece para o cliente ("MultiEnvio") pode mudar à vontade sem que ninguém perca os dados.
if (app.isPackaged && !process.env.DISPARO_USER_DATA_DIR) {
  app.setPath('userData', path.join(app.getPath('appData'), 'tabelas-whatsapp'))
}
app.setName('MultiEnvio')
// as notificações do Windows aparecem com o nome e o ícone do atalho que o instalador criou
if (process.platform === 'win32') app.setAppUserModelId('com.felipechessa.multienvio')

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
    if (!USE_PROJECT_DATA) process.env.ELECTRON_USER_DATA_DIR = app.getPath('userData')
    await import('../src/server.js')
    licenseModule = await import('../src/license.js')
    setupWhatsAppWeb()
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
      nodeIntegration: false,
      webviewTag: true // aba "WhatsApp": o WhatsApp Web oficial embutido (ver setupWhatsAppWeb)
    }
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)

  // A única <webview> permitida é a do WhatsApp Web, na sessão própria dela, sem nenhum
  // acesso a Node — mesmo que algo na página tente criar outra apontando pra outro lugar.
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // sem licença válida o WhatsApp embutido não abre, mesmo que a tela tente
    if (!licenseModule?.isActivated() || !isWhatsAppUrl(params.src) || params.partition !== WHATSAPP_PARTITION) {
      event.preventDefault()
      return
    }
    delete webPreferences.preload
    webPreferences.nodeIntegration = false
    webPreferences.contextIsolation = true
    webPreferences.sandbox = true
  })

  // Links externos (ex: "Abrir conversa" no funil de campanhas, que aponta pra wa.me) abrem no
  // navegador padrão do usuário, não numa janela nova do próprio app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url) && !url.startsWith(`http://localhost:${PORT}`)) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
}

// ===== WhatsApp Web embutido (aba "WhatsApp") =====
//
// É o WhatsApp Web oficial (web.whatsapp.com) dentro do app, numa <webview> — não recriamos
// nada. Ele é mais um "aparelho conectado" no celular (o disparo já é um; o WhatsApp permite
// até 4), com sessão própria e persistente: escaneia o QR uma vez e fica logado.

const WHATSAPP_PARTITION = 'persist:whatsapp'

function isWhatsAppUrl(url) {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && (hostname === 'whatsapp.com' || hostname.endsWith('.whatsapp.com') || hostname.endsWith('.whatsapp.net'))
  } catch {
    return false
  }
}

function setupWhatsAppWeb() {
  const waSession = session.fromPartition(WHATSAPP_PARTITION)

  // O WhatsApp Web só aceita navegadores que ele reconhece — com o "Electron/30" no user agent
  // ele pede pra "atualizar o Chrome". Usamos o mesmo Chromium que já vem no Electron, só
  // sem a marca do Electron.
  waSession.setUserAgent(
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`
  )

  // Libera só o que o WhatsApp Web usa: notificações de mensagem nova, microfone/câmera (nota
  // de voz, foto), copiar pra área de transferência e — sem esses dois ele mostra "erro no
  // banco de dados do seu navegador" e não gera o QR — armazenamento persistente (guarda a
  // sessão logada) e sincronização em segundo plano. Todo o resto é negado.
  const allowed = new Set([
    'notifications', 'media', 'clipboard-sanitized-write', 'clipboard-read', 'fullscreen',
    'persistent-storage', 'background-sync'
  ])
  waSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const ok = allowed.has(permission) && isWhatsAppUrl(details.requestingUrl || webContents.getURL())
    if (process.env.DISPARO_DEBUG_PERMISSIONS) console.log('[whatsapp] pedido de permissão:', permission, ok)
    callback(ok)
  })
  waSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    const ok = allowed.has(permission) && isWhatsAppUrl(requestingOrigin)
    if (process.env.DISPARO_DEBUG_PERMISSIONS) console.log('[whatsapp] checagem de permissão:', permission, ok)
    return ok
  })

  // Links clicados dentro das conversas (sites, Google Maps, etc.) abrem no navegador padrão,
  // nunca dentro da aba do WhatsApp nem numa janela solta do app.
  app.on('web-contents-created', (event, contents) => {
    if (contents.getType() !== 'webview') return
    contents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url)
      return { action: 'deny' }
    })
    contents.on('will-navigate', (navEvent, url) => {
      if (isWhatsAppUrl(url)) return
      navEvent.preventDefault()
      if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    })
  })
}

let updateReadyToInstall = false

function createTray() {
  // .ico com vários tamanhos (16 a 256 px): o Windows escolhe o certo para a escala da tela,
  // sem ficar borrado. Se faltar, avisa no log em vez de criar um ícone invisível sem explicação.
  let trayIcon = nativeImage.createFromPath(ICON_PATH)
  if (trayIcon.isEmpty()) {
    console.error('[bandeja] ícone não encontrado em', ICON_PATH)
    trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png')).resize({ width: 32, height: 32 })
  }
  tray = new Tray(trayIcon)
  tray.setToolTip('MultiEnvio')
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
          label: 'Atualizar agora',
          click: () => {
            try { updateState.requestInstall() } catch (err) { console.error('[autoUpdater]', err.message) }
          }
        }]
      : [{ label: 'Verificar atualizações', click: () => autoUpdater.checkForUpdates().catch(() => {}) }]),
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
      // silencioso (sem abrir o assistente de instalação de novo, mantém a pasta escolhida) e
      // reabre o programa sozinho já na versão nova
      autoUpdater.quitAndInstall(true, true)
    }
  })

  autoUpdater.on('checking-for-update', () => updateState.setState({ checking: true, error: null }))
  autoUpdater.on('update-not-available', () => updateState.setState({ checking: false, updateAvailable: false, latestVersion: null }))
  autoUpdater.on('error', (err) => {
    console.error('[autoUpdater] erro:', err.message)
    // falhou (sem internet, GitHub fora): libera o programa e tenta de novo na próxima checagem
    updateState.setState({ checking: false, error: err.message, updateAvailable: !!updateState.getState().downloaded })
  })
  autoUpdater.on('update-available', (info) => {
    console.log('[autoUpdater] atualização disponível:', info.version)
    updateState.setState({
      checking: false,
      updateAvailable: true,
      latestVersion: info.version,
      releaseNotes: updateState.notesToText(info.releaseNotes),
      progress: 0
    })
  })
  autoUpdater.on('download-progress', (p) => {
    updateState.setState({ progress: Math.round(p.percent || 0) })
  })
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[autoUpdater] atualização baixada, pronta para instalar:', info.version)
    updateReadyToInstall = true
    updateState.setState({ downloaded: true, progress: 100, latestVersion: info.version })
    refreshTrayMenu()
    // aviso do Windows (aparece mesmo com o programa só na bandeja); clicar abre a janela
    if (Notification.isSupported()) {
      const n = new Notification({
        title: `Atualizando o MultiEnvio (v${info.version})`,
        body: 'O programa vai reiniciar sozinho, assim que não houver envio em andamento.',
        icon: ICON_PATH
      })
      n.on('click', () => {
        if (!mainWindow) return
        mainWindow.show()
        mainWindow.focus()
      })
      n.show()
    }
    updateState.installWhenIdle({ delayMs: 1500 })
  })

  // Atualização é obrigatória e imediata: confere ao abrir e a cada minuto (o GitHub não tem
  // como avisar o programa). Com uma atualização já em andamento não confere de novo, para
  // não zerar a barra de progresso.
  const check = () => {
    if (updateState.getState().updateAvailable) return
    autoUpdater.checkForUpdates().catch((err) => console.error('[autoUpdater] falha ao checar atualização:', err.message))
  }
  check()
  setInterval(check, 60 * 1000)
}
