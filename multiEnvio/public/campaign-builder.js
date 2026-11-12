// Assistente "Nova campanha" (tela Campanhas → "+ Nova campanha").
//
// 5 passos: Modelo → Público → Mensagens → Regras → Revisão. Todo o estado fica no objeto
// `builder`; cada passo é redesenhado do zero a partir dele (renderBuilderStep), então os
// campos sempre escrevem no estado assim que mudam. Usa funções globais de app.js
// (escapeHtml, showToast) e de campaigns.js (showCampaignList, openCampaignBoard,
// describeWindow, WEEKDAYS) e o catálogo de public/campaign-templates.js.

const BUILDER_STEPS = ['Modelo', 'Público', 'Mensagens', 'Regras', 'Revisão']
const OPT_OUT_FOOTER = 'Se não quiser mais receber mensagens, responda SAIR.'
const SAMPLE_CONTACT_NAME = 'Maria Souza'
const CONTACTS_RENDER_LIMIT = 300

const builderView = document.getElementById('campaign-builder-view')
const builderStepsEl = document.getElementById('builder-steps')
const builderBody = document.getElementById('builder-body')
const builderError = document.getElementById('builder-error')
const builderBackBtn = document.getElementById('builder-back-btn')
const builderNextBtn = document.getElementById('builder-next-btn')
const builderFooterInfo = document.getElementById('builder-footer-info')

let builder = null
let builderLabels = []
let builderAllContacts = null
let builderSettings = null
let lastFocusedTextarea = null

function newBuilderState(defaultWindow) {
  return {
    step: 0,
    industryId: CAMPAIGN_TEMPLATE_CATALOG[0].id,
    templateId: null,
    name: '',
    description: '',
    audienceHint: '',
    audienceType: 'labels',
    labelIds: new Set(),
    labelsCount: 0,
    contacts: new Map(), // aba "Contatos": jid -> { jid, name }
    contactsQuery: '',
    sheet: { file: null, headers: [], previewRows: [], totalRows: 0, phoneColumn: '', nameColumn: '', results: null, selected: new Set(), summary: null },
    excludeActive: true,
    variables: [], // { key, label, value, example, custom }
    message: '',
    file: null,
    appendOptOut: true,
    followups: [],
    startMode: 'now',
    scheduledFor: '',
    sendWindow: JSON.parse(JSON.stringify(defaultWindow)),
    applyLabelId: '',
    replyLabelId: '',
    simulateTyping: true,
    skipBlocked: true,
    markAsRead: false,
    submitting: false
  }
}

async function openCampaignBuilder() {
  if (isLicenseLocked()) return
  stopCampaignRefresh()
  let defaultWindow = { days: [1, 2, 3, 4, 5, 6], start: '09:00', end: '19:00' }
  try {
    const [settingsRes, labelsRes, sendRes] = await Promise.all([
      fetch('/api/campaign-settings'),
      fetch('/api/labels'),
      fetch('/api/settings')
    ])
    defaultWindow = (await settingsRes.json()).sendWindow
    builderLabels = await labelsRes.json()
    builderSettings = (await sendRes.json()).settings
  } catch {
    // segue com os padrões — os campos continuam editáveis
  }
  builder = newBuilderState(defaultWindow)
  builderAllContacts = null
  prefillAudienceFromMainScreen()
  campaignsModal.classList.remove('hidden')
  campaignsListView.classList.add('hidden')
  campaignBoardView.classList.add('hidden')
  builderView.classList.remove('hidden')
  renderBuilderStep()
}

// Aproveita o que já estiver selecionado na tela principal (etiquetas na barra lateral, ou
// contatos escolhidos em "Todos os contatos"/"Clientes frios") — quem escolhe a etiqueta lá e
// abre o assistente espera encontrar o público já preenchido.
function prefillAudienceFromMainScreen() {
  if (Array.isArray(adHocContacts) && adHocContacts.length > 0) {
    builder.audienceType = 'contacts'
    for (const c of adHocContacts) builder.contacts.set(c.jid, { jid: c.jid, name: c.name || null })
    builder.prefilledFrom = `${adHocContacts.length} contato(s) que você já tinha selecionado na tela principal`
  } else if (selectedLabelIds.size > 0) {
    builder.audienceType = 'labels'
    builder.labelIds = new Set(Array.from(selectedLabelIds).map(String))
    const names = builderLabels.filter((l) => builder.labelIds.has(l.id)).map((l) => l.name)
    builder.prefilledFrom = `etiqueta(s) ${names.join(', ')}, que você já tinha selecionado na tela principal`
    refreshLabelsCount()
  }
}

function closeCampaignBuilder() {
  builder = null
  builderView.classList.add('hidden')
  showCampaignList()
}

function setBuilderError(message) {
  builderError.textContent = message || ''
  builderError.classList.toggle('hidden', !message)
}

// ===== Navegação =====

function renderBuilderSteps() {
  builderStepsEl.innerHTML = BUILDER_STEPS.map((title, i) => {
    const cls = i === builder.step ? 'active' : i < builder.step ? 'done' : ''
    return `<li class="${cls}" data-step="${i}"><span>${i < builder.step ? '✓' : i + 1}</span>${title}</li>`
  }).join('')
  for (const li of builderStepsEl.querySelectorAll('li.done')) {
    li.addEventListener('click', () => goToBuilderStep(Number(li.dataset.step)))
  }
}

function goToBuilderStep(step) {
  setBuilderError('')
  builder.step = step
  renderBuilderStep()
  builderBody.scrollTop = 0
}

function renderBuilderStep() {
  renderBuilderSteps()
  builderBackBtn.classList.toggle('hidden', builder.step === 0)
  builderNextBtn.classList.remove('hidden')
  builderNextBtn.disabled = builder.submitting
  const isLast = builder.step === BUILDER_STEPS.length - 1
  builderNextBtn.textContent = isLast
    ? (builder.startMode === 'schedule' ? '📅 Agendar campanha' : '🚀 Iniciar campanha')
    : 'Próximo'
  builderFooterInfo.textContent = ''
  ;[renderTemplateStep, renderAudienceStep, renderMessagesStep, renderRulesStep, renderReviewStep][builder.step]()
}

function validateBuilderStep() {
  if (builder.step === 1) {
    if (audienceCount() === 0) {
      if (builder.audienceType === 'labels') {
        return builder.labelIds.size === 0
          ? 'Marque a caixinha de pelo menos uma etiqueta (clique na linha da etiqueta).'
          : 'As etiquetas marcadas não têm nenhum contato que possa receber (quem pediu para sair não conta).'
      }
      if (builder.audienceType === 'contacts') return 'Marque pelo menos um contato da lista.'
      return 'Envie a planilha, confira os números e deixe pelo menos um marcado.'
    }
  }
  if (builder.step === 2) {
    if (!builder.name.trim()) return 'Dê um nome para a campanha.'
    if (!builder.message.trim() && !builder.file) return 'Escreva a primeira mensagem ou anexe um arquivo.'
    for (const v of builder.variables) {
      if (!/^[a-z][a-z0-9_]{0,29}$/.test(v.key)) return `Nome de variável inválido: "${v.key}". Use letras minúsculas, números e _ (ex: cupom, link_loja).`
      if (!String(v.value).trim()) return `Preencha o valor de {{${v.key}}}.`
    }
    const missing = missingBuilderVariables()
    if (missing.length > 0) return `As mensagens usam ${missing.map((k) => `{{${k}}}`).join(', ')}, mas não tem valor. Adicione em "Variáveis".`
    for (let i = 0; i < builder.followups.length; i++) {
      const f = builder.followups[i]
      const d = Number(f.delayDays)
      if (!Number.isInteger(d) || d < 1 || d > 60) return `Follow-up ${i + 1}: o prazo precisa ser de 1 a 60 dias.`
      if (!f.message.trim() && !f.file) return `Follow-up ${i + 1}: escreva uma mensagem ou anexe um arquivo.`
    }
  }
  if (builder.step === 3) {
    if (builder.followups.length > 0 && builder.sendWindow.days.length === 0) return 'Escolha pelo menos um dia para os follow-ups.'
    if (builder.sendWindow.start >= builder.sendWindow.end) return 'O horário de início dos follow-ups precisa ser antes do fim.'
    if (builder.startMode === 'schedule') {
      if (!builder.scheduledFor) return 'Escolha a data e a hora de início.'
      if (new Date(builder.scheduledFor).getTime() <= Date.now()) return 'Escolha um horário de início no futuro.'
    }
  }
  return null
}

builderNextBtn.addEventListener('click', () => {
  if (!builder) return
  const error = validateBuilderStep()
  if (error) {
    setBuilderError(error)
    return
  }
  if (builder.step === BUILDER_STEPS.length - 1) {
    submitBuilder()
    return
  }
  goToBuilderStep(builder.step + 1)
})

builderBackBtn.addEventListener('click', () => {
  if (builder && builder.step > 0) goToBuilderStep(builder.step - 1)
})

document.getElementById('builder-cancel-btn').addEventListener('click', closeCampaignBuilder)
document.getElementById('campaigns-close-btn-3').addEventListener('click', () => {
  builder = null
  builderView.classList.add('hidden')
  closeCampaignsModal()
})
document.getElementById('campaign-new-btn').addEventListener('click', openCampaignBuilder)
document.getElementById('open-builder-link').addEventListener('click', (e) => {
  e.preventDefault()
  openCampaignBuilder()
})

// ===== Passo 1: Modelo =====

function applyTemplate(setup) {
  builder.templateId = setup ? setup.id : null
  builder.name = setup ? setup.name : ''
  builder.description = setup ? setup.goal : ''
  builder.audienceHint = setup ? setup.audienceHint || '' : ''
  builder.message = setup ? setup.message : ''
  builder.variables = setup
    ? setup.variables.map((v) => ({ key: v.key, label: v.label, value: '', example: v.example, custom: false }))
    : []
  builder.followups = setup ? setup.followups.map((f) => ({ delayDays: f.delayDays, message: f.message, file: null })) : []
  if (setup?.sendWindow) builder.sendWindow = JSON.parse(JSON.stringify(setup.sendWindow))
  goToBuilderStep(1)
}

function renderTemplateStep() {
  const industry = CAMPAIGN_TEMPLATE_CATALOG.find((i) => i.id === builder.industryId) || CAMPAIGN_TEMPLATE_CATALOG[0]
  builderBody.innerHTML = `
    <p class="builder-intro">Escolha um modelo pronto para o seu ramo — dá para mudar tudo nos próximos passos — ou comece do zero.</p>
    <div class="template-layout">
      <div class="template-industries">
        <button type="button" class="template-industry template-blank">✏️ Começar do zero</button>
        ${CAMPAIGN_TEMPLATE_CATALOG.map((i) => `
          <button type="button" class="template-industry ${i.id === industry.id ? 'active' : ''}" data-id="${i.id}">${i.icon} ${escapeHtml(i.name)}</button>
        `).join('')}
      </div>
      <div class="template-setups">
        <h3>${industry.icon} ${escapeHtml(industry.name)}</h3>
        ${industry.setups.map((s) => `
          <div class="template-card" data-id="${s.id}">
            <div class="template-card-head">
              <strong>${escapeHtml(s.name)}</strong>
              <span class="template-badge">${s.followups.length === 0 ? 'sem follow-up' : `${s.followups.length} follow-up(s)`}</span>
            </div>
            <p>${escapeHtml(s.goal)}</p>
            <p class="template-meta">👥 ${escapeHtml(s.audienceHint || '')}</p>
            <div class="template-preview">${escapeHtml(s.message)}</div>
            <button type="button" class="small template-use-btn">Usar este modelo</button>
          </div>
        `).join('')}
      </div>
    </div>
  `
  builderNextBtn.classList.add('hidden')
  builderBody.querySelector('.template-blank').addEventListener('click', () => applyTemplate(null))
  for (const btn of builderBody.querySelectorAll('.template-industry[data-id]')) {
    btn.addEventListener('click', () => {
      builder.industryId = btn.dataset.id
      renderTemplateStep()
    })
  }
  for (const card of builderBody.querySelectorAll('.template-card')) {
    const setup = industry.setups.find((s) => s.id === card.dataset.id)
    card.querySelector('.template-use-btn').addEventListener('click', () => applyTemplate(setup))
  }
}

// ===== Passo 2: Público =====

function audienceCount() {
  if (builder.audienceType === 'labels') return builder.labelsCount
  if (builder.audienceType === 'contacts') return builder.contacts.size
  return builder.sheet.selected.size
}

function renderAudienceSummary() {
  const n = audienceCount()
  builderFooterInfo.textContent = n > 0 ? `${n} contato(s) selecionado(s)` : 'Nenhum contato selecionado'
}

async function refreshLabelsCount() {
  if (builder.labelIds.size === 0) {
    builder.labelsCount = 0
  } else {
    try {
      const res = await fetch(`/api/labels/contacts-count?ids=${encodeURIComponent(Array.from(builder.labelIds).join(','))}`)
      builder.labelsCount = (await res.json()).count
    } catch {
      builder.labelsCount = 0
    }
  }
  renderAudienceSummary()
}

function renderAudienceStep() {
  builderBody.innerHTML = `
    ${builder.audienceHint ? `<p class="builder-intro">💡 Público sugerido para este modelo: <strong>${escapeHtml(builder.audienceHint)}</strong></p>` : '<p class="builder-intro">Quem vai receber a campanha? Marque as etiquetas ou os contatos.</p>'}
    ${builder.prefilledFrom ? `<p class="notice">✅ Já trouxe ${escapeHtml(builder.prefilledFrom)}. Pode mudar à vontade.</p>` : ''}
    <div class="sidebar-tabs builder-tabs">
      <button type="button" class="sidebar-tab ${builder.audienceType === 'labels' ? 'active' : ''}" data-type="labels">Etiquetas</button>
      <button type="button" class="sidebar-tab ${builder.audienceType === 'contacts' ? 'active' : ''}" data-type="contacts">Escolher contatos</button>
      <button type="button" class="sidebar-tab ${builder.audienceType === 'spreadsheet' ? 'active' : ''}" data-type="spreadsheet">Planilha / leads frios</button>
    </div>
    <div id="builder-audience-pane"></div>
    <label class="checkbox-field">
      <input type="checkbox" id="builder-exclude-active" ${builder.excludeActive ? 'checked' : ''} />
      Não incluir quem já está recebendo follow-up de outra campanha ativa (recomendado)
    </label>
    <p class="field-hint">Quem pediu para não receber mais mensagens ("sair", "parar") é sempre removido automaticamente.</p>
  `
  for (const tab of builderBody.querySelectorAll('.builder-tabs .sidebar-tab')) {
    tab.addEventListener('click', () => {
      builder.audienceType = tab.dataset.type
      renderAudienceStep()
    })
  }
  builderBody.querySelector('#builder-exclude-active').addEventListener('change', (e) => { builder.excludeActive = e.target.checked })

  const pane = builderBody.querySelector('#builder-audience-pane')
  if (builder.audienceType === 'labels') renderLabelsPane(pane)
  else if (builder.audienceType === 'contacts') renderContactsPane(pane)
  else {
    // Lead frio (quem não tem seu número) só pela Prospecção, que tem as travas contra bloqueio
    pane.innerHTML = `
      <div class="type-explain">
        <strong>Lista de números que ainda não têm seu contato?</strong> Use a <strong>Prospecção</strong>: ela confere os números,
        varia a mensagem para cada pessoa, envia devagar ao longo dos dias e para sozinha se aparecer sinal de bloqueio.
        Quem responder entra num funil igual ao das campanhas.
        <div style="margin-top:10px"><button type="button" class="small" id="builder-go-prospecting">Abrir Prospecção</button></div>
      </div>`
    pane.querySelector('#builder-go-prospecting').addEventListener('click', () => {
      builder = null
      builderView.classList.add('hidden')
      openProspecting()
    })
  }
  renderAudienceSummary()
}

function renderLabelsPane(pane) {
  if (builderLabels.length === 0) {
    pane.innerHTML = '<p class="empty-state">Nenhuma etiqueta sincronizada. Conecte o WhatsApp Business e clique em "Atualizar" na lista de etiquetas.</p>'
    return
  }
  pane.innerHTML = `<div class="builder-pick-list">${builderLabels.map((l) => `
    <label class="builder-pick">
      <input type="checkbox" value="${escapeHtml(l.id)}" ${builder.labelIds.has(l.id) ? 'checked' : ''} />
      <span>${escapeHtml(l.name)}</span><small>${l.contactCount} contato(s)</small>
    </label>`).join('')}</div>`
  for (const input of pane.querySelectorAll('input[type="checkbox"]')) {
    input.addEventListener('change', () => {
      if (input.checked) builder.labelIds.add(input.value)
      else builder.labelIds.delete(input.value)
      refreshLabelsCount()
    })
  }
  refreshLabelsCount()
}

async function renderContactsPane(pane) {
  pane.innerHTML = '<p class="muted">Carregando contatos...</p>'
  if (!builderAllContacts) {
    try {
      builderAllContacts = await (await fetch('/api/contacts')).json()
    } catch {
      builderAllContacts = []
    }
  }
  if (!builder || builder.audienceType !== 'contacts') return
  pane.innerHTML = `
    <input type="text" class="labels-search" id="builder-contacts-search" placeholder="Buscar por nome ou número..." value="${escapeHtml(builder.contactsQuery)}" />
    <div class="panel-header-actions" style="margin-bottom: 8px;">
      <button type="button" class="secondary small" id="builder-contacts-all">Selecionar todos os filtrados</button>
      <button type="button" class="secondary small" id="builder-contacts-none">Limpar seleção</button>
      <span class="muted" id="builder-contacts-info"></span>
    </div>
    <div class="builder-pick-list" id="builder-contacts-list"></div>
  `
  const listEl = pane.querySelector('#builder-contacts-list')
  const infoEl = pane.querySelector('#builder-contacts-info')
  const filtered = () => {
    const q = builder.contactsQuery.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    if (!q) return builderAllContacts
    return builderAllContacts.filter((c) => (c.name || '').toLowerCase().includes(q) || (digits && c.jid.split('@')[0].includes(digits)))
  }
  const draw = () => {
    const items = filtered()
    infoEl.textContent = items.length > CONTACTS_RENDER_LIMIT ? `mostrando ${CONTACTS_RENDER_LIMIT} de ${items.length} — refine a busca` : `${items.length} contato(s)`
    listEl.innerHTML = items.slice(0, CONTACTS_RENDER_LIMIT).map((c) => `
      <label class="builder-pick">
        <input type="checkbox" value="${escapeHtml(c.jid)}" ${builder.contacts.has(c.jid) ? 'checked' : ''} />
        <span>${escapeHtml(c.name || c.jid.split('@')[0])}</span><small>${c.jid.endsWith('@s.whatsapp.net') ? '+' + c.jid.split('@')[0] : ''}</small>
      </label>`).join('') || '<p class="muted">Nenhum contato encontrado.</p>'
    for (const input of listEl.querySelectorAll('input')) {
      input.addEventListener('change', () => {
        const contact = builderAllContacts.find((c) => c.jid === input.value)
        if (input.checked && contact) builder.contacts.set(contact.jid, { jid: contact.jid, name: contact.name || null })
        else builder.contacts.delete(input.value)
        renderAudienceSummary()
      })
    }
    renderAudienceSummary()
  }
  pane.querySelector('#builder-contacts-search').addEventListener('input', (e) => {
    builder.contactsQuery = e.target.value
    draw()
  })
  pane.querySelector('#builder-contacts-all').addEventListener('click', () => {
    for (const c of filtered()) builder.contacts.set(c.jid, { jid: c.jid, name: c.name || null })
    draw()
  })
  pane.querySelector('#builder-contacts-none').addEventListener('click', () => {
    builder.contacts.clear()
    draw()
  })
  draw()
}

function renderSpreadsheetPane(pane) {
  const sheet = builder.sheet
  const columnOptions = (selected, withNone) =>
    (withNone ? '<option value="">Nenhuma</option>' : '<option value="">Escolha...</option>') +
    sheet.headers.map((h, i) => `<option value="${i}" ${String(selected) === String(i) ? 'selected' : ''}>${escapeHtml(h || `Coluna ${i + 1}`)}</option>`).join('')

  pane.innerHTML = `
    <p class="notice confirm">Mandar para quem ainda não tem seu contato salvo aumenta o risco de bloqueio. Prefira listas
      de quem já conhece seu negócio, lotes menores e um ritmo de envio mais lento.</p>
    <div class="followup-file-row">
      <button type="button" class="secondary small" id="builder-sheet-btn">📄 ${sheet.file ? 'Trocar planilha' : 'Escolher planilha (.xlsx ou .csv)'}</button>
      <span>${sheet.file ? escapeHtml(sheet.file.name) + ` — ${sheet.totalRows} linha(s)` : 'precisa ter uma coluna com o telefone'}</span>
      <input type="file" id="builder-sheet-input" accept=".xlsx,.csv" hidden />
    </div>
    ${sheet.headers.length > 0 ? `
      <div class="settings-grid" style="margin-top: 12px;">
        <div class="field"><label>Coluna do telefone</label><select id="builder-sheet-phone">${columnOptions(sheet.phoneColumn, false)}</select></div>
        <div class="field"><label>Coluna do nome (opcional)</label><select id="builder-sheet-name">${columnOptions(sheet.nameColumn, true)}</select></div>
      </div>
      <button type="button" class="small" id="builder-sheet-validate" style="margin-top: 10px;">Conferir números no WhatsApp</button>
      <p class="field-hint">Cada número é conferido no WhatsApp antes de poder receber — nada é enviado nesta etapa.</p>
    ` : ''}
    ${sheet.summary ? `
      <p class="muted" style="margin-top: 10px;">✅ ${sheet.summary.valid} com WhatsApp · ❌ ${sheet.summary.invalid} sem WhatsApp · ⚠️ ${sheet.summary.unparseable} inválidos${sheet.summary.optedOut ? ` · 🚫 ${sheet.summary.optedOut} pediram para sair` : ''}</p>
      <div class="builder-pick-list">${sheet.results.filter((r) => r.status === 'valid').map((r) => `
        <label class="builder-pick">
          <input type="checkbox" value="${escapeHtml(r.jid)}" ${sheet.selected.has(r.jid) ? 'checked' : ''} />
          <span>${escapeHtml(r.name || r.rawPhone)}</span><small>${escapeHtml(r.rawPhone)}</small>
        </label>`).join('')}</div>
    ` : ''}
  `
  const fileInput = pane.querySelector('#builder-sheet-input')
  pane.querySelector('#builder-sheet-btn').addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0]
    if (!file) return
    setBuilderError('')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/cold-contacts/preview', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não consegui ler a planilha.')
      builder.sheet = { file, headers: data.headers, previewRows: data.previewRows, totalRows: data.totalRows, phoneColumn: '', nameColumn: '', results: null, selected: new Set(), summary: null }
      const guess = data.headers.findIndex((h) => /fone|cel|whats|telefone|phone|n[uú]mero/i.test(h || ''))
      if (guess >= 0) builder.sheet.phoneColumn = String(guess)
      const nameGuess = data.headers.findIndex((h) => /nome|name|cliente/i.test(h || ''))
      if (nameGuess >= 0) builder.sheet.nameColumn = String(nameGuess)
    } catch (err) {
      setBuilderError(err.message)
    }
    renderAudienceStep()
  })
  pane.querySelector('#builder-sheet-phone')?.addEventListener('change', (e) => { sheet.phoneColumn = e.target.value })
  pane.querySelector('#builder-sheet-name')?.addEventListener('change', (e) => { sheet.nameColumn = e.target.value })
  pane.querySelector('#builder-sheet-validate')?.addEventListener('click', async (e) => {
    if (sheet.phoneColumn === '') {
      setBuilderError('Escolha qual coluna é o telefone.')
      return
    }
    setBuilderError('')
    e.target.disabled = true
    e.target.textContent = 'Conferindo...'
    const fd = new FormData()
    fd.append('file', sheet.file)
    fd.append('phoneColumn', sheet.phoneColumn)
    if (sheet.nameColumn !== '') fd.append('nameColumn', sheet.nameColumn)
    try {
      const res = await fetch('/api/cold-contacts/validate', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não consegui conferir os números.')
      sheet.results = data.results
      sheet.summary = data.summary
      sheet.variables = data.variables || [] // colunas da planilha que viram {{variável}}
      sheet.selected = new Set(data.results.filter((r) => r.status === 'valid').map((r) => r.jid))
    } catch (err) {
      setBuilderError(err.message)
    }
    renderAudienceStep()
  })
  for (const input of pane.querySelectorAll('.builder-pick-list input')) {
    input.addEventListener('change', () => {
      if (input.checked) sheet.selected.add(input.value)
      else sheet.selected.delete(input.value)
      renderAudienceSummary()
    })
  }
}

function audiencePayload() {
  if (builder.audienceType === 'labels') return { type: 'labels', labelIds: Array.from(builder.labelIds) }
  if (builder.audienceType === 'contacts') return { type: 'contacts', contacts: Array.from(builder.contacts.values()) }
  const contacts = builder.sheet.results
    .filter((r) => r.status === 'valid' && builder.sheet.selected.has(r.jid))
    .map((r) => ({ jid: r.jid, name: r.name || null, vars: r.vars || {} }))
  return { type: 'spreadsheet', contacts }
}

// Colunas da planilha (público "Planilha") que viram variáveis por contato: {{empresa}}...
function sheetVarKeys() {
  return builder.audienceType === 'spreadsheet' ? (builder.sheet.variables || []).map((v) => v.key) : []
}

// Um contato da planilha para a pré-visualização mostrar os valores de verdade das colunas
function sampleSheetRow() {
  if (builder.audienceType !== 'spreadsheet' || !builder.sheet.results) return null
  return builder.sheet.results.find((r) => r.status === 'valid' && builder.sheet.selected.has(r.jid)) || null
}

// ===== Passo 3: Mensagens =====

function variableMap() {
  return Object.fromEntries(builder.variables.map((v) => [v.key, v.value]))
}

function finalFirstMessage() {
  const text = builder.message.trim()
  if (!builder.appendOptOut) return text
  return text ? `${text}\n\n${OPT_OUT_FOOTER}` : OPT_OUT_FOOTER
}

// Variáveis usadas nas mensagens que não têm valor: nem da campanha ("Variáveis"), nem
// colunas da planilha do público. Mesma comparação do servidor (sem acento/maiúscula).
function missingBuilderVariables() {
  const defined = [...builder.variables.map((v) => v.key), ...sheetVarKeys()]
  return unknownVariablesIn([builder.message, ...builder.followups.map((f) => f.message)], defined)
}

// Mesmo resultado que o servidor + motor de envio vão produzir pra um contato de exemplo.
function previewText(text) {
  const vars = variableMap()
  const row = sampleSheetRow()
  const name = row?.name || SAMPLE_CONTACT_NAME
  const sheetKeys = sheetVarKeys()
  return String(text || '').replace(MESSAGE_VAR_RE, (m, raw, fallback) => {
    const key = normalizeVarKey(raw)
    if (key === 'primeiro_nome') return name.split(' ')[0]
    if (key === 'nome') return name
    const v = vars[key]
    if (v && v.trim()) return v
    const cell = row?.vars?.[key]
    if (cell && String(cell).trim()) return cell
    if (fallback !== undefined) return fallback // texto reserva
    if (sheetKeys.includes(key)) return '' // coluna vazia para este contato: o espaço some
    return `⚠️{{${raw}}}`
  }).replace(/[ \t]+([,.!?;:])/g, '$1').replace(/[ \t]{2,}/g, ' ')
}

function formatWhatsappText(text) {
  return escapeHtml(text)
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/~([^~\n]+)~/g, '<s>$1</s>')
    .replace(/\n/g, '<br>')
}

function insertIntoTextarea(textarea, token) {
  if (!textarea) return
  const start = textarea.selectionStart ?? textarea.value.length
  const end = textarea.selectionEnd ?? textarea.value.length
  textarea.value = textarea.value.slice(0, start) + token + textarea.value.slice(end)
  textarea.selectionStart = textarea.selectionEnd = start + token.length
  textarea.dispatchEvent(new Event('input'))
  textarea.focus()
}

function renderMessagesStep() {
  builderBody.innerHTML = `
    <div class="builder-columns">
      <div class="builder-main">
        <div class="settings-grid">
          <div class="field field-full">
            <label for="builder-name">Nome da campanha</label>
            <input type="text" id="builder-name" class="builder-input" maxlength="80" placeholder="Ex: Black Friday — clientes antigos" />
          </div>
          <div class="field field-full">
            <label for="builder-description">Objetivo / assunto (só para você)</label>
            <input type="text" id="builder-description" class="builder-input" maxlength="500" placeholder="Ex: vender o estoque de verão até domingo" />
          </div>
        </div>

        <h3 class="builder-section-title">Variáveis</h3>
        <p class="field-hint">Valores que você preenche uma vez e entram no texto onde estiver <code>{{chave}}</code>.
          <code>{{primeiro_nome}}</code> e <code>{{nome}}</code> são automáticos para cada contato${sheetVarKeys().length ? ', e as colunas da planilha também (mudam para cada contato)' : ''}.
          Se algum cliente não tiver o dado, o espaço some sozinho; para outro texto, use <code>{{empresa|sua empresa}}</code>.</p>
        <div id="builder-variables"></div>
        <button type="button" class="secondary small" id="builder-add-variable">+ Nova variável</button>

        <h3 class="builder-section-title">Primeira mensagem</h3>
        <div class="builder-chips" id="builder-chips"></div>
        <textarea id="builder-message" rows="6" placeholder="Escreva a mensagem. Termine com uma pergunta fácil de responder — resposta gera conversa e conversa gera venda."></textarea>
        <div class="followup-file-row">
          <button type="button" class="secondary small" id="builder-file-btn">📎 ${builder.file ? 'Trocar arquivo' : 'Anexar arquivo'}</button>
          <span>${builder.file ? escapeHtml(builder.file.name) : 'opcional — imagem, PDF, vídeo ou áudio (vira nota de voz)'}</span>
          ${builder.file ? '<button type="button" class="secondary small" id="builder-file-clear">Tirar arquivo</button>' : ''}
          <input type="file" id="builder-file-input" accept=".pdf,image/*,video/*,audio/*" hidden />
        </div>
        <label class="checkbox-field">
          <input type="checkbox" id="builder-optout" ${builder.appendOptOut ? 'checked' : ''} />
          Adicionar no final: "${OPT_OUT_FOOTER}" (recomendado — reduz denúncias e bloqueios)
        </label>

        <h3 class="builder-section-title">Follow-ups — para quem não responder</h3>
        <div id="builder-followups"></div>
        <button type="button" class="secondary small" id="builder-add-followup">+ Adicionar follow-up</button>
      </div>
      <div class="builder-preview">
        <h3 class="builder-section-title">Pré-visualização</h3>
        <p class="field-hint">Como chega para "${SAMPLE_CONTACT_NAME}".</p>
        <div class="builder-phone" id="builder-preview"></div>
      </div>
    </div>
  `

  const nameInput = builderBody.querySelector('#builder-name')
  nameInput.value = builder.name
  nameInput.addEventListener('input', () => { builder.name = nameInput.value })
  const descInput = builderBody.querySelector('#builder-description')
  descInput.value = builder.description
  descInput.addEventListener('input', () => { builder.description = descInput.value })

  const messageInput = builderBody.querySelector('#builder-message')
  messageInput.value = builder.message
  messageInput.addEventListener('input', () => {
    builder.message = messageInput.value
    renderBuilderPreview()
  })
  messageInput.addEventListener('focus', () => { lastFocusedTextarea = messageInput })
  lastFocusedTextarea = messageInput

  const fileInput = builderBody.querySelector('#builder-file-input')
  builderBody.querySelector('#builder-file-btn').addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', () => {
    builder.file = fileInput.files[0] || null
    renderMessagesStep()
  })
  builderBody.querySelector('#builder-file-clear')?.addEventListener('click', () => {
    builder.file = null
    renderMessagesStep()
  })
  builderBody.querySelector('#builder-optout').addEventListener('change', (e) => {
    builder.appendOptOut = e.target.checked
    renderBuilderPreview()
  })

  builderBody.querySelector('#builder-add-variable').addEventListener('click', () => {
    builder.variables.push({ key: '', label: '', value: '', example: '', custom: true })
    renderBuilderVariables()
  })
  builderBody.querySelector('#builder-add-followup').addEventListener('click', () => {
    if (builder.followups.length >= MAX_FOLLOWUP_STEPS) return
    builder.followups.push({ delayDays: builder.followups.length === 0 ? 2 : 3, message: '', file: null })
    renderBuilderFollowups()
  })

  renderBuilderVariables()
  renderBuilderFollowups()
  renderBuilderPreview()
}

function renderBuilderChips() {
  const chipsEl = builderBody.querySelector('#builder-chips')
  if (!chipsEl) return
  const sheetKeys = sheetVarKeys()
  const keys = Array.from(new Set(['primeiro_nome', 'nome', ...builder.variables.map((v) => v.key).filter(Boolean), ...sheetKeys]))
  chipsEl.innerHTML = '<span class="muted">Inserir:</span> ' + keys.map((k) => {
    const col = sheetKeys.includes(k) ? (builder.sheet.variables || []).find((v) => v.key === k) : null
    return `<button type="button" class="builder-chip" data-key="${escapeHtml(k)}"${col ? ` title="Coluna da planilha: ${escapeHtml(col.header)} (muda para cada contato)"` : ''}>{{${escapeHtml(k)}}}</button>`
  }).join('')
  for (const chip of chipsEl.querySelectorAll('.builder-chip')) {
    // mousedown + preventDefault: não tira o foco do campo de texto antes de inserir
    chip.addEventListener('mousedown', (e) => e.preventDefault())
    chip.addEventListener('click', () => insertIntoTextarea(lastFocusedTextarea, `{{${chip.dataset.key}}}`))
  }
}

function renderBuilderVariables() {
  const container = builderBody.querySelector('#builder-variables')
  container.innerHTML = builder.variables.length === 0 ? '<p class="muted" style="margin: 6px 0;">Nenhuma variável.</p>' : ''
  builder.variables.forEach((v, index) => {
    const row = document.createElement('div')
    row.className = 'builder-variable'
    row.innerHTML = v.custom
      ? `<input type="text" class="builder-input var-key" placeholder="chave (ex: cupom)" maxlength="30" />
         <input type="text" class="builder-input var-value" placeholder="valor (ex: BLACK30)" />
         <button type="button" class="secondary small var-remove">Remover</button>`
      : `<span class="var-label"><code>{{${escapeHtml(v.key)}}}</code> ${escapeHtml(v.label)}</span>
         <${v.key === 'ofertas' ? 'textarea rows="3"' : 'input type="text"'} class="builder-input var-value" placeholder="${escapeHtml(v.example ? 'Ex: ' + v.example : '')}"${v.key === 'ofertas' ? '></textarea>' : ' />'}
         <button type="button" class="secondary small var-remove">Remover</button>`
    const keyInput = row.querySelector('.var-key')
    if (keyInput) {
      keyInput.value = v.key
      keyInput.addEventListener('input', () => {
        v.key = keyInput.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
        renderBuilderChips()
        renderBuilderPreview()
      })
    }
    const valueInput = row.querySelector('.var-value')
    valueInput.value = v.value
    valueInput.addEventListener('input', () => {
      v.value = valueInput.value
      renderBuilderPreview()
    })
    row.querySelector('.var-remove').addEventListener('click', () => {
      builder.variables.splice(index, 1)
      renderBuilderVariables()
    })
    container.appendChild(row)
  })
  renderBuilderChips()
  renderBuilderPreview()
}

function renderBuilderFollowups() {
  const container = builderBody.querySelector('#builder-followups')
  container.innerHTML = builder.followups.length === 0
    ? '<p class="muted" style="margin: 6px 0;">Sem follow-up — só a primeira mensagem e o funil de vendas.</p>'
    : ''
  builder.followups.forEach((step, index) => {
    const el = document.createElement('div')
    el.className = 'followup-step'
    el.innerHTML = `
      <div class="followup-step-header">
        <strong>Follow-up ${index + 1}</strong>
        <button type="button" class="secondary small fu-remove">Remover</button>
      </div>
      <div class="followup-delay">
        Enviar se não responder em
        <input type="number" min="1" max="60" step="1" class="fu-delay" value="${step.delayDays}" />
        dia(s) ${index === 0 ? 'depois da primeira mensagem' : `depois do follow-up ${index}`}
      </div>
      <textarea class="fu-message" rows="3" placeholder="Traga algo novo: um benefício, uma prova, um prazo — não só 'viu minha mensagem?'"></textarea>
      <div class="followup-file-row">
        <button type="button" class="secondary small fu-file-btn">📎 ${step.file ? 'Trocar arquivo' : 'Anexar arquivo'}</button>
        <span>${step.file ? escapeHtml(step.file.name) : 'opcional'}</span>
        ${step.file ? '<button type="button" class="secondary small fu-file-clear">Tirar arquivo</button>' : ''}
        <input type="file" class="fu-file-input" accept=".pdf,image/*,video/*,audio/*" hidden />
      </div>
    `
    const msg = el.querySelector('.fu-message')
    msg.value = step.message
    msg.addEventListener('input', () => {
      step.message = msg.value
      renderBuilderPreview()
    })
    msg.addEventListener('focus', () => { lastFocusedTextarea = msg })
    el.querySelector('.fu-delay').addEventListener('input', (e) => {
      step.delayDays = e.target.value
      renderBuilderPreview()
    })
    const fileInput = el.querySelector('.fu-file-input')
    el.querySelector('.fu-file-btn').addEventListener('click', () => fileInput.click())
    fileInput.addEventListener('change', () => {
      step.file = fileInput.files[0] || null
      renderBuilderFollowups()
    })
    el.querySelector('.fu-file-clear')?.addEventListener('click', () => {
      step.file = null
      renderBuilderFollowups()
    })
    el.querySelector('.fu-remove').addEventListener('click', () => {
      builder.followups.splice(index, 1)
      renderBuilderFollowups()
    })
    container.appendChild(el)
  })
  builderBody.querySelector('#builder-add-followup').classList.toggle('hidden', builder.followups.length >= MAX_FOLLOWUP_STEPS)
  renderBuilderPreview()
}

function renderBuilderPreview() {
  const el = builderBody.querySelector('#builder-preview')
  if (!el) return
  const bubbles = []
  const first = finalFirstMessage()
  bubbles.push(`<div class="builder-bubble-label">1ª mensagem</div><div class="builder-bubble">${builder.file ? `<div class="builder-bubble-file">📎 ${escapeHtml(builder.file.name)}</div>` : ''}${formatWhatsappText(previewText(first)) || '<span class="muted">(vazia)</span>'}</div>`)
  let day = 0
  builder.followups.forEach((f, i) => {
    day += Number(f.delayDays) || 0
    bubbles.push(`<div class="builder-bubble-label">Follow-up ${i + 1} · dia ${day}, se não responder</div><div class="builder-bubble">${f.file ? `<div class="builder-bubble-file">📎 ${escapeHtml(f.file.name)}</div>` : ''}${formatWhatsappText(previewText(f.message)) || '<span class="muted">(vazia)</span>'}</div>`)
  })
  el.innerHTML = bubbles.join('')
}

// ===== Passo 4: Regras =====

function labelOptions(selected) {
  return '<option value="">Nenhuma</option>' + builderLabels
    .map((l) => `<option value="${escapeHtml(l.id)}" ${l.id === selected ? 'selected' : ''}>${escapeHtml(l.name)}</option>`).join('')
}

function renderRulesStep() {
  const w = builder.sendWindow
  builderBody.innerHTML = `
    <h3 class="builder-section-title">Quando começar</h3>
    <label class="checkbox-field"><input type="radio" name="builder-start" value="now" ${builder.startMode === 'now' ? 'checked' : ''} /> Agora, assim que eu confirmar</label>
    <label class="checkbox-field"><input type="radio" name="builder-start" value="schedule" ${builder.startMode === 'schedule' ? 'checked' : ''} /> Agendar a primeira mensagem</label>
    <div id="builder-schedule-row" class="${builder.startMode === 'schedule' ? '' : 'hidden'}">
      <input type="datetime-local" id="builder-scheduled-for" class="builder-input" value="${escapeHtml(builder.scheduledFor)}" />
      <p class="field-hint">O app precisa estar aberto nesse horário.</p>
    </div>

    <h3 class="builder-section-title">Horário dos follow-ups desta campanha</h3>
    ${builder.followups.length === 0 ? '<p class="field-hint">Esta campanha não tem follow-up — o horário não se aplica.</p>' : ''}
    <div class="campaign-window-days">${WEEKDAYS.map((name, day) => `
      <label><input type="checkbox" class="builder-day" value="${day}" ${w.days.includes(day) ? 'checked' : ''} /> ${name}</label>`).join('')}
    </div>
    <div class="campaign-window-hours">
      <label>Das <input type="time" id="builder-window-start" value="${w.start}" /></label>
      <label>às <input type="time" id="builder-window-end" value="${w.end}" /></label>
    </div>

    <h3 class="builder-section-title">Etiquetas automáticas no WhatsApp</h3>
    <div class="settings-grid">
      <div class="field"><label>Ao receber a 1ª mensagem, aplicar</label><select id="builder-apply-label">${labelOptions(builder.applyLabelId)}</select></div>
      <div class="field"><label>Quando responder, aplicar</label><select id="builder-reply-label">${labelOptions(builder.replyLabelId)}</select></div>
    </div>
    <p class="field-hint">Ex: "Campanha Black Friday" para quem recebeu e "Lead quente" para quem respondeu — assim você filtra direto no WhatsApp Business.</p>

    <h3 class="builder-section-title">Naturalidade do envio</h3>
    <label class="checkbox-field"><input type="checkbox" id="builder-typing" ${builder.simulateTyping ? 'checked' : ''} /> Simular "digitando..." antes de cada mensagem (recomendado)</label>
    <label class="checkbox-field"><input type="checkbox" id="builder-skip-blocked" ${builder.skipBlocked ? 'checked' : ''} /> Pular contatos bloqueados (recomendado)</label>
    <label class="checkbox-field"><input type="checkbox" id="builder-mark-read" ${builder.markAsRead ? 'checked' : ''} /> Marcar conversa como lida depois de enviar</label>
    ${builderSettings ? `<p class="field-hint">Ritmo atual: ${builderSettings.delayMinSec}–${builderSettings.delayMaxSec}s entre mensagens, pausa de ${builderSettings.batchPauseMinutes} min a cada ${builderSettings.batchSize}, limite de ${builderSettings.dailyLimit || 'sem limite'} por dia. Mude em "Configurações de envio".</p>` : ''}
  `
  for (const radio of builderBody.querySelectorAll('input[name="builder-start"]')) {
    radio.addEventListener('change', () => {
      builder.startMode = radio.value
      builderBody.querySelector('#builder-schedule-row').classList.toggle('hidden', radio.value !== 'schedule')
      renderBuilderSteps()
    })
  }
  builderBody.querySelector('#builder-scheduled-for').addEventListener('input', (e) => { builder.scheduledFor = e.target.value })
  for (const day of builderBody.querySelectorAll('.builder-day')) {
    day.addEventListener('change', () => {
      builder.sendWindow.days = Array.from(builderBody.querySelectorAll('.builder-day:checked')).map((d) => Number(d.value))
    })
  }
  builderBody.querySelector('#builder-window-start').addEventListener('input', (e) => { builder.sendWindow.start = e.target.value })
  builderBody.querySelector('#builder-window-end').addEventListener('input', (e) => { builder.sendWindow.end = e.target.value })
  builderBody.querySelector('#builder-apply-label').addEventListener('change', (e) => { builder.applyLabelId = e.target.value })
  builderBody.querySelector('#builder-reply-label').addEventListener('change', (e) => { builder.replyLabelId = e.target.value })
  builderBody.querySelector('#builder-typing').addEventListener('change', (e) => { builder.simulateTyping = e.target.checked })
  builderBody.querySelector('#builder-skip-blocked').addEventListener('change', (e) => { builder.skipBlocked = e.target.checked })
  builderBody.querySelector('#builder-mark-read').addEventListener('change', (e) => { builder.markAsRead = e.target.checked })
}

// ===== Passo 5: Revisão =====

function formatDuration(minutes) {
  if (minutes < 1) return 'menos de 1 minuto'
  if (minutes < 60) return `cerca de ${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `cerca de ${h}h${m ? ` ${m}min` : ''}`
}

async function renderReviewStep() {
  const n = audienceCount()
  let usage = null
  try {
    usage = await (await fetch('/api/settings/usage')).json()
  } catch {
    // sem estimativa de limite diário
  }
  if (!builder || builder.step !== 4) return

  const s = builderSettings
  let estimate = ''
  const warnings = []
  if (s) {
    const avgDelaySec = (s.delayMinSec + s.delayMaxSec) / 2 + (builder.simulateTyping ? 1.6 : 0)
    const pauses = Math.max(0, Math.floor((n - 1) / s.batchSize))
    const minutes = (n * avgDelaySec) / 60 + pauses * s.batchPauseMinutes
    estimate = `A primeira mensagem leva ${formatDuration(minutes)} para sair para todos.`
    if (s.dailyLimit > 0) {
      const remainingToday = usage ? usage.remaining : s.dailyLimit
      if (n > remainingToday) {
        const days = 1 + Math.ceil((n - remainingToday) / s.dailyLimit)
        warnings.push(`Seu limite diário é de ${s.dailyLimit} envios (restam ${remainingToday} hoje). Com ${n} contatos, a 1ª mensagem para quando atingir o limite — o restante não é enviado sozinho. Considere dividir em ${days} campanhas, uma por dia, ou ajustar o limite.`)
      }
    }
  }
  if (builder.audienceType === 'spreadsheet') warnings.push('Público de planilha (quem não tem seu contato) tem mais risco de bloqueio. Comece com um lote pequeno.')
  if (builder.audienceType === 'spreadsheet') {
    const varsWarn = missingColumnsWarning([builder.message, ...builder.followups.map((f) => f.message)], audiencePayload().contacts)
    if (varsWarn) warnings.push(varsWarn)
  }
  if (!/\?\s*$/m.test(builder.message.trim()) && builder.message.trim()) warnings.push('Dica: terminar a 1ª mensagem com uma pergunta aumenta muito a taxa de resposta.')

  const windowText = builder.followups.length > 0 ? describeWindow(builder.sendWindow) : '—'
  const labelName = (id) => builderLabels.find((l) => l.id === id)?.name || 'nenhuma'
  const audienceText = builder.audienceType === 'labels'
    ? `Etiquetas: ${builderLabels.filter((l) => builder.labelIds.has(l.id)).map((l) => l.name).join(', ')}`
    : builder.audienceType === 'contacts' ? 'Contatos escolhidos' : 'Planilha'

  builderBody.innerHTML = `
    <div class="builder-review">
      <div class="review-row"><span>Campanha</span><strong>${escapeHtml(builder.name)}</strong></div>
      ${builder.description ? `<div class="review-row"><span>Objetivo</span><div>${escapeHtml(builder.description)}</div></div>` : ''}
      <div class="review-row"><span>Público</span><div><strong>${n} contato(s)</strong> · ${escapeHtml(audienceText)}${builder.excludeActive ? ' · sem quem já está em outra campanha' : ''}</div></div>
      <div class="review-row"><span>Início</span><div>${builder.startMode === 'schedule' ? new Date(builder.scheduledFor).toLocaleString('pt-BR') : 'Agora'}</div></div>
      <div class="review-row"><span>Mensagens</span><div>1ª mensagem${builder.file ? ' + arquivo' : ''}${builder.followups.length ? ` e ${builder.followups.length} follow-up(s): ${builder.followups.map((f, i) => `${i + 1}º após ${f.delayDays} dia(s)`).join(', ')}` : ', sem follow-up'}</div></div>
      <div class="review-row"><span>Follow-ups saem</span><div>${escapeHtml(windowText)}</div></div>
      <div class="review-row"><span>Etiquetas</span><div>ao receber: ${escapeHtml(labelName(builder.applyLabelId))} · ao responder: ${escapeHtml(labelName(builder.replyLabelId))}</div></div>
      ${builder.variables.length ? `<div class="review-row"><span>Variáveis</span><div>${builder.variables.map((v) => `<code>{{${escapeHtml(v.key)}}}</code> = ${escapeHtml(v.value)}`).join('<br>')}</div></div>` : ''}
      ${estimate ? `<div class="review-row"><span>Tempo</span><div>${escapeHtml(estimate)}</div></div>` : ''}
    </div>
    ${warnings.map((w) => `<p class="notice confirm">${escapeHtml(w)}</p>`).join('')}
    <h3 class="builder-section-title">Como a 1ª mensagem chega</h3>
    <div class="builder-phone builder-phone-inline">
      <div class="builder-bubble">${builder.file ? `<div class="builder-bubble-file">📎 ${escapeHtml(builder.file.name)}</div>` : ''}${formatWhatsappText(previewText(finalFirstMessage()))}</div>
    </div>
  `
}

async function submitBuilder() {
  if (builder.submitting) return
  builder.submitting = true
  builderNextBtn.disabled = true
  builderNextBtn.textContent = builder.startMode === 'schedule' ? 'Agendando...' : 'Iniciando...'
  setBuilderError('')

  const fd = new FormData()
  fd.append('name', builder.name.trim())
  fd.append('description', builder.description.trim())
  if (builder.templateId) fd.append('templateId', builder.templateId)
  fd.append('audienceJson', JSON.stringify(audiencePayload()))
  fd.append('excludeActive', builder.excludeActive ? 'true' : 'false')
  fd.append('message', finalFirstMessage())
  if (builder.file) fd.append('file', builder.file)
  fd.append('variablesJson', JSON.stringify(variableMap()))
  let fileIndex = 0
  const steps = builder.followups.map((f) => {
    const entry = { delayDays: Number(f.delayDays), message: f.message.trim(), fileIndex: null }
    if (f.file) {
      fd.append('followupFiles', f.file)
      entry.fileIndex = fileIndex++
    }
    return entry
  })
  fd.append('followupsJson', JSON.stringify(steps))
  fd.append('sendWindowJson', JSON.stringify(builder.sendWindow))
  if (builder.applyLabelId) fd.append('applyLabelId', builder.applyLabelId)
  if (builder.replyLabelId) fd.append('replyLabelId', builder.replyLabelId)
  fd.append('simulateTyping', builder.simulateTyping ? 'true' : 'false')
  fd.append('skipBlocked', builder.skipBlocked ? 'true' : 'false')
  fd.append('markAsRead', builder.markAsRead ? 'true' : 'false')
  if (builder.startMode === 'schedule') fd.append('scheduledFor', new Date(builder.scheduledFor).toISOString())

  try {
    const res = await fetch('/api/campaigns', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Não foi possível iniciar a campanha.')
    builder = null
    builderView.classList.add('hidden')
    if (data.scheduled) {
      showToast(`Campanha agendada para ${data.total} contato(s).`, 'success')
      showCampaignList()
    } else {
      const skipped = data.excludedActive ? ` (${data.excludedActive} já estavam em outra campanha e ficaram de fora)` : ''
      showToast(`Campanha iniciada para ${data.total} contato(s)${skipped}.`, 'success')
      openCampaignBoard(data.campaignId)
    }
  } catch (err) {
    setBuilderError(err.message)
    if (builder) {
      builder.submitting = false
      builderNextBtn.disabled = false
      renderBuilderStep()
    }
  }
}
