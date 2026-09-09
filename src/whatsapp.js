import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import pino from 'pino'
import makeWASocket, { useMultiFileAuthState, DisconnectReason, ALL_WA_PATCH_NAMES } from '@whiskeysockets/baileys'

import * as store from './db.js'
import { AUTH_DIR } from './paths.js'

const state = {
  status: 'connecting', // 'connecting' | 'qr' | 'connected' | 'closed' | 'disconnected' | 'logged_out'
  qrDataUrl: null,
  sock: null,
  manualDisconnect: false
}

// respostas curtas e diretas que indicam pedido de opt-out — casamento exato (não "contém"),
// pra não disparar em falso quando a palavra aparece dentro de uma frase qualquer do cliente
const OPT_OUT_KEYWORDS = new Set([
  'parar', 'pare', 'pare de enviar', 'pare de mandar', 'sair', 'cancelar',
  'stop', 'descadastrar', 'remover', 'nao quero mais', 'nao quero mais receber'
])

const COMBINING_MARKS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g')

function normalizeText(text) {
  return text
    .normalize('NFD').replace(COMBINING_MARKS, '') // remove acentos
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // remove pontuação
    .trim()
    .replace(/\s+/g, ' ')
}

function extractTextBody(msg) {
  const m = msg.message
  if (!m) return ''
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || ''
}

async function forceFullResync(sock) {
  for (const name of ALL_WA_PATCH_NAMES) {
    const versionFile = path.join(AUTH_DIR, `app-state-sync-version-${name}.json`)
    if (fs.existsSync(versionFile)) fs.unlinkSync(versionFile)
  }
  await sock.resyncAppState(ALL_WA_PATCH_NAMES, true)
}

async function start() {
  state.manualDisconnect = false
  state.status = 'connecting'
  state.qrDataUrl = null

  const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR)

  const sock = makeWASocket({
    auth: authState,
    logger: pino({ level: 'error' })
  })
  state.sock = sock

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    // ignora eventos de um socket antigo que já foi substituído (ex: reset de sessão
    // disparou start() de novo antes do end() do socket anterior terminar de fechar)
    if (state.sock !== sock) return

    const { connection, lastDisconnect, qr } = update

    if (qr) {
      state.status = 'qr'
      state.qrDataUrl = await QRCode.toDataURL(qr)
    }

    if (connection === 'open') {
      state.status = 'connected'
      state.qrDataUrl = null

      // o Baileys só manda o histórico completo de etiquetas uma vez, no pareamento inicial —
      // em reconexões normais ele lembra a versão que já enviou e não reenvia nada. Se o cache
      // local (data/) estiver vazio numa sessão já pareada (ex: pasta apagada, ou projeto
      // copiado para outra máquina mantendo a pasta "auth"), zeramos o controle de versão do
      // Baileys e pedimos a ressincronização completa, recuperando as etiquetas sem precisar
      // escanear o QR de novo.
      if (store.listLabels().length === 0) {
        forceFullResync(sock).catch((err) => {
          console.error('Falha ao ressincronizar etiquetas:', err.message)
        })
      }
    }

    if (connection === 'close') {
      state.qrDataUrl = null

      if (state.manualDisconnect) {
        state.status = 'disconnected'
        return
      }

      const statusCode = lastDisconnect?.error?.output?.statusCode
      const loggedOut = statusCode === DisconnectReason.loggedOut

      if (loggedOut) {
        state.status = 'logged_out'
        console.error('Sessão encerrada pelo WhatsApp (logout). Gere um novo QR Code para parear novamente.')
        return
      }

      state.status = 'closed'
      start().catch((err) => console.error('Falha ao reconectar:', err))
    }
  })

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      const jid = msg.key.remoteJid
      if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast') continue
      const text = extractTextBody(msg)
      if (!text) continue
      if (OPT_OUT_KEYWORDS.has(normalizeText(text))) {
        store.addOptOut(jid)
      }
    }
  })

  sock.ev.on('labels.edit', (label) => {
    store.upsertLabel(label)
  })

  sock.ev.on('labels.association', ({ association, type }) => {
    store.applyAssociation(association, type)
  })

  sock.ev.on('contacts.upsert', (contacts) => {
    for (const c of contacts) {
      store.upsertContact(c.id, c.name || c.notify)
    }
  })

  sock.ev.on('contacts.update', (contacts) => {
    for (const c of contacts) {
      store.upsertContact(c.id, c.name || c.notify)
    }
  })

  return sock
}

function getStatus() {
  return { status: state.status, qrDataUrl: state.qrDataUrl }
}

function getSock() {
  if (state.status !== 'connected' || !state.sock) {
    throw new Error('WhatsApp não está conectado no momento.')
  }
  return state.sock
}

function disconnect() {
  if (!state.sock || state.status === 'disconnected') {
    throw new Error('Não há conexão ativa para desconectar.')
  }
  // fecha o socket sem fazer logout: as credenciais em auth/ continuam válidas,
  // então dá para reconectar depois sem escanear o QR de novo.
  state.manualDisconnect = true
  state.sock.end(new Error('Desconexão manual'))
}

function reconnect() {
  if (state.status === 'connected' || state.status === 'connecting') {
    throw new Error('O WhatsApp já está conectado.')
  }
  return start()
}

async function resyncLabels() {
  const sock = getSock()
  await forceFullResync(sock)
}

async function resetSession() {
  // usado quando o WhatsApp já encerrou a sessão (logout) e as credenciais salvas
  // não servem mais — precisa apagar auth/ e parear de novo com um QR novo.
  if (state.sock) {
    try {
      state.sock.end(new Error('Sessão reiniciada'))
    } catch {
      // ignora — o socket já pode estar fechado
    }
  }
  fs.rmSync(AUTH_DIR, { recursive: true, force: true })
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  store.resetPairingData()
  return start()
}

export { start, getStatus, getSock, disconnect, reconnect, resyncLabels, resetSession }
