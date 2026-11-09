// Aba "WhatsApp": o WhatsApp Web oficial embutido no app, numa <webview> do Electron.
//
// - Só existe no programa instalado (janela do Electron). Aberto num navegador comum (modo
//   desenvolvimento), o painel explica isso e oferece abrir o web.whatsapp.com numa aba.
// - A <webview> é criada na primeira vez que o painel abre e depois fica viva escondida —
//   voltar ao WhatsApp é instantâneo e a conversa aberta continua onde estava.
// - openWhatsAppChat(phone) é usado pelo funil de campanhas ("Abrir ↗"): abre a conversa do
//   contato aqui dentro, sem janela nova e sem depender do app do WhatsApp no computador.

const WHATSAPP_URL = 'https://web.whatsapp.com/'
const IS_ELECTRON = navigator.userAgent.includes('Electron')

const whatsappPanel = document.getElementById('whatsapp-panel')
const whatsappHost = document.getElementById('whatsapp-host')
const whatsappStatus = document.getElementById('whatsapp-status')
const whatsappBackCampaignBtn = document.getElementById('whatsapp-back-campaign-btn')
const whatsappBtn = document.getElementById('whatsapp-btn')

let whatsappWebview = null
let whatsappReturnCampaignId = null
let waWebState = 'idle'
// conversa pedida pelo funil enquanto o WhatsApp Web ainda não estava conectado; abre sozinha
// assim que ele conectar ({ digits, label, loadWhenOn })
let waPendingChat = null
const whatsappNotice = document.getElementById('whatsapp-notice')

// ===== Status do WhatsApp Web no cabeçalho =====
// Bolinha no botão "WhatsApp" (verde = logado, âmbar = precisa escanear o QR), número de
// não lidas (lido do título "(3) WhatsApp" que o próprio WhatsApp Web mantém) e o texto no menu
// de conexão. Se já foi conectado antes, o WhatsApp Web é carregado em segundo plano ao abrir o
// programa — assim as não lidas aparecem sem precisar abrir a aba.
const WA_LINKED_KEY = 'waWebLinked'
const waWebDot = document.getElementById('wa-web-dot')
const waWebUnread = document.getElementById('wa-web-unread')
const connWebStatus = document.getElementById('conn-web-status')
let waStatusTimer = null

function setWaWebStatus(state, unread = 0) {
  const texts = {
    unavailable: 'Disponível só no programa instalado.',
    idle: 'Não aberto ainda. Clique em WhatsApp.',
    loading: 'Carregando…',
    on: unread > 0 ? `Conectado · ${unread} conversa(s) não lida(s)` : 'Conectado',
    off: 'Não conectado: escaneie o QR Code na aba WhatsApp.'
  }
  const prev = waWebState
  waWebState = state
  connWebStatus.textContent = texts[state] || ''
  updatePendingChat(prev)
  waWebDot.classList.toggle('hidden', state !== 'on' && state !== 'off')
  waWebDot.className = `nav-dot ${state === 'on' ? 'on' : 'off'}${state !== 'on' && state !== 'off' ? ' hidden' : ''}`
  waWebDot.title = state === 'on' ? 'WhatsApp Web conectado' : 'WhatsApp Web não conectado'
  waWebUnread.textContent = unread > 99 ? '99+' : String(unread)
  waWebUnread.classList.toggle('hidden', !(state === 'on' && unread > 0))
}

async function checkWaWebStatus() {
  if (!whatsappWebview) return
  try {
    const r = await whatsappWebview.executeJavaScript(`({
      logged: !!document.querySelector('#pane-side, [data-testid="chat-list"], [aria-label="Lista de conversas"], [aria-label="Chat list"]'),
      qr: !!document.querySelector('canvas'),
      title: document.title
    })`)
    const match = /^\((\d+)\)/.exec(r.title || '')
    const unread = match ? Number(match[1]) : 0
    if (r.logged) {
      localStorage.setItem(WA_LINKED_KEY, '1')
      setWaWebStatus('on', unread)
    } else if (r.qr) {
      localStorage.removeItem(WA_LINKED_KEY)
      setWaWebStatus('off')
    } else {
      setWaWebStatus('loading')
    }
  } catch {
    // página ainda carregando — tenta de novo no próximo ciclo
  }
}

function startWaStatusWatch() {
  if (waStatusTimer) return
  waStatusTimer = setInterval(checkWaWebStatus, 4000)
}

function positionWhatsAppPanel() {
  const header = document.querySelector('header')
  whatsappPanel.style.top = `${header ? Math.round(header.getBoundingClientRect().bottom) : 0}px`
}

function showWhatsAppNotice(html, kind = 'warn') {
  whatsappNotice.innerHTML = html
  whatsappNotice.classList.toggle('ok', kind === 'ok')
  whatsappNotice.classList.remove('hidden')
}

function hideWhatsAppNotice() {
  whatsappNotice.classList.add('hidden')
  whatsappNotice.innerHTML = ''
}

// Mantém o aviso de "conecte para abrir a conversa com X" em dia e, quando o WhatsApp Web
// conecta, abre a conversa que ficou pendente.
function updatePendingChat(prevState) {
  if (!waPendingChat) return
  const who = escapeHtml(waPendingChat.label)
  if (waWebState === 'off') {
    waPendingChat.loadWhenOn = true // a tela de QR substituiu o link da conversa; recarrega depois
    const outside = `https://wa.me/${waPendingChat.digits}`
    showWhatsAppNotice(`<span class="wn-icon">📱</span><span class="wn-text"><strong>Para abrir a conversa com ${who} aqui, conecte o WhatsApp Web.</strong>
      <span>No celular: Aparelhos conectados → Conectar um aparelho → escaneie o QR abaixo.</span></span>
      <a class="wn-alt" href="${outside}" target="_blank" rel="noopener noreferrer">Prefiro abrir no navegador ↗</a>`)
  } else if (waWebState === 'on') {
    const pending = waPendingChat
    waPendingChat = null
    if (pending.loadWhenOn && whatsappWebview) whatsappWebview.loadURL(`https://web.whatsapp.com/send?phone=${pending.digits}`)
    if (prevState === 'off') {
      showWhatsAppNotice(`<span class="wn-icon">✅</span><span class="wn-text">Conectado. Abrindo a conversa com ${who}…</span>`, 'ok')
      setTimeout(hideWhatsAppNotice, 5000)
    } else {
      hideWhatsAppNotice()
    }
  }
}

function destroyWhatsAppWebview() {
  if (!whatsappWebview) return
  whatsappWebview.remove()
  whatsappWebview = null
  whatsappHost.innerHTML = ''
  clearInterval(waStatusTimer)
  waStatusTimer = null
  waPendingChat = null
  setWaWebStatus('idle')
}

function ensureWhatsAppWebview(initialUrl, contactLabel) {
  if (isLicenseLocked()) {
    setWaWebStatus('idle')
    return null
  }
  if (!IS_ELECTRON) {
    // No navegador o WhatsApp Web não pode ser embutido (o próprio WhatsApp bloqueia). Mesmo
    // assim não joga a pessoa pra fora: explica aqui dentro e só abre outra aba se ela pedir.
    const what = contactLabel ? `a conversa com <strong>${escapeHtml(contactLabel)}</strong>` : 'o WhatsApp'
    whatsappHost.innerHTML = `
      <div class="whatsapp-fallback">
        <h2>WhatsApp não conectado</h2>
        <p>Esta versão de teste não mostra o WhatsApp. Para ver ${what} aqui dentro:</p>
        <ol class="wf-steps">
          <li>Abra o programa <strong>MultiEnvio</strong></li>
          <li>Clique em <strong>WhatsApp</strong>, no topo</li>
          <li>No celular: <strong>Aparelhos conectados → Conectar um aparelho</strong> e escaneie o QR Code</li>
        </ol>
        <a class="wf-alt" href="${initialUrl || WHATSAPP_URL}" target="_blank" rel="noopener noreferrer">Prefiro abrir no navegador ↗</a>
      </div>`
    return null
  }
  if (whatsappWebview) return whatsappWebview

  const webview = document.createElement('webview')
  webview.setAttribute('partition', 'persist:whatsapp')
  webview.setAttribute('allowpopups', '')
  webview.setAttribute('src', initialUrl || WHATSAPP_URL)
  webview.className = 'whatsapp-webview'
  webview.addEventListener('did-start-loading', () => { whatsappStatus.textContent = 'Carregando o WhatsApp...' })
  webview.addEventListener('did-stop-loading', () => { whatsappStatus.textContent = '' })
  webview.addEventListener('did-fail-load', (e) => {
    if (e.errorCode === -3) return // navegação cancelada por outra — normal
    whatsappStatus.textContent = 'Não foi possível carregar o WhatsApp. Confira a internet e clique em Recarregar.'
  })
  whatsappHost.innerHTML = ''
  whatsappHost.appendChild(webview)
  whatsappWebview = webview
  setWaWebStatus('loading')
  webview.addEventListener('dom-ready', checkWaWebStatus)
  webview.addEventListener('page-title-updated', checkWaWebStatus)
  startWaStatusWatch()
  return webview
}

function openWhatsAppPanel({ url, returnCampaignId, contactLabel } = {}) {
  if (isLicenseLocked()) return
  positionWhatsAppPanel()
  whatsappReturnCampaignId = returnCampaignId || null
  whatsappBackCampaignBtn.classList.toggle('hidden', !whatsappReturnCampaignId)
  whatsappBackCampaignBtn.textContent = '← Voltar para a campanha'

  const existed = !!whatsappWebview
  const webview = ensureWhatsAppWebview(url, contactLabel)
  if (webview && existed && url) webview.loadURL(url)

  whatsappPanel.classList.add('open')
  whatsappPanel.setAttribute('aria-hidden', 'false')
  whatsappBtn.classList.add('active')
}

function closeWhatsAppPanel() {
  waPendingChat = null // saiu do WhatsApp: não abre conversa "do nada" depois
  hideWhatsAppNotice()
  whatsappPanel.classList.remove('open')
  whatsappPanel.setAttribute('aria-hidden', 'true')
  whatsappBtn.classList.remove('active')
}

// Abre a conversa de um número (só dígitos, com DDI) dentro do WhatsApp embutido. Nunca abre
// janela/aba fora do programa: se o WhatsApp Web não estiver conectado, avisa para escanear o QR
// e abre a conversa sozinho quando conectar.
function openWhatsAppChat(phone, { returnCampaignId, name } = {}) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return false
  const label = name || (typeof formatPhone === 'function' ? formatPhone(digits) : `+${digits}`)
  const url = `https://web.whatsapp.com/send?phone=${digits}`
  hideWhatsAppNotice()
  if (!IS_ELECTRON) {
    waPendingChat = null
    openWhatsAppPanel({ url, returnCampaignId, contactLabel: label })
    return true
  }
  if (waWebState === 'off') {
    // tela de QR aberta: carregar o link da conversa agora só recarregaria o QR
    waPendingChat = { digits, label, loadWhenOn: true }
    openWhatsAppPanel({ returnCampaignId })
  } else {
    waPendingChat = { digits, label, loadWhenOn: false }
    openWhatsAppPanel({ url, returnCampaignId })
  }
  updatePendingChat(waWebState)
  return true
}

// é uma aba da barra superior: clicar de novo não fecha (para sair, use outra aba ou Início)
whatsappBtn.addEventListener('click', () => {
  if (!whatsappPanel.classList.contains('open')) openWhatsAppPanel()
})
document.getElementById('whatsapp-reload-btn').addEventListener('click', () => {
  if (whatsappWebview) whatsappWebview.reload()
})
whatsappBackCampaignBtn.addEventListener('click', () => {
  const id = whatsappReturnCampaignId
  closeWhatsAppPanel()
  if (id) openCampaignBoard(id)
})
window.addEventListener('resize', () => {
  if (whatsappPanel.classList.contains('open')) positionWhatsAppPanel()
})

// estado inicial do indicador + pré-carregamento em segundo plano de quem já conectou antes
if (!IS_ELECTRON) {
  setWaWebStatus('unavailable')
} else if (localStorage.getItem(WA_LINKED_KEY) === '1') {
  setWaWebStatus('loading')
  setTimeout(() => ensureWhatsAppWebview(), 4000)
} else {
  setWaWebStatus('idle')
}
