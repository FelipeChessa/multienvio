import { randomUUID } from 'crypto'
import { EventEmitter } from 'events'

import * as store from './db.js'
import { getSock } from './whatsapp.js'

const jobs = new Map() // jobId -> { emitter, entries: [], done: boolean, summary }

// trava de disparo único: sem isso, dois disparos simultâneos (duas abas, duplo-clique)
// poderiam juntos ultrapassar o limite diário por uma corrida lógica entre as checagens
// de cada um. Não é sobre corrupção de data/app.json (persist() já é síncrono e seguro),
// é sobre a garantia do limite diário/disjuntor ser coerente.
let activeJobId = null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomDelay(minMs, maxMs) {
  const min = Math.min(minMs, maxMs)
  const max = Math.max(minMs, maxMs)
  return min + Math.floor(Math.random() * (max - min + 1))
}

function buildVCard(name, phone) {
  const digits = String(phone).replace(/[^\d+]/g, '').replace(/^\+/, '')
  return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;waid=${digits}:${phone}\nEND:VCARD`
}

// Devolve uma lista de payloads a enviar (na maioria dos casos só um). O caso de dois é a nota
// de voz: o Baileys não aceita legenda em áudio, então se tiver mensagem de texto junto, ela
// vai como uma segunda mensagem de texto separada.
function buildMessagePayloads({ messageType, message, file, asVoiceNote, pollQuestion, pollOptions, profile }) {
  if (messageType === 'poll') {
    return [{ poll: { name: pollQuestion, values: pollOptions, selectableCount: 1 } }]
  }
  if (messageType === 'location') {
    const loc = profile.location
    return [{ location: { degreesLatitude: loc.lat, degreesLongitude: loc.lng, name: loc.name || undefined, address: loc.address || undefined } }]
  }
  if (messageType === 'contact') {
    const card = profile.businessCard
    return [{ contacts: { displayName: card.name, contacts: [{ vcard: buildVCard(card.name, card.phone) }] } }]
  }
  // messageType === 'media' (ou ausente)
  if (!file) return [{ text: message }]
  if (file.mimetype.startsWith('image/')) {
    return [{ image: file.buffer, caption: message }]
  }
  if (file.mimetype.startsWith('video/')) {
    return [{ video: file.buffer, caption: message }]
  }
  if (file.mimetype.startsWith('audio/') && asVoiceNote) {
    const payloads = [{ audio: file.buffer, mimetype: file.mimetype, ptt: true }]
    if (message) payloads.push({ text: message })
    return payloads
  }
  return [{
    document: file.buffer,
    mimetype: file.mimetype,
    fileName: file.originalname,
    caption: message
  }]
}

async function sendPayloads(sock, jid, payloads) {
  for (const payload of payloads) {
    await sock.sendMessage(jid, payload)
  }
}

function personalizeMessage(message, contactName) {
  return message.replace(/\{\{\s*nome\s*\}\}/gi, contactName || 'cliente')
}

function startDispatch({ labelIds, labelName, message, file, contacts: explicitContacts, messageType, asVoiceNote, pollQuestion, pollOptions }) {
  if (activeJobId) {
    throw new Error('Já existe um disparo em andamento. Aguarde ele terminar antes de iniciar outro.')
  }

  // reenvio rápido a partir da tabela de falhas (ou as abas "Todos os contatos"/"Clientes
  // frios") manda uma lista explícita de contatos, em vez de etiqueta(s) — nesse caso não há
  // labelIds/labelName reais vindos de etiqueta.
  const contacts = explicitContacts && explicitContacts.length > 0
    ? explicitContacts
    : store.listContactsForLabels(labelIds || [])
  const effectiveLabelName = labelName || (explicitContacts ? 'Reenvio manual' : null)
  // logSend guarda um labelId por linha só pra exibição na tabela de falhas — com várias
  // etiquetas combinadas não há um único "dono" do contato, então só preenche quando for
  // exatamente uma etiqueta (mesmo padrão problem-free já usado antes com etiqueta única).
  const logLabelId = labelIds && labelIds.length === 1 ? labelIds[0] : null
  const jobId = randomUUID()
  activeJobId = jobId

  const settings = store.getSettings()
  const profile = store.getMessagingProfile()
  const effectiveMessageType = messageType || 'media'
  const delayMinMs = settings.delayMinSec * 1000
  const delayMaxMs = settings.delayMaxSec * 1000
  const batchPauseMs = settings.batchPauseMinutes * 60 * 1000
  const cb = settings.circuitBreaker

  const emitter = new EventEmitter()
  const job = { emitter, entries: [], done: false, summary: null }
  jobs.set(jobId, job)

  const emit = (event) => {
    job.entries.push(event)
    emitter.emit('event', event)
  }

  const finish = () => {
    job.done = true
    if (activeJobId === jobId) activeJobId = null
  }

  const usageBefore = store.countSendsInWindow(24)
  const dailyRemaining = settings.dailyLimit > 0 ? Math.max(0, settings.dailyLimit - usageBefore.total) : null

  emit({
    type: 'start',
    total: contacts.length,
    labelName: effectiveLabelName,
    delayMinMs,
    delayMaxMs,
    batchSize: settings.batchSize,
    batchPauseMs,
    dailyLimit: settings.dailyLimit,
    dailyRemaining
  })

  ;(async () => {
    const sock = getSock()
    let sent = 0
    let failed = 0
    let consecutiveFailures = 0

    for (const contact of contacts) {
      if (settings.dailyLimit > 0 && store.countSendsInWindow(24).total >= settings.dailyLimit) {
        emit({
          type: 'aborted',
          reason: 'daily_limit',
          message: `Limite diário de ${settings.dailyLimit} envios atingido. O restante não foi enviado.`,
          sent,
          failed,
          total: contacts.length
        })
        job.summary = { sent, failed, total: contacts.length, aborted: true, reason: 'daily_limit' }
        finish()
        return
      }

      const label = contact.name || contact.jid
      const personalizedMessage = personalizeMessage(message || '', contact.name)
      try {
        const payloads = buildMessagePayloads({
          messageType: effectiveMessageType,
          message: personalizedMessage,
          file,
          asVoiceNote,
          pollQuestion,
          pollOptions,
          profile
        })
        await sendPayloads(sock, contact.jid, payloads)
        sent += 1
        consecutiveFailures = 0
        store.logSend(jobId, logLabelId, effectiveLabelName, contact.jid, contact.name, 'sent', null)
        emit({ type: 'progress', jid: contact.jid, name: label, status: 'sent', sent, failed, total: contacts.length })
      } catch (err) {
        failed += 1
        consecutiveFailures += 1
        store.logSend(jobId, logLabelId, effectiveLabelName, contact.jid, contact.name, 'failed', String(err?.message || err))
        emit({ type: 'progress', jid: contact.jid, name: label, status: 'failed', error: String(err?.message || err), sent, failed, total: contacts.length })
      }

      if (cb.enabled) {
        const attempts = sent + failed
        const failureRate = attempts > 0 ? failed / attempts : 0
        const tripped = consecutiveFailures >= cb.consecutiveFailures ||
          (attempts >= cb.minSampleForRate && failureRate > cb.failureRateThreshold)

        if (tripped) {
          const reason = consecutiveFailures >= cb.consecutiveFailures ? 'consecutive_failures' : 'failure_rate'
          const message = reason === 'consecutive_failures'
            ? `Envio interrompido automaticamente: ${consecutiveFailures} mensagens seguidas falharam. Isso costuma indicar um problema de conexão ou de bloqueio — verifique antes de tentar de novo.`
            : `Envio interrompido automaticamente: muitas falhas entre os envios (${failed} de ${attempts}). Isso costuma indicar um problema de conexão ou de bloqueio — verifique antes de tentar de novo.`
          emit({ type: 'aborted', reason, message, sent, failed, total: contacts.length })
          job.summary = { sent, failed, total: contacts.length, aborted: true, reason }
          finish()
          return
        }
      }

      if (contact !== contacts[contacts.length - 1]) {
        const attemptsSoFar = sent + failed
        if (attemptsSoFar > 0 && attemptsSoFar % settings.batchSize === 0) {
          emit({ type: 'batch_pause', pauseMs: batchPauseMs, afterCount: attemptsSoFar })
          await sleep(batchPauseMs)
        } else {
          const delayMs = randomDelay(delayMinMs, delayMaxMs)
          emit({ type: 'waiting', delayMs })
          await sleep(delayMs)
        }
      }
    }

    job.summary = { sent, failed, total: contacts.length }
    emit({ type: 'done', sent, failed, total: contacts.length })
    finish()
  })().catch((err) => {
    emit({ type: 'error', error: String(err?.message || err) })
    finish()
  })

  return jobId
}

function subscribeToJob(jobId, onEvent) {
  const job = jobs.get(jobId)
  if (!job) return null

  for (const entry of job.entries) onEvent(entry)
  if (job.done) return () => {}

  const handler = (event) => onEvent(event)
  job.emitter.on('event', handler)
  return () => job.emitter.off('event', handler)
}

export { startDispatch, subscribeToJob }
