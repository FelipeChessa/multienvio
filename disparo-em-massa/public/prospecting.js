// Módulo "🎯 Prospecção" (leads frios) — interface. Regras e travas: src/prospecting.js.
//
// Três telas no mesmo modal:
// - lista das prospecções (progresso, hoje x/teto, respostas, saídas);
// - assistente em 5 passos: Lista → Triagem → Mensagens → Segurança → Revisão;
// - acompanhamento de uma lista (status de cada lead, pausar/retomar, funil de respostas).
// Usa funções globais de app.js (escapeHtml, showToast, showConfirmDialog) e de campaigns.js
// (openCampaignBoard, closeCampaignsModal, describeWindow, WEEKDAYS).

const PR_STEPS = ['Lista', 'Triagem', 'Mensagens', 'Segurança', 'Revisão']
const PR_OPTOUT_FOOTER = 'Se não quiser receber mensagens, é só responder SAIR.'
const PR_STATUS = {
  valid: { label: 'Com WhatsApp', icon: '✅', selectable: true },
  contact: { label: 'Já é seu contato', icon: '👤', selectable: true },
  no_whatsapp: { label: 'Sem WhatsApp', icon: '❌' },
  invalid: { label: 'Número inválido', icon: '⚠️' },
  duplicate: { label: 'Repetido na lista', icon: '🔁' },
  optout: { label: 'Pediu para sair', icon: '🚫' },
  recent: { label: 'Prospectado há < 30 dias', icon: '⏳' }
}
const PR_LEAD_STATUS = {
  pending: { label: 'Aguardando', cls: '' },
  sent: { label: 'Enviado', cls: 'ok' },
  replied: { label: 'Respondeu', cls: 'good' },
  optout: { label: 'Pediu para sair', cls: 'bad' },
  failed: { label: 'Falhou', cls: 'bad' },
  skipped: { label: 'Pulado', cls: '' }
}

const prModal = document.getElementById('prospects-modal')
const prListView = document.getElementById('pr-list-view')
const prWizardView = document.getElementById('pr-wizard-view')
const prDetailView = document.getElementById('pr-detail-view')
const prBody = document.getElementById('pr-body')
const prStepsEl = document.getElementById('pr-steps')
const prError = document.getElementById('pr-error')
const prNext = document.getElementById('pr-next')
const prBack = document.getElementById('pr-back')
const prFooterInfo = document.getElementById('pr-footer-info')

let pw = null // estado do assistente
let prPresets = null
let prRefreshTimer = null
let prCurrentId = null
let prDetailFilter = 'all'
let prAnalyzeTimer = null

function prShow(view) {
  for (const v of [prListView, prWizardView, prDetailView]) v.classList.toggle('hidden', v !== view)
}

function prStopRefresh() {
  if (prRefreshTimer) clearInterval(prRefreshTimer)
  prRefreshTimer = null
}

async function openProspecting() {
  closeCampaignsModal?.()
  prModal.classList.remove('hidden')
  await showProspectList()
}

function closeProspecting() {
  prStopRefresh()
  prModal.classList.add('hidden')
  pw = null
}

function prSetError(msg) {
  prError.textContent = msg || ''
  prError.classList.toggle('hidden', !msg)
}

function prPct(v) { return `${Math.round((v || 0) * 100)}%` }

// ===== Lista =====

async function showProspectList() {
  prStopRefresh()
  prCurrentId = null
  prShow(prListView)
  await loadProspectList()
  prRefreshTimer = setInterval(loadProspectList, 20000)
}

function prStatusPill(s) {
  if (s.sendingNow) return { text: 'enviando agora', cls: 'sending' }
  if (s.status === 'paused') return { text: 'pausada', cls: 'paused' }
  if (s.status === 'done') return { text: 'concluída', cls: '' }
  if (s.startAt && s.startAt > Date.now()) return { text: 'agendada', cls: 'sending' }
  return { text: 'ativa', cls: '' }
}

async function loadProspectList() {
  let list = []
  try { list = await (await fetch('/api/prospects')).json() } catch { return }
  const el = document.getElementById('pr-list')
  document.getElementById('pr-empty').classList.toggle('hidden', list.length > 0)
  el.innerHTML = ''
  for (const s of list) {
    const pill = prStatusPill(s)
    const sent = s.total - s.counts.pending - s.counts.skipped
    const card = document.createElement('div')
    card.className = 'campaign-card'
    card.innerHTML = `
      <div>
        <h3>${escapeHtml(s.name)} <span class="campaign-status ${pill.cls}">${pill.text}</span></h3>
        <div class="campaign-meta">${s.total} leads · hoje ${s.todaySent}/${s.todayCap} · perfil ${escapeHtml(s.preset)}${s.etaDays ? ` · termina em ~${s.etaDays} dia(s)` : ''}</div>
        <div class="pr-bar"><i style="width:${s.total ? Math.round((sent / s.total) * 100) : 0}%"></i></div>
      </div>
      <div class="campaign-card-numbers">
        <div><strong>${sent}/${s.total}</strong><span>enviados</span></div>
        <div><strong>${prPct(s.replyRate)}</strong><span>responderam</span></div>
        <div><strong class="${s.optOutRate >= 0.05 ? 'pr-warn' : ''}">${prPct(s.optOutRate)}</strong><span>pediram para sair</span></div>
      </div>
      ${s.pausedReason ? `<div class="campaign-preview pr-warn">⚠️ ${escapeHtml(s.pausedReason)}</div>` : ''}
    `
    card.addEventListener('click', () => openProspectDetail(s.id))
    el.appendChild(card)
  }
}

// ===== Assistente =====

async function openProspectWizard() {
  prStopRefresh()
  if (!prPresets) {
    try { prPresets = await (await fetch('/api/prospects/presets')).json() } catch { prPresets = null }
  }
  pw = {
    step: 0, file: null, headers: [], previewRows: [], totalRows: 0, phoneColumn: '', nameColumn: '',
    triage: null, selected: new Set(), filter: 'all', search: '', name: '', manualText: '',
    variants: ['', ''], appendOptOut: true, followups: [],
    preset: 'conservador', custom: null, sendWindow: { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' },
    startMode: 'now', startAt: '', consent: false, quality: null, previews: [], busy: false
  }
  prShow(prWizardView)
  prRender()
}

function prRenderSteps() {
  prStepsEl.innerHTML = PR_STEPS.map((t, i) => `<li class="${i === pw.step ? 'active' : i < pw.step ? 'done' : ''}" data-step="${i}"><span>${i < pw.step ? '✓' : i + 1}</span>${t}</li>`).join('')
  for (const li of prStepsEl.querySelectorAll('li.done')) li.addEventListener('click', () => prGo(Number(li.dataset.step)))
}

function prGo(step) {
  prSetError('')
  pw.step = step
  prRender()
  prBody.scrollTop = 0
}

function prRender() {
  prRenderSteps()
  prBack.classList.toggle('hidden', pw.step === 0)
  prNext.disabled = pw.busy
  prNext.textContent = pw.step === PR_STEPS.length - 1 ? '🚀 Iniciar prospecção' : pw.step === 0 ? 'Conferir números no WhatsApp' : 'Próximo'
  prFooterInfo.textContent = ''
  ;[prRenderUpload, prRenderTriage, prRenderMessages, prRenderSafety, prRenderReview][pw.step]()
}

function prSelectedLeads() {
  if (!pw.triage) return []
  return pw.triage.results.filter((r) => pw.selected.has(r.row) && PR_STATUS[r.status]?.selectable)
}

function prFinalVariants() {
  return pw.variants.map((v) => {
    const t = v.trim()
    if (!pw.appendOptOut || !t || /\bsair\b/i.test(t)) return t
    return `${t}\n\n${PR_OPTOUT_FOOTER}`
  })
}

function prSafety() {
  const base = { ...(prPresets?.presets?.[pw.preset] || {}) }
  return { ...base, ...(pw.custom || {}), preset: pw.preset, sendWindow: pw.sendWindow }
}

// estimativa de dias com aquecimento (mesma conta do servidor)
function prEstimateDays(n, s) {
  let days = 0, sent = 0
  while (sent < n && days < 3650) {
    sent += Math.min(s.dailyCap, s.warmupStart + s.warmupStep * days)
    days++
  }
  return days
}

// ----- Passo 1: lista -----

// Números digitados à mão: um por linha, com o nome opcional antes ou depois
// ("Maria Souza, (11) 99999-0000", "11999990000 - João", "+55 21 98888-7777").
function prParseManual(text) {
  const out = []
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    // telefone: opcional "+", opcional "(" do DDD, depois dígitos/espaços/pontuação
    const match = line.match(/\+?\(?\d[\d\s().-]{7,}\d/)
    if (!match) { out.push({ name: '', phone: line, invalid: true }); continue }
    const name = (line.slice(0, match.index) + ' ' + line.slice(match.index + match[0].length))
      .replace(/[,;|\t–—()-]+/g, ' ').replace(/\s+/g, ' ').trim()
    out.push({ name, phone: match[0].trim() })
  }
  return out
}

function prRenderUpload() {
  const cols = (sel, none) => (none ? '<option value="">Nenhuma</option>' : '<option value="">Escolha...</option>') +
    pw.headers.map((h, i) => `<option value="${i}" ${String(sel) === String(i) ? 'selected' : ''}>${escapeHtml(h || `Coluna ${i + 1}`)}</option>`).join('')
  prBody.innerHTML = `
    <div class="field" style="max-width:520px"><label>Nome da lista</label>
      <input type="text" id="pr-name" class="builder-input" maxlength="80" placeholder="Ex: Lojas de moda — Zona Sul" /></div>

    <h3 class="builder-section-title">Planilha</h3>
    ${pw.file ? `
      <div class="pr-file-chip">
        <span class="pr-file-icon">📄</span>
        <div><b>${escapeHtml(pw.file.name)}</b><small>${pw.totalRows} linha(s) · ${pw.headers.length} coluna(s)</small></div>
        <button type="button" class="secondary small" id="pr-file-change">Trocar</button>
        <button type="button" class="secondary small" id="pr-file-remove">Remover</button>
      </div>` : `
      <div id="pr-drop" class="dropzone pr-drop-compact">
        <span>📄 Arraste a planilha (.xlsx ou .csv) ou <u>clique para escolher</u>. Colunas extras viram variáveis, como <code>{{empresa}}</code>.</span>
      </div>`}
    <input type="file" id="pr-file" accept=".xlsx,.csv" hidden />
    ${pw.headers.length ? `
      <div class="settings-grid" style="margin-top:14px">
        <div class="field"><label>Coluna do telefone</label><select id="pr-phone-col" class="builder-input">${cols(pw.phoneColumn, false)}</select></div>
        <div class="field"><label>Coluna do nome (recomendado)</label><select id="pr-name-col" class="builder-input">${cols(pw.nameColumn, true)}</select></div>
      </div>
      <div class="pr-table-wrap" style="margin-top:12px"><table class="pr-table">
        <thead><tr>${pw.headers.map((h, i) => `<th class="${String(i) === String(pw.phoneColumn) ? 'pr-col-phone' : String(i) === String(pw.nameColumn) ? 'pr-col-name' : ''}">${escapeHtml(h || `Coluna ${i + 1}`)}</th>`).join('')}</tr></thead>
        <tbody>${pw.previewRows.map((r) => `<tr>${pw.headers.map((_, i) => `<td>${escapeHtml(r[i] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <p class="field-hint">Primeiras linhas da planilha.</p>` : ''}

    <h3 class="builder-section-title">Digitar números ${pw.file ? '<span class="label-optional">opcional — somam à planilha</span>' : ''}</h3>
    <textarea id="pr-manual" rows="4" placeholder="Um por linha. O nome é opcional:&#10;Maria Souza, (11) 99999-0000&#10;(21) 98888-7777 - João&#10;+55 31 97777-6666"></textarea>
    <p class="field-hint" id="pr-manual-info"></p>

    <p class="field-hint">Na próxima etapa cada número é conferido no WhatsApp — <strong>nada é enviado agora</strong>. A conferência é feita
      em lotes pequenos, com pausas, e pode levar alguns minutos em listas grandes.</p>
  `
  const nameInput = prBody.querySelector('#pr-name')
  nameInput.value = pw.name
  nameInput.addEventListener('input', () => { pw.name = nameInput.value })

  const fileInput = prBody.querySelector('#pr-file')
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) prLoadFile(fileInput.files[0]) })
  const drop = prBody.querySelector('#pr-drop')
  if (drop) {
    drop.addEventListener('click', () => fileInput.click())
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragover') })
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'))
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('dragover'); if (e.dataTransfer.files[0]) prLoadFile(e.dataTransfer.files[0]) })
  }
  prBody.querySelector('#pr-file-change')?.addEventListener('click', () => fileInput.click())
  prBody.querySelector('#pr-file-remove')?.addEventListener('click', () => {
    Object.assign(pw, { file: null, headers: [], previewRows: [], totalRows: 0, phoneColumn: '', nameColumn: '', triage: null })
    prRender()
  })
  prBody.querySelector('#pr-phone-col')?.addEventListener('change', (e) => { pw.phoneColumn = e.target.value; prRender() })
  prBody.querySelector('#pr-name-col')?.addEventListener('change', (e) => { pw.nameColumn = e.target.value; prRender() })

  const manualInput = prBody.querySelector('#pr-manual')
  const manualInfo = prBody.querySelector('#pr-manual-info')
  const updateManualInfo = () => {
    const list = prParseManual(pw.manualText)
    const bad = list.filter((m) => m.invalid).length
    manualInfo.textContent = list.length === 0 ? '' : `${list.length - bad} número(s) digitado(s)${bad ? ` · ${bad} linha(s) sem número reconhecível` : ''}`
    const total = (pw.totalRows || 0) + list.length - bad
    prFooterInfo.textContent = total ? `${total} número(s) para conferir` : ''
  }
  manualInput.value = pw.manualText
  manualInput.addEventListener('input', () => { pw.manualText = manualInput.value; pw.triage = null; updateManualInfo() })
  updateManualInfo()
}

async function prLoadFile(file) {
  prSetError('')
  const fd = new FormData()
  fd.append('file', file)
  try {
    const res = await fetch('/api/prospects/preview', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    Object.assign(pw, { file, headers: data.headers, previewRows: data.previewRows, totalRows: data.totalRows, triage: null, selected: new Set() })
    const phoneGuess = data.headers.findIndex((h) => /fone|cel|whats|telefone|phone|n[uú]mero/i.test(h || ''))
    const nameGuess = data.headers.findIndex((h) => /^nome|name|cliente|contato/i.test(h || ''))
    pw.phoneColumn = phoneGuess >= 0 ? String(phoneGuess) : ''
    pw.nameColumn = nameGuess >= 0 ? String(nameGuess) : ''
    if (!pw.name) pw.name = file.name.replace(/\.(xlsx|csv)$/i, '')
  } catch (err) {
    prSetError(err.message || 'Não consegui ler a planilha.')
  }
  prRender()
}

async function prRunTriage() {
  pw.busy = true
  prNext.disabled = true
  const manual = prParseManual(pw.manualText).filter((m) => !m.invalid).map(({ name, phone }) => ({ name, phone }))
  const total = pw.totalRows + manual.length
  prNext.textContent = 'Conferindo…'
  prFooterInfo.textContent = `Conferindo ${total} número(s) no WhatsApp em lotes pequenos — pode levar ~${Math.max(1, Math.ceil(total / 40 * 1.8 / 60))} min.`
  const fd = new FormData()
  if (pw.file) {
    fd.append('file', pw.file)
    fd.append('phoneColumn', pw.phoneColumn)
    if (pw.nameColumn !== '') fd.append('nameColumn', pw.nameColumn)
  }
  fd.append('manualJson', JSON.stringify(manual))
  try {
    const res = await fetch('/api/prospects/triage', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    pw.triage = data
    pw.selected = new Set(data.results.filter((r) => PR_STATUS[r.status]?.selectable).map((r) => r.row))
    pw.busy = false
    prGo(1)
  } catch (err) {
    pw.busy = false
    prSetError(err.message || 'Não consegui conferir os números.')
    prRender()
  }
}

// ----- Passo 2: triagem -----
function prRenderTriage() {
  const { results, summary } = pw.triage
  const order = ['valid', 'contact', 'no_whatsapp', 'invalid', 'duplicate', 'optout', 'recent']
  const q = pw.search.trim().toLowerCase()
  const visible = results.filter((r) => (pw.filter === 'all' || r.status === pw.filter) &&
    (!q || (r.name || '').toLowerCase().includes(q) || r.rawPhone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§')))
  const varKeys = pw.triage.varKeys.slice(0, 3)
  prBody.innerHTML = `
    <p class="builder-intro">Revise quem vai receber. Só dá para selecionar números <strong>com WhatsApp</strong>. Quem já pediu para sair
      ou já recebeu prospecção nos últimos 30 dias fica de fora automaticamente — insistir é o que mais gera denúncia.</p>
    <div class="pr-filters">
      <button type="button" class="pr-chip ${pw.filter === 'all' ? 'active' : ''}" data-f="all">Todos <b>${results.length}</b></button>
      ${order.filter((s) => summary[s]).map((s) => `<button type="button" class="pr-chip ${pw.filter === s ? 'active' : ''}" data-f="${s}">${PR_STATUS[s].icon} ${PR_STATUS[s].label} <b>${summary[s]}</b></button>`).join('')}
    </div>
    <div class="panel-header-actions" style="margin:10px 0">
      <input type="text" id="pr-search" class="labels-search" style="margin:0;max-width:280px" placeholder="Buscar nome ou número" value="${escapeHtml(pw.search)}" />
      <button type="button" class="secondary small" id="pr-sel-all">Selecionar visíveis</button>
      <button type="button" class="secondary small" id="pr-sel-none">Limpar seleção</button>
      ${summary.no_whatsapp || summary.invalid ? '<button type="button" class="secondary small" id="pr-export">⬇ Baixar não encontrados (.csv)</button>' : ''}
    </div>
    <div class="pr-table-wrap"><table class="pr-table">
      <thead><tr><th></th><th>Linha</th><th>Nome</th><th>Telefone</th><th>Situação</th>${varKeys.map((k) => `<th>{{${escapeHtml(k)}}}</th>`).join('')}</tr></thead>
      <tbody>${visible.slice(0, 500).map((r) => {
        const st = PR_STATUS[r.status]
        return `<tr class="${st.selectable ? '' : 'pr-row-off'}">
          <td>${st.selectable ? `<input type="checkbox" data-row="${r.row}" ${pw.selected.has(r.row) ? 'checked' : ''} />` : ''}</td>
          <td>${r.manual ? '<span title="Digitado à mão">✍️</span>' : r.row}</td><td>${escapeHtml(r.name || '—')}</td><td>${escapeHtml(r.rawPhone)}</td>
          <td><span class="pr-badge pr-${r.status}">${st.icon} ${st.label}</span>${r.note ? `<small class="muted"> (${escapeHtml(r.note)})</small>` : ''}</td>
          ${varKeys.map((k) => `<td>${escapeHtml(r.vars?.[k] || '')}</td>`).join('')}
        </tr>`
      }).join('')}</tbody>
    </table></div>
    ${visible.length > 500 ? `<p class="field-hint">Mostrando 500 de ${visible.length}. Use a busca ou os filtros.</p>` : ''}
    ${summary.contact ? '<p class="field-hint">👤 "Já é seu contato": tem seu número salvo — pode receber, mas talvez faça mais sentido usar uma Campanha normal.</p>' : ''}
  `
  for (const chip of prBody.querySelectorAll('.pr-chip')) chip.addEventListener('click', () => { pw.filter = chip.dataset.f; prRender() })
  const search = prBody.querySelector('#pr-search')
  search.addEventListener('input', () => { pw.search = search.value; prRender(); const s = prBody.querySelector('#pr-search'); s.focus(); s.setSelectionRange(s.value.length, s.value.length) })
  for (const cb of prBody.querySelectorAll('input[data-row]')) {
    cb.addEventListener('change', () => { const row = Number(cb.dataset.row); cb.checked ? pw.selected.add(row) : pw.selected.delete(row); prTriageFooter() })
  }
  prBody.querySelector('#pr-sel-all').addEventListener('click', () => { for (const r of visible) if (PR_STATUS[r.status]?.selectable) pw.selected.add(r.row); prRender() })
  prBody.querySelector('#pr-sel-none').addEventListener('click', () => { pw.selected.clear(); prRender() })
  prBody.querySelector('#pr-export')?.addEventListener('click', () => {
    const rows = results.filter((r) => r.status === 'no_whatsapp' || r.status === 'invalid')
    const csv = 'linha;nome;telefone;situacao\n' + rows.map((r) => [r.row, r.name || '', r.rawPhone, PR_STATUS[r.status].label].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }))
    a.download = 'nao-encontrados.csv'
    a.click()
  })
  prTriageFooter()
}

function prTriageFooter() {
  const n = prSelectedLeads().length
  prFooterInfo.textContent = `${n} lead(s) selecionado(s)`
}

// ----- Passo 3: mensagens -----
function prRenderMessages() {
  const keys = ['primeiro_nome', 'nome', ...pw.triage.varKeys]
  prBody.innerHTML = `
    <div class="builder-columns">
      <div class="builder-main">
        <p class="builder-intro">Escreva <strong>pelo menos 2 versões</strong> da primeira mensagem — cada lead recebe uma delas, sorteada.
          Use <code>{Oi|Olá|E aí}</code> para variar trechos: cada pessoa recebe uma das opções. Assim nenhuma mensagem sai igual à anterior.</p>
        <div class="builder-chips" id="pr-chips"></div>
        <div id="pr-variants"></div>
        <button type="button" class="secondary small" id="pr-add-variant">+ Mais uma versão</button>
        <label class="checkbox-field"><input type="checkbox" id="pr-optout" ${pw.appendOptOut ? 'checked' : ''} />
          Adicionar no final: "${PR_OPTOUT_FOOTER}" (recomendado)</label>
        <h3 class="builder-section-title">Follow-up para quem não responder — opcional (até 2)</h3>
        <p class="field-hint">Em lead frio, insistir demais gera denúncia: no máximo 1 ou 2, espaçados. Quem responde para de receber.</p>
        <div id="pr-followups"></div>
        <button type="button" class="secondary small" id="pr-add-fu">+ Adicionar follow-up</button>
      </div>
      <div class="builder-preview">
        <h3 class="builder-section-title">Qualidade da mensagem</h3>
        <div id="pr-quality" class="pr-quality"></div>
        <h3 class="builder-section-title">Como chega para seus leads</h3>
        <div class="builder-phone" id="pr-preview"></div>
      </div>
    </div>
  `
  let lastFocus = null
  const chips = prBody.querySelector('#pr-chips')
  chips.innerHTML = '<span class="muted">Inserir:</span> ' + keys.map((k) => `<button type="button" class="builder-chip" data-ins="{{${escapeHtml(k)}}}">{{${escapeHtml(k)}}}</button>`).join('') +
    ' <button type="button" class="builder-chip" data-ins="{Oi|Olá|E aí}">{Oi|Olá|E aí}</button>'
  for (const c of chips.querySelectorAll('.builder-chip')) {
    c.addEventListener('mousedown', (e) => e.preventDefault())
    c.addEventListener('click', () => { if (lastFocus) insertIntoTextarea(lastFocus, c.dataset.ins) })
  }
  const vEl = prBody.querySelector('#pr-variants')
  pw.variants.forEach((v, i) => {
    const box = document.createElement('div')
    box.className = 'followup-step'
    box.innerHTML = `<div class="followup-step-header"><strong>Versão ${i + 1}</strong>${pw.variants.length > 2 ? '<button type="button" class="secondary small pr-rm">Remover</button>' : ''}</div>
      <textarea rows="4" placeholder="${i === 0 ? 'Ex: {Oi|Olá} {{primeiro_nome}}! Vi que a {{empresa}} trabalha com moda. Posso te mandar nosso catálogo?' : 'Ex: E aí {{primeiro_nome}}, tudo certo? Sou da Alfa e ajudamos lojas como a sua a vender mais. Faz sentido conversar?'}"></textarea>`
    const ta = box.querySelector('textarea')
    ta.value = v
    ta.addEventListener('focus', () => { lastFocus = ta })
    ta.addEventListener('input', () => { pw.variants[i] = ta.value; prScheduleAnalyze() })
    box.querySelector('.pr-rm')?.addEventListener('click', () => { pw.variants.splice(i, 1); prRender() })
    if (i === 0) lastFocus = ta
    vEl.appendChild(box)
  })
  prBody.querySelector('#pr-add-variant').classList.toggle('hidden', pw.variants.length >= (prPresets?.maxVariants || 5))
  prBody.querySelector('#pr-add-variant').addEventListener('click', () => { pw.variants.push(''); prRender() })
  prBody.querySelector('#pr-optout').addEventListener('change', (e) => { pw.appendOptOut = e.target.checked; prScheduleAnalyze() })

  const fEl = prBody.querySelector('#pr-followups')
  pw.followups.forEach((f, i) => {
    const box = document.createElement('div')
    box.className = 'followup-step'
    box.innerHTML = `<div class="followup-step-header"><strong>Follow-up ${i + 1}</strong><button type="button" class="secondary small pr-rm">Remover</button></div>
      <div class="followup-delay">Enviar se não responder em <input type="number" min="1" max="30" value="${f.delayDays}" /> dia(s)</div>
      <textarea rows="2" placeholder="Ex: {{primeiro_nome}}, conseguiu ver minha mensagem? Se não for o momento, sem problema 🙂"></textarea>`
    const ta = box.querySelector('textarea')
    ta.value = f.message
    ta.addEventListener('input', () => { f.message = ta.value })
    box.querySelector('input').addEventListener('input', (e) => { f.delayDays = e.target.value })
    box.querySelector('.pr-rm').addEventListener('click', () => { pw.followups.splice(i, 1); prRender() })
    fEl.appendChild(box)
  })
  prBody.querySelector('#pr-add-fu').classList.toggle('hidden', pw.followups.length >= 2)
  prBody.querySelector('#pr-add-fu').addEventListener('click', () => { pw.followups.push({ delayDays: pw.followups.length ? 4 : 3, message: '' }); prRender() })
  prRenderQuality()
  prScheduleAnalyze(0)
}

function prScheduleAnalyze(delay = 400) {
  clearTimeout(prAnalyzeTimer)
  prAnalyzeTimer = setTimeout(prAnalyze, delay)
}

async function prAnalyze() {
  if (!pw || pw.step !== 2) return
  const sample = prSelectedLeads().slice(0, 4).map((l) => ({ name: l.name, phone: l.phone, vars: l.vars }))
  try {
    const res = await fetch('/api/prospects/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variants: prFinalVariants(), sampleLeads: sample }) })
    const data = await res.json()
    pw.quality = data
    prRenderQuality()
  } catch { /* tenta de novo na próxima digitação */ }
}

function prRenderQuality() {
  const qEl = prBody.querySelector('#pr-quality')
  const pEl = prBody.querySelector('#pr-preview')
  if (!qEl || !pw.quality) return
  const { score, issues, preview } = pw.quality
  const tone = score >= 80 ? 'good' : score >= 55 ? 'mid' : 'bad'
  const label = score >= 80 ? 'Boa' : score >= 55 ? 'Pode melhorar' : 'Arriscada'
  const icon = { critical: '⛔', warning: '⚠️', tip: '💡' }
  qEl.innerHTML = `
    <div class="pr-score pr-score-${tone}"><strong>${score}</strong><span>${label}</span><div class="pr-bar"><i style="width:${score}%"></i></div></div>
    ${issues.length ? `<ul class="pr-issues">${issues.map((i) => `<li class="pr-issue-${i.level}">${icon[i.level]} ${escapeHtml(i.text)}</li>`).join('')}</ul>` : '<p class="field-hint">Tudo certo: mensagens variadas, pessoais e com saída para quem não quiser.</p>'}
  `
  pEl.innerHTML = (preview || []).map((p) => `<div class="builder-bubble-label">${escapeHtml(p.leadName)} · versão ${p.variant + 1}</div><div class="builder-bubble">${formatWhatsappText(p.text) || '<span class="muted">(vazia)</span>'}</div>`).join('')
}

// ----- Passo 4: segurança -----
function prRenderSafety() {
  const presets = prPresets?.presets || {}
  const s = prSafety()
  const n = prSelectedLeads().length
  const w = pw.sendWindow
  prBody.innerHTML = `
    <p class="builder-intro">Escolha o ritmo. Quanto mais devagar, menor o risco de bloqueio. O envio acontece sozinho, aos poucos,
      ao longo dos dias — com o programa aberto, dentro do horário escolhido.</p>
    <div class="pr-presets">${Object.entries(presets).map(([key, p]) => `
      <button type="button" class="pr-preset ${pw.preset === key ? 'active' : ''}" data-preset="${key}">
        <strong>${escapeHtml(p.label)}${key === 'conservador' ? ' <span class="template-badge">recomendado</span>' : ''}</strong>
        <span class="muted">${escapeHtml(p.description)}</span>
        <ul>
          <li>Até <b>${p.dailyCap}</b> por dia (começa com ${p.warmupStart} e sobe ${p.warmupStep}/dia)</li>
          <li>${p.delayMinSec}–${p.delayMaxSec}s entre mensagens</li>
          <li>Lotes de ${p.batchSize}, pausa de ~${p.batchPauseMinutes} min</li>
          <li>~${prEstimateDays(n, p)} dia(s) para ${n} leads</li>
        </ul>
      </button>`).join('')}
    </div>
    <details class="send-options" ${pw.custom ? 'open' : ''}>
      <summary><span class="send-options-title">Ajustar manualmente</span><span class="send-options-summary">${s.dailyCap}/dia · ${s.delayMinSec}–${s.delayMaxSec}s</span></summary>
      <div class="send-options-body"><div class="settings-grid" style="margin-top:12px">
        ${[['dailyCap', 'Máximo por dia', 1, prPresets?.limits?.dailyCapMax || 150], ['warmupStart', 'Começa com (1º dia)', 1, 150], ['warmupStep', 'Aumenta por dia', 0, 50],
          ['delayMinSec', 'Intervalo mínimo (s)', prPresets?.limits?.delayMinSec || 15, 600], ['delayMaxSec', 'Intervalo máximo (s)', prPresets?.limits?.delayMinSec || 15, 900],
          ['batchSize', 'Mensagens por lote', 1, prPresets?.limits?.batchSizeMax || 20], ['batchPauseMinutes', 'Pausa entre lotes (min)', prPresets?.limits?.batchPauseMinMinutes || 3, 120]]
          .map(([k, label, min, max]) => `<div class="field"><label>${label}</label><input type="number" class="builder-input pr-num" data-k="${k}" min="${min}" max="${max}" value="${s[k]}" /></div>`).join('')}
      </div><p class="field-hint">Limites de segurança fixos: no máximo ${prPresets?.limits?.dailyCapMax || 150} por dia e pelo menos ${prPresets?.limits?.delayMinSec || 15}s entre mensagens.</p></div>
    </details>
    <h3 class="builder-section-title">Horário de envio</h3>
    <div class="campaign-window-days">${WEEKDAYS.map((name, d) => `<label><input type="checkbox" class="pr-day" value="${d}" ${w.days.includes(d) ? 'checked' : ''} /> ${name}</label>`).join('')}</div>
    <div class="campaign-window-hours"><label>Das <input type="time" id="pr-w-start" value="${w.start}" /></label><label>às <input type="time" id="pr-w-end" value="${w.end}" /></label></div>
    <h3 class="builder-section-title">Quando começar</h3>
    <label class="checkbox-field"><input type="radio" name="pr-start" value="now" ${pw.startMode === 'now' ? 'checked' : ''} /> Agora (no próximo horário permitido)</label>
    <label class="checkbox-field"><input type="radio" name="pr-start" value="schedule" ${pw.startMode === 'schedule' ? 'checked' : ''} /> A partir de <input type="datetime-local" id="pr-start-at" class="builder-input" style="width:auto;margin-left:8px" value="${escapeHtml(pw.startAt)}" /></label>
    <div class="type-explain" style="margin-top:14px"><strong>Travas automáticas desta lista:</strong> para sozinha se vários envios falharem
      seguidos, se mais de 8% de quem recebeu pedir para sair, ou se o WhatsApp encerrar a sessão (sinal de bloqueio). Também
      respeita o limite diário geral das Configurações de envio.</div>
  `
  for (const b of prBody.querySelectorAll('.pr-preset')) b.addEventListener('click', () => { pw.preset = b.dataset.preset; pw.custom = null; prRender() })
  for (const inp of prBody.querySelectorAll('.pr-num')) inp.addEventListener('input', () => { pw.custom = { ...(pw.custom || {}), [inp.dataset.k]: Number(inp.value) } })
  for (const d of prBody.querySelectorAll('.pr-day')) d.addEventListener('change', () => { pw.sendWindow.days = Array.from(prBody.querySelectorAll('.pr-day:checked')).map((x) => Number(x.value)) })
  prBody.querySelector('#pr-w-start').addEventListener('input', (e) => { pw.sendWindow.start = e.target.value })
  prBody.querySelector('#pr-w-end').addEventListener('input', (e) => { pw.sendWindow.end = e.target.value })
  for (const r of prBody.querySelectorAll('input[name="pr-start"]')) r.addEventListener('change', () => { pw.startMode = r.value })
  prBody.querySelector('#pr-start-at').addEventListener('input', (e) => { pw.startAt = e.target.value; pw.startMode = 'schedule'; prBody.querySelector('input[value="schedule"]').checked = true })
}

// ----- Passo 5: revisão -----
function prRenderReview() {
  const leads = prSelectedLeads()
  const s = prSafety()
  const q = pw.quality || { score: 0, issues: [] }
  const days = prEstimateDays(leads.length, s)
  prBody.innerHTML = `
    <div class="builder-review">
      <div class="review-row"><span>Lista</span><strong>${escapeHtml(pw.name)}</strong></div>
      <div class="review-row"><span>Leads</span><div><strong>${leads.length}</strong> de ${pw.triage.results.length} linhas da planilha</div></div>
      <div class="review-row"><span>Mensagens</span><div>${pw.variants.length} versões · qualidade <strong>${q.score}</strong>/100${pw.followups.length ? ` · ${pw.followups.length} follow-up(s)` : ' · sem follow-up'}</div></div>
      <div class="review-row"><span>Ritmo</span><div>${escapeHtml(prPresets?.presets?.[pw.preset]?.label || pw.preset)}${pw.custom ? ' (ajustado)' : ''}: até ${s.dailyCap}/dia, começando com ${s.warmupStart} · ${s.delayMinSec}–${s.delayMaxSec}s entre mensagens</div></div>
      <div class="review-row"><span>Horário</span><div>${escapeHtml(describeWindow(pw.sendWindow))}</div></div>
      <div class="review-row"><span>Início</span><div>${pw.startMode === 'schedule' && pw.startAt ? new Date(pw.startAt).toLocaleString('pt-BR') : 'Agora'}</div></div>
      <div class="review-row"><span>Duração</span><div>~${days} dia(s) de envio para todos os leads</div></div>
    </div>
    ${q.issues.filter((i) => i.level === 'warning').map((i) => `<p class="notice confirm">⚠️ ${escapeHtml(i.text)}</p>`).join('')}
    <label class="checkbox-field pr-consent"><input type="checkbox" id="pr-consent" ${pw.consent ? 'checked' : ''} />
      <span>Esses contatos são clientes, ex-clientes ou pessoas com interesse legítimo no meu negócio, e vou respeitar quem pedir
      para sair (LGPD). Entendo que mensagens para quem não conhece meu número podem gerar bloqueio do WhatsApp.</span></label>
  `
  prBody.querySelector('#pr-consent').addEventListener('change', (e) => { pw.consent = e.target.checked })
}

function prValidateStep() {
  if (pw.step === 0) {
    if (!pw.name.trim()) return 'Dê um nome para a lista.'
    const manual = prParseManual(pw.manualText).filter((m) => !m.invalid)
    if (!pw.file && manual.length === 0) return 'Envie uma planilha ou digite pelo menos um número.'
    if (pw.file && pw.phoneColumn === '') return 'Escolha qual coluna da planilha é o telefone.'
  }
  if (pw.step === 1 && prSelectedLeads().length === 0) return 'Selecione pelo menos um lead com WhatsApp.'
  if (pw.step === 2) {
    const crit = (pw.quality?.issues || []).find((i) => i.level === 'critical')
    if (crit) return crit.text
    if (pw.variants.filter((v) => v.trim()).length < (prPresets?.minVariants || 2)) return 'Escreva pelo menos 2 versões da mensagem.'
    for (const [i, f] of pw.followups.entries()) {
      if (!f.message.trim()) return `Follow-up ${i + 1}: escreva a mensagem ou remova.`
    }
  }
  if (pw.step === 3) {
    if (pw.sendWindow.days.length === 0) return 'Escolha pelo menos um dia da semana.'
    if (pw.sendWindow.start >= pw.sendWindow.end) return 'O horário de início precisa ser antes do fim.'
    if (pw.startMode === 'schedule' && !pw.startAt) return 'Escolha a data de início.'
  }
  if (pw.step === 4 && !pw.consent) return 'Confirme a declaração antes de iniciar.'
  return null
}

async function prSubmit() {
  pw.busy = true
  prNext.disabled = true
  prNext.textContent = 'Iniciando…'
  const body = {
    name: pw.name.trim(),
    leads: prSelectedLeads().map((l) => ({ jid: l.jid, name: l.name, vars: l.vars })),
    variants: prFinalVariants(),
    followups: pw.followups.map((f) => ({ delayDays: Number(f.delayDays), message: f.message.trim() })),
    safety: prSafety(),
    startAt: pw.startMode === 'schedule' && pw.startAt ? new Date(pw.startAt).toISOString() : null
  }
  try {
    const res = await fetch('/api/prospects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    showToast(`Prospecção criada com ${data.total} leads. O envio começa aos poucos, no horário escolhido.`, 'success')
    pw = null
    openProspectDetail(data.id)
  } catch (err) {
    pw.busy = false
    prSetError(err.message || 'Não foi possível criar a lista.')
    prRender()
  }
}

prNext.addEventListener('click', () => {
  if (!pw || pw.busy) return
  const err = prValidateStep()
  if (err) return prSetError(err)
  prSetError('')
  if (pw.step === 0) return prRunTriage()
  if (pw.step === PR_STEPS.length - 1) return prSubmit()
  prGo(pw.step + 1)
})
prBack.addEventListener('click', () => { if (pw && pw.step > 0) prGo(pw.step - 1) })

// ===== Acompanhamento de uma lista =====

async function openProspectDetail(id) {
  prStopRefresh()
  prCurrentId = id
  prDetailFilter = 'all'
  prModal.classList.remove('hidden')
  prShow(prDetailView)
  await loadProspectDetail()
  prRefreshTimer = setInterval(loadProspectDetail, 15000)
}

async function loadProspectDetail() {
  if (!prCurrentId) return
  let d
  try {
    const res = await fetch(`/api/prospects/${prCurrentId}`)
    if (!res.ok) { showProspectList(); return }
    d = await res.json()
  } catch { return }
  const pill = prStatusPill(d)
  document.getElementById('pr-detail-name').textContent = d.name
  const st = document.getElementById('pr-detail-status')
  st.textContent = pill.text
  st.className = `campaign-status ${pill.cls}`
  const toggle = document.getElementById('pr-toggle-btn')
  toggle.textContent = d.status === 'active' ? '⏸ Pausar' : '▶ Retomar'
  toggle.classList.toggle('hidden', d.status === 'done')
  toggle.dataset.action = d.status === 'active' ? 'pause' : 'resume'
  document.getElementById('pr-funnel-btn').dataset.campaign = d.campaignId
  const banner = document.getElementById('pr-detail-banner')
  banner.textContent = d.pausedReason ? `⚠️ ${d.pausedReason}` : ''
  banner.classList.toggle('hidden', !d.pausedReason)

  const sent = d.total - d.counts.pending - d.counts.skipped
  document.getElementById('pr-detail-stats').innerHTML = `
    <div class="campaign-stat"><strong>${sent}/${d.total}</strong><span>enviados</span></div>
    <div class="campaign-stat"><strong>${d.todaySent}/${d.todayCap}</strong><span>hoje (aquecimento)</span></div>
    <div class="campaign-stat"><strong>${d.counts.replied} · ${prPct(d.replyRate)}</strong><span>responderam</span></div>
    <div class="campaign-stat"><strong class="${d.optOutRate >= 0.05 ? 'pr-warn' : ''}">${d.counts.optout} · ${prPct(d.optOutRate)}</strong><span>pediram para sair (pausa em 8%)</span></div>
    <div class="campaign-stat"><strong>${d.etaDays != null ? `~${d.etaDays} dia(s)` : '—'}</strong><span>para terminar</span></div>
  `
  document.getElementById('pr-detail-progress').innerHTML = `<div class="pr-bar pr-bar-lg"><i style="width:${d.total ? Math.round((sent / d.total) * 100) : 0}%"></i></div>`

  const filters = [['all', 'Todos', d.total], ['pending', 'Aguardando', d.counts.pending], ['sent', 'Enviados', d.counts.sent - d.counts.replied - d.counts.optout],
    ['replied', 'Responderam', d.counts.replied], ['optout', 'Pediram para sair', d.counts.optout], ['failed', 'Falharam', d.counts.failed], ['skipped', 'Pulados', d.counts.skipped]]
  const fEl = document.getElementById('pr-detail-filters')
  fEl.innerHTML = filters.filter(([k, , n]) => k === 'all' || n > 0).map(([k, label, n]) => `<button type="button" class="pr-chip ${prDetailFilter === k ? 'active' : ''}" data-f="${k}">${label} <b>${n}</b></button>`).join('')
  for (const c of fEl.querySelectorAll('.pr-chip')) c.addEventListener('click', () => { prDetailFilter = c.dataset.f; loadProspectDetail() })

  const leads = d.leads.filter((l) => prDetailFilter === 'all' || l.status === prDetailFilter)
  document.getElementById('pr-detail-table').innerHTML = `<table class="pr-table">
    <thead><tr><th>Nome</th><th>Telefone</th><th>Situação</th><th>Versão</th><th>Enviado</th><th>Resposta</th></tr></thead>
    <tbody>${leads.slice(0, 500).map((l) => {
      const s = PR_LEAD_STATUS[l.status] || { label: l.status, cls: '' }
      return `<tr><td>${escapeHtml(l.name || '—')}</td><td>+${escapeHtml(l.phone)}</td>
        <td><span class="pr-lead pr-lead-${s.cls}">${s.label}</span>${l.error && l.status !== 'sent' ? `<small class="muted"> ${escapeHtml(l.error)}</small>` : ''}</td>
        <td>${l.variant != null ? l.variant + 1 : '—'}</td>
        <td>${l.sentAt ? new Date(l.sentAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
        <td>${l.lastReply ? `💬 ${escapeHtml(l.lastReply.slice(0, 60))}` : ''}</td></tr>`
    }).join('')}</tbody></table>
    ${leads.length > 500 ? `<p class="field-hint">Mostrando 500 de ${leads.length}.</p>` : ''}`
}

document.getElementById('pr-toggle-btn').addEventListener('click', async (e) => {
  const action = e.currentTarget.dataset.action
  const res = await fetch(`/api/prospects/${prCurrentId}/${action}`, { method: 'POST' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return showToast(data.error || 'Não foi possível.', 'error')
  showToast(action === 'pause' ? 'Prospecção pausada.' : 'Prospecção retomada.', 'success')
  loadProspectDetail()
})

document.getElementById('pr-delete-btn').addEventListener('click', async () => {
  const ok = await showConfirmDialog({
    title: 'Excluir esta lista de prospecção?',
    message: 'Os envios pendentes não serão feitos e o funil de respostas desta lista será apagado. As mensagens já enviadas continuam no WhatsApp.',
    confirmText: 'Excluir', danger: true
  })
  if (!ok) return
  const res = await fetch(`/api/prospects/${prCurrentId}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return showToast(data.error || 'Não foi possível excluir.', 'error')
  showToast('Lista excluída.', 'success')
  showProspectList()
})

document.getElementById('pr-funnel-btn').addEventListener('click', (e) => {
  const id = e.currentTarget.dataset.campaign
  closeProspecting()
  openCampaignBoard(id)
})

document.getElementById('prospecting-btn').addEventListener('click', openProspecting)
document.getElementById('pr-new-btn').addEventListener('click', openProspectWizard)
document.getElementById('pr-wizard-cancel').addEventListener('click', () => { pw = null; showProspectList() })
document.getElementById('pr-detail-back').addEventListener('click', showProspectList)
for (const b of document.querySelectorAll('.pr-close')) b.addEventListener('click', closeProspecting)
for (const a of document.querySelectorAll('.open-prospecting-link')) a.addEventListener('click', (e) => { e.preventDefault(); openProspecting() })
