// Renderiza commercial.html quadro a quadro (render(t) determinístico) e monta o MP4 final
// com a trilha. Usa só o que já vem no projeto: o Electron e o ffmpeg-static.
//   ../../disparo-em-massa/node_modules/electron/dist/electron.exe render-video.mjs [--preview]
// --preview: só exporta alguns quadros em PNG (frames/) para conferir, sem gerar vídeo.
//
// A captura usa o protocolo de depuração do Chrome com uma "tela virtual" de exatamente
// 1920x1080 — fotografar a janela não serve, porque o Windows limita a janela ao tamanho
// útil da tela (ex: 1920x1032 com a barra de tarefas) e o vídeo sairia esticado.
import { app, BrowserWindow } from 'electron'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FFMPEG = path.join(__dirname, '..', '..', 'disparo-em-massa', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
const W = 1920
const H = 1080
const FPS = 30
const DURATION = 57.6
const PREVIEW = process.argv.includes('--preview')
const PREVIEW_TIMES = [2.4, 3.9, 6.6, 13.6, 20.5, 28.9, 36.3, 42.4, 46.5, 52.0]

app.commandLine.appendSwitch('force-device-scale-factor', '1')

app.whenReady().then(async () => {
  try {
    // offscreen: a janela escondida comum não produz quadros, e a captura ficaria esperando
    const win = new BrowserWindow({ width: 1280, height: 720, show: false, webPreferences: { offscreen: true, backgroundThrottling: false } })
    win.webContents.setFrameRate(60)
    await win.loadURL(pathToFileURL(path.join(__dirname, 'commercial.html')).href + '?render')
    await win.webContents.executeJavaScript('window.renderReady')

    const dbg = win.webContents.debugger
    dbg.attach('1.3')
    await dbg.sendCommand('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })

    async function frameAt(t) {
      await win.webContents.executeJavaScript(`render(${t}); 1`)
      const { data } = await dbg.sendCommand('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: W, height: H, scale: 1 },
        optimizeForSpeed: true
      })
      return Buffer.from(data, 'base64')
    }

    if (PREVIEW) {
      fs.mkdirSync(path.join(__dirname, 'frames'), { recursive: true })
      for (const t of PREVIEW_TIMES) {
        const png = await frameAt(t)
        fs.writeFileSync(path.join(__dirname, 'frames', `t${String(t).replace('.', '_')}.png`), png)
        console.log('quadro', t, png.readUInt32BE(16) + 'x' + png.readUInt32BE(20))
      }
      app.quit()
      return
    }

    const out = path.join(__dirname, 'multienvio-comercial.mp4')
    const ff = spawn(FFMPEG, [
      '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-i', path.join(__dirname, 'soundtrack.wav'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '192k', '-shortest', out
    ], { stdio: ['pipe', 'ignore', 'pipe'] })
    let ffErr = ''
    ff.stderr.on('data', (d) => { ffErr = (ffErr + d).slice(-2000) })

    const total = Math.round(DURATION * FPS)
    const started = Date.now()
    for (let f = 0; f < total; f++) {
      const png = await frameAt(f / FPS)
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r))
      if (f % 150 === 0) console.log(`quadro ${f}/${total} (${Math.round((Date.now() - started) / 1000)}s)`)
    }
    ff.stdin.end()
    const code = await new Promise((r) => ff.on('close', r))
    console.log(code === 0 ? `vídeo pronto: ${out}` : `ffmpeg falhou (${code}): ${ffErr}`)
  } catch (err) {
    console.error('erro no render:', err)
  }
  app.quit()
})
