// Tela inicial da área central (src/dashboardRoutes.js → /api/home).
//
// Antes, sem destinatário selecionado, a área central ficava em branco e o usuário precisava
// adivinhar que tinha que clicar numa etiqueta. Agora ela mostra:
// - os 4 caminhos principais (enviar mensagem, campanha, prospecção, atender no WhatsApp);
// - "Primeiros passos" enquanto o usuário ainda não fez o básico;
// - o que está em andamento (campanhas, prospecções, agendamentos) e os últimos envios.
// Some sozinha quando o painel de envio aparece (observando a classe dele) e volta quando ele
// some — sem precisar mexer em cada lugar que mostra/esconde o painel.

const homePanel = document.getElementById('home-panel')
const homeRunning = document.getElementById('home-running')
const homeRecent = document.getElementById('home-recent')
const homeSteps = document.getElementById('home-steps')
const homeStepsList = document.getElementById('home-steps-list')

function syncHomeVisibility() {
  const dispatchVisible = !dispatchPanel.classList.contains('hidden')
  homePanel.classList.toggle('hidden', dispatchVisible)
  if (!dispatchVisible) refreshHome()
}
new MutationObserver(syncHomeVisibility).observe(dispatchPanel, { attributes: true, attributeFilter: ['class'] })

// "Enviar uma mensagem": o primeiro passo é escolher quem recebe, na coluna da esquerda
function guideToRecipients() {
  const sidebar = document.getElementById('labels-list')
  sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' })
  sidebar.classList.remove('attention')
  void sidebar.offsetWidth // reinicia a animação
  sidebar.classList.add('attention')
  showToast('Primeiro, marque à esquerda quem vai receber: uma ou mais etiquetas, ou contatos em "Todos os contatos".', 'info')
}

// Desmarca os destinatários e volta para a tela inicial
function clearRecipients() {
  if (activeContactSource === 'allContacts') {
    selectedContactJids.clear()
    renderAllContactsList()
    updateDispatchPanelForContacts()
  } else {
    selectedLabelIds.clear()
    adHocContacts = null
    renderLabels(lastLabelsFetch)
    updateDispatchPanelForLabels()
  }
  dispatchPanel.classList.add('hidden')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function homeAction(action) {
  if (action === 'send') guideToRecipients()
  else if (action === 'campaign') openCampaignBuilder()
  else if (action === 'prospect') openProspecting()
  else if (action === 'whatsapp') openWhatsAppPanel()
  else if (action === 'profile') openProfileModal()
}

function renderFirstSteps(fs) {
  const steps = [
    { done: fs.connected, title: 'Conecte seu WhatsApp', desc: 'Escaneie o QR Code com o WhatsApp Business do celular.' },
    { done: fs.hasLabels, title: 'Organize seus clientes em etiquetas', desc: 'No WhatsApp Business do celular, segure uma conversa → Etiquetar. As etiquetas aparecem aqui à esquerda.' },
    { done: fs.profileReady, title: 'Cadastre seu contato', desc: 'Seu nome e número para os clientes salvarem com um toque.', action: 'profile', cta: 'Cadastrar' },
    { done: fs.firstSend, title: 'Envie sua primeira mensagem', desc: 'Marque uma etiqueta à esquerda e escreva a mensagem.', action: 'send', cta: 'Começar' },
    { done: fs.hasCampaign, title: 'Crie sua primeira campanha', desc: 'Com lembrete automático para quem não responder.', action: 'campaign', cta: 'Criar' }
  ]
  const doneCount = steps.filter((s) => s.done).length
  homeSteps.classList.toggle('hidden', doneCount === steps.length)
  homeSteps.querySelector('h3').textContent = `Primeiros passos · ${doneCount} de ${steps.length}`
  homeStepsList.innerHTML = steps.map((s) => `
    <li class="${s.done ? 'done' : ''}">
      <span class="hs-check">${s.done ? '✓' : ''}</span>
      <div><b>${s.title}</b><span>${s.desc}</span></div>
      ${!s.done && s.action ? `<button type="button" class="secondary small" data-action="${s.action}">${s.cta}</button>` : ''}
    </li>`).join('')
  for (const b of homeStepsList.querySelectorAll('button[data-action]')) b.addEventListener('click', () => homeAction(b.dataset.action))
}

function renderRunning(items) {
  if (items.length === 0) {
    homeRunning.innerHTML = '<li class="home-empty">Nada em andamento. Campanhas, prospecções e envios programados aparecem aqui.</li>'
    return
  }
  const icon = { campaign: '🔁', prospect: '🎯', scheduled: '🕘' }
  const statusText = (i) => i.status === 'paused' ? '<span class="campaign-status paused">pausada</span>' : i.kind === 'scheduled' ? '<span class="campaign-status sending">programado</span>' : '<span class="campaign-status">ativa</span>'
  homeRunning.innerHTML = items.map((i, idx) => `
    <li data-i="${idx}" class="${i.kind === 'scheduled' ? '' : 'clickable'}">
      <span class="hl-icon">${icon[i.kind]}</span>
      <div class="hl-body"><b>${escapeHtml(i.name)}</b> ${statusText(i)}
        <small>${escapeHtml(i.detail || '')}</small>
        ${i.progress != null ? `<div class="pr-bar"><i style="width:${Math.round(i.progress * 100)}%"></i></div>` : ''}
        ${i.pausedReason ? `<small class="pr-warn">⚠️ ${escapeHtml(i.pausedReason)}</small>` : ''}
      </div>
    </li>`).join('')
  homeRunning.querySelectorAll('li.clickable').forEach((li) => {
    const item = items[Number(li.dataset.i)]
    li.addEventListener('click', () => {
      if (item.kind === 'campaign') openCampaignBoard(item.id)
      else if (item.kind === 'prospect') openProspectDetail(item.id)
    })
  })
}

function renderRecent(items) {
  if (items.length === 0) {
    homeRecent.innerHTML = '<li class="home-empty">Nenhum envio ainda. Comece marcando uma etiqueta à esquerda.</li>'
    return
  }
  homeRecent.innerHTML = items.map((r) => `
    <li><span class="hl-icon">📤</span>
      <div class="hl-body"><b>${escapeHtml(r.name)}</b>
        <small>${r.sent} enviada(s)${r.failed ? ` · <span class="pr-warn">${r.failed} falharam</span>` : ''} · ${new Date(r.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small>
      </div>
    </li>`).join('')
}

let homeFetchSeq = 0
async function refreshHome() {
  if (homePanel.classList.contains('hidden')) return
  const seq = ++homeFetchSeq
  try {
    const data = await (await fetch('/api/home')).json()
    if (seq !== homeFetchSeq) return
    renderFirstSteps(data.firstSteps)
    renderRunning(data.running)
    renderRecent(data.recent)
  } catch {
    // informativo — tenta de novo no próximo ciclo
  }
}

for (const b of document.querySelectorAll('.home-action')) b.addEventListener('click', () => homeAction(b.dataset.action))
document.getElementById('dispatch-close-btn').addEventListener('click', clearRecipients)
setInterval(refreshHome, 20000)
syncHomeVisibility()
