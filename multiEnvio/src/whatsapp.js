import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import pino from 'pino'
import makeWASocket, { useMultiFileAuthState, DisconnectReason, ALL_WA_PATCH_NAMES, fetchLatestWaWebVersion } from '@whiskeysockets/baileys'

import * as store from './db.js'
import { AUTH_DIR } from './paths.js'

// O Baileys traz embutida a versão do WhatsApp Web da época em que foi publicado. Quando ela
// fica muito para trás, o celular recusa o pareamento ("QR Code inválido"). Por isso buscamos
// a versão atual do WhatsApp Web ao conectar; sem internet ou se a busca falhar, fica com a
// versão embutida (undefined = padrão do Baileys).
let cachedWaVersion = null
async function getWaWebVersion() {
  if (cachedWaVersion) return cachedWaVersion
  try {
    const { version, isLatest } = await fetchLatestWaWebVersion({ timeout: 10000 })
    if (isLatest && Array.isArray(version)) {
      cachedWaVersion = version
      return version
    }
  } catch (err) {
    console.error('Não foi possível obter a versão atual do WhatsApp Web:', err.message)
  }
  return undefined
}

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

// ===== Identidade de contato (número x LID) =====
//
// O WhatsApp atual às vezes identifica quem manda mensagem por um ID interno ("LID", ex:
// 123456789@lid) em vez do número (5511999999999@s.whatsapp.net). O mesmo contato pode
// aparecer de um jeito numa etiqueta e de outro na resposta, então pra saber se "quem
// respondeu" é "quem recebeu", comparamos um conjunto de chaves de identidade: o próprio JID
// sem sufixo de aparelho, o JID alternativo que o Baileys manda junto, e o número resolvido a
// partir do LID pelo mapeamento que o próprio Baileys mantém.

function normalizeJid(jid) {
  if (!jid || typeof jid !== 'string' || !jid.includes('@')) return null
  const [user, server] = jid.split('@')
  return `${user.split(':')[0]}@${server}`
}

async function resolvePhoneJid(sock, jid) {
  const normalized = normalizeJid(jid)
  if (!normalized) return null
  if (normalized.endsWith('@s.whatsapp.net')) return normalized
  if (normalized.endsWith('@lid')) {
    try {
      const pn = await sock?.signalRepository?.lidMapping?.getPNForLID(normalized)
      return normalizeJid(pn)
    } catch {
      return null
    }
  }
  return null
}

async function identityKeysFor(sock, ...jids) {
  const keys = new Set()
  for (const jid of jids) {
    const normalized = normalizeJid(jid)
    if (!normalized) continue
    keys.add(normalized)
    const pn = await resolvePhoneJid(sock, normalized)
    if (pn) keys.add(pn)
  }
  return keys
}

// Usado pelas campanhas pra calcular as chaves de quem recebeu. Sem conexão, devolve só o
// JID normalizado (o LID é resolvido de novo quando a resposta chegar, do lado de quem responde).
async function contactIdentityKeys(jid) {
  return identityKeysFor(state.sock, jid)
}

function messageTimestampMs(msg) {
  const ts = msg.messageTimestamp
  if (ts == null) return Date.now()
  const seconds = typeof ts === 'object' && typeof ts.toNumber === 'function' ? ts.toNumber() : Number(ts)
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : Date.now()
}

// Mensagens de protocolo (confirmação, chave de criptografia, edição apagada etc.) não são
// algo que o contato "escreveu" — não podem contar como resposta.
function hasUserContent(msg) {
  const m = msg.message
  if (!m || msg.messageStubType) return false
  const keys = Object.keys(m).filter((k) => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage')
  if (keys.length === 0) return false
  return !keys.every((k) => k === 'protocolMessage')
}

function describeMessage(msg) {
  const text = extractTextBody(msg)
  if (text) return text
  const m = msg.message || {}
  if (m.audioMessage) return '[áudio]'
  if (m.imageMessage) return '[imagem]'
  if (m.videoMessage) return '[vídeo]'
  if (m.documentMessage || m.documentWithCaptionMessage) return '[documento]'
  if (m.stickerMessage) return '[figurinha]'
  if (m.reactionMessage) return `[reagiu ${m.reactionMessage.text || ''}]`.replace(' ]', ']')
  if (m.pollUpdateMessage) return '[votou na enquete]'
  if (m.locationMessage) return '[localização]'
  if (m.contactMessage || m.contactsArrayMessage) return '[contato]'
  return '[mensagem]'
}

const incomingListeners = new Set()

// Outros módulos (campanhas) se inscrevem aqui em vez de importar este arquivo em ciclo.
function onIncomingMessage(listener) {
  incomingListeners.add(listener)
  return () => incomingListeners.delete(listener)
}

async function handleIncoming(sock, msg, type) {
  const keys = await identityKeysFor(sock, msg.key.remoteJid, msg.key.remoteJidAlt)
  const text = extractTextBody(msg)

  if (type === 'notify' && text && OPT_OUT_KEYWORDS.has(normalizeText(text))) {
    // grava todas as formas conhecidas do contato — a checagem de opt-out na hora do envio
    // compara pelo JID que está na etiqueta/lista, que pode ser o número ou o LID
    for (const key of keys) store.addOptOut(key)
  }

  const event = {
    keys,
    timestamp: messageTimestampMs(msg),
    preview: describeMessage(msg).slice(0, 200),
    isNew: type === 'notify'
  }
  for (const listener of incomingListeners) {
    try {
      listener(event)
    } catch (err) {
      console.error('Falha em um ouvinte de mensagem recebida:', err.message)
    }
  }
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

  const version = await getWaWebVersion()

  const sock = makeWASocket({
    auth: authState,
    logger: pino({ level: 'error' }),
    ...(version ? { version } : {})
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
    // 'notify' = mensagem nova chegando agora (inclui as que chegaram com o app fechado e são
    // entregues ao reconectar); 'append' = histórico sincronizado. Opt-out só reage a
    // mensagem nova; detecção de resposta das campanhas aceita as duas, porque ela compara o
    // horário da mensagem com o do envio e não reage a nada anterior a ele.
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      const jid = msg.key.remoteJid
      if (!jid || jid.endsWith('@g.us') || jid.endsWith('@newsletter') || jid === 'status@broadcast') continue
      if (!hasUserContent(msg)) continue
      handleIncoming(sock, msg, type).catch((err) => {
        console.error('Falha ao processar mensagem recebida:', err.message)
      })
    }
  })

  sock.ev.on('labels.edit', (label) => {
    store.upsertLabel(label)
  })

  sock.ev.on('labels.association', ({ association, type }) => {
    store.applyAssociation(association, type)
  })

  // name = nome salvo na agenda; notify = nome do perfil da pessoa. Guardados separados para a
  // tela de campanhas preferir o da agenda.
  const saveContacts = (contacts) => {
    for (const c of contacts) {
      store.upsertContact(c.id, c.name, c.notify)
      // a mesma pessoa às vezes chega pelo LID; guarda também no número, se vier junto
      for (const alt of [c.phoneNumber, c.lid]) {
        if (alt && alt !== c.id) store.upsertContact(alt, c.name, c.notify)
      }
    }
  }
  sock.ev.on('contacts.upsert', saveContacts)
  sock.ev.on('contacts.update', saveContacts)

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

export { start, getStatus, getSock, disconnect, reconnect, resyncLabels, resetSession, onIncomingMessage, contactIdentityKeys, normalizeJid }
