// Captura as telas reais do sistema (cópia de demonstração na porta 3299, dados fictícios)
// em PNG, para usar no comercial. Roda com o Electron do próprio projeto:
//   ../../disparo-em-massa/node_modules/electron/dist/electron.exe capture-shots.mjs
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'shots')
const URL = 'http://localhost:3299/'
const W = 1600
const H = 1000

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Prepara a página: finge WhatsApp conectado (a cópia de demo não tem sessão), esconde
// tutorial/modais e entra na tela principal.
const PREPARE = `
(async () => {
  const realFetch = window.fetch.bind(window)
  window.fetch = (url, opts) => {
    if (String(url).startsWith('/api/status')) return Promise.resolve(new Response(JSON.stringify({ status: 'connected', qrDataUrl: null })))
    return realFetch(url, opts)
  }
  localStorage.setItem('tutorialSeen', '1')
  document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.add('hidden'))
  await pollStatus()
  await new Promise((r) => setTimeout(r, 1200))
  document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.add('hidden'))
  return 'ok'
})()`

const STATES = [
  ['01-painel', `
    (async () => {
      for (const name of ['Clientes VIP', 'Black Friday']) {
        const card = [...document.querySelectorAll('.label-card')].find((c) => c.textContent.includes(name))
        card && card.click()
        await new Promise((r) => setTimeout(r, 500))
      }
      const msg = document.getElementById('message-input')
      msg.value = 'Oi {{primeiro_nome}}! 🖤 Nossa Black Friday começou: até 40% OFF em toda a loja.\\n\\nQuer que eu separe alguma peça pra você?'
      msg.dispatchEvent(new Event('input'))
      window.scrollTo(0, 0)
    })()`],
  ['02-modelos', `
    (async () => {
      await openCampaignBuilder()
      await new Promise((r) => setTimeout(r, 400))
    })()`],
  ['03-publico', `
    (async () => {
      document.querySelector('.template-card .template-use-btn').click()
      await new Promise((r) => setTimeout(r, 400))
      for (const name of ['Clientes VIP', 'Black Friday']) {
        const row = [...document.querySelectorAll('.builder-pick')].find((l) => l.textContent.includes(name))
        row && row.querySelector('input').click()
        await new Promise((r) => setTimeout(r, 300))
      }
    })()`],
  ['04-mensagens', `
    (async () => {
      goToBuilderStep(2)
      await new Promise((r) => setTimeout(r, 300))
      const vals = document.querySelectorAll('.builder-variable .var-value')
      const fill = ['Verão 2027', 'https://minhaloja.com.br/verao']
      vals.forEach((v, i) => { v.value = fill[i] || 'valor'; v.dispatchEvent(new Event('input')) })
    })()`],
  ['05-revisao', `
    (async () => {
      goToBuilderStep(3)
      await new Promise((r) => setTimeout(r, 300))
      goToBuilderStep(4)
      await new Promise((r) => setTimeout(r, 900))
    })()`],
  ['06-campanhas', `
    (async () => {
      closeCampaignBuilder()
      await new Promise((r) => setTimeout(r, 900))
    })()`],
  ['07-funil', `
    (async () => {
      const card = [...document.querySelectorAll('.campaign-card')].find((c) => c.textContent.includes('Black Friday'))
      card.click()
      await new Promise((r) => setTimeout(r, 1200))
    })()`],
  ['08-seguranca', `
    (async () => {
      closeCampaignsModal()
      await new Promise((r) => setTimeout(r, 300))
      document.getElementById('settings-btn').click()
      await new Promise((r) => setTimeout(r, 900))
    })()`]
]

// Captura pelo protocolo do Chrome numa "tela virtual" de 1600x1000 exatos: a captura da
// janela pode vir atrasada (quadro anterior) e o Windows limita a altura da janela à tela.
app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const win = new BrowserWindow({ width: 1280, height: 800, show: false, webPreferences: { offscreen: true, backgroundThrottling: false } })
  win.webContents.setFrameRate(30)
  console.log('carregando...')
  await win.loadURL(URL)
  const dbg = win.webContents.debugger
  dbg.attach('1.3')
  await dbg.sendCommand('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
  console.log('carregado')
  await wait(1500)
  console.log('prepare:', await win.webContents.executeJavaScript(PREPARE))
  for (const [name, script] of STATES) {
    try {
      await win.webContents.executeJavaScript(script)
    } catch (err) {
      console.log('erro em', name, err.message)
    }
    await wait(900)
    const { data } = await dbg.sendCommand('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } })
    fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(data, 'base64'))
    console.log('capturado', name)
  }
  app.quit()
})
