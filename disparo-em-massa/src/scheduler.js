import crypto from 'crypto'
import * as store from './db.js'
import * as whatsapp from './whatsapp.js'
import { startDispatch } from './sender.js'
import * as scheduledFiles from './scheduledFiles.js'

// Se o app ficou fechado e o horário agendado já passou há mais que isso quando reabre, não
// dispara sozinho um disparo potencialmente muito atrasado — marca como falho e deixa o
// usuário decidir se quer reagendar. Dentro dessa janela (ex: o app foi fechado por 2 minutos
// pra aplicar uma atualização), ainda dispara normalmente.
const GRACE_MS = 15 * 60 * 1000

const timers = new Map()

function armTimer(entry) {
  const delay = new Date(entry.scheduledFor).getTime() - Date.now()
  const timer = setTimeout(() => fire(entry.id), Math.max(0, delay))
  timers.set(entry.id, timer)
}

function cleanupFiles(entry) {
  scheduledFiles.deleteFile(entry.payload.fileRef)
  for (const ref of entry.payload.albumFileRefs || []) scheduledFiles.deleteFile(ref)
}

function fire(id) {
  timers.delete(id)
  const entry = store.getScheduledMessage(id)
  if (!entry || entry.status !== 'pending') return

  try {
    whatsapp.getSock()
  } catch (err) {
    cleanupFiles(entry)
    store.updateScheduledMessage(id, { status: 'failed', error: 'WhatsApp desconectado no horário agendado: ' + err.message })
    return
  }

  const { payload } = entry
  try {
    startDispatch({
      labelIds: payload.labelIds,
      labelName: payload.labelName,
      contacts: payload.contacts,
      message: payload.message,
      messageType: payload.messageType,
      asVoiceNote: payload.asVoiceNote,
      pollQuestion: payload.pollQuestion,
      pollOptions: payload.pollOptions,
      simulateTyping: payload.simulateTyping,
      skipBlocked: payload.skipBlocked,
      markAsRead: payload.markAsRead,
      applyLabelId: payload.applyLabelId,
      removeLabelId: payload.removeLabelId,
      file: scheduledFiles.readFile(payload.fileRef),
      albumFiles: (payload.albumFileRefs || []).map((ref) => scheduledFiles.readFile(ref))
    })
    store.updateScheduledMessage(id, { status: 'sent' })
  } catch (err) {
    store.updateScheduledMessage(id, { status: 'failed', error: err.message })
  }
  cleanupFiles(entry)
}

// Chamado pela rota POST /api/scheduled — recebe basicamente os mesmos campos que
// startDispatch aceita, mais scheduledFor. Persiste os arquivos em disco (se houver) antes de
// gravar o agendamento, já que o buffer do upload não sobrevive além desta requisição.
export function scheduleMessage(input) {
  const entry = {
    id: crypto.randomUUID(),
    scheduledFor: input.scheduledFor,
    createdAt: new Date().toISOString(),
    status: 'pending',
    error: null,
    payload: {
      labelIds: input.labelIds,
      labelName: input.labelName,
      contacts: input.contacts,
      message: input.message,
      messageType: input.messageType,
      asVoiceNote: input.asVoiceNote,
      pollQuestion: input.pollQuestion,
      pollOptions: input.pollOptions,
      simulateTyping: input.simulateTyping,
      skipBlocked: input.skipBlocked,
      markAsRead: input.markAsRead,
      applyLabelId: input.applyLabelId,
      removeLabelId: input.removeLabelId,
      fileRef: scheduledFiles.storeFile(input.file),
      albumFileRefs: (input.albumFiles || []).map((f) => scheduledFiles.storeFile(f))
    }
  }
  store.addScheduledMessage(entry)
  armTimer(entry)
  return entry
}

export function cancelScheduledMessage(id) {
  const entry = store.getScheduledMessage(id)
  if (!entry) throw new Error('Agendamento não encontrado.')
  if (entry.status !== 'pending') throw new Error('Esse agendamento já foi processado e não pode mais ser cancelado.')
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  cleanupFiles(entry)
  store.removeScheduledMessage(id)
}

// Rearma os agendamentos pendentes ao iniciar o app — sem isso, um agendamento feito antes de
// fechar o app (ou antes de uma atualização reiniciar o app) nunca dispararia sozinho.
export function initScheduler() {
  const now = Date.now()
  for (const entry of store.listScheduledMessages()) {
    if (entry.status !== 'pending') continue
    const due = new Date(entry.scheduledFor).getTime()
    if (due < now - GRACE_MS) {
      cleanupFiles(entry)
      store.updateScheduledMessage(entry.id, { status: 'failed', error: 'O app estava fechado quando o horário agendado chegou.' })
      continue
    }
    armTimer(entry)
  }
}
