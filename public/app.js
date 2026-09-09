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

const labelsRefreshBtn = document.getElementById('labels-refresh-btn')
const labelsSearchInput = document.getElementById('labels-search')
const labelsContainer = document.getElementById('labels-container')
const dispatchPanel = document.getElementById('dispatch-panel')
const dispatchTitle = document.getElementById('dispatch-title')
const dispatchCount = document.getElementById('dispatch-count')
const dispatchBtn = document.getElementById('dispatch-btn')
const messageInput = document.getElementById('message-input')
const dropzone = document.getElementById('dropzone')
const dropzoneText = document.getElementById('dropzone-text')
const fileInput = document.getElementById('file-input')
const removeFileBtn = document.getElementById('remove-file-btn')

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

let selectedLabel = null
let selectedFile = null
let lastLabelsFetch = []
let awaitingConfirm = false
let recommendedRanges = null
let currentTutorialStep = 1
let adHocContacts = null

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
  renderLabels(labels)
  if (labels.length > 0) setScreen('main')
  refreshStats()
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
    card.className = 'label-card' + (selectedLabel && selectedLabel.id === label.id ? ' active' : '')
    card.innerHTML = `<div class="name">${escapeHtml(label.name)}</div><div class="count">${label.contactCount} contato(s)</div>`
    card.addEventListener('click', () => selectLabel(label))
    labelsContainer.appendChild(card)
  }
}

labelsSearchInput.addEventListener('input', () => renderLabels(lastLabelsFetch))

function selectLabel(label) {
  selectedLabel = label
  adHocContacts = null
  renderLabels(lastLabelsFetch)
  dispatchPanel.classList.remove('hidden')
  dispatchTitle.textContent = `Disparar: ${label.name}`
  dispatchCount.textContent = `${label.contactCount} contato(s) receberão esta mensagem.`
  progressPanel.classList.add('hidden')
  dispatchBtn.disabled = label.contactCount === 0
  resetConfirmState()
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
  adHocContacts = checked.map((cb) => ({ jid: cb.dataset.jid, name: cb.dataset.name || null }))
  selectedLabel = null
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
}

function clearFile() {
  selectedFile = null
  fileInput.value = ''
  dropzone.classList.remove('has-file')
  dropzoneText.textContent = 'Arraste um arquivo aqui ou clique para selecionar'
  removeFileBtn.classList.add('hidden')
}

removeFileBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  clearFile()
})

dispatchCancelBtn.addEventListener('click', () => {
  resetConfirmState()
})

dispatchBtn.addEventListener('click', async () => {
  if (!selectedLabel && !adHocContacts) {
    showNotice('error', 'Selecione uma etiqueta ou contatos para disparar.')
    return
  }
  const message = messageInput.value.trim()
  if (!message) {
    showNotice('error', 'Escreva a mensagem antes de disparar.')
    return
  }

  if (!awaitingConfirm) {
    awaitingConfirm = true
    dispatchBtn.textContent = 'Confirmar envio'
    dispatchCancelBtn.classList.remove('hidden')
    const target = adHocContacts
      ? `${adHocContacts.length} contato(s) selecionado(s)`
      : `${selectedLabel.contactCount} contato(s) da etiqueta "${selectedLabel.name}"`
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
    formData.append('labelId', selectedLabel.id)
  }
  formData.append('message', message)
  if (selectedFile) formData.append('file', selectedFile)

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
