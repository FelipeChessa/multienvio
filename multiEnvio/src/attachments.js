import { convertWebmToOggOpus } from './audio.js'

// Anexos do tipo "Arquivo/texto" (disparo imediato e agendado). Aceita o campo antigo `file`
// (um arquivo) e o novo `attachments` (vários, até MAX_ATTACHMENTS). Gravação feita no app
// chega como audio/webm e é remuxada pra ogg/opus quando vai como nota de voz — senão o
// WhatsApp não mostra como nota de voz de verdade (ver src/audio.js).
export const MAX_ATTACHMENTS = 10

export function prepareAttachments(reqFiles, asVoiceNote) {
  const list = [...(reqFiles?.file || []), ...(reqFiles?.attachments || [])].slice(0, MAX_ATTACHMENTS)
  return list.map((f) => {
    if (asVoiceNote && f.mimetype.startsWith('audio/webm')) {
      const ogg = convertWebmToOggOpus(f.buffer)
      if (ogg) return { ...f, buffer: ogg, mimetype: 'audio/ogg; codecs=opus' }
    }
    return f
  })
}
