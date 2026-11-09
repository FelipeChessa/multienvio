// Barra superior como navegação principal: Início · WhatsApp · Campanhas · Prospecção.
//
// - Campanhas e Prospecção abrem ABAIXO da barra (como o WhatsApp), então a barra continua
//   clicável e a pessoa troca de tela direto por ela, sem botões de "voltar".
// - Abrir uma seção fecha as outras; "Início" fecha todas e volta à tela inicial.
// - O botão da tela atual fica destacado (classe .active), observando as próprias telas — não
//   importa por onde ela foi aberta (barra, tela inicial, funil, notificação...).

const navHomeBtn = document.getElementById('home-btn')
const navSections = {
  whatsapp: { btn: document.getElementById('whatsapp-btn'), el: document.getElementById('whatsapp-panel'), isOpen: (el) => el.classList.contains('open') },
  campaigns: { btn: document.getElementById('campaigns-btn'), el: document.getElementById('campaigns-modal'), isOpen: (el) => !el.classList.contains('hidden') },
  prospects: { btn: document.getElementById('prospecting-btn'), el: document.getElementById('prospects-modal'), isOpen: (el) => !el.classList.contains('hidden') }
}

// altura da barra superior, usada para as seções abrirem logo abaixo dela
const appHeader = document.querySelector('header')
function syncHeaderHeight() {
  document.documentElement.style.setProperty('--header-h', `${Math.round(appHeader.getBoundingClientRect().bottom)}px`)
}
syncHeaderHeight()
new ResizeObserver(syncHeaderHeight).observe(appHeader)
window.addEventListener('resize', syncHeaderHeight)

function openSectionName() {
  // Campanhas/Prospecção ficam por cima do WhatsApp, então valem primeiro
  for (const name of ['campaigns', 'prospects', 'whatsapp']) {
    const s = navSections[name]
    if (s.isOpen(s.el)) return name
  }
  return 'home'
}

function syncNavActive() {
  const current = openSectionName()
  navHomeBtn.classList.toggle('active', current === 'home')
  for (const [name, s] of Object.entries(navSections)) s.btn.classList.toggle('active', current === name)
}

function leaveSections(keep) {
  if (keep !== 'whatsapp' && navSections.whatsapp.isOpen(navSections.whatsapp.el)) closeWhatsAppPanel()
  if (keep !== 'campaigns' && navSections.campaigns.isOpen(navSections.campaigns.el)) closeCampaignsModal()
  if (keep !== 'prospects' && navSections.prospects.isOpen(navSections.prospects.el)) closeProspecting()
}

function goHome() {
  leaveSections()
  if (!dispatchPanel.classList.contains('hidden')) clearRecipients() // volta para a tela inicial
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Licença inválida ou vencida com o programa aberto: fecha tudo e tira o WhatsApp embutido da
// memória (o tutorial "Como usar" pode continuar aberto).
function applyLicenseLock() {
  leaveSections()
  destroyWhatsAppWebview()
  document.querySelectorAll('.modal-overlay').forEach((m) => {
    if (m.id !== 'tutorial-modal') m.classList.add('hidden')
  })
}

navHomeBtn.addEventListener('click', goHome)
// antes de cada seção abrir (pelo próprio clique dela), fecha as outras
for (const [name, s] of Object.entries(navSections)) {
  s.btn.addEventListener('click', () => leaveSections(name), true)
}

const navObserver = new MutationObserver(syncNavActive)
for (const s of Object.values(navSections)) navObserver.observe(s.el, { attributes: true, attributeFilter: ['class'] })
syncNavActive()

// o logo/nome MultiEnvio também leva ao Início (como na maioria dos sites e apps)
const brandHome = document.getElementById('brand-home')
brandHome.addEventListener('click', goHome)
brandHome.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHome() }
})
