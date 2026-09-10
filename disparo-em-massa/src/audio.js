import { spawnSync } from 'child_process'
import ffmpegPath from 'ffmpeg-static'

// Gravação feita no navegador (MediaRecorder) sai como WebM/Opus — o mesmo codec de áudio que
// o WhatsApp espera pra nota de voz, só que dentro do contêiner errado. Aqui é só remuxagem
// (copy, sem reencodar o áudio) pro contêiner Ogg, que é o que faz o WhatsApp mostrar a bolha
// redonda com forma de onda em vez de um arquivo de áudio comum. Roda tudo via pipe
// (stdin/stdout), sem tocar em disco.
export function convertWebmToOggOpus(webmBuffer) {
  try {
    const result = spawnSync(ffmpegPath, [
      '-hide_banner', '-loglevel', 'error',
      '-f', 'webm', '-i', 'pipe:0',
      '-vn', '-c:a', 'copy',
      '-f', 'ogg', 'pipe:1'
    ], {
      input: webmBuffer,
      maxBuffer: 100 * 1024 * 1024
    })
    if (result.status !== 0 || !result.stdout || result.stdout.length === 0) {
      console.error('ffmpeg falhou ao converter gravação de áudio para ogg/opus:', result.stderr?.toString())
      return null
    }
    return result.stdout
  } catch (err) {
    console.error('Não foi possível rodar ffmpeg para converter a gravação de áudio:', err.message)
    return null
  }
}
