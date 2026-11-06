const badge = document.getElementById('connection-badge')
const versionBadge = document.getElementById('version-badge')
const updateNowBtn = document.getElementById('update-now-btn')
const disconnectBtn = document.getElementById('disconnect-btn')
const reconnectBtn = document.getElementById('reconnect-btn')
const settingsBtn = document.getElementById('settings-btn')
const helpBtn = document.getElementById('help-btn')
const unlicensedScreen = document.getElementById('unlicensed-screen')
const licenseKeyInput = document.getElementById('license-key-input')
const licenseError = document.getElementById('license-error')
const licenseActivateBtn = document.getElementById('license-activate-btn')
const pairingScreen = document.getElementById('pairing-screen')
const syncingScreen = document.getElementById('syncing-screen')
const disconnectedScreen = document.getElementById('disconnected-screen')
const loggedOutScreen = document.getElementById('logged-out-screen')
const resetSessionBtn = document.getElementById('reset-session-btn')
const mainScreen = document.getElementById('main-screen')
const qrImage = document.getElementById('qr-image')

const labelsRefreshBtn = document.getElementById('labels-refresh-btn')
const labelsSearchInput = document.getElementById('labels-search')
const labelsContainer = document.getElementById('labels-container')
const sidebarTabs = document.querySelectorAll('.sidebar-tab')
const allContactsSearchInput = document.getElementById('all-contacts-search')
const allContactsBulkActions = document.getElementById('all-contacts-bulk-actions')
const allContactsFilteredCount = document.getElementById('all-contacts-filtered-count')
const selectAllContactsBtn = document.getElementById('select-all-contacts-btn')
const clearContactsSelectionBtn = document.getElementById('clear-contacts-selection-btn')

const coldContactsPanel = document.getElementById('cold-contacts-panel')
const ccStageUpload = document.getElementById('cc-stage-upload')
const ccStageMapping = document.getElementById('cc-stage-mapping')
const ccStageResults = document.getElementById('cc-stage-results')
const ccDropzone = document.getElementById('cc-dropzone')
const ccDropzoneText = document.getElementById('cc-dropzone-text')
const ccFileInput = document.getElementById('cc-file-input')
const ccUploadNotice = document.getElementById('cc-upload-notice')
const ccMappingFilename = document.getElementById('cc-mapping-filename')
const ccPhoneColumnSelect = document.getElementById('cc-phone-column-select')
const ccNameColumnSelect = document.getElementById('cc-name-column-select')
const ccValidateBtn = document.getElementById('cc-validate-btn')
const ccChangeFileBtn = document.getElementById('cc-change-file-btn')
const ccMappingNotice = document.getElementById('cc-mapping-notice')
const ccResultsSummary = document.getElementById('cc-results-summary')
const ccSelectAllBtn = document.getElementById('cc-select-all-btn')
const ccClearSelectionBtn = document.getElementById('cc-clear-selection-btn')
const ccResultsList = document.getElementById('cc-results-list')
const ccRestartBtn = document.getElementById('cc-restart-btn')
const coldContactsRiskBanner = document.getElementById('cold-contacts-risk-banner')
const dispatchPanel = document.getElementById('dispatch-panel')
const dispatchTitle = document.getElementById('dispatch-title')
const dispatchCount = document.getElementById('dispatch-count')
const dispatchBtn = document.getElementById('dispatch-btn')
const messageInput = document.getElementById('message-input')
const dropzone = document.getElementById('dropzone')
const dropzoneText = document.getElementById('dropzone-text')
const fileInput = document.getElementById('file-input')
const removeFileBtn = document.getElementById('remove-file-btn')
const recordAudioBtn = document.getElementById('record-audio-btn')

const messageTypeSelect = document.getElementById('message-type-select')
const mediaFields = document.getElementById('media-fields')
const albumFields = document.getElementById('album-fields')
const albumDropzone = document.getElementById('album-dropzone')
const albumDropzoneText = document.getElementById('album-dropzone-text')
const albumFileInput = document.getElementById('album-file-input')
const albumMessageInput = document.getElementById('album-message-input')
const pollFields = document.getElementById('poll-fields')
const locationFields = document.getElementById('location-fields')
const contactFields = document.getElementById('contact-fields')
const voiceNoteLabel = document.getElementById('voice-note-label')
const voiceNoteToggle = document.getElementById('voice-note-toggle')
const pollQuestionInput = document.getElementById('poll-question-input')
const pollOptionsInput = document.getElementById('poll-options-input')
const locationSummary = document.getElementById('location-summary')
const contactCardSummary = document.getElementById('contact-card-summary')
const configureLocationBtn = document.getElementById('configure-location-btn')
const configureContactBtn = document.getElementById('configure-contact-btn')
const applyLabelSelect = document.getElementById('apply-label-select')
const removeLabelSelect = document.getElementById('remove-label-select')
const simulateTypingToggle = document.getElementById('simulate-typing-toggle')
const skipBlockedToggle = document.getElementById('skip-blocked-toggle')
const markReadToggle = document.getElementById('mark-read-toggle')

const profileModal = document.getElementById('profile-modal')
const profileCloseBtn = document.getElementById('profile-close-btn')
const profileCancelBtn = document.getElementById('profile-cancel-btn')
const profileSaveBtn = document.getElementById('profile-save-btn')
const profileError = document.getElementById('profile-error')
const profileFields = {
  businessName: document.getElementById('profile-business-name'),
  businessPhone: document.getElementById('profile-business-phone'),
  locationName: document.getElementById('profile-location-name'),
  locationAddress: document.getElementById('profile-location-address'),
  locationLat: document.getElementById('profile-location-lat'),
  locationLng: document.getElementById('profile-location-lng')
}

const dispatchNotice = document.getElementById('dispatch-notice')
const dispatchCancelBtn = document.getElementById('dispatch-cancel-btn')

const scheduleToggle = document.getElementById('schedule-toggle')
const scheduleFields = document.getElementById('schedule-fields')
const scheduleDatetimeInput = document.getElementById('schedule-datetime-input')
const scheduleBtn = document.getElementById('schedule-btn')

const scheduledSection = document.getElementById('scheduled-section')
const scheduledRefreshBtn = document.getElementById('scheduled-refresh-btn')
const scheduledTable = document.getElementById('scheduled-table')
const scheduledBody = document.getElementById('scheduled-body')

const progressPanel = document.getElementById('progress-panel')
const progressFill = document.getElementById('progress-fill')
const progressSummary = document.getElementById('progress-summary')
const progressLog = document.getElementById('progress-log')

const failuresSection = document.getElementById('failures-section')
const failuresRefreshBtn = document.getElementById('failures-refresh-btn')
const failuresResendBtn = document.getElementById('failures-resend-btn')
const failuresSelectAll = document.getElementById('failures-select-all')
const failuresTable = document.getElementById('failures-table')
const failuresBody = document.getElementById('failures-body')

const optoutsSection = document.getElementById('optouts-section')
const optoutsRefreshBtn = document.getElementById('optouts-refresh-btn')
const optoutsTable = document.getElementById('optouts-table')
const optoutsBody = document.getElementById('optouts-body')

const pacingSummary = document.getElementById('pacing-summary')


const toastContainer = document.getElementById('toast-container')

const settingsModal = document.getElementById('settings-modal')
const settingsCloseBtn = document.getElementById('settings-close-btn')
const settingsCancelBtn = document.getElementById('settings-cancel-btn')
const settingsSaveBtn = document.getElementById('settings-save-btn')
const settingsError = document.getElementById('settings-error')
const settingFields = {
  delayMinSec: document.getElementById('setting-delay-min'),
  delayMaxSec: document.getElementById('setting-delay-max'),
  batchSize: document.getElementById('setting-batch-size'),
  batchPauseMinutes: document.getElementById('setting-batch-pause'),
  dailyLimit: document.getElementById('setting-daily-limit')
}
const settingHints = {
  delayMinSec: document.getElementById('hint-delay-min'),
  delayMaxSec: document.getElementById('hint-delay-max'),
  batchSize: document.getElementById('hint-batch-size'),
  batchPauseMinutes: document.getElementById('hint-batch-pause'),
  dailyLimit: document.getElementById('hint-daily-limit')
}
const cbEnabledInput = document.getElementById('setting-cb-enabled')
const cbConsecutiveInput = document.getElementById('setting-cb-consecutive')
const cbSampleInput = document.getElementById('setting-cb-sample')
const cbRateInput = document.getElementById('setting-cb-rate')

const tutorialModal = document.getElementById('tutorial-modal')
const tutorialSkipBtn = document.getElementById('tutorial-skip-btn')
const tutorialSkipLinkBtn = document.getElementById('tutorial-skip-link-btn')
const tutorialBackBtn = document.getElementById('tutorial-back-btn')
const tutorialNextBtn = document.getElementById('tutorial-next-btn')
const tutorialStepIndicator = document.getElementById('tutorial-step-indicator')
const tutorialSteps = Array.from(document.querySelectorAll('.tutorial-step'))

let selectedLabelIds = new Set()
let lastLabelsContactCount = 0
let selectedFile = null
let selectedFiles = []
let selectedAlbumFiles = []
const MAX_ALBUM_FILES = 5
let lastLabelsFetch = []
let awaitingConfirm = false
let recommendedRanges = null
let currentTutorialStep = 1
let adHocContacts = null
let activeContactSource = 'labels' // 'labels' | 'allContacts' | 'coldContacts'
let allContactsCache = null // null = ainda não buscado
let selectedContactJids = new Set()
let coldContactsFile = null
let coldContactsHeaders = []
let coldContactsPreviewRows = []
let coldContactsValidRows = [] // [{ jid, name, rawPhone }] — só as linhas 'valid' da última validação
let selectedColdContactJids = new Set()
let currentProfile = { businessCard: { name: '', phone: '' }, location: { lat: null, lng: null, name: '', address: '' } }

// ===== ícones, toasts e diálogo de confirmação (substituem alert()/confirm() nativos) =====

const ICON_PATHS = {
  check: '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
  alert: '<path d="M12 3 2 20h20L12 3z"/><line x1="12" y1="9" x2="12" y2="14"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/>',
  pause: '<circle cx="12" cy="12" r="9"/><line x1="10" y1="9" x2="10" y2="15"/><line x1="14" y1="9" x2="14" y2="15"/>',
  x: '<circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>',
  info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none"/>',
  tag: '<path d="M3 3h8l10 10-8 8L3 11V3z"/><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/>'
}

function iconSvg(name) {
  return `<span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ICON_PATHS.info}</svg></span>`
}

function showToast(message, type = 'info', duration = 5000) {
  const toast = document.createElement('div')
  toast.className = 'toast' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '')
  toast.innerHTML = `${iconSvg(type === 'error' ? 'x' : type === 'success' ? 'check' : 'info')}<span>${escapeHtml(message)}</span>`
  toastContainer.appendChild(toast)
  setTimeout(() => {
    toast.classList.add('leaving')
    setTimeout(() => toast.remove(), 200)
  }, duration)
}

function showConfirmDialog({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.innerHTML = `
      <div class="modal-card confirm-card">
        <div class="confirm-icon ${danger ? 'danger' : 'info'}">${iconSvg(danger ? 'alert' : 'info')}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="confirm-actions">
          <button class="confirm-btn-secondary" type="button">${escapeHtml(cancelText)}</button>
          <button class="confirm-btn-primary ${danger ? 'danger' : ''}" type="button">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    const finish = (result) => {
      overlay.remove()
      resolve(result)
    }

    overlay.querySelector('.confirm-btn-secondary').addEventListener('click', () => finish(false))
    overlay.querySelector('.confirm-btn-primary').addEventListener('click', () => finish(true))
    overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(false) })
  })
}

function showNotice(type, text) {
  dispatchNotice.textContent = text
  dispatchNotice.className = 'notice ' + type
  dispatchNotice.classList.remove('hidden')
}

function clearNotice() {
  dispatchNotice.classList.add('hidden')
  dispatchNotice.textContent = ''
}

function resetConfirmState() {
  awaitingConfirm = false
  dispatchCancelBtn.classList.add('hidden')
  dispatchBtn.textContent = 'Disparar'
  clearNotice()
}

function setScreen(name) {
  unlicensedScreen.classList.toggle('hidden', name !== 'unlicensed')
  pairingScreen.classList.toggle('hidden', name !== 'pairing')
  syncingScreen.classList.toggle('hidden', name !== 'syncing')
  disconnectedScreen.classList.toggle('hidden', name !== 'disconnected')
  loggedOutScreen.classList.toggle('hidden', name !== 'logged_out')
  mainScreen.classList.toggle('hidden', name !== 'main')
}

function updateConnectionButtons(status) {
  const canDisconnect = status === 'connected' || status === 'qr' || status === 'connecting'
  disconnectBtn.classList.toggle('hidden', !canDisconnect)
  reconnectBtn.classList.toggle('hidden', status !== 'disconnected')
}

async function pollStatus() {
  try {
    const res = await fetch('/api/status')
    const data = await res.json()
    updateConnectionButtons(data.status)

    if (data.status === 'unlicensed') {
      setConnectionChip('error', 'Não ativado', 'Programa ainda não ativado.')
      setScreen('unlicensed')
    } else if (data.status === 'connected') {
      setConnectionChip('ok', 'Conectado', 'Conectado e pronto para enviar.')
      if (lastLabelsFetch.length === 0) {
        setScreen('syncing')
        await refreshLabels()
        if (lastLabelsFetch.length > 0) setScreen('main')
      } else {
        setScreen('main')
      }
    } else if (data.status === 'qr' && data.qrDataUrl) {
      setConnectionChip('warn', 'Aguardando QR Code', 'Escaneie o QR Code na tela para conectar.')
      qrImage.src = data.qrDataUrl
      if (qrBeforeRefresh !== null && data.qrDataUrl !== qrBeforeRefresh) finishQrRefresh()
      setScreen('pairing')
    } else if (data.status === 'disconnected') {
      setConnectionChip('off', 'Desconectado', 'Desconectado. Use Reconectar para voltar.')
      setScreen('disconnected')
    } else if (data.status === 'logged_out') {
      setConnectionChip('error', 'Sessão expirada', 'O WhatsApp encerrou a sessão. Gere um novo QR Code.')
      setScreen('logged_out')
    } else {
      setConnectionChip('warn', data.status === 'closed' ? 'Reconectando…' : 'Conectando…', 'Estabelecendo a conexão com o WhatsApp…')
    }
  } catch (err) {
    setConnectionChip('error', 'Sem resposta', 'O programa não está respondendo. Feche e abra de novo.')
  }
}

// Farol de versão no cabeçalho: verde = em dia, amarelo = tem atualização (baixando ou já
// pronta pra instalar). O botão "Atualizar" só aparece quando a atualização já terminou de
// baixar — antes disso, mostra "baixando..." desabilitado, já que instalar sem terminar o
// download não funciona (electron-updater exige o arquivo completo em disco).
// Status da conexão no cabeçalho: discreto quando está tudo bem (bolinha verde estática), e só
// chama atenção quando precisa de ação (âmbar = conectando/QR, vermelho = problema). O detalhe
// fica no menu que abre ao clicar no indicador.
function setConnectionChip(kind, text, detail) {
  badge.textContent = text
  badge.className = `status-chip ${kind}`
  badge.title = detail
  const dispatchStatus = document.getElementById('conn-dispatch-status')
  if (dispatchStatus) dispatchStatus.textContent = detail
}

// Versão: discreta, só no menu ("Sobre"). Só vira aviso no cabeçalho quando há uma atualização
// já baixada e pronta pra instalar — aí é uma ação útil, não decoração.
async function pollAppVersion() {
  try {
    const res = await fetch('/api/app-version')
    const data = await res.json()
    versionBadge.textContent = `v${data.currentVersion}`
    const versionDetail = document.getElementById('version-detail')
    const menuDot = document.getElementById('menu-update-dot')
    menuDot.classList.add('hidden') // o aviso de versão nova agora é o sininho
    renderUpdateBell(data)
    // enquanto baixa, atualiza a barra de progresso mais rápido que o ciclo normal de 30 s
    clearTimeout(updateFastPoll)
    if (data.updateAvailable && !data.downloaded) updateFastPoll = setTimeout(pollAppVersion, 3000)
    if (data.updateAvailable) {
      versionDetail.textContent = data.downloaded
        ? `Nova versão v${data.latestVersion} pronta: clique no sininho 🔔 para atualizar.`
        : `Baixando a nova versão v${data.latestVersion}…`
    } else {
      versionDetail.textContent = 'Você está na versão mais recente.'
    }
  } catch {
    // servidor ainda subindo ou fora do ar — mantém o que já estava mostrado, sem quebrar a UI
  }
}

// Sininho de atualização: aparece só quando há versão nova. Baixa sozinha em segundo plano;
// quando termina, "Atualizar agora" fecha o programa, instala e abre de novo já atualizado.
let updateInstalling = false
let updateFastPoll = null
function renderUpdateBell(data) {
  const wrap = document.getElementById('update-wrap')
  wrap.classList.toggle('hidden', !data.updateAvailable)
  if (!data.updateAvailable) return
  const ready = !!data.downloaded
  document.getElementById('update-bell').title = ready
    ? `Versão v${data.latestVersion} pronta para instalar`
    : `Baixando a versão v${data.latestVersion}…`
  wrap.classList.toggle('ready', ready)
  document.getElementById('update-title').textContent = `Versão ${data.latestVersion} disponível`

  const notes = String(data.releaseNotes || '').split('\n').filter(Boolean)
  const list = document.getElementById('update-notes')
  list.innerHTML = notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')
  list.classList.toggle('hidden', notes.length === 0)

  const bar = document.getElementById('update-progress')
  bar.classList.toggle('hidden', ready)
  bar.querySelector('i').style.width = `${Math.max(4, Number(data.progress) || 0)}%`

  if (updateInstalling) return
  document.getElementById('update-hint').textContent = ready
    ? 'O programa fecha, atualiza e abre de novo sozinho. Leva alguns segundos.'
    : `Baixando em segundo plano… ${Number(data.progress) || 0}%. Pode continuar usando.`
  updateNowBtn.disabled = !ready
  updateNowBtn.textContent = 'Atualizar agora'
}

// Resumo de uma linha das "Opções de envio" recolhidas — mostra o que está ativo sem abrir.
function updateSendOptionsSummary() {
  const el = document.getElementById('send-options-summary')
  if (!el) return
  const parts = []
  if (document.getElementById('simulate-typing-toggle').checked) parts.push('digitando…')
  if (document.getElementById('skip-blocked-toggle').checked) parts.push('pula bloqueados')
  if (document.getElementById('mark-read-toggle').checked) parts.push('marca como lida')
  const apply = document.getElementById('apply-label-select')
  const remove = document.getElementById('remove-label-select')
  if (apply.value) parts.push(`+ etiqueta ${apply.selectedOptions[0].textContent}`)
  if (remove.value) parts.push(`− etiqueta ${remove.selectedOptions[0].textContent}`)
  el.textContent = parts.join(' · ')
}
for (const id of ['simulate-typing-toggle', 'skip-blocked-toggle', 'mark-read-toggle', 'apply-label-select', 'remove-label-select']) {
  document.getElementById(id).addEventListener('change', updateSendOptionsSummary)
}
updateSendOptionsSummary()

// Menus suspensos do cabeçalho (status da conexão e menu ⋯): abrem no clique, fecham ao
// clicar fora, ao escolher um item ou com Esc.
const headerMenus = [
  [document.getElementById('connection-badge'), document.getElementById('connection-menu')],
  [document.getElementById('main-menu-btn'), document.getElementById('main-menu')],
  [document.getElementById('update-bell'), document.getElementById('update-menu')]
]

function closeHeaderMenus(except) {
  for (const [btn, menu] of headerMenus) {
    if (menu === except) continue
    menu.classList.add('hidden')
    btn.setAttribute('aria-expanded', 'false')
  }
}

for (const [btn, menu] of headerMenus) {
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    const opening = menu.classList.contains('hidden')
    closeHeaderMenus(menu)
    menu.classList.toggle('hidden', !opening)
    btn.setAttribute('aria-expanded', String(opening))
  })
  menu.addEventListener('click', (e) => {
    e.stopPropagation()
    if (e.target.closest('.dropdown-item, .dropdown-actions button')) closeHeaderMenus()
  })
}
document.addEventListener('click', () => closeHeaderMenus())
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeHeaderMenus() })

updateNowBtn.addEventListener('click', async (e) => {
  e.stopPropagation() // mantém o menu aberto mostrando "Atualizando…"
  const hint = document.getElementById('update-hint')
  updateInstalling = true
  updateNowBtn.disabled = true
  updateNowBtn.textContent = 'Atualizando…'
  hint.textContent = 'Fechando o programa para atualizar. Ele abre de novo sozinho.'
  try {
    const res = await fetch('/api/app-version/install', { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      updateInstalling = false
      hint.textContent = data.error || 'Não foi possível atualizar agora.'
      updateNowBtn.disabled = false
      updateNowBtn.textContent = 'Tentar de novo'
    }
    // se deu certo o app fecha e reabre sozinho na nova versão — não precisa fazer mais nada aqui
  } catch {
    // a conexão cai quando o programa fecha para instalar: é o esperado
  }
})

licenseActivateBtn.addEventListener('click', async () => {
  const key = licenseKeyInput.value.trim()
  licenseError.classList.add('hidden')
  if (!key) {
    licenseError.textContent = 'Cole a chave de licença antes de ativar.'
    licenseError.classList.remove('hidden')
    return
  }
  licenseActivateBtn.disabled = true
  licenseActivateBtn.textContent = 'Ativando...'
  try {
    const res = await fetch('/api/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    })
    const data = await res.json()
    if (!res.ok) {
      licenseError.textContent = data.error || 'Chave inválida.'
      licenseError.classList.remove('hidden')
    } else {
      showToast('Programa ativado com sucesso!', 'success')
      pollStatus()
    }
  } catch (err) {
    licenseError.textContent = 'Erro ao ativar: ' + err.message
    licenseError.classList.remove('hidden')
  }
  licenseActivateBtn.disabled = false
  licenseActivateBtn.textContent = 'Ativar'
})

licenseKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') licenseActivateBtn.click()
})

disconnectBtn.addEventListener('click', async () => {
  const ok = await showConfirmDialog({
    title: 'Desconectar o WhatsApp?',
    message: 'A sessão fica salva e dá para reconectar depois sem escanear o QR de novo.',
    confirmText: 'Desconectar'
  })
  if (!ok) return
  disconnectBtn.disabled = true
  try {
    const res = await fetch('/api/connection/disconnect', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) showToast(data.error || 'Erro ao desconectar.', 'error')
  } catch (err) {
    showToast('Erro ao desconectar: ' + err.message, 'error')
  }
  disconnectBtn.disabled = false
  pollStatus()
})

reconnectBtn.addEventListener('click', async () => {
  reconnectBtn.disabled = true
  try {
    const res = await fetch('/api/connection/reconnect', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) showToast(data.error || 'Erro ao reconectar.', 'error')
  } catch (err) {
    showToast('Erro ao reconectar: ' + err.message, 'error')
  }
  reconnectBtn.disabled = false
  pollStatus()
})

// Botão na própria tela do QR Code: descarta a tentativa de pareamento atual (que nunca chegou
// a conectar, então não há sessão válida a perder) e pede um código novo do zero. Fica
// desabilitado até o QR novo chegar, pra não disparar vários reinícios seguidos.
const refreshQrBtn = document.getElementById('refresh-qr-btn')
let qrBeforeRefresh = null
let refreshQrTimeout = null

function finishQrRefresh() {
  clearTimeout(refreshQrTimeout)
  refreshQrTimeout = null
  qrBeforeRefresh = null
  refreshQrBtn.disabled = false
  refreshQrBtn.textContent = '↻ Gerar novo QR Code'
  qrImage.style.opacity = ''
}

refreshQrBtn.addEventListener('click', async () => {
  refreshQrBtn.disabled = true
  refreshQrBtn.textContent = 'Gerando novo QR Code...'
  qrImage.style.opacity = '0.25'
  qrBeforeRefresh = qrImage.src
  refreshQrTimeout = setTimeout(finishQrRefresh, 20000)
  try {
    const res = await fetch('/api/connection/reset', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      showToast(data.error || 'Erro ao gerar novo QR Code.', 'error')
      finishQrRefresh()
      return
    }
  } catch (err) {
    showToast('Erro ao gerar novo QR Code: ' + err.message, 'error')
    finishQrRefresh()
    return
  }
  pollStatus()
})

resetSessionBtn.addEventListener('click', async () => {
  resetSessionBtn.disabled = true
  resetSessionBtn.textContent = 'Gerando novo QR Code...'
  try {
    const res = await fetch('/api/connection/reset', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) showToast(data.error || 'Erro ao gerar novo QR Code.', 'error')
  } catch (err) {
    showToast('Erro ao gerar novo QR Code: ' + err.message, 'error')
  }
  resetSessionBtn.disabled = false
  resetSessionBtn.textContent = 'Gerar novo QR Code'
  lastLabelsFetch = []
  pollStatus()
})

labelsRefreshBtn.addEventListener('click', async () => {
  labelsRefreshBtn.disabled = true
  labelsRefreshBtn.textContent = 'Atualizando...'
  try {
    await fetch('/api/labels/resync', { method: 'POST' })
  } catch (err) {
    // resync é best-effort — mesmo se falhar, ainda tentamos recarregar a lista local abaixo
  }
  await refreshLabels()
  // etiquetas recém-sincronizadas chegam de forma assíncrona pelo WhatsApp, então buscamos de novo
  // depois de alguns segundos para pegar o que ainda não tinha chegado na primeira tentativa
  setTimeout(refreshLabels, 4000)
  labelsRefreshBtn.disabled = false
  labelsRefreshBtn.textContent = 'Atualizar'
})

async function refreshLabels() {
  const res = await fetch('/api/labels')
  const labels = await res.json()
  lastLabelsFetch = labels
  // etiquetas apagadas ou renomeadas não devem ficar "presas" numa seleção antiga
  for (const id of Array.from(selectedLabelIds)) {
    if (!labels.some((l) => l.id === id)) selectedLabelIds.delete(id)
  }
  renderLabelSelects(labels)
  if (activeContactSource === 'labels') {
    renderLabels(labels)
    if (selectedLabelIds.size > 0) updateDispatchPanelForLabels()
  }
  if (labels.length > 0) setScreen('main')
  refreshStats()
}

// Popula os selects de "aplicar/remover etiqueta após o envio", preservando a seleção atual
// se a etiqueta escolhida ainda existir na lista nova.
function renderLabelSelects(labels) {
  for (const select of [applyLabelSelect, removeLabelSelect]) {
    const current = select.value
    select.innerHTML = '<option value="">Nenhuma</option>'
    for (const label of labels) {
      const option = document.createElement('option')
      option.value = label.id
      option.textContent = label.name
      select.appendChild(option)
    }
    if (labels.some((l) => l.id === current)) select.value = current
  }
}

function renderLabels(labels) {
  const hasAnyLabels = labels.length > 0
  labelsSearchInput.classList.toggle('hidden', !hasAnyLabels)

  labelsContainer.innerHTML = ''
  if (!hasAnyLabels) {
    labelsContainer.innerHTML = `<p class="empty-state">${iconSvg('tag')}Nenhuma etiqueta encontrada ainda.<br>Crie etiquetas no WhatsApp Business do celular e clique em "Atualizar".</p>`
    return
  }

  const query = labelsSearchInput.value.trim().toLowerCase()
  const filtered = query ? labels.filter((l) => l.name.toLowerCase().includes(query)) : labels

  if (filtered.length === 0) {
    labelsContainer.innerHTML = `<p class="empty-state">${iconSvg('tag')}Nenhuma etiqueta encontrada para "${escapeHtml(labelsSearchInput.value.trim())}".</p>`
    return
  }

  for (const label of filtered) {
    const card = document.createElement('div')
    card.className = 'label-card' + (selectedLabelIds.has(label.id) ? ' active' : '')
    card.innerHTML = `<div class="select-check"></div><div class="name">${escapeHtml(label.name)}</div><div class="count">${label.contactCount} contato(s)</div>`
    card.addEventListener('click', () => toggleLabel(label))
    labelsContainer.appendChild(card)
  }
}

labelsSearchInput.addEventListener('input', () => renderLabels(lastLabelsFetch))

// ===== aba "Todos os contatos" =====
//
// Reaproveita o MESMO mecanismo já usado pelo reenvio de falhas selecionadas: preenche
// adHocContacts (em vez de labelIds) e deixa o handler de disparo/FormData já existentes
// cuidarem do resto — não precisa duplicar validação nem envio.

function switchSidebarTab(tab) {
  if (tab === activeContactSource) return
  activeContactSource = tab
  for (const btn of sidebarTabs) btn.classList.toggle('active', btn.dataset.tab === tab)
  allContactsSearchInput.classList.toggle('hidden', tab !== 'allContacts')
  allContactsBulkActions.classList.toggle('hidden', tab !== 'allContacts')
  labelsContainer.classList.toggle('hidden', tab === 'coldContacts')
  coldContactsPanel.classList.toggle('hidden', tab !== 'coldContacts')
  coldContactsRiskBanner.classList.toggle('hidden', tab !== 'coldContacts')

  selectedLabelIds.clear()
  selectedContactJids.clear()
  selectedColdContactJids.clear()
  adHocContacts = null
  allContactsSearchInput.value = ''

  if (tab === 'allContacts') {
    renderAllContactsList()
    fetchAllContactsIfNeeded()
  } else if (tab === 'coldContacts') {
    syncColdContactsCheckboxes()
  } else {
    labelsSearchInput.value = ''
    renderLabels(lastLabelsFetch)
  }
  dispatchPanel.classList.add('hidden')
  resetConfirmState()
}

for (const btn of sidebarTabs) {
  btn.addEventListener('click', () => switchSidebarTab(btn.dataset.tab))
}

async function fetchAllContactsIfNeeded() {
  if (allContactsCache !== null) return
  try {
    const res = await fetch('/api/contacts')
    allContactsCache = await res.json()
  } catch (err) {
    allContactsCache = []
  }
  if (activeContactSource === 'allContacts') renderAllContactsList()
}

function filteredAllContacts() {
  const list = allContactsCache || []
  const query = allContactsSearchInput.value.trim().toLowerCase()
  if (!query) return list
  return list.filter((c) => (c.name || '').toLowerCase().includes(query) || c.jid.toLowerCase().includes(query))
}

function renderAllContactsList() {
  const filtered = filteredAllContacts()
  allContactsFilteredCount.textContent = filtered.length

  if (allContactsCache === null) {
    labelsContainer.innerHTML = `<p class="empty-state">Carregando contatos...</p>`
    return
  }
  if (filtered.length === 0) {
    labelsContainer.innerHTML = `<p class="empty-state">Nenhum contato encontrado.</p>`
    return
  }

  labelsContainer.innerHTML = ''
  for (const contact of filtered) {
    const checked = selectedContactJids.has(contact.jid)
    const card = document.createElement('div')
    card.className = 'label-card' + (checked ? ' active' : '')
    card.innerHTML = `<div class="select-check"></div><div class="name">${escapeHtml(contact.name || contact.jid)}</div>`
    card.addEventListener('click', () => toggleContact(contact))
    labelsContainer.appendChild(card)
  }
}

function toggleContact(contact) {
  if (selectedContactJids.has(contact.jid)) selectedContactJids.delete(contact.jid)
  else selectedContactJids.add(contact.jid)
  renderAllContactsList()
  updateDispatchPanelForContacts()
}

function updateDispatchPanelForContacts() {
  if (selectedContactJids.size === 0) {
    adHocContacts = null
    dispatchPanel.classList.add('hidden')
    return
  }
  const jids = Array.from(selectedContactJids)
  adHocContacts = jids.map((jid) => {
    const c = (allContactsCache || []).find((x) => x.jid === jid)
    return { jid, name: c?.name || null }
  })
  dispatchPanel.classList.remove('hidden')
  dispatchTitle.textContent = adHocContacts.length === 1
    ? `Disparar: ${adHocContacts[0].name || adHocContacts[0].jid}`
    : `Disparar: ${adHocContacts.length} contatos selecionados`
  dispatchCount.textContent = `${adHocContacts.length} contato(s) receberão esta mensagem.`
  progressPanel.classList.add('hidden')
  dispatchBtn.disabled = false
  scheduleBtn.disabled = false
  resetConfirmState()
}

allContactsSearchInput.addEventListener('input', renderAllContactsList)

selectAllContactsBtn.addEventListener('click', () => {
  for (const contact of filteredAllContacts()) selectedContactJids.add(contact.jid)
  renderAllContactsList()
  updateDispatchPanelForContacts()
})

clearContactsSelectionBtn.addEventListener('click', () => {
  selectedContactJids.clear()
  renderAllContactsList()
  updateDispatchPanelForContacts()
})

// ===== aba "Clientes frios" =====
//
// Assistente de 3 etapas (upload -> mapear coluna -> validar) que termina alimentando o MESMO
// adHocContacts já usado por "Todos os contatos" e por reenvio de falhas. Nenhuma etapa aqui
// envia mensagem — só /api/cold-contacts/validate, que confere os números no WhatsApp de
// verdade antes de qualquer um virar selecionável.

function ccSetStage(stage) {
  ccStageUpload.classList.toggle('hidden', stage !== 'upload')
  ccStageMapping.classList.toggle('hidden', stage !== 'mapping')
  ccStageResults.classList.toggle('hidden', stage !== 'results')
}

function resetColdContactsWizard() {
  coldContactsFile = null
  coldContactsHeaders = []
  coldContactsPreviewRows = []
  coldContactsValidRows = []
  selectedColdContactJids.clear()
  ccFileInput.value = ''
  ccDropzone.classList.remove('has-file')
  ccDropzoneText.textContent = 'Arraste uma planilha (.xlsx ou .csv) aqui, ou clique para selecionar'
  ccUploadNotice.classList.add('hidden')
  ccMappingNotice.classList.add('hidden')
  ccSetStage('upload')
  updateDispatchPanelForColdContacts()
}

ccDropzone.addEventListener('click', () => ccFileInput.click())
ccDropzone.addEventListener('dragover', (e) => {
  e.preventDefault()
  ccDropzone.classList.add('dragover')
})
ccDropzone.addEventListener('dragleave', () => ccDropzone.classList.remove('dragover'))
ccDropzone.addEventListener('drop', (e) => {
  e.preventDefault()
  ccDropzone.classList.remove('dragover')
  if (e.dataTransfer.files.length > 0) handleColdContactsFile(e.dataTransfer.files[0])
})
ccFileInput.addEventListener('change', () => {
  if (ccFileInput.files.length > 0) handleColdContactsFile(ccFileInput.files[0])
})

async function handleColdContactsFile(file) {
  coldContactsFile = file
  ccDropzone.classList.add('has-file')
  ccDropzoneText.textContent = `Arquivo selecionado: ${file.name} (clique para trocar)`
  ccUploadNotice.classList.add('hidden')

  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await fetch('/api/cold-contacts/preview', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      ccUploadNotice.textContent = data.error || 'Erro ao ler a planilha.'
      ccUploadNotice.classList.remove('hidden')
      return
    }
    coldContactsHeaders = data.headers
    coldContactsPreviewRows = data.previewRows
    populateColdContactsColumnSelects()
    ccMappingFilename.textContent = `${file.name} — ${data.totalRows} linha(s) de dado(s)`
    ccSetStage('mapping')
  } catch (err) {
    ccUploadNotice.textContent = 'Erro ao enviar a planilha: ' + err.message
    ccUploadNotice.classList.remove('hidden')
  }
}

function populateColdContactsColumnSelects() {
  const sample = coldContactsPreviewRows[0] || []
  ccPhoneColumnSelect.innerHTML = ''
  ccNameColumnSelect.innerHTML = '<option value="">Nenhuma</option>'
  coldContactsHeaders.forEach((header, idx) => {
    const label = `${header || 'Coluna ' + (idx + 1)}${sample[idx] ? ' — ex: ' + sample[idx] : ''}`

    const phoneOption = document.createElement('option')
    phoneOption.value = String(idx)
    phoneOption.textContent = label
    ccPhoneColumnSelect.appendChild(phoneOption)

    const nameOption = document.createElement('option')
    nameOption.value = String(idx)
    nameOption.textContent = label
    ccNameColumnSelect.appendChild(nameOption)
  })
  // Só um atalho de conveniência (tenta achar uma coluna com nome que sugira telefone) — o
  // usuário ainda vê e confirma qual coluna foi escolhida antes de validar.
  const guessIdx = coldContactsHeaders.findIndex((h) => /telefone|celular|phone|whatsapp|numero|número/i.test(h || ''))
  if (guessIdx !== -1) ccPhoneColumnSelect.value = String(guessIdx)
}

ccChangeFileBtn.addEventListener('click', resetColdContactsWizard)
ccRestartBtn.addEventListener('click', resetColdContactsWizard)

ccValidateBtn.addEventListener('click', async () => {
  if (!coldContactsFile) return
  ccMappingNotice.classList.add('hidden')
  ccValidateBtn.disabled = true
  ccValidateBtn.textContent = 'Validando...'

  const formData = new FormData()
  formData.append('file', coldContactsFile)
  formData.append('phoneColumn', ccPhoneColumnSelect.value)
  if (ccNameColumnSelect.value !== '') formData.append('nameColumn', ccNameColumnSelect.value)

  try {
    const res = await fetch('/api/cold-contacts/validate', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      ccMappingNotice.textContent = data.error || 'Erro ao validar contatos.'
      ccMappingNotice.classList.remove('hidden')
      return
    }
    coldContactsValidRows = data.results.filter((r) => r.status === 'valid')
    selectedColdContactJids = new Set(coldContactsValidRows.map((r) => r.jid))
    renderColdContactsResults(data.summary)
    ccSetStage('results')
    updateDispatchPanelForColdContacts()
  } catch (err) {
    ccMappingNotice.textContent = 'Erro ao validar contatos: ' + err.message
    ccMappingNotice.classList.remove('hidden')
  } finally {
    ccValidateBtn.disabled = false
    ccValidateBtn.textContent = 'Validar contatos'
  }
})

function renderColdContactsResults(summary) {
  const parts = [`${summary.valid} válido(s) no WhatsApp`, `${summary.invalid} não encontrado(s)`]
  if (summary.optedOut > 0) parts.push(`${summary.optedOut} já pediram pra não receber mais`)
  parts.push(`${summary.unparseable} sem telefone legível`)
  ccResultsSummary.textContent = `${parts.join(', ')} — de ${summary.total} linha(s) no total.`

  if (coldContactsValidRows.length === 0) {
    ccResultsList.innerHTML = '<p class="empty-state">Nenhum número válido encontrado nessa planilha.</p>'
    return
  }

  ccResultsList.innerHTML = ''
  for (const row of coldContactsValidRows) {
    const checked = selectedColdContactJids.has(row.jid)
    const card = document.createElement('div')
    card.className = 'label-card' + (checked ? ' active' : '')
    card.innerHTML = `<div class="select-check"></div><div class="name">${escapeHtml(row.name || row.rawPhone)}</div><div class="count">${escapeHtml(row.rawPhone)}</div>`
    card.addEventListener('click', () => toggleColdContact(row))
    ccResultsList.appendChild(card)
  }
}

function syncColdContactsCheckboxes() {
  const cards = ccResultsList.querySelectorAll('.label-card')
  cards.forEach((card, idx) => {
    const row = coldContactsValidRows[idx]
    if (!row) return
    card.classList.toggle('active', selectedColdContactJids.has(row.jid))
  })
}

function toggleColdContact(row) {
  if (selectedColdContactJids.has(row.jid)) selectedColdContactJids.delete(row.jid)
  else selectedColdContactJids.add(row.jid)
  syncColdContactsCheckboxes()
  updateDispatchPanelForColdContacts()
}

ccSelectAllBtn.addEventListener('click', () => {
  selectedColdContactJids = new Set(coldContactsValidRows.map((r) => r.jid))
  syncColdContactsCheckboxes()
  updateDispatchPanelForColdContacts()
})

ccClearSelectionBtn.addEventListener('click', () => {
  selectedColdContactJids.clear()
  syncColdContactsCheckboxes()
  updateDispatchPanelForColdContacts()
})

function updateDispatchPanelForColdContacts() {
  if (activeContactSource !== 'coldContacts' || selectedColdContactJids.size === 0) {
    adHocContacts = null
    if (activeContactSource === 'coldContacts') dispatchPanel.classList.add('hidden')
    return
  }
  adHocContacts = coldContactsValidRows
    .filter((r) => selectedColdContactJids.has(r.jid))
    .map((r) => ({ jid: r.jid, name: r.name || null }))
  dispatchPanel.classList.remove('hidden')
  dispatchTitle.textContent = `Disparar: ${adHocContacts.length} contato(s) da planilha`
  dispatchCount.textContent = `${adHocContacts.length} contato(s) receberão esta mensagem.`
  progressPanel.classList.add('hidden')
  dispatchBtn.disabled = false
  scheduleBtn.disabled = false
  resetConfirmState()
}

// Marca/desmarca uma etiqueta — várias podem ficar selecionadas ao mesmo tempo, com dedupe
// de contatos repetidos feito no backend (store.listContactsForLabels).
function toggleLabel(label) {
  if (selectedLabelIds.has(label.id)) selectedLabelIds.delete(label.id)
  else selectedLabelIds.add(label.id)
  adHocContacts = null
  renderLabels(lastLabelsFetch)
  updateDispatchPanelForLabels()
}

async function updateDispatchPanelForLabels() {
  if (selectedLabelIds.size === 0) {
    dispatchPanel.classList.add('hidden')
    return
  }
  dispatchPanel.classList.remove('hidden')
  const selected = lastLabelsFetch.filter((l) => selectedLabelIds.has(l.id))
  dispatchTitle.textContent = `Disparar: ${selected.map((l) => l.name).join(', ')}`
  progressPanel.classList.add('hidden')
  resetConfirmState()

  const ids = Array.from(selectedLabelIds).join(',')
  try {
    const res = await fetch(`/api/labels/contacts-count?ids=${encodeURIComponent(ids)}`)
    const data = await res.json()
    lastLabelsContactCount = data.count
    dispatchCount.textContent = `${data.count} contato(s) receberão esta mensagem.`
    dispatchBtn.disabled = data.count === 0
    scheduleBtn.disabled = data.count === 0
  } catch (err) {
    lastLabelsContactCount = 0
    dispatchCount.textContent = ''
    dispatchBtn.disabled = true
    scheduleBtn.disabled = true
  }
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function phoneFromJid(jid) {
  if (!jid) return ''
  const [user, server] = jid.split('@')
  if (server === 'g.us') return '(grupo)'
  return user.split(':')[0]
}

async function refreshFailures() {
  try {
    const res = await fetch('/api/logs/failed')
    const failures = await res.json()
    renderFailures(failures)
  } catch (err) {
    // painel de falhas é informativo — não bloqueia o resto da tela se der erro
  }
}

function renderFailures(failures) {
  updateResendButtonState()
  failuresSection.classList.toggle('hidden', failures.length === 0)
  if (failures.length === 0) {
    failuresTable.classList.add('hidden')
    return
  }
  failuresTable.classList.remove('hidden')
  failuresSelectAll.checked = false
  failuresBody.innerHTML = ''
  for (const f of failures) {
    const tr = document.createElement('tr')
    const date = new Date(f.createdAt).toLocaleString('pt-BR')
    const phone = f.phone || phoneFromJid(f.jid)
    tr.innerHTML = `
      <td><input type="checkbox" class="failure-select" data-jid="${escapeHtml(f.jid)}" data-name="${escapeHtml(f.name || '')}" /></td>
      <td>${escapeHtml(date)}</td>
      <td>${escapeHtml(f.labelName || '-')}</td>
      <td>${escapeHtml(f.name || '-')}</td>
      <td>${escapeHtml(phone)}</td>
      <td class="error-cell" title="${escapeHtml(f.error || '')}">${escapeHtml(f.error || '-')}</td>
      <td><button class="copy-btn" type="button">Copiar número</button></td>
    `
    tr.querySelector('.copy-btn').addEventListener('click', (e) => {
      navigator.clipboard.writeText(phone)
      e.target.textContent = 'Copiado!'
      setTimeout(() => { e.target.textContent = 'Copiar número' }, 1500)
    })
    tr.querySelector('.failure-select').addEventListener('change', updateResendButtonState)
    failuresBody.appendChild(tr)
  }
}

function updateResendButtonState() {
  const checked = document.querySelectorAll('.failure-select:checked').length
  failuresResendBtn.disabled = checked === 0
  failuresResendBtn.textContent = checked > 0 ? `Reenviar selecionados (${checked})` : 'Reenviar selecionados'
}

failuresSelectAll.addEventListener('change', () => {
  document.querySelectorAll('.failure-select').forEach((cb) => { cb.checked = failuresSelectAll.checked })
  updateResendButtonState()
})

failuresResendBtn.addEventListener('click', () => {
  const checked = Array.from(document.querySelectorAll('.failure-select:checked'))
  if (checked.length === 0) return
  // troca pra aba "Etiquetas" primeiro (limpa qualquer seleção anterior, inclusive
  // adHocContacts) — só depois preenche adHocContacts com quem foi marcado aqui, senão a
  // troca de aba apagaria a seleção que acabamos de montar.
  if (activeContactSource !== 'labels') switchSidebarTab('labels')
  adHocContacts = checked.map((cb) => ({ jid: cb.dataset.jid, name: cb.dataset.name || null }))
  selectedLabelIds.clear()
  renderLabels(lastLabelsFetch)
  dispatchPanel.classList.remove('hidden')
  dispatchTitle.textContent = 'Reenviar para contatos selecionados'
  dispatchCount.textContent = `${adHocContacts.length} contato(s) selecionado(s) receberão esta mensagem.`
  progressPanel.classList.add('hidden')
  dispatchBtn.disabled = false
  scheduleBtn.disabled = false
  resetConfirmState()
  messageInput.focus()
  dispatchPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

failuresRefreshBtn.addEventListener('click', refreshFailures)

// contatos que pediram para não receber mais (opt-out)

async function refreshOptOuts() {
  try {
    const res = await fetch('/api/optouts')
    const optOuts = await res.json()
    renderOptOuts(optOuts)
  } catch (err) {
    // painel informativo — não bloqueia o resto da tela se der erro
  }
}

function renderOptOuts(optOuts) {
  optoutsSection.classList.toggle('hidden', optOuts.length === 0)
  if (optOuts.length === 0) {
    optoutsTable.classList.add('hidden')
    return
  }
  optoutsTable.classList.remove('hidden')
  optoutsBody.innerHTML = ''
  for (const o of optOuts) {
    const tr = document.createElement('tr')
    const date = new Date(o.at).toLocaleString('pt-BR')
    const phone = o.phone || phoneFromJid(o.jid)
    tr.innerHTML = `
      <td>${escapeHtml(date)}</td>
      <td>${escapeHtml(o.name || '-')}</td>
      <td>${escapeHtml(phone)}</td>
      <td><button class="row-action-btn" type="button">Reativar</button></td>
    `
    tr.querySelector('.row-action-btn').addEventListener('click', async (e) => {
      e.target.disabled = true
      try {
        await fetch(`/api/optouts/${encodeURIComponent(o.jid)}`, { method: 'DELETE' })
        refreshOptOuts()
        refreshLabels()
      } catch (err) {
        e.target.disabled = false
      }
    })
    optoutsBody.appendChild(tr)
  }
}

optoutsRefreshBtn.addEventListener('click', refreshOptOuts)

// configurações de envio (ritmo anti-bloqueio)

function applyFieldWarning(input, hintEl, value, range) {
  const outOfRange = !Number.isFinite(value) || value < range.min || value > range.max
  input.classList.toggle('field-input-warning', outOfRange)
  hintEl.classList.toggle('warning', outOfRange)
  hintEl.textContent = outOfRange
    ? `Fora da faixa recomendada (${range.min}–${range.max}) — maior risco de bloqueio da conta.`
    : `Faixa recomendada: ${range.min}–${range.max}`
}

function updateAllFieldWarnings() {
  if (!recommendedRanges) return
  for (const key of Object.keys(settingFields)) {
    applyFieldWarning(settingFields[key], settingHints[key], Number(settingFields[key].value), recommendedRanges[key])
  }
}

for (const key of Object.keys(settingFields)) {
  settingFields[key].addEventListener('input', updateAllFieldWarnings)
}

function renderSettingsForm(settings) {
  settingFields.delayMinSec.value = settings.delayMinSec
  settingFields.delayMaxSec.value = settings.delayMaxSec
  settingFields.batchSize.value = settings.batchSize
  settingFields.batchPauseMinutes.value = settings.batchPauseMinutes
  settingFields.dailyLimit.value = settings.dailyLimit
  cbEnabledInput.checked = settings.circuitBreaker.enabled
  cbConsecutiveInput.value = settings.circuitBreaker.consecutiveFailures
  cbSampleInput.value = settings.circuitBreaker.minSampleForRate
  cbRateInput.value = Math.round(settings.circuitBreaker.failureRateThreshold * 100)
  updateAllFieldWarnings()
}

async function loadSettingsIntoForm() {
  const res = await fetch('/api/settings')
  const data = await res.json()
  recommendedRanges = data.recommended
  renderSettingsForm(data.settings)
}

function openSettingsModal() {
  settingsError.classList.add('hidden')
  loadSettingsIntoForm().catch((err) => {
    settingsError.textContent = 'Erro ao carregar configurações: ' + err.message
    settingsError.classList.remove('hidden')
  })
  settingsModal.classList.remove('hidden')
}

function closeSettingsModal() {
  settingsModal.classList.add('hidden')
}

settingsBtn.addEventListener('click', openSettingsModal)
settingsCloseBtn.addEventListener('click', closeSettingsModal)
settingsCancelBtn.addEventListener('click', closeSettingsModal)
settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeSettingsModal() })

settingsSaveBtn.addEventListener('click', async () => {
  const payload = {
    delayMinSec: Number(settingFields.delayMinSec.value),
    delayMaxSec: Number(settingFields.delayMaxSec.value),
    batchSize: Math.round(Number(settingFields.batchSize.value)),
    batchPauseMinutes: Number(settingFields.batchPauseMinutes.value),
    dailyLimit: Math.round(Number(settingFields.dailyLimit.value)),
    circuitBreaker: {
      enabled: cbEnabledInput.checked,
      consecutiveFailures: Math.round(Number(cbConsecutiveInput.value)),
      minSampleForRate: Math.round(Number(cbSampleInput.value)),
      failureRateThreshold: Number(cbRateInput.value) / 100
    }
  }
  settingsError.classList.add('hidden')
  settingsSaveBtn.disabled = true
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) {
      settingsError.textContent = data.error || 'Erro ao salvar configurações.'
      settingsError.classList.remove('hidden')
    } else {
      closeSettingsModal()
      loadPacingSummary()
    }
  } catch (err) {
    settingsError.textContent = 'Erro ao salvar configurações: ' + err.message
    settingsError.classList.remove('hidden')
  }
  settingsSaveBtn.disabled = false
})

async function loadPacingSummary() {
  try {
    const [settingsRes, usageRes] = await Promise.all([
      fetch('/api/settings'),
      fetch('/api/settings/usage')
    ])
    const settingsData = await settingsRes.json()
    const usage = await usageRes.json()
    recommendedRanges = settingsData.recommended
    renderPacingSummary(settingsData.settings, usage)
  } catch (err) {
    // resumo de ritmo é informativo — não bloqueia o resto da tela se der erro
  }
}

function renderPacingSummary(settings, usage) {
  const limitText = usage.dailyLimit > 0
    ? `limite diário de ${usage.dailyLimit} (${usage.last24h.total} usados nas últimas 24h)`
    : 'sem limite diário'
  pacingSummary.innerHTML = `${iconSvg('info')}<span>Ritmo atual: ${settings.delayMinSec}–${settings.delayMaxSec}s entre mensagens · pausa de ${settings.batchPauseMinutes} min a cada ${settings.batchSize} envios · ${limitText}</span>`
}

// faixa de métricas no topo da tela principal

// Painel de início (src/dashboardRoutes.js): quem está esperando resposta, resultados, envios
// de hoje e saúde do número. O nome refreshStats ficou porque já é chamado em vários lugares.
async function refreshStats() {
  let d
  try {
    d = await (await fetch('/api/dashboard')).json()
  } catch {
    return // informativo — não trava o resto da tela
  }
  const ago = (ms) => {
    if (!ms) return ''
    const min = Math.round((Date.now() - ms) / 60000)
    if (min < 60) return `há ${Math.max(1, min)} min`
    const h = Math.round(min / 60)
    return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} dia(s)`
  }

  // aguardando resposta: clicar no nome abre a conversa (WhatsApp embutido quando disponível)
  document.getElementById('dash-waiting-count').textContent = d.waiting.count
  const list = document.getElementById('dash-waiting-list')
  list.innerHTML = d.waiting.count === 0
    ? '<li class="dash-empty">Ninguém esperando. Quando um cliente responder uma campanha, ele aparece aqui.</li>'
    : d.waiting.items.map((w, i) => `<li data-i="${i}" title="Abrir conversa"><b>${escapeHtml(w.name || (w.phone ? '+' + w.phone : 'Cliente'))}</b>
        <span>💬 ${escapeHtml((w.lastReply || '').slice(0, 70))}</span><small>${ago(w.lastReplyAt)} · ${escapeHtml(w.campaignName)}</small></li>`).join('')
  list.querySelectorAll('li[data-i]').forEach((li) => {
    const w = d.waiting.items[Number(li.dataset.i)]
    li.addEventListener('click', () => {
      if (w.phone && typeof openWhatsAppChat === 'function') openWhatsAppChat(w.phone, { returnCampaignId: w.campaignId, name: w.name })
      else openCampaignBoard(w.campaignId)
    })
  })

  // resultados
  document.getElementById('dash-won').textContent = `${d.sales.won7d} venda(s)`
  document.getElementById('dash-sales-sub').innerHTML = [
    `${d.sales.negotiating} em negociação`,
    d.sales.replyRate7d === null ? 'Sem envios de campanha na semana' : `${Math.round(d.sales.replyRate7d * 100)}% responderam (${d.sales.sent7d} enviados)`
  ].join('<br>')

  // envios de hoje
  const s = d.sending
  document.getElementById('dash-sent').textContent = s.dailyLimit > 0 ? `${s.last24h} de ${s.dailyLimit}` : `${s.last24h}`
  document.getElementById('dash-sent-bar').style.width = s.dailyLimit > 0 ? `${Math.min(100, Math.round((s.last24h / s.dailyLimit) * 100))}%` : '0%'
  const next = []
  if (s.followupsToday) next.push(`${s.followupsToday} follow-up(s) previstos`)
  if (s.prospectToday) next.push(`${s.prospectToday} da prospecção`)
  if (s.nextScheduledAt) next.push(`agendado ${new Date(s.nextScheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`)
  document.getElementById('dash-sending-sub').textContent = next.length ? 'Ainda hoje: ' + next.join(' · ') : 'Nada mais previsto para hoje (limite das últimas 24h).'

  // saúde do número
  const labels = { ok: 'Boa', attention: 'Atenção', risk: 'Risco' }
  document.getElementById('dash-health').textContent = labels[d.health.level]
  document.getElementById('dash-health-card').className = `dash-card dash-health dash-${d.health.level}`
  document.getElementById('dash-health-sub').textContent = d.health.reasons.length
    ? d.health.reasons.join(' ')
    : 'Sem falhas nem pedidos de saída fora do normal. Continue com ritmo moderado.'
}

document.getElementById('dash-open-campaigns').addEventListener('click', () => openCampaignsModal())

// tutorial de primeiro uso

const TUTORIAL_VERSION = 'v1'

function showTutorialStep(step) {
  currentTutorialStep = step
  tutorialSteps.forEach((el) => {
    el.classList.toggle('active', Number(el.dataset.step) === step)
  })
  tutorialStepIndicator.textContent = `Passo ${step} de ${tutorialSteps.length}`
  tutorialBackBtn.classList.toggle('hidden', step === 1)
  tutorialNextBtn.textContent = step === tutorialSteps.length ? 'Concluir' : 'Próximo'
}

function openTutorial() {
  showTutorialStep(1)
  tutorialModal.classList.remove('hidden')
}

function closeTutorial(markSeen) {
  tutorialModal.classList.add('hidden')
  if (markSeen) {
    try { localStorage.setItem('tutorialSeen', TUTORIAL_VERSION) } catch (err) {
      // localStorage pode não estar disponível (ex: modo privado) — sem problema,
      // o tutorial só vai reaparecer sozinho na próxima visita nesse caso
    }
  }
}

helpBtn.addEventListener('click', openTutorial)
tutorialSkipBtn.addEventListener('click', () => closeTutorial(true))
tutorialSkipLinkBtn.addEventListener('click', () => closeTutorial(true))
tutorialModal.addEventListener('click', (e) => { if (e.target === tutorialModal) closeTutorial(true) })
tutorialBackBtn.addEventListener('click', () => showTutorialStep(Math.max(1, currentTutorialStep - 1)))
tutorialNextBtn.addEventListener('click', () => {
  if (currentTutorialStep >= tutorialSteps.length) {
    closeTutorial(true)
  } else {
    showTutorialStep(currentTutorialStep + 1)
  }
})

;(function maybeShowTutorialOnFirstVisit() {
  let seen = null
  try { seen = localStorage.getItem('tutorialSeen') } catch (err) {
    // sem localStorage disponível — melhor mostrar o tutorial do que arriscar não mostrar nunca
  }
  if (seen !== TUTORIAL_VERSION) openTutorial()
})()

// dropzone
dropzone.addEventListener('click', () => fileInput.click())
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropzone.classList.add('dragover')
})
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'))
dropzone.addEventListener('drop', (e) => {
  e.preventDefault()
  dropzone.classList.remove('dragover')
  if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
})
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) addFiles(fileInput.files)
  fileInput.value = '' // permite escolher o mesmo arquivo de novo depois de removê-lo
})

// Vários anexos (tipo "Arquivo/texto"): a lista fica em selectedFiles; selectedFile continua
// existindo (= primeiro anexo) pra quem só precisa saber "tem anexo?".
const MAX_ATTACHMENTS = 10
const attachmentsList = document.getElementById('attachments-list')
const attachmentsHint = document.getElementById('attachments-hint')
const albumToggle = document.getElementById('album-toggle')
const albumToggleLabel = document.getElementById('album-toggle-label')
albumToggle.addEventListener('change', () => renderAttachments())

// "Mensagem" com 2 a 5 fotos/vídeos e a opção de álbum marcada vai como álbum de verdade
function shouldSendAsAlbum() {
  const n = selectedFiles.length
  return albumToggle.checked && n >= 2 && n <= MAX_ALBUM_FILES &&
    selectedFiles.every((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
}
const voiceNoteText = document.getElementById('voice-note-text')

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

function fileIcon(file) {
  if (file.type.startsWith('image/')) return '🖼️'
  if (file.type.startsWith('video/')) return '🎬'
  if (file.type.startsWith('audio/')) return '🎵'
  if (file.type === 'application/pdf') return '📄'
  return '📎'
}

function addFiles(fileList) {
  const incoming = Array.from(fileList)
  const room = MAX_ATTACHMENTS - selectedFiles.length
  const accepted = incoming
    .filter((f) => !selectedFiles.some((s) => s.name === f.name && s.size === f.size))
    .slice(0, Math.max(0, room))
  if (incoming.length > accepted.length && selectedFiles.length + accepted.length >= MAX_ATTACHMENTS) {
    showToast(`Máximo de ${MAX_ATTACHMENTS} anexos por envio.`, 'error')
  }
  selectedFiles = [...selectedFiles, ...accepted]
  renderAttachments()
}

function setFile(file) {
  addFiles([file])
}

function removeAttachment(index) {
  selectedFiles.splice(index, 1)
  renderAttachments()
}

function renderAttachments() {
  selectedFile = selectedFiles[0] || null
  const count = selectedFiles.length
  dropzone.classList.toggle('has-file', count > 0)
  dropzoneText.textContent = count === 0
    ? 'Arraste arquivos aqui ou clique para selecionar (pode escolher vários)'
    : count >= MAX_ATTACHMENTS
      ? `${count} anexos (máximo atingido)`
      : `${count} anexo(s) — clique ou arraste para adicionar mais`
  removeFileBtn.classList.toggle('hidden', count === 0)

  attachmentsList.innerHTML = ''
  selectedFiles.forEach((file, index) => {
    const li = document.createElement('li')
    li.innerHTML = `
      <span class="att-icon">${fileIcon(file)}</span>
      <span class="att-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
      <span class="att-size">${formatFileSize(file.size)}</span>
      <button type="button" class="att-remove" title="Remover este anexo">&times;</button>
    `
    li.querySelector('.att-remove').addEventListener('click', () => removeAttachment(index))
    attachmentsList.appendChild(li)
  })
  attachmentsList.classList.toggle('hidden', count === 0)

  // álbum: só faz sentido com 2 a 5 fotos/vídeos (limite do WhatsApp/servidor)
  const visual = selectedFiles.filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/')).length
  const albumEligible = count >= 2 && visual === count && count <= MAX_ALBUM_FILES
  albumToggleLabel.classList.toggle('hidden', !albumEligible)
  const asAlbum = albumEligible && albumToggle.checked
  attachmentsHint.classList.toggle('hidden', count < 2 || asAlbum)
  document.getElementById('message-hint').innerHTML = count > 0
    ? (asAlbum ? 'A mensagem vai como legenda do álbum.' : 'A mensagem vai como legenda do primeiro anexo.') + ' Use <code>{{nome}}</code> para personalizar com o nome de cada contato.'
    : 'Dica: use <code>{{nome}}</code> na mensagem para personalizar com o nome de cada contato.'

  const audioCount = selectedFiles.filter((f) => f.type.startsWith('audio/')).length
  voiceNoteLabel.classList.toggle('hidden', audioCount === 0)
  if (audioCount === 0) voiceNoteToggle.checked = false
  voiceNoteText.textContent = audioCount > 1 || count > 1
    ? 'Enviar os áudios como nota de voz (nota de voz não tem legenda)'
    : 'Enviar como nota de voz (sem legenda — se houver mensagem, ela vai separada, como texto)'
}

function clearFile() {
  selectedFiles = []
  fileInput.value = ''
  voiceNoteToggle.checked = false
  renderAttachments()
}

removeFileBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  clearFile()
})

// Gravação de áudio dentro do app (nota de voz), sem precisar importar um arquivo pronto —
// grava com o microfone do computador, igual ao WhatsApp. O navegador só grava em WebM/Opus
// (Ogg não é suportado pelo MediaRecorder do Chromium); o servidor remuxa pra Ogg/Opus antes
// de enviar (ver src/audio.js), que é o formato que o WhatsApp reconhece como nota de voz.
let mediaRecorder = null
let recordedChunks = []
let recordingStream = null
let recordingStartedAt = null
let recordingTimerInterval = null

async function startRecording() {
  if (mediaRecorder) return
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (err) {
    showNotice('error', 'Não foi possível acessar o microfone. Verifique se o Windows permite que aplicativos de área de trabalho usem o microfone (Configurações > Privacidade > Microfone) e se nenhum outro programa está usando-o. Detalhe: ' + err.message)
    return
  }
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : ''
  mediaRecorder = mimeType ? new MediaRecorder(recordingStream, { mimeType }) : new MediaRecorder(recordingStream)
  recordedChunks = []
  mediaRecorder.addEventListener('dataavailable', (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data)
  })
  mediaRecorder.addEventListener('stop', onRecordingStopped)
  mediaRecorder.start()
  recordingStartedAt = Date.now()
  recordAudioBtn.classList.add('recording')
  updateRecordingTimer()
  recordingTimerInterval = setInterval(updateRecordingTimer, 500)
}

function updateRecordingTimer() {
  const secs = Math.floor((Date.now() - recordingStartedAt) / 1000)
  const m = Math.floor(secs / 60)
  const s = String(secs % 60).padStart(2, '0')
  recordAudioBtn.textContent = `⏺ Gravando ${m}:${s} (clique para parar)`
}

function stopRecording() {
  if (!mediaRecorder) return
  mediaRecorder.stop()
}

function onRecordingStopped() {
  clearInterval(recordingTimerInterval)
  recordingTimerInterval = null
  recordAudioBtn.textContent = '🎙️ Gravar áudio'
  recordAudioBtn.classList.remove('recording')
  recordingStream?.getTracks().forEach((t) => t.stop())
  recordingStream = null
  const durationMs = Date.now() - recordingStartedAt
  const blobType = mediaRecorder.mimeType || 'audio/webm'
  mediaRecorder = null
  if (durationMs < 500 || recordedChunks.length === 0) {
    showNotice('error', 'Gravação muito curta — segure e fale por pelo menos 1 segundo.')
    recordedChunks = []
    return
  }
  const blob = new Blob(recordedChunks, { type: blobType })
  recordedChunks = []
  const file = new File([blob], `gravacao-${Date.now()}.webm`, { type: blobType })
  setFile(file)
  voiceNoteToggle.checked = true
}

recordAudioBtn.addEventListener('click', () => {
  if (mediaRecorder) stopRecording()
  else startRecording()
})

// Emoji picker compartilhado entre os campos de mensagem (message-input, album-message-input,
// etc.) — abre perto do botão clicado, insere na textarea alvo na posição do cursor.
// EMOJI_CATEGORIES vem de emoji-data.js (script clássico carregado antes deste).
const emojiPicker = document.getElementById('emoji-picker')
const emojiPickerTabs = document.getElementById('emoji-picker-tabs')
const emojiPickerGrid = document.getElementById('emoji-picker-grid')
let emojiPickerTargetId = null
let emojiPickerCategoryIndex = 0

function renderEmojiTabs() {
  emojiPickerTabs.innerHTML = ''
  EMOJI_CATEGORIES.forEach((cat, i) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = cat.icon
    btn.title = cat.name
    btn.className = i === emojiPickerCategoryIndex ? 'active' : ''
    btn.addEventListener('click', () => {
      emojiPickerCategoryIndex = i
      renderEmojiTabs()
      renderEmojiGrid()
    })
    emojiPickerTabs.appendChild(btn)
  })
}

function renderEmojiGrid() {
  emojiPickerGrid.innerHTML = ''
  for (const emoji of EMOJI_CATEGORIES[emojiPickerCategoryIndex].emojis) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = emoji
    btn.addEventListener('click', () => insertEmoji(emoji))
    emojiPickerGrid.appendChild(btn)
  }
}

// Compartilhado com os pickers de modelo e produto abaixo.
function insertTextAtCursor(targetId, text) {
  const el = document.getElementById(targetId)
  if (!el) return
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? el.value.length
  el.value = el.value.slice(0, start) + text + el.value.slice(end)
  const newPos = start + text.length
  el.focus()
  el.setSelectionRange(newPos, newPos)
}

function insertEmoji(emoji) {
  insertTextAtCursor(emojiPickerTargetId, emoji)
}

function openEmojiPicker(button) {
  emojiPickerTargetId = button.dataset.target
  document.querySelectorAll('.emoji-toggle-btn').forEach((b) => b.classList.toggle('active', b === button))
  renderEmojiTabs()
  renderEmojiGrid()
  const rect = button.getBoundingClientRect()
  emojiPicker.classList.remove('hidden')
  const pickerWidth = 300
  const left = Math.max(10, Math.min(rect.left, window.innerWidth - pickerWidth - 10))
  emojiPicker.style.left = `${left}px`
  emojiPicker.style.top = `${rect.bottom + 6}px`
}

function closeEmojiPicker() {
  emojiPicker.classList.add('hidden')
  document.querySelectorAll('.emoji-toggle-btn').forEach((b) => b.classList.remove('active'))
  emojiPickerTargetId = null
}

document.querySelectorAll('.emoji-toggle-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    if (emojiPickerTargetId === btn.dataset.target && !emojiPicker.classList.contains('hidden')) {
      closeEmojiPicker()
    } else {
      openEmojiPicker(btn)
    }
  })
})

document.addEventListener('click', (e) => {
  if (emojiPicker.classList.contains('hidden')) return
  if (emojiPicker.contains(e.target) || e.target.classList.contains('emoji-toggle-btn')) return
  closeEmojiPicker()
})

// Popup posicionado genérico — mesmo comportamento do emoji picker (abre perto do botão,
// fecha ao clicar fora ou ao clicar de novo no botão que abriu), reaproveitado pelos
// pickers de modelo e produto abaixo em vez de duplicar a lógica de posicionamento 2x.
function createPositionedPicker(pickerEl, toggleClass, onOpen) {
  let targetId = null
  function open(button) {
    targetId = button.dataset.target
    document.querySelectorAll('.' + toggleClass).forEach((b) => b.classList.toggle('active', b === button))
    onOpen()
    const rect = button.getBoundingClientRect()
    pickerEl.classList.remove('hidden')
    const pickerWidth = pickerEl.offsetWidth || 280
    const left = Math.max(10, Math.min(rect.left, window.innerWidth - pickerWidth - 10))
    pickerEl.style.left = `${left}px`
    pickerEl.style.top = `${rect.bottom + 6}px`
  }
  function close() {
    pickerEl.classList.add('hidden')
    document.querySelectorAll('.' + toggleClass).forEach((b) => b.classList.remove('active'))
    targetId = null
  }
  document.querySelectorAll('.' + toggleClass).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      if (targetId === btn.dataset.target && !pickerEl.classList.contains('hidden')) close()
      else open(btn)
    })
  })
  document.addEventListener('click', (e) => {
    if (pickerEl.classList.contains('hidden')) return
    if (pickerEl.contains(e.target) || e.target.classList.contains(toggleClass)) return
    close()
  })
  return { open, close, getTargetId: () => targetId }
}

// ===== Templates de mensagem =====
const templatePicker = document.getElementById('template-picker')
const templatePickerList = document.getElementById('template-picker-list')
const templateSaveNameInput = document.getElementById('template-save-name')
const templateSaveBtn = document.getElementById('template-save-btn')

let templates = []
let templatesFetchSeq = 0

async function refreshTemplates() {
  // abrir o popup duas vezes seguidas (ou abrir e depois salvar rápido) dispara GETs
  // concorrentes — sem isso, o mais lento podia "vencer" e sobrescrever o estado com dados
  // desatualizados só porque respondeu depois. Só aplica a resposta da requisição mais recente.
  const seq = ++templatesFetchSeq
  try {
    const res = await fetch('/api/templates')
    const data = await res.json()
    if (seq === templatesFetchSeq) templates = data
  } catch {
    // popup só é preenchido quando aberto — se falhar, tenta de novo na próxima abertura
  }
}

function renderTemplatePickerList() {
  templatePickerList.innerHTML = ''
  if (templates.length === 0) {
    templatePickerList.innerHTML = '<p class="mini-picker-empty">Nenhum modelo salvo ainda.</p>'
    return
  }
  for (const t of templates) {
    const row = document.createElement('div')
    row.className = 'mini-picker-item'
    row.innerHTML = `
      <div class="mini-picker-item-main">
        <div class="mini-picker-item-title">${escapeHtml(t.name)}</div>
        <div class="mini-picker-item-sub">${escapeHtml(t.message.slice(0, 50))}</div>
      </div>
      <div class="mini-picker-item-actions">
        <button type="button" title="Excluir">🗑️</button>
      </div>
    `
    row.querySelector('.mini-picker-item-main').addEventListener('click', () => applyTemplate(t))
    row.querySelector('.mini-picker-item-actions button').addEventListener('click', async (e) => {
      e.stopPropagation()
      const confirmed = await showConfirmDialog({
        title: 'Excluir este modelo?',
        message: `"${t.name}" não poderá ser recuperado.`,
        confirmText: 'Excluir',
        danger: true
      })
      if (!confirmed) return
      await fetch(`/api/templates/${t.id}`, { method: 'DELETE' })
      await refreshTemplates()
      renderTemplatePickerList()
    })
    templatePickerList.appendChild(row)
  }
}

function applyTemplate(t) {
  messageTypeSelect.value = t.messageType || 'media'
  updateMessageTypeFields()
  if (t.messageType === 'album') {
    albumMessageInput.value = t.message
  } else {
    messageInput.value = t.message
  }
  if (t.messageType === 'poll') {
    pollQuestionInput.value = t.pollQuestion || ''
    pollOptionsInput.value = (t.pollOptions || []).join('\n')
  }
  templatePickerCtl.close()
  showToast(`Modelo "${t.name}" aplicado.`, 'success')
}

const templatePickerCtl = createPositionedPicker(templatePicker, 'template-toggle-btn', () => {
  templateSaveNameInput.value = ''
  refreshTemplates().then(renderTemplatePickerList)
})

templateSaveBtn.addEventListener('click', async () => {
  const name = templateSaveNameInput.value.trim()
  if (!name) {
    showToast('Dê um nome pro modelo antes de salvar.', 'error')
    return
  }
  const targetId = templatePickerCtl.getTargetId()
  const message = (targetId === 'album-message-input' ? albumMessageInput.value : messageInput.value).trim()
  if (!message) {
    showToast('Escreva a mensagem antes de salvar como modelo.', 'error')
    return
  }
  const messageType = messageTypeSelect.value
  try {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        message,
        messageType,
        pollQuestion: messageType === 'poll' ? pollQuestionInput.value.trim() : null,
        pollOptions: messageType === 'poll' ? pollOptionsInput.value.split('\n').map((s) => s.trim()).filter(Boolean) : []
      })
    })
    const data = await res.json()
    if (!res.ok) {
      showToast(data.error || 'Erro ao salvar modelo.', 'error')
      return
    }
    templateSaveNameInput.value = ''
    await refreshTemplates()
    renderTemplatePickerList()
    showToast('Modelo salvo!', 'success')
  } catch (err) {
    showToast('Erro ao salvar modelo: ' + err.message, 'error')
  }
})

// ===== Produtos =====
const productsBtn = document.getElementById('products-btn')
const productsModal = document.getElementById('products-modal')
const productsCloseBtn = document.getElementById('products-close-btn')
const productFormName = document.getElementById('product-form-name')
const productFormPrice = document.getElementById('product-form-price')
const productFormDescription = document.getElementById('product-form-description')
const productFormError = document.getElementById('product-form-error')
const productFormSaveBtn = document.getElementById('product-form-save-btn')
const productFormCancelBtn = document.getElementById('product-form-cancel-btn')
const productsTable = document.getElementById('products-table')
const productsBody = document.getElementById('products-body')
const productsEmpty = document.getElementById('products-empty')
const productPicker = document.getElementById('product-picker')
const productPickerList = document.getElementById('product-picker-list')
const productManageBtn = document.getElementById('product-manage-btn')

let products = []
let editingProductId = null
let productsFetchSeq = 0

async function refreshProducts() {
  // mesma proteção contra corrida usada em refreshTemplates() — descarta respostas de
  // requisições que não são mais a mais recente.
  const seq = ++productsFetchSeq
  try {
    const res = await fetch('/api/products')
    const data = await res.json()
    if (seq === productsFetchSeq) products = data
  } catch {
    // idem templates — repopula na próxima vez que abrir
  }
}

function resetProductForm() {
  editingProductId = null
  productFormName.value = ''
  productFormPrice.value = ''
  productFormDescription.value = ''
  productFormError.classList.add('hidden')
  productFormSaveBtn.textContent = 'Salvar produto'
  productFormCancelBtn.classList.add('hidden')
}

function renderProductsTable() {
  productsTable.classList.toggle('hidden', products.length === 0)
  productsEmpty.classList.toggle('hidden', products.length > 0)
  productsBody.innerHTML = ''
  for (const p of products) {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.price || '-')}</td>
      <td>${escapeHtml((p.description || '').slice(0, 60))}</td>
      <td>
        <button type="button" class="secondary small product-edit-btn">Editar</button>
        <button type="button" class="secondary small product-delete-btn">Excluir</button>
      </td>
    `
    tr.querySelector('.product-edit-btn').addEventListener('click', () => {
      editingProductId = p.id
      productFormName.value = p.name
      productFormPrice.value = p.price || ''
      productFormDescription.value = p.description || ''
      productFormError.classList.add('hidden')
      productFormSaveBtn.textContent = 'Salvar alterações'
      productFormCancelBtn.classList.remove('hidden')
      productFormName.focus()
    })
    tr.querySelector('.product-delete-btn').addEventListener('click', async () => {
      const confirmed = await showConfirmDialog({
        title: 'Excluir este produto?',
        message: `"${p.name}" não poderá ser recuperado.`,
        confirmText: 'Excluir',
        danger: true
      })
      if (!confirmed) return
      await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
      await refreshProducts()
      renderProductsTable()
    })
    productsBody.appendChild(tr)
  }
}

function openProductsModal() {
  resetProductForm()
  productsModal.classList.remove('hidden')
  refreshProducts().then(renderProductsTable)
}

function closeProductsModal() {
  productsModal.classList.add('hidden')
}

productsBtn.addEventListener('click', openProductsModal)
productsCloseBtn.addEventListener('click', closeProductsModal)
productFormCancelBtn.addEventListener('click', resetProductForm)

productFormSaveBtn.addEventListener('click', async () => {
  const name = productFormName.value.trim()
  if (!name) {
    productFormError.textContent = 'Dê um nome pro produto.'
    productFormError.classList.remove('hidden')
    return
  }
  const body = JSON.stringify({
    name,
    price: productFormPrice.value.trim(),
    description: productFormDescription.value.trim()
  })
  try {
    const res = await fetch(editingProductId ? `/api/products/${editingProductId}` : '/api/products', {
      method: editingProductId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })
    const data = await res.json()
    if (!res.ok) {
      productFormError.textContent = data.error || 'Erro ao salvar produto.'
      productFormError.classList.remove('hidden')
      return
    }
    resetProductForm()
    await refreshProducts()
    renderProductsTable()
    showToast('Produto salvo!', 'success')
  } catch (err) {
    productFormError.textContent = 'Erro ao salvar produto: ' + err.message
    productFormError.classList.remove('hidden')
  }
})

function renderProductPickerList() {
  productPickerList.innerHTML = ''
  if (products.length === 0) {
    productPickerList.innerHTML = '<p class="mini-picker-empty">Nenhum produto cadastrado ainda.</p>'
    return
  }
  for (const p of products) {
    const row = document.createElement('div')
    row.className = 'mini-picker-item'
    row.innerHTML = `
      <div class="mini-picker-item-main">
        <div class="mini-picker-item-title">${escapeHtml(p.name)}</div>
        <div class="mini-picker-item-sub">${escapeHtml(p.price || '')}</div>
      </div>
    `
    row.addEventListener('click', () => {
      const lines = [`*${p.name}*`]
      if (p.price) lines.push(p.price)
      if (p.description) lines.push(p.description)
      insertTextAtCursor(productPickerCtl.getTargetId(), lines.join('\n'))
      productPickerCtl.close()
    })
    productPickerList.appendChild(row)
  }
}

const productPickerCtl = createPositionedPicker(productPicker, 'product-toggle-btn', () => {
  refreshProducts().then(renderProductPickerList)
})

productManageBtn.addEventListener('click', () => {
  productPickerCtl.close()
  openProductsModal()
})

// ===== Pré-visualização de mensagem =====
const previewBtn = document.getElementById('preview-btn')
const previewModal = document.getElementById('preview-modal')
const previewCloseBtn = document.getElementById('preview-close-btn')
const previewBubble = document.getElementById('preview-bubble')

function formatWhatsAppText(text) {
  let html = escapeHtml(text)
  html = html.replace(/```([^`]+)```/g, '<code>$1</code>')
  html = html.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
  html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>')
  html = html.replace(/~([^~\n]+)~/g, '<s>$1</s>')
  return html
}

function previewTimeMeta() {
  const now = new Date()
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `<span class="preview-meta">${time} ✓✓</span>`
}

function buildPreviewHtml() {
  const messageType = messageTypeSelect.value
  const sampleName = 'João'

  if (messageType === 'poll') {
    const question = pollQuestionInput.value.trim() || '(pergunta da enquete)'
    const options = pollOptionsInput.value.split('\n').map((s) => s.trim()).filter(Boolean)
    const optionsHtml = (options.length ? options : ['(opção 1)', '(opção 2)'])
      .map((o) => `<div class="preview-poll-option">⚪ ${escapeHtml(o)}</div>`).join('')
    return `<strong>📊 ${escapeHtml(question)}</strong>${optionsHtml}${previewTimeMeta()}`
  }

  if (messageType === 'location') {
    const loc = currentProfile.location
    return `<div class="preview-card-row"><div class="preview-card-title">📍 ${escapeHtml(loc.name || 'Localização')}</div>${escapeHtml(loc.address || '')}</div>${previewTimeMeta()}`
  }

  if (messageType === 'contact') {
    const card = currentProfile.businessCard
    return `<div class="preview-card-row"><div class="preview-card-title">👤 ${escapeHtml(card.name || '(nome do contato)')}</div>${escapeHtml(card.phone || '')}</div>${previewTimeMeta()}`
  }

  if (messageType === 'media' && shouldSendAsAlbum()) {
    const grid = `<div class="preview-album-grid">${selectedFiles.map((f) => `<div>${fileIcon(f)}</div>`).join('')}</div>`
    const caption = formatWhatsAppText(messageInput.value.replace(/\{\{nome\}\}/g, sampleName))
    return `${grid}${caption}${previewTimeMeta()}`
  }

  // media (padrão) — pode ter arquivo anexado e/ou nota de voz
  const attachmentNote = selectedFiles.map((f) => {
    if (voiceNoteToggle.checked && f.type.startsWith('audio/')) return '<div class="preview-card-row">🎤 Nota de voz</div>'
    return `<div class="preview-card-row">${fileIcon(f)} ${escapeHtml(f.name)}</div>`
  }).join('')
  const caption = formatWhatsAppText(messageInput.value.replace(/\{\{nome\}\}/g, sampleName))
  return `${attachmentNote}${caption}${previewTimeMeta()}`
}

previewBtn.addEventListener('click', () => {
  previewBubble.innerHTML = buildPreviewHtml()
  previewModal.classList.remove('hidden')
})
previewCloseBtn.addEventListener('click', () => previewModal.classList.add('hidden'))
previewModal.addEventListener('click', (e) => { if (e.target === previewModal) previewModal.classList.add('hidden') })

// dropzone do álbum (multi-arquivo)
albumDropzone.addEventListener('click', () => albumFileInput.click())
albumDropzone.addEventListener('dragover', (e) => {
  e.preventDefault()
  albumDropzone.classList.add('dragover')
})
albumDropzone.addEventListener('dragleave', () => albumDropzone.classList.remove('dragover'))
albumDropzone.addEventListener('drop', (e) => {
  e.preventDefault()
  albumDropzone.classList.remove('dragover')
  if (e.dataTransfer.files.length > 0) addAlbumFiles(e.dataTransfer.files)
})
albumFileInput.addEventListener('change', () => {
  if (albumFileInput.files.length > 0) addAlbumFiles(albumFileInput.files)
  albumFileInput.value = ''
})

function addAlbumFiles(fileList) {
  const incoming = Array.from(fileList).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
  const rejected = fileList.length - incoming.length
  selectedAlbumFiles = [...selectedAlbumFiles, ...incoming].slice(0, MAX_ALBUM_FILES)
  renderAlbumSummary()
  if (rejected > 0) {
    showToast('Álbum só aceita imagens e vídeos — algum arquivo foi ignorado.', 'error')
  }
}

function renderAlbumSummary() {
  albumDropzone.classList.toggle('has-file', selectedAlbumFiles.length > 0)
  if (selectedAlbumFiles.length === 0) {
    albumDropzoneText.textContent = 'Arraste 2 a 5 imagens ou vídeos aqui, ou clique para selecionar'
    return
  }
  const names = selectedAlbumFiles.map((f) => f.name).join(', ')
  albumDropzoneText.textContent = `${selectedAlbumFiles.length} arquivo(s) selecionado(s): ${names} (clique para adicionar mais, até ${MAX_ALBUM_FILES})`
}

// tipo de mensagem (arquivo/texto, enquete, localização, cartão de contato)

function updateMessageTypeFields() {
  const type = messageTypeSelect.value
  mediaFields.classList.toggle('hidden', type !== 'media')
  albumFields.classList.toggle('hidden', type !== 'album')
  pollFields.classList.toggle('hidden', type !== 'poll')
  locationFields.classList.toggle('hidden', type !== 'location')
  contactFields.classList.toggle('hidden', type !== 'contact')
  for (const card of document.querySelectorAll('#type-cards .type-card')) {
    const on = card.dataset.type === type
    card.classList.toggle('active', on)
    card.setAttribute('aria-checked', String(on))
  }
}
messageTypeSelect.addEventListener('change', updateMessageTypeFields)

// Cartões de tipo de mensagem: só trocam o <select> escondido, que segue sendo a fonte da
// verdade pro resto do código (validação, envio, agendamento, pré-visualização).
for (const card of document.querySelectorAll('#type-cards .type-card')) {
  card.addEventListener('click', () => {
    if (messageTypeSelect.value === card.dataset.type) return
    messageTypeSelect.value = card.dataset.type
    messageTypeSelect.dispatchEvent(new Event('change'))
  })
}

function renderProfileSummaries() {
  locationSummary.textContent = currentProfile.location.lat != null
    ? `Configurado: ${currentProfile.location.name || currentProfile.location.address || (currentProfile.location.lat + ', ' + currentProfile.location.lng)}`
    : 'Nenhuma localização configurada ainda.'
  contactCardSummary.textContent = currentProfile.businessCard.name
    ? `${currentProfile.businessCard.name} — ${currentProfile.businessCard.phone}`
    : 'Nenhum cartão configurado ainda — configure seu nome e número uma vez.'
  if (currentProfile.location.lat != null) {
    locationSummary.textContent = currentProfile.location.name || currentProfile.location.address || `${currentProfile.location.lat}, ${currentProfile.location.lng}`
  } else {
    locationSummary.textContent = 'Nenhuma localização configurada ainda — configure o endereço uma vez.'
  }
  configureLocationBtn.textContent = currentProfile.location.lat != null ? 'Alterar' : 'Configurar localização'
  configureContactBtn.textContent = currentProfile.businessCard.name ? 'Alterar' : 'Configurar seu contato'
}

async function refreshProfile() {
  try {
    const res = await fetch('/api/messaging-profile')
    currentProfile = await res.json()
  } catch (err) {
    // perfil é usado só quando o tipo de mensagem exigir — não bloqueia o resto da tela
  }
  renderProfileSummaries()
}

// ===== Janela "Seu contato e localização" =====
// Em vez de pedir latitude/longitude (ninguém sabe a da própria loja), aceita o link do Google
// Maps e tira as coordenadas dele. Telefone: aceita do jeito que a pessoa digitar e completa o +55.

const profileMapsLink = document.getElementById('profile-maps-link')
const profileMapsHint = document.getElementById('profile-maps-hint')
const profilePhoneHint = document.getElementById('profile-phone-hint')
const profileContactPreview = document.getElementById('profile-contact-preview')
const profileLocationPreview = document.getElementById('profile-location-preview')
const MAPS_HINT_DEFAULT = profileMapsHint.innerHTML

function normalizeBusinessPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10 || digits.length === 11) return '+55' + digits
  return '+' + digits
}

function formatPhoneBR(e164) {
  const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(e164 || '')
  return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : e164
}

// Coordenadas de um link do Maps (vários formatos) ou de um "lat, lng" colado direto
function parseMapsCoords(text) {
  const t = decodeURIComponent(String(text || ''))
  const patterns = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/]
  for (const re of patterns) {
    const m = re.exec(t)
    if (m) {
      const lat = Number(m[1]), lng = Number(m[2])
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }
    }
  }
  return null
}

function setMapsHint(html, tone = '') {
  profileMapsHint.innerHTML = html
  profileMapsHint.className = `field-hint profile-hint ${tone}`
}

let mapsResolveSeq = 0
async function handleMapsLink() {
  const value = profileMapsLink.value.trim()
  if (!value) { setMapsHint(MAPS_HINT_DEFAULT); return }
  let coords = parseMapsCoords(value)
  if (!coords && /goo\.gl|google\./i.test(value)) {
    const seq = ++mapsResolveSeq
    setMapsHint('Lendo o link…')
    try {
      const res = await fetch(`/api/resolve-maps-link?url=${encodeURIComponent(value)}`)
      const data = await res.json()
      if (seq !== mapsResolveSeq) return
      if (!res.ok) throw new Error(data.error)
      coords = parseMapsCoords(data.finalUrl)
    } catch (err) {
      setMapsHint(escapeHtml(err.message || 'Não consegui ler esse link.'), 'warn')
      return
    }
  }
  if (!coords) {
    setMapsHint('Não encontrei a localização nesse link. Abra a loja no Google Maps, toque em <strong>Compartilhar → Copiar link</strong> e cole de novo.', 'warn')
    return
  }
  profileFields.locationLat.value = coords.lat
  profileFields.locationLng.value = coords.lng
  setMapsHint('✓ Localização encontrada.', 'ok')
  updateProfilePreviews()
}

function updateProfilePreviews() {
  const name = profileFields.businessName.value.trim()
  const phone = normalizeBusinessPhone(profileFields.businessPhone.value)
  profilePhoneHint.textContent = phone ? `Vai como ${formatPhoneBR(phone)}` : 'Com DDD. O +55 é colocado sozinho.'
  profileContactPreview.classList.toggle('hidden', !name && !phone)
  profileContactPreview.innerHTML = `<span class="pp-label">Como chega</span><div class="pp-card"><span class="pp-avatar">👤</span><div><b>${escapeHtml(name || 'Seu nome')}</b><small>${escapeHtml(phone ? formatPhoneBR(phone) : 'seu número')}</small></div><span class="pp-action">Salvar</span></div>`

  const lat = Number(profileFields.locationLat.value), lng = Number(profileFields.locationLng.value)
  const hasCoords = profileFields.locationLat.value.trim() !== '' && profileFields.locationLng.value.trim() !== '' && Number.isFinite(lat) && Number.isFinite(lng)
  profileLocationPreview.classList.toggle('hidden', !hasCoords)
  if (hasCoords) {
    const place = profileFields.locationName.value.trim() || 'Sua localização'
    const address = profileFields.locationAddress.value.trim()
    profileLocationPreview.innerHTML = `<span class="pp-label">Como chega</span><div class="pp-card"><span class="pp-avatar">📍</span><div><b>${escapeHtml(place)}</b><small>${escapeHtml(address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)}</small></div><a class="pp-action" href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener noreferrer">Conferir no mapa ↗</a></div>`
  }
}

profileMapsLink.addEventListener('change', handleMapsLink)
profileMapsLink.addEventListener('paste', () => setTimeout(handleMapsLink, 0))
for (const el of [profileFields.businessName, profileFields.businessPhone, profileFields.locationName, profileFields.locationAddress, profileFields.locationLat, profileFields.locationLng]) {
  el.addEventListener('input', updateProfilePreviews)
}

function openProfileModal() {
  profileFields.businessName.value = currentProfile.businessCard.name || ''
  profileFields.businessPhone.value = currentProfile.businessCard.phone ? formatPhoneBR(currentProfile.businessCard.phone) : ''
  profileFields.locationName.value = currentProfile.location.name || ''
  profileFields.locationAddress.value = currentProfile.location.address || ''
  profileFields.locationLat.value = currentProfile.location.lat ?? ''
  profileFields.locationLng.value = currentProfile.location.lng ?? ''
  profileMapsLink.value = ''
  setMapsHint(MAPS_HINT_DEFAULT)
  updateProfilePreviews()
  profileError.classList.add('hidden')
  profileModal.classList.remove('hidden')
  profileFields.businessName.focus()
}

function closeProfileModal() {
  profileModal.classList.add('hidden')
}

configureLocationBtn.addEventListener('click', openProfileModal)
configureContactBtn.addEventListener('click', openProfileModal)
profileCloseBtn.addEventListener('click', closeProfileModal)
profileCancelBtn.addEventListener('click', closeProfileModal)
profileModal.addEventListener('click', (e) => { if (e.target === profileModal) closeProfileModal() })

profileSaveBtn.addEventListener('click', async () => {
  const lat = profileFields.locationLat.value.trim().replace(',', '.')
  const lng = profileFields.locationLng.value.trim().replace(',', '.')
  const name = profileFields.businessName.value.trim()
  const phone = normalizeBusinessPhone(profileFields.businessPhone.value)
  const showProfileError = (msg) => { profileError.textContent = msg; profileError.classList.remove('hidden') }
  if (name && !phone) return showProfileError('Informe o WhatsApp do negócio para o cartão de contato.')
  if (phone && !name) return showProfileError('Informe o nome que vai aparecer no cartão de contato.')
  if (phone && !/^\+\d{10,15}$/.test(phone)) return showProfileError('Esse número parece incompleto. Use DDD + número, ex: (11) 99999-9999.')
  if ((lat && !lng) || (!lat && lng) || (lat && (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))))) {
    return showProfileError('A localização ficou incompleta. Cole o link do Google Maps de novo.')
  }
  const payload = {
    businessCard: {
      name,
      phone
    },
    location: {
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      name: profileFields.locationName.value.trim(),
      address: profileFields.locationAddress.value.trim()
    }
  }
  profileError.classList.add('hidden')
  profileSaveBtn.disabled = true
  try {
    const res = await fetch('/api/messaging-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    currentProfile = await res.json()
    renderProfileSummaries()
    closeProfileModal()
    showToast('Salvo!', 'success')
  } catch (err) {
    profileError.textContent = 'Erro ao salvar: ' + err.message
    profileError.classList.remove('hidden')
  }
  profileSaveBtn.disabled = false
})

dispatchCancelBtn.addEventListener('click', () => {
  resetConfirmState()
})

// Validação e montagem do FormData compartilhadas entre "Disparar" (agora) e "Programar
// envio" (mais tarde) — os dois mandam exatamente os mesmos campos, só a rota muda.
function validateDispatchFields() {
  if (selectedLabelIds.size === 0 && !adHocContacts) {
    return 'Selecione uma etiqueta ou contatos.'
  }
  const messageType = messageTypeSelect.value
  const message = messageInput.value.trim()
  if (messageType === 'media' && !message && selectedFiles.length === 0) {
    return 'Escreva a mensagem ou anexe uma foto, vídeo, PDF ou áudio.'
  }
  if (messageType === 'album' && selectedAlbumFiles.length < 2) {
    return 'Selecione pelo menos 2 fotos/vídeos para o álbum.'
  }
  if (messageType === 'poll') {
    const question = pollQuestionInput.value.trim()
    const options = pollOptionsInput.value.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!question || options.length < 2) {
      return 'Escreva a pergunta e pelo menos 2 opções da enquete.'
    }
  }
  if (messageType === 'location' && currentProfile.location.lat == null) {
    return 'Configure a localização antes de continuar.'
  }
  if (messageType === 'contact' && !currentProfile.businessCard.name) {
    return 'Configure o cartão de contato antes de continuar.'
  }
  return validateCampaignFields() // public/campaigns.js
}

function buildDispatchFormData() {
  // "Mensagem" com 2 a 5 fotos/vídeos e a opção de álbum marcada vira o tipo álbum do servidor
  const messageType = messageTypeSelect.value === 'media' && shouldSendAsAlbum() ? 'album' : messageTypeSelect.value
  const message = messageInput.value.trim()
  const formData = new FormData()
  if (adHocContacts) {
    formData.append('contactsJson', JSON.stringify(adHocContacts))
  } else {
    for (const labelId of selectedLabelIds) formData.append('labelIds', labelId)
  }
  formData.append('messageType', messageType)
  if (messageType === 'album') {
    formData.append('message', message)
    for (const albumFile of selectedFiles) formData.append('files', albumFile)
  } else {
    formData.append('message', message)
  }
  if (messageType === 'media') {
    for (const f of selectedFiles) formData.append('attachments', f)
  }
  formData.append('asVoiceNote', voiceNoteToggle.checked ? 'true' : 'false')
  if (messageType === 'poll') {
    formData.append('pollQuestion', pollQuestionInput.value.trim())
    for (const opt of pollOptionsInput.value.split('\n').map((s) => s.trim()).filter(Boolean)) {
      formData.append('pollOptions', opt)
    }
  }
  formData.append('simulateTyping', simulateTypingToggle.checked ? 'true' : 'false')
  formData.append('skipBlocked', skipBlockedToggle.checked ? 'true' : 'false')
  formData.append('markAsRead', markReadToggle.checked ? 'true' : 'false')
  if (applyLabelSelect.value) formData.append('applyLabelId', applyLabelSelect.value)
  if (removeLabelSelect.value) formData.append('removeLabelId', removeLabelSelect.value)
  appendCampaignFields(formData) // public/campaigns.js
  return formData
}

dispatchBtn.addEventListener('click', async () => {
  const validationError = validateDispatchFields()
  if (validationError) {
    showNotice('error', validationError)
    return
  }

  if (!awaitingConfirm) {
    awaitingConfirm = true
    dispatchBtn.textContent = 'Confirmar envio'
    dispatchCancelBtn.classList.remove('hidden')
    const target = adHocContacts
      ? `${adHocContacts.length} contato(s) selecionado(s)`
      : `${lastLabelsContactCount} contato(s) da(s) etiqueta(s) "${lastLabelsFetch.filter((l) => selectedLabelIds.has(l.id)).map((l) => l.name).join(', ')}"`
    const campaignNote = isCampaignSelected() ? ' Eles vão entrar na campanha, com follow-up automático para quem não responder.' : ''
    showNotice('confirm', `Clique em "Confirmar envio" para disparar para ${target}.${campaignNote}`)
    return
  }

  resetConfirmState()
  dispatchBtn.disabled = true
  scheduleBtn.disabled = true
  progressPanel.classList.remove('hidden')
  progressLog.innerHTML = ''
  document.getElementById('batch-pause-banner')?.remove()
  document.querySelector('.aborted-banner')?.remove()
  progressFill.style.width = '0%'
  progressSummary.textContent = 'Iniciando...'

  const formData = buildDispatchFormData()

  try {
    const res = await fetch('/api/dispatch', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      showNotice('error', data.error || 'Erro ao iniciar disparo.')
      dispatchBtn.disabled = false
      scheduleBtn.disabled = false
      return
    }
    if (data.campaignId) {
      showToast('Campanha criada — acompanhe as respostas em "Campanhas".', 'success')
      resetCampaignForm()
    }
    listenToJob(data.jobId)
  } catch (err) {
    showNotice('error', 'Erro ao iniciar disparo: ' + err.message)
    dispatchBtn.disabled = false
    scheduleBtn.disabled = false
  }
})

// Programar envio — mesmos campos do disparo imediato, só que vai pra /api/scheduled com um
// horário no futuro em vez de disparar na hora. src/scheduler.js persiste e dispara sozinho,
// mesmo que o app seja fechado e reaberto antes do horário chegar.
scheduleToggle.addEventListener('change', () => {
  const scheduling = scheduleToggle.checked
  scheduleFields.classList.toggle('hidden', !scheduling)
  dispatchBtn.classList.toggle('hidden', scheduling)
  scheduleBtn.classList.toggle('hidden', !scheduling)
  resetConfirmState()
})

scheduleBtn.addEventListener('click', async () => {
  const validationError = validateDispatchFields()
  if (validationError) {
    showNotice('error', validationError)
    return
  }
  if (!scheduleDatetimeInput.value) {
    showNotice('error', 'Escolha a data e hora do envio.')
    return
  }
  const scheduledFor = new Date(scheduleDatetimeInput.value)
  if (scheduledFor.getTime() <= Date.now()) {
    showNotice('error', 'Escolha um horário no futuro.')
    return
  }

  scheduleBtn.disabled = true
  const formData = buildDispatchFormData()
  formData.append('scheduledFor', scheduledFor.toISOString())

  try {
    const res = await fetch('/api/scheduled', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      showNotice('error', data.error || 'Erro ao programar o envio.')
      scheduleBtn.disabled = false
      return
    }
    const withCampaign = isCampaignSelected() ? ' — a campanha começa nesse horário' : ''
    showToast(`Envio programado para ${scheduledFor.toLocaleString('pt-BR')}${withCampaign}`, 'success')
    resetCampaignForm()
    scheduleToggle.checked = false
    scheduleFields.classList.add('hidden')
    dispatchBtn.classList.remove('hidden')
    scheduleBtn.classList.add('hidden')
    scheduleDatetimeInput.value = ''
    refreshScheduled()
  } catch (err) {
    showNotice('error', 'Erro ao programar o envio: ' + err.message)
  }
  scheduleBtn.disabled = false
})

async function refreshScheduled() {
  try {
    const res = await fetch('/api/scheduled')
    const scheduled = await res.json()
    renderScheduled(scheduled)
  } catch {
    // painel informativo — não bloqueia o resto da tela se der erro
  }
}

function renderScheduled(scheduled) {
  const pending = scheduled.filter((s) => s.status === 'pending')
  scheduledSection.classList.toggle('hidden', scheduled.length === 0)
  if (scheduled.length === 0) {
    scheduledTable.classList.add('hidden')
    return
  }
  scheduledTable.classList.remove('hidden')
  scheduledBody.innerHTML = ''
  const statusLabel = { pending: 'Agendado', sent: 'Enviado', failed: 'Falhou', cancelled: 'Cancelado' }
  for (const s of scheduled) {
    const tr = document.createElement('tr')
    const when = new Date(s.scheduledFor).toLocaleString('pt-BR')
    const target = s.payload.labelName || (s.payload.contacts ? `${s.payload.contacts.length} contato(s)` : '-')
    const preview = (s.payload.message || s.payload.pollQuestion || '').slice(0, 60)
    tr.innerHTML = `
      <td>${escapeHtml(when)}</td>
      <td>${escapeHtml(target)}</td>
      <td title="${escapeHtml(s.payload.message || '')}">${escapeHtml(preview) || '-'}</td>
      <td>${escapeHtml(statusLabel[s.status] || s.status)}${s.error ? ` <span title="${escapeHtml(s.error)}">⚠️</span>` : ''}</td>
      <td>${s.status === 'pending' ? '<button type="button" class="scheduled-cancel-btn secondary small">Cancelar</button>' : ''}</td>
    `
    if (s.status === 'pending') {
      tr.querySelector('.scheduled-cancel-btn').addEventListener('click', async () => {
        const confirmed = await showConfirmDialog({
          title: 'Cancelar este agendamento?',
          message: 'O envio programado não vai acontecer.',
          confirmText: 'Cancelar agendamento',
          danger: true
        })
        if (!confirmed) return
        try {
          await fetch(`/api/scheduled/${s.id}`, { method: 'DELETE' })
          refreshScheduled()
        } catch (err) {
          showNotice('error', 'Erro ao cancelar: ' + err.message)
        }
      })
    }
    scheduledBody.appendChild(tr)
  }
}

scheduledRefreshBtn.addEventListener('click', refreshScheduled)

function listenToJob(jobId) {
  const source = new EventSource(`/api/dispatch/${jobId}/stream`)

  source.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.type === 'start') {
      const min = Math.round(data.delayMinMs / 1000)
      const max = Math.round(data.delayMaxMs / 1000)
      progressSummary.textContent = `Enviando para ${data.total} contato(s), com pausa de ${min}–${max}s entre cada envio...`
    }

    if (data.type === 'progress') {
      const pct = Math.round(((data.sent + data.failed) / data.total) * 100)
      progressFill.style.width = pct + '%'
      progressSummary.textContent = `${data.sent} enviado(s), ${data.failed} falha(s) de ${data.total}`
      const li = document.createElement('li')
      li.className = data.status
      const phone = phoneFromJid(data.jid)
      const contactLabel = data.name ? `${data.name} (${phone})` : phone
      li.innerHTML = `<span>${escapeHtml(contactLabel)}</span><span>${data.status === 'sent' ? 'OK' : 'falhou'}</span>`
      if (data.status === 'failed' && data.error) {
        const errLine = document.createElement('div')
        errLine.className = 'log-error'
        errLine.textContent = data.error
        li.appendChild(errLine)
      }
      progressLog.prepend(li)
    }

    if (data.type === 'waiting') {
      const seconds = Math.round(data.delayMs / 1000)
      progressSummary.textContent += ` — aguardando ${seconds}s antes do próximo envio...`
    }

    if (data.type === 'batch_pause') {
      const minutes = Math.round(data.pauseMs / 60000)
      let banner = document.getElementById('batch-pause-banner')
      if (!banner) {
        banner = document.createElement('div')
        banner.id = 'batch-pause-banner'
        banner.className = 'batch-pause-banner'
        progressPanel.appendChild(banner)
      }
      banner.innerHTML = `${iconSvg('pause')}<span>Pausa de ${minutes} min a cada ${data.afterCount} envios (proteção contra bloqueio)...</span>`
    }

    if (data.type === 'progress') {
      document.getElementById('batch-pause-banner')?.remove()
    }

    if (data.type === 'done') {
      progressFill.style.width = '100%'
      progressSummary.textContent = `Concluído: ${data.sent} enviado(s), ${data.failed} falha(s) de ${data.total}`
      document.getElementById('batch-pause-banner')?.remove()
      dispatchBtn.disabled = false
      scheduleBtn.disabled = false
      adHocContacts = null
      refreshLabels()
      refreshFailures()
      refreshOptOuts()
      loadPacingSummary()
      source.close()
    }

    if (data.type === 'aborted') {
      document.getElementById('batch-pause-banner')?.remove()
      const banner = document.createElement('div')
      banner.className = 'aborted-banner'
      banner.innerHTML = `${iconSvg('x')}<span>${escapeHtml(data.message)}</span>`
      progressPanel.appendChild(banner)
      progressSummary.textContent = `Interrompido: ${data.sent} enviado(s), ${data.failed} falha(s) de ${data.total}`
      dispatchBtn.disabled = false
      scheduleBtn.disabled = false
      adHocContacts = null
      refreshLabels()
      refreshFailures()
      refreshOptOuts()
      loadPacingSummary()
      source.close()
    }

    if (data.type === 'error') {
      progressSummary.textContent = `Erro no disparo: ${data.error}`
      dispatchBtn.disabled = false
      scheduleBtn.disabled = false
      source.close()
    }
  }

  source.onerror = () => {
    dispatchBtn.disabled = false
    scheduleBtn.disabled = false
    source.close()
  }
}

updateMessageTypeFields()
refreshProfile()
pollStatus()
pollAppVersion()
refreshFailures()
refreshOptOuts()
refreshScheduled()
loadPacingSummary()
refreshStats()
setInterval(pollStatus, 2500)
setInterval(pollAppVersion, 30000)
setInterval(() => {
  if (!mainScreen.classList.contains('hidden')) {
    refreshLabels()
    // não atualiza a tabela de falhas sozinho enquanto o usuário tem checkboxes marcadas —
    // senão a seleção some antes de dar tempo de clicar em "Reenviar selecionados"
    if (document.querySelectorAll('.failure-select:checked').length === 0) {
      refreshFailures()
    }
    refreshOptOuts()
    refreshScheduled()
    loadPacingSummary()
    refreshStats()
  }
}, 5000)
