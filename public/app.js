const badge = document.getElementById('connection-badge')
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

const labelsPanelTitle = document.getElementById('labels-panel-title')
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

const progressPanel = document.getElementById('progress-panel')
const progressFill = document.getElementById('progress-fill')
const progressSummary = document.getElementById('progress-summary')
const progressLog = document.getElementById('progress-log')

const failuresRefreshBtn = document.getElementById('failures-refresh-btn')
const failuresResendBtn = document.getElementById('failures-resend-btn')
const failuresSelectAll = document.getElementById('failures-select-all')
const failuresEmpty = document.getElementById('failures-empty')
const failuresTable = document.getElementById('failures-table')
const failuresBody = document.getElementById('failures-body')

const optoutsRefreshBtn = document.getElementById('optouts-refresh-btn')
const optoutsEmpty = document.getElementById('optouts-empty')
const optoutsTable = document.getElementById('optouts-table')
const optoutsBody = document.getElementById('optouts-body')

const pacingSummary = document.getElementById('pacing-summary')

const statLabelsCount = document.getElementById('stat-labels-count')
const statUsage24h = document.getElementById('stat-usage-24h')
const statSuccessRate = document.getElementById('stat-success-rate')
const statOptoutsCount = document.getElementById('stat-optouts-count')

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
      badge.textContent = 'não ativado'
      badge.className = 'badge error'
      setScreen('unlicensed')
    } else if (data.status === 'connected') {
      badge.textContent = 'conectado'
      badge.className = 'badge connected'
      if (lastLabelsFetch.length === 0) {
        setScreen('syncing')
        await refreshLabels()
        if (lastLabelsFetch.length > 0) setScreen('main')
      } else {
        setScreen('main')
      }
    } else if (data.status === 'qr' && data.qrDataUrl) {
      badge.textContent = 'aguardando pareamento'
      badge.className = 'badge'
      qrImage.src = data.qrDataUrl
      setScreen('pairing')
    } else if (data.status === 'disconnected') {
      badge.textContent = 'desconectado'
      badge.className = 'badge disconnected'
      setScreen('disconnected')
    } else if (data.status === 'logged_out') {
      badge.textContent = 'sessão expirada'
      badge.className = 'badge error'
      setScreen('logged_out')
    } else {
      badge.textContent = data.status === 'closed' ? 'reconectando...' : 'conectando...'
      badge.className = 'badge'
    }
  } catch (err) {
    badge.textContent = 'erro de conexão com o servidor'
    badge.className = 'badge error'
  }
}

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
  labelsPanelTitle.textContent = tab === 'allContacts' ? 'Todos os contatos' : tab === 'coldContacts' ? 'Clientes frios' : 'Etiquetas'
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
  } catch (err) {
    lastLabelsContactCount = 0
    dispatchCount.textContent = ''
    dispatchBtn.disabled = true
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
  if (failures.length === 0) {
    failuresTable.classList.add('hidden')
    failuresEmpty.classList.remove('hidden')
    return
  }
  failuresEmpty.classList.add('hidden')
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
  if (optOuts.length === 0) {
    optoutsTable.classList.add('hidden')
    optoutsEmpty.classList.remove('hidden')
    return
  }
  optoutsEmpty.classList.add('hidden')
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

async function refreshStats() {
  try {
    const [usageRes, optOutsRes] = await Promise.all([
      fetch('/api/settings/usage'),
      fetch('/api/optouts')
    ])
    const usage = await usageRes.json()
    const optOuts = await optOutsRes.json()
    statLabelsCount.textContent = lastLabelsFetch.length
    statUsage24h.textContent = usage.last24h.total
    const rate = usage.last24h.total > 0 ? Math.round((usage.last24h.sent / usage.last24h.total) * 100) : null
    statSuccessRate.textContent = rate === null ? '–' : `${rate}%`
    statOptoutsCount.textContent = optOuts.length
  } catch (err) {
    // faixa de métricas é informativa — não bloqueia o resto da tela se der erro
  }
}

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
  if (e.dataTransfer.files.length > 0) setFile(e.dataTransfer.files[0])
})
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) setFile(fileInput.files[0])
})

function setFile(file) {
  selectedFile = file
  dropzone.classList.add('has-file')
  dropzoneText.textContent = `Arquivo selecionado: ${file.name} (clique para trocar)`
  removeFileBtn.classList.remove('hidden')
  const isAudio = file.type.startsWith('audio/')
  voiceNoteLabel.classList.toggle('hidden', !isAudio)
  if (!isAudio) voiceNoteToggle.checked = false
}

function clearFile() {
  selectedFile = null
  fileInput.value = ''
  dropzone.classList.remove('has-file')
  dropzoneText.textContent = 'Arraste um arquivo aqui ou clique para selecionar'
  removeFileBtn.classList.add('hidden')
  voiceNoteLabel.classList.add('hidden')
  voiceNoteToggle.checked = false
}

removeFileBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  clearFile()
})

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
}
messageTypeSelect.addEventListener('change', updateMessageTypeFields)

function renderProfileSummaries() {
  locationSummary.textContent = currentProfile.location.lat != null
    ? `Configurado: ${currentProfile.location.name || currentProfile.location.address || (currentProfile.location.lat + ', ' + currentProfile.location.lng)}`
    : 'Nenhuma localização configurada ainda.'
  contactCardSummary.textContent = currentProfile.businessCard.name
    ? `Configurado: ${currentProfile.businessCard.name} — ${currentProfile.businessCard.phone}`
    : 'Nenhum cartão de contato configurado ainda.'
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

function openProfileModal() {
  profileFields.businessName.value = currentProfile.businessCard.name || ''
  profileFields.businessPhone.value = currentProfile.businessCard.phone || ''
  profileFields.locationName.value = currentProfile.location.name || ''
  profileFields.locationAddress.value = currentProfile.location.address || ''
  profileFields.locationLat.value = currentProfile.location.lat ?? ''
  profileFields.locationLng.value = currentProfile.location.lng ?? ''
  profileError.classList.add('hidden')
  profileModal.classList.remove('hidden')
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
  const lat = profileFields.locationLat.value.trim()
  const lng = profileFields.locationLng.value.trim()
  const payload = {
    businessCard: {
      name: profileFields.businessName.value.trim(),
      phone: profileFields.businessPhone.value.trim()
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

dispatchBtn.addEventListener('click', async () => {
  if (selectedLabelIds.size === 0 && !adHocContacts) {
    showNotice('error', 'Selecione uma etiqueta ou contatos para disparar.')
    return
  }
  const messageType = messageTypeSelect.value
  const message = messageInput.value.trim()
  if (messageType === 'media' && !message) {
    showNotice('error', 'Escreva a mensagem antes de disparar.')
    return
  }
  if (messageType === 'album' && selectedAlbumFiles.length < 2) {
    showNotice('error', 'Selecione pelo menos 2 fotos/vídeos para o álbum.')
    return
  }
  if (messageType === 'poll') {
    const question = pollQuestionInput.value.trim()
    const options = pollOptionsInput.value.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!question || options.length < 2) {
      showNotice('error', 'Escreva a pergunta e pelo menos 2 opções da enquete.')
      return
    }
  }
  if (messageType === 'location' && currentProfile.location.lat == null) {
    showNotice('error', 'Configure a localização antes de disparar.')
    return
  }
  if (messageType === 'contact' && !currentProfile.businessCard.name) {
    showNotice('error', 'Configure o cartão de contato antes de disparar.')
    return
  }

  if (!awaitingConfirm) {
    awaitingConfirm = true
    dispatchBtn.textContent = 'Confirmar envio'
    dispatchCancelBtn.classList.remove('hidden')
    const target = adHocContacts
      ? `${adHocContacts.length} contato(s) selecionado(s)`
      : `${lastLabelsContactCount} contato(s) da(s) etiqueta(s) "${lastLabelsFetch.filter((l) => selectedLabelIds.has(l.id)).map((l) => l.name).join(', ')}"`
    showNotice('confirm', `Clique em "Confirmar envio" para disparar para ${target}.`)
    return
  }

  resetConfirmState()
  dispatchBtn.disabled = true
  progressPanel.classList.remove('hidden')
  progressLog.innerHTML = ''
  document.getElementById('batch-pause-banner')?.remove()
  document.querySelector('.aborted-banner')?.remove()
  progressFill.style.width = '0%'
  progressSummary.textContent = 'Iniciando...'

  const formData = new FormData()
  if (adHocContacts) {
    formData.append('contactsJson', JSON.stringify(adHocContacts))
  } else {
    for (const labelId of selectedLabelIds) formData.append('labelIds', labelId)
  }
  formData.append('messageType', messageType)
  if (messageType === 'album') {
    formData.append('message', albumMessageInput.value.trim())
    for (const albumFile of selectedAlbumFiles) formData.append('files', albumFile)
  } else {
    formData.append('message', message)
  }
  if (selectedFile) formData.append('file', selectedFile)
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

  try {
    const res = await fetch('/api/dispatch', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      showNotice('error', data.error || 'Erro ao iniciar disparo.')
      dispatchBtn.disabled = false
      return
    }
    listenToJob(data.jobId)
  } catch (err) {
    showNotice('error', 'Erro ao iniciar disparo: ' + err.message)
    dispatchBtn.disabled = false
  }
})

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
      source.close()
    }
  }

  source.onerror = () => {
    dispatchBtn.disabled = false
    source.close()
  }
}

updateMessageTypeFields()
refreshProfile()
pollStatus()
refreshFailures()
refreshOptOuts()
loadPacingSummary()
refreshStats()
setInterval(pollStatus, 2500)
setInterval(() => {
  if (!mainScreen.classList.contains('hidden')) {
    refreshLabels()
    // não atualiza a tabela de falhas sozinho enquanto o usuário tem checkboxes marcadas —
    // senão a seleção some antes de dar tempo de clicar em "Reenviar selecionados"
    if (document.querySelectorAll('.failure-select:checked').length === 0) {
      refreshFailures()
    }
    refreshOptOuts()
    loadPacingSummary()
    refreshStats()
  }
}, 5000)
