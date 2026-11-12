// Campanhas (follow-up automático + funil de vendas) — parte da interface.
//
// Carregado depois de app.js e usa as funções globais de lá (escapeHtml, showToast,
// showConfirmDialog). Duas partes:
// 1. a opção "Criar como campanha" no painel de disparo (campos + follow-ups), que app.js
//    consulta ao validar e montar o FormData do disparo/agendamento;
// 2. a tela "Campanhas" (botão no cabeçalho): lista de campanhas e o funil (kanban) de cada uma.

const CAMPAIGN_STAGES = [
  { id: 'waiting', title: 'Aguardando resposta' },
  { id: 'replied', title: 'Respondeu' },
  { id: 'negotiating', title: 'Negociando' },
  { id: 'won', title: 'Venda fechada' },
  { id: 'lost', title: 'Perdido' }
]
const MAX_FOLLOWUP_STEPS = 5
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ===== 1. Opção no painel de disparo =====

const campaignToggle = document.getElementById('campaign-toggle')
const campaignFields = document.getElementById('campaign-fields')
const campaignNameInput = document.getElementById('campaign-name-input')
const followupStepsContainer = document.getElementById('followup-steps')
const addFollowupBtn = document.getElementById('add-followup-btn')
const followupWindowHint = document.getElementById('followup-window-hint')

let followupSteps = []

function describeWindow(sendWindow) {
  const days = sendWindow.days.slice().sort()
  let daysText
  const isRange = days.length > 1 && days.every((d, i) => i === 0 || d === days[i - 1] + 1)
  if (days.length === 7) daysText = 'todos os dias'
  else if (isRange) daysText = `de ${WEEKDAYS[days[0]].toLowerCase()} a ${WEEKDAYS[days[days.length - 1]].toLowerCase()}`
  else daysText = days.map((d) => WEEKDAYS[d].toLowerCase()).join(', ')
  return `${daysText}, das ${sendWindow.start} às ${sendWindow.end}`
}

async function refreshFollowupWindowHint() {
  try {
    const res = await fetch('/api/campaign-settings')
    const settings = await res.json()
    followupWindowHint.textContent = `Os follow-ups saem ${describeWindow(settings.sendWindow)}, com o app aberto — mude em Campanhas → Horário dos follow-ups. O ritmo e o limite diário de "Configurações de envio" valem também.`
  } catch {
    followupWindowHint.textContent = ''
  }
}

function renderFollowupSteps() {
  followupStepsContainer.innerHTML = ''
  followupSteps.forEach((step, index) => {
    const el = document.createElement('div')
    el.className = 'followup-step'
    el.innerHTML = `
      <div class="followup-step-header">
        <strong>Follow-up ${index + 1}</strong>
        <button type="button" class="secondary small followup-remove-btn">Remover</button>
      </div>
      <div class="followup-delay">
        Enviar se não responder em
        <input type="number" min="1" max="60" step="1" class="followup-delay-input" value="${step.delayDays}" />
        dia(s) ${index === 0 ? 'depois da primeira mensagem' : `depois do follow-up ${index}`}
      </div>
      <textarea class="followup-message-input" placeholder="Ex: Oi {{nome}}, conseguiu ver minha mensagem? Posso te ajudar com alguma dúvida?"></textarea>
      <div class="followup-file-row">
        <button type="button" class="secondary small followup-file-btn">📎 ${step.file ? 'Trocar arquivo' : 'Anexar arquivo'}</button>
        <span class="followup-file-name">${step.file ? escapeHtml(step.file.name) : 'opcional — imagem, PDF, vídeo ou áudio'}</span>
        ${step.file ? '<button type="button" class="secondary small followup-file-clear-btn">Tirar arquivo</button>' : ''}
        <input type="file" class="followup-file-input" accept=".pdf,image/*,video/*,audio/*" hidden />
      </div>
    `
    const messageInput = el.querySelector('.followup-message-input')
    messageInput.value = step.message
    messageInput.addEventListener('input', () => { step.message = messageInput.value })

    const delayInput = el.querySelector('.followup-delay-input')
    delayInput.addEventListener('input', () => { step.delayDays = delayInput.value })

    const fileInput = el.querySelector('.followup-file-input')
    el.querySelector('.followup-file-btn').addEventListener('click', () => fileInput.click())
    fileInput.addEventListener('change', () => {
      step.file = fileInput.files[0] || null
      renderFollowupSteps()
    })
    el.querySelector('.followup-file-clear-btn')?.addEventListener('click', () => {
      step.file = null
      renderFollowupSteps()
    })

    el.querySelector('.followup-remove-btn').addEventListener('click', () => {
      followupSteps.splice(index, 1)
      renderFollowupSteps()
    })
    followupStepsContainer.appendChild(el)
  })
  addFollowupBtn.classList.toggle('hidden', followupSteps.length >= MAX_FOLLOWUP_STEPS)
}

function addFollowupStep() {
  if (followupSteps.length >= MAX_FOLLOWUP_STEPS) return
  followupSteps.push({ delayDays: followupSteps.length === 0 ? 2 : 3, message: '', file: null })
  renderFollowupSteps()
}

campaignToggle.addEventListener('change', () => {
  campaignFields.classList.toggle('hidden', !campaignToggle.checked)
  if (campaignToggle.checked) {
    if (followupSteps.length === 0) addFollowupStep()
    refreshFollowupWindowHint()
    campaignNameInput.focus()
  }
})

addFollowupBtn.addEventListener('click', addFollowupStep)

// Chamado por validateDispatchFields() em app.js. Devolve uma mensagem de erro ou null.
function validateCampaignFields() {
  if (!campaignToggle.checked) return null
  if (!campaignNameInput.value.trim()) return 'Dê um nome para a campanha.'
  for (let i = 0; i < followupSteps.length; i++) {
    const step = followupSteps[i]
    const days = Number(step.delayDays)
    if (!Number.isInteger(days) || days < 1 || days > 60) return `Follow-up ${i + 1}: o prazo precisa ser de 1 a 60 dias.`
    if (!step.message.trim() && !step.file) return `Follow-up ${i + 1}: escreva uma mensagem ou anexe um arquivo.`
  }
  return null
}

// Chamado por buildDispatchFormData() em app.js.
function appendCampaignFields(formData) {
  if (!campaignToggle.checked) return
  formData.append('createCampaign', 'true')
  formData.append('campaignName', campaignNameInput.value.trim())
  let fileIndex = 0
  const steps = followupSteps.map((step) => {
    const entry = { delayDays: Number(step.delayDays), message: step.message.trim(), fileIndex: null }
    if (step.file) {
      formData.append('followupFiles', step.file)
      entry.fileIndex = fileIndex++
    }
    return entry
  })
  formData.append('followupsJson', JSON.stringify(steps))
}

function isCampaignSelected() {
  return campaignToggle.checked
}

// Chamado depois que o disparo/agendamento com campanha foi aceito.
function resetCampaignForm() {
  campaignToggle.checked = false
  campaignFields.classList.add('hidden')
  campaignNameInput.value = ''
  followupSteps = []
  renderFollowupSteps()
}

// ===== 2. Tela "Campanhas" =====

const campaignsBtn = document.getElementById('campaigns-btn')
const campaignsModal = document.getElementById('campaigns-modal')
const campaignsListView = document.getElementById('campaigns-list-view')
const campaignBoardView = document.getElementById('campaign-board-view')
const campaignsListEl = document.getElementById('campaigns-list')
const campaignsEmptyEl = document.getElementById('campaigns-empty')
const campaignWindowBtn = document.getElementById('campaign-window-btn')
const campaignWindowPanel = document.getElementById('campaign-window-panel')
const campaignWindowDays = document.getElementById('campaign-window-days')
const campaignWindowStart = document.getElementById('campaign-window-start')
const campaignWindowEnd = document.getElementById('campaign-window-end')
const campaignWindowSaveBtn = document.getElementById('campaign-window-save-btn')
const campaignWindowError = document.getElementById('campaign-window-error')
const campaignBoardName = document.getElementById('campaign-board-name')
const campaignBoardStatus = document.getElementById('campaign-board-status')
const campaignBoardPausedReason = document.getElementById('campaign-board-paused-reason')
const campaignBoardStats = document.getElementById('campaign-board-stats')
const campaignBoardSteps = document.getElementById('campaign-board-steps')
const campaignBoardSearch = document.getElementById('campaign-board-search')
const campaignKanban = document.getElementById('campaign-kanban')
const campaignToggleStatusBtn = document.getElementById('campaign-toggle-status-btn')
const campaignDeleteBtn = document.getElementById('campaign-delete-btn')

let currentCampaign = null
let campaignRefreshTimer = null
let openNoteJids = new Set()

function formatPercent(value) {
  return `${Math.round(value * 100)}%`
}

function formatRelative(ms) {
  if (!ms) return ''
  const diff = ms - Date.now()
  const abs = Math.abs(diff)
  const minutes = Math.round(abs / 60000)
  const hours = Math.round(abs / 3600000)
  const days = Math.round(abs / 86400000)
  let text
  if (minutes < 1) text = 'agora'
  else if (minutes < 60) text = `${minutes} min`
  else if (hours < 24) text = `${hours} h`
  else text = `${days} dia${days === 1 ? '' : 's'}`
  if (text === 'agora') return text
  return diff > 0 ? `em ${text}` : `há ${text}`
}

// Cores das etiquetas do WhatsApp Business (o WhatsApp manda só o índice 0–19).
const WA_LABEL_COLORS = ['#ff9485', '#64c4ff', '#ffd429', '#dfaef0', '#99b6c1', '#55ccb3', '#ff9dff', '#d3a91d', '#6d7cce', '#d7e752',
  '#00d0e2', '#ffc5c7', '#93ceac', '#f74848', '#00a0f2', '#83e422', '#ffaf04', '#b5ebff', '#9ba6ff', '#9368cf']
function waLabelColor(index) {
  const i = Number(index)
  return Number.isInteger(i) && i >= 0 ? WA_LABEL_COLORS[i % WA_LABEL_COLORS.length] : '#94a3b8'
}

function formatPhone(phone) {
  if (!phone) return ''
  const m = String(phone).match(/^55(\d{2})(\d{4,5})(\d{4})$/)
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${phone}`
}

function statusLabel(summary) {
  if (summary.sendingNow) return { text: 'enviando follow-up', cls: 'sending' }
  if (summary.status === 'paused') return { text: 'pausada', cls: 'paused' }
  return { text: 'ativa', cls: '' }
}

function stopCampaignRefresh() {
  if (campaignRefreshTimer) clearInterval(campaignRefreshTimer)
  campaignRefreshTimer = null
}

async function openCampaignsModal() {
  if (isLicenseLocked()) return
  campaignsModal.classList.remove('hidden')
  showCampaignList()
}

function closeCampaignsModal() {
  campaignsModal.classList.add('hidden')
  stopCampaignRefresh()
  currentCampaign = null
}

async function showCampaignList() {
  stopCampaignRefresh()
  currentCampaign = null
  document.getElementById('campaign-builder-view').classList.add('hidden')
  campaignBoardView.classList.add('hidden')
  campaignsListView.classList.remove('hidden')
  await loadCampaignList()
  campaignRefreshTimer = setInterval(loadCampaignList, 20000)
}

async function loadCampaignList() {
  let list = []
  try {
    const res = await fetch('/api/campaigns')
    list = await res.json()
  } catch {
    return
  }
  campaignsEmptyEl.classList.toggle('hidden', list.length > 0)
  campaignsListEl.innerHTML = ''
  for (const c of list) {
    if (c.status === 'scheduled') {
      campaignsListEl.appendChild(buildScheduledCampaignCard(c))
      continue
    }
    const status = statusLabel(c)
    const card = document.createElement('div')
    card.className = 'campaign-card'
    let next
    if (c.nextDueAt && c.nextDueAt <= Date.now()) next = 'follow-up pendente, sai no próximo horário de envio'
    else if (c.nextDueAt) next = `próximo follow-up ${formatRelative(c.nextDueAt)}`
    else next = c.followupCount > 0 ? 'sem follow-ups pendentes' : 'sem follow-ups'
    card.innerHTML = `
      <div>
        <h3>${escapeHtml(c.name)} <span class="campaign-status ${status.cls}">${status.text}</span></h3>
        <div class="campaign-meta">
          Criada ${new Date(c.createdAt).toLocaleDateString('pt-BR')} · ${c.followupCount} follow-up(s) · ${next}${c.origin ? ' · ' + escapeHtml(c.origin) : ''}
        </div>
      </div>
      <div class="campaign-card-numbers">
        <div><strong>${c.total}</strong><span>contatos</span></div>
        <div><strong>${c.replied}</strong><span>responderam</span></div>
        <div><strong>${formatPercent(c.replyRate)}</strong><span>taxa de resposta</span></div>
        <div><strong>${c.counts.won || 0}</strong><span>vendas</span></div>
      </div>
      ${c.initialPreview ? `<div class="campaign-preview">“${escapeHtml(c.initialPreview)}”</div>` : ''}
    `
    card.addEventListener('click', () => openCampaignBoard(c.id))
    campaignsListEl.appendChild(card)
  }
}

// Campanha agendada que ainda não começou: só existe como agendamento até o horário chegar,
// então o cartão não abre funil — mostra quando começa e permite cancelar.
function buildScheduledCampaignCard(c) {
  const card = document.createElement('div')
  card.className = 'campaign-card scheduled'
  card.innerHTML = `
    <div>
      <h3>${escapeHtml(c.name)} <span class="campaign-status sending">agendada</span></h3>
      <div class="campaign-meta">
        Começa ${new Date(c.scheduledFor).toLocaleString('pt-BR')} · ${c.followupCount} follow-up(s)${c.origin ? ' · ' + escapeHtml(c.origin) : ''}
      </div>
    </div>
    <div class="campaign-card-numbers">
      <div><strong>${c.total}</strong><span>contatos</span></div>
      <div><button type="button" class="secondary small danger-text scheduled-cancel-btn">Cancelar</button></div>
    </div>
    ${c.initialPreview ? `<div class="campaign-preview">“${escapeHtml(c.initialPreview)}”</div>` : ''}
  `
  card.querySelector('.scheduled-cancel-btn').addEventListener('click', async (e) => {
    e.stopPropagation()
    const confirmed = await showConfirmDialog({
      title: 'Cancelar esta campanha agendada?',
      message: `"${c.name}" não será enviada.`,
      confirmText: 'Cancelar campanha',
      cancelText: 'Manter',
      danger: true
    })
    if (!confirmed) return
    const res = await fetch(`/api/campaigns/scheduled/${c.scheduledId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      showToast(data.error || 'Não foi possível cancelar.', 'error')
      return
    }
    showToast('Campanha agendada cancelada.', 'success')
    loadCampaignList()
  })
  return card
}

async function openCampaignBoard(id) {
  if (isLicenseLocked()) return
  stopCampaignRefresh()
  openNoteJids = new Set()
  campaignBoardSearch.value = ''
  campaignsModal.classList.remove('hidden')
  document.getElementById('campaign-builder-view').classList.add('hidden')
  campaignsListView.classList.add('hidden')
  campaignBoardView.classList.remove('hidden')
  await loadCampaignBoard(id)
  campaignRefreshTimer = setInterval(() => {
    // não redesenha enquanto o usuário está escrevendo uma anotação
    if (campaignKanban.contains(document.activeElement) && document.activeElement.tagName === 'TEXTAREA') return
    loadCampaignBoard(id)
  }, 15000)
}

async function loadCampaignBoard(id) {
  try {
    const res = await fetch(`/api/campaigns/${id}`)
    if (!res.ok) {
      showToast('Campanha não encontrada.', 'error')
      showCampaignList()
      return
    }
    currentCampaign = await res.json()
  } catch {
    return
  }
  renderCampaignBoard()
}

function renderCampaignBoard() {
  const c = currentCampaign
  if (!c) return
  const status = statusLabel(c)
  campaignBoardName.textContent = c.name
  campaignBoardStatus.textContent = status.text
  campaignBoardStatus.className = `campaign-status ${status.cls}`
  campaignToggleStatusBtn.textContent = c.status === 'paused' ? '▶ Retomar follow-ups' : '⏸ Pausar follow-ups'
  campaignToggleStatusBtn.classList.toggle('hidden', c.followupCount === 0)

  let banner = c.pausedReason || ''
  if (c.initialSending) {
    banner = `Enviando a 1ª mensagem: ${c.total + (c.initialFailed || 0)}${c.audienceCount ? ` de ${c.audienceCount}` : ''}... Os contatos aparecem no funil conforme recebem.`
  } else if (c.initialAborted === 'daily_limit') {
    banner = 'A 1ª mensagem parou no limite diário de envios — parte do público não recebeu. Crie outra campanha amanhã para o restante.'
  } else if (c.initialAborted) {
    banner = 'O envio da 1ª mensagem foi interrompido antes do fim (muitas falhas seguidas ou erro de conexão). Quem recebeu está no funil.'
  }
  campaignBoardPausedReason.classList.toggle('hidden', !banner)
  campaignBoardPausedReason.textContent = banner

  campaignBoardStats.innerHTML = `
    <div class="campaign-stat"><strong>${c.total}</strong><span>receberam a 1ª mensagem${c.initialFailed ? ` (${c.initialFailed} falharam)` : ''}</span></div>
    <div class="campaign-stat"><strong>${c.replied} · ${formatPercent(c.replyRate)}</strong><span>responderam</span></div>
    <div class="campaign-stat"><strong>${c.counts.negotiating || 0}</strong><span>negociando</span></div>
    <div class="campaign-stat"><strong>${c.counts.won || 0}</strong><span>vendas fechadas</span></div>
    <div class="campaign-stat"><strong>${c.finishedWithoutReply}</strong><span>sem resposta após os follow-ups</span></div>
  `

  const chips = []
  if (c.description) chips.push(`<span class="campaign-step-chip" title="${escapeHtml(c.description)}">🎯 ${escapeHtml(c.description)}</span>`)
  if (c.steps.length === 0) {
    chips.push('<span class="campaign-step-chip">Sem follow-ups — só funil de vendas</span>')
  } else {
    chips.push(...c.steps.map((s, i) => `<span class="campaign-step-chip" title="${escapeHtml(s.message || '')}">Follow-up ${i + 1}: após ${s.delayDays} dia(s)${s.fileName ? ' · 📎' : ''}${s.message ? ' — ' + escapeHtml(s.message) : ''}</span>`))
    if (c.sendWindow) chips.push(`<span class="campaign-step-chip">🕘 ${escapeHtml(describeWindow(c.sendWindow))}</span>`)
  }
  campaignBoardSteps.innerHTML = chips.join('')

  renderKanban()
}

function waitingInfo(contact) {
  if (contact.stoppedReason === 'failed') return 'O follow-up não pôde ser enviado para este contato.'
  if (contact.totalFollowups === 0) return `Recebeu a mensagem ${formatRelative(contact.firstSentAt)}.`
  if (contact.followupsSent >= contact.totalFollowups) return `Recebeu os ${contact.totalFollowups} follow-up(s) e não respondeu.`
  const next = contact.followupsSent + 1
  if (!contact.nextDueAt) return `Follow-up ${next} de ${contact.totalFollowups} pausado.`
  const when = contact.nextDueAt <= Date.now() ? 'no próximo horário de envio' : formatRelative(contact.nextDueAt)
  return `Follow-up ${next} de ${contact.totalFollowups} ${when}.`
}

function renderKanban() {
  const c = currentCampaign
  const q = campaignBoardSearch.value.trim().toLowerCase()
  const qDigits = q.replace(/\D/g, '')
  const contacts = c.contacts.filter((ct) => {
    if (!q) return true
    return (ct.name || '').toLowerCase().includes(q) || (qDigits && (ct.phone || '').includes(qDigits))
  })

  campaignKanban.innerHTML = ''
  for (const stage of CAMPAIGN_STAGES) {
    const inStage = contacts
      .filter((ct) => ct.stage === stage.id)
      .sort((a, b) => (b.lastReplyAt || b.stageChangedAt || 0) - (a.lastReplyAt || a.stageChangedAt || 0))

    const column = document.createElement('div')
    column.className = 'kanban-column'
    column.innerHTML = `
      <div class="kanban-column-header">${stage.title} <span>${inStage.length}</span></div>
      <div class="kanban-cards"></div>
    `
    const cardsEl = column.querySelector('.kanban-cards')
    if (inStage.length === 0) cardsEl.innerHTML = '<div class="kanban-empty">Nenhum contato</div>'
    for (const contact of inStage) cardsEl.appendChild(buildKanbanCard(contact))

    column.addEventListener('dragover', (e) => {
      e.preventDefault()
      column.classList.add('drag-over')
    })
    column.addEventListener('dragleave', () => column.classList.remove('drag-over'))
    column.addEventListener('drop', (e) => {
      e.preventDefault()
      column.classList.remove('drag-over')
      const jid = e.dataTransfer.getData('text/plain')
      if (jid) moveCampaignContact(jid, stage.id)
    })
    campaignKanban.appendChild(column)
  }
}

function buildKanbanCard(contact) {
  const card = document.createElement('div')
  card.className = 'kanban-card'
  card.draggable = true

  let info = ''
  if (contact.stoppedReason === 'optout') {
    info = 'Pediu para não receber mais mensagens.'
  } else if (contact.stage === 'waiting') {
    info = waitingInfo(contact)
  }

  const options = CAMPAIGN_STAGES
    .map((s) => `<option value="${s.id}" ${s.id === contact.stage ? 'selected' : ''}>${s.title}</option>`)
    .join('')

  card.innerHTML = `
    <div class="kc-name">${escapeHtml(contact.name || formatPhone(contact.phone) || 'Contato')}</div>
    ${contact.phone && contact.name ? `<div class="kc-phone">${formatPhone(contact.phone)}</div>` : ''}
    ${contact.labels?.length ? `<div class="kc-labels">${contact.labels.map((l) => `<span class="kc-label" title="Etiqueta do WhatsApp"><i style="background:${waLabelColor(l.color)}"></i>${escapeHtml(l.name)}</span>`).join('')}</div>` : ''}
    ${info ?`<div class="kc-info">${escapeHtml(info)}</div>` : ''}
    ${contact.lastReply ? `<div class="kc-reply" title="${escapeHtml(contact.lastReply)}">💬 ${escapeHtml(contact.lastReply)} <span class="kc-phone">· ${formatRelative(contact.lastReplyAt)}</span></div>` : ''}
    ${contact.note && !openNoteJids.has(contact.jid) ? `<div class="kc-note">📝 ${escapeHtml(contact.note)}</div>` : ''}
    <div class="kc-note-editor"></div>
    <div class="kc-actions">
      <select title="Mover para">${options}</select>
      <button type="button" class="secondary small kc-note-btn">📝</button>
      ${contact.phone ? `<button type="button" class="kc-open-chat" title="Abrir a conversa no WhatsApp aqui dentro do programa">💬 Conversa</button>` : ''}
    </div>
  `

  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', contact.jid)
    card.classList.add('dragging')
  })
  card.addEventListener('dragend', () => card.classList.remove('dragging'))

  card.querySelector('select').addEventListener('change', (e) => moveCampaignContact(contact.jid, e.target.value))

  // Abre a conversa no WhatsApp embutido (public/whatsapp-web.js), com um botão pra voltar
  // direto pra esta campanha — sem janela nova nem depender do app do WhatsApp no computador.
  card.querySelector('.kc-open-chat')?.addEventListener('click', (e) => {
    e.preventDefault()
    const campaignId = currentCampaign?.id
    closeCampaignsModal()
    openWhatsAppChat(contact.phone, { returnCampaignId: campaignId, name: contact.name })
  })

  const editor = card.querySelector('.kc-note-editor')
  const openEditor = () => {
    openNoteJids.add(contact.jid)
    editor.innerHTML = '<textarea placeholder="Anotação sobre este contato (ex: pediu orçamento de 3 unidades)"></textarea>'
    const textarea = editor.querySelector('textarea')
    textarea.value = contact.note || ''
    textarea.addEventListener('blur', async () => {
      openNoteJids.delete(contact.jid)
      if (textarea.value !== (contact.note || '')) {
        await saveCampaignContact(contact.jid, { note: textarea.value })
      } else {
        renderKanban()
      }
    })
    textarea.focus()
  }
  card.querySelector('.kc-note-btn').addEventListener('click', openEditor)
  if (openNoteJids.has(contact.jid)) openEditor()

  return card
}

async function saveCampaignContact(jid, patch) {
  if (!currentCampaign) return
  try {
    const res = await fetch(`/api/campaigns/${currentCampaign.id}/contacts/${encodeURIComponent(jid)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    })
    const data = await res.json()
    if (!res.ok) {
      showToast(data.error || 'Não foi possível salvar.', 'error')
    }
  } catch (err) {
    showToast('Não foi possível salvar: ' + err.message, 'error')
  }
  await loadCampaignBoard(currentCampaign.id)
}

function moveCampaignContact(jid, stage) {
  const contact = currentCampaign?.contacts.find((ct) => ct.jid === jid)
  if (!contact || contact.stage === stage) return
  saveCampaignContact(jid, { stage })
}

campaignBoardSearch.addEventListener('input', () => {
  if (currentCampaign) renderKanban()
})

campaignToggleStatusBtn.addEventListener('click', async () => {
  if (!currentCampaign) return
  const action = currentCampaign.status === 'paused' ? 'resume' : 'pause'
  await fetch(`/api/campaigns/${currentCampaign.id}/${action}`, { method: 'POST' })
  showToast(action === 'pause' ? 'Follow-ups pausados.' : 'Follow-ups retomados.', 'success')
  await loadCampaignBoard(currentCampaign.id)
})

campaignDeleteBtn.addEventListener('click', async () => {
  if (!currentCampaign) return
  const confirmed = await showConfirmDialog({
    title: 'Excluir esta campanha?',
    message: `"${currentCampaign.name}" e o funil com ${currentCampaign.total} contato(s) e anotações serão apagados. Os follow-ups pendentes não serão mais enviados. As mensagens já enviadas continuam no WhatsApp.`,
    confirmText: 'Excluir',
    danger: true
  })
  if (!confirmed) return
  const res = await fetch(`/api/campaigns/${currentCampaign.id}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    showToast(data.error || 'Não foi possível excluir.', 'error')
    return
  }
  showToast('Campanha excluída.', 'success')
  showCampaignList()
})

// ----- Horário dos follow-ups -----

async function loadCampaignWindow() {
  const res = await fetch('/api/campaign-settings')
  const { sendWindow } = await res.json()
  campaignWindowDays.innerHTML = WEEKDAYS.map((name, day) => `
    <label><input type="checkbox" value="${day}" ${sendWindow.days.includes(day) ? 'checked' : ''} /> ${name}</label>
  `).join('')
  campaignWindowStart.value = sendWindow.start
  campaignWindowEnd.value = sendWindow.end
  campaignWindowError.classList.add('hidden')
}

campaignWindowBtn.addEventListener('click', async () => {
  const opening = campaignWindowPanel.classList.contains('hidden')
  campaignWindowPanel.classList.toggle('hidden', !opening)
  if (opening) await loadCampaignWindow()
})

campaignWindowSaveBtn.addEventListener('click', async () => {
  const days = Array.from(campaignWindowDays.querySelectorAll('input:checked')).map((i) => Number(i.value))
  const res = await fetch('/api/campaign-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sendWindow: { days, start: campaignWindowStart.value, end: campaignWindowEnd.value } })
  })
  const data = await res.json()
  if (!res.ok) {
    campaignWindowError.textContent = data.error || 'Não foi possível salvar.'
    campaignWindowError.classList.remove('hidden')
    return
  }
  campaignWindowError.classList.add('hidden')
  campaignWindowPanel.classList.add('hidden')
  showToast(`Follow-ups vão sair ${describeWindow(data.sendWindow)}.`, 'success')
  refreshFollowupWindowHint()
})

campaignsBtn.addEventListener('click', openCampaignsModal)
document.getElementById('campaigns-close-btn').addEventListener('click', closeCampaignsModal)
document.getElementById('campaigns-close-btn-2').addEventListener('click', closeCampaignsModal)
document.getElementById('campaign-back-btn').addEventListener('click', showCampaignList)
