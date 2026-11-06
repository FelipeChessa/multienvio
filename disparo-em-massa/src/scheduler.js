import crypto from 'crypto'
import * as store from './db.js'
import * as whatsapp from './whatsapp.js'
import { startDispatch } from './sender.js'
import * as scheduledFiles from './scheduledFiles.js'
import { createCampaign, deleteCampaign, discardPersistedInput, initialDispatchHooks, describeInitialMessage } from './campaigns.js'

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

function attachmentRefsOf(payload) {
  if (Array.isArray(payload.attachmentRefs)) return payload.attachmentRefs.filter(Boolean)
  return payload.fileRef ? [payload.fileRef] : []
}

function cleanupFiles(entry) {
  for (const ref of attachmentRefsOf(entry.payload)) scheduledFiles.deleteFile(ref)
  for (const ref of entry.payload.albumFileRefs || []) scheduledFiles.deleteFile(ref)
}

// Anexos dos follow-ups de uma campanha agendada que não chegou a ser criada (cancelada ou
// falhou antes de sair). Se a campanha foi criada, os anexos passam a ser dela e ficam.
function cleanupCampaignFiles(entry) {
  if (entry.payload.campaign) discardPersistedInput(entry.payload.campaign)
}

function fire(id) {
  timers.delete(id)
  const entry = store.getScheduledMessage(id)
  if (!entry || entry.status !== 'pending') return

  try {
    whatsapp.getSock()
  } catch (err) {
    cleanupFiles(entry)
    cleanupCampaignFiles(entry)
    store.updateScheduledMessage(id, { status: 'failed', error: 'WhatsApp desconectado no horário agendado: ' + err.message })
    return
  }

  const { payload } = entry
  // agendamentos antigos guardavam um anexo só em `fileRef`
  const files = attachmentRefsOf(payload).map((ref) => scheduledFiles.readFile(ref))
  const file = files[0] || null
  const albumFiles = (payload.albumFileRefs || []).map((ref) => scheduledFiles.readFile(ref))

  let campaign = null
  if (payload.campaign) {
    campaign = createCampaign(payload.campaign, {
      origin: payload.labelName || (payload.contacts ? `${payload.contacts.length} contato(s) selecionado(s)` : null),
      initialPreview: describeInitialMessage(payload.messageType, payload.message, payload.pollQuestion, file, albumFiles, files.length)
    })
  }

  try {
    startDispatch({
      ...(campaign ? initialDispatchHooks(campaign.id) : {}),
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
      files,
      albumFiles
    })
    store.updateScheduledMessage(id, { status: 'sent', campaignId: campaign?.id || null })
  } catch (err) {
    if (campaign) {
      try {
        deleteCampaign(campaign.id) // apaga a campanha vazia e os anexos dos follow-ups
      } catch {
        // já não existe
      }
    }
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
      // vários anexos (`files`) ou um só (`file`, ainda usado pelo assistente de campanhas)
      attachmentRefs: (input.files && input.files.length ? input.files : (input.file ? [input.file] : []))
        .map((f) => scheduledFiles.storeFile(f)),
      albumFileRefs: (input.albumFiles || []).map((f) => scheduledFiles.storeFile(f)),
      campaign: input.campaign || null
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
  cleanupCampaignFiles(entry)
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
      cleanupCampaignFiles(entry)
      store.updateScheduledMessage(entry.id, { status: 'failed', error: 'O app estava fechado quando o horário agendado chegou.' })
      continue
    }
    armTimer(entry)
  }
}
