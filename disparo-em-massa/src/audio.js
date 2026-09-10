import { spawnSync } from 'child_process'
import ffmpegStaticPath from 'ffmpeg-static'

// Dentro do app empacotado, ffmpeg-static resolve o próprio caminho como algo dentro de
// "app.asar" — isso "existe" pra leitura de arquivo (o Electron redireciona transparentemente
// pra app.asar.unpacked), mas spawnSync chama o SO diretamente pra executar o processo, sem
// esse redirecionamento, e falha com ENOENT. O binário de fato está em app.asar.unpacked
// (ver asarUnpack em package.json) — só precisa trocar o pedaço do caminho. Não afeta o modo
// dev (node src/server.js, sem asar nenhum): a troca é um no-op quando "app.asar" não aparece.
const ffmpegPath = ffmpegStaticPath.replace('app.asar', 'app.asar.unpacked')

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
    if (result.error || result.status !== 0 || !result.stdout || result.stdout.length === 0) {
      console.error('ffmpeg falhou ao converter gravação de áudio para ogg/opus:', result.error?.message, result.stderr?.toString())
      return null
    }
    return result.stdout
  } catch (err) {
    console.error('Não foi possível rodar ffmpeg para converter a gravação de áudio:', err.message)
    return null
  }
}
