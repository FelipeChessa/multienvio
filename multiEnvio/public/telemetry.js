// Dados de uso (só contagens): uma vez por minuto conta se a pessoa estava usando o programa
// (mexeu no mouse/teclado com a janela em foco), quais telas abriu e erros da tela. Vai para
// /api/usage/ping -> src/usage.js. Nenhum texto digitado, mensagem ou contato sai daqui.

;(function () {
  const watched = [
    ['whatsapp', 'whatsapp-panel', (el) => el.classList.contains('open')],
    ['dispatch', 'dispatch-panel', (el) => !el.classList.contains('hidden')],
    ['campaigns', 'campaigns-modal', (el) => !el.classList.contains('hidden')],
    ['prospects', 'prospects-modal', (el) => !el.classList.contains('hidden')],
    ['settings', 'settings-modal', (el) => !el.classList.contains('hidden')],
    ['products', 'products-modal', (el) => !el.classList.contains('hidden')],
    ['profile', 'profile-modal', (el) => !el.classList.contains('hidden')],
    ['tutorial', 'tutorial-modal', (el) => !el.classList.contains('hidden')]
  ]
  let screens = {}
  let errors = []
  let lastInputAt = 0

  // conta cada vez que uma tela passa de fechada para aberta
  for (const [name, id, isOpen] of watched) {
    const el = document.getElementById(id)
    if (!el) continue
    let wasOpen = isOpen(el)
    new MutationObserver(() => {
      const open = isOpen(el)
      if (open && !wasOpen) screens[name] = (screens[name] || 0) + 1
      wasOpen = open
    }).observe(el, { attributes: true, attributeFilter: ['class'] })
  }

  for (const type of ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart']) {
    window.addEventListener(type, () => { lastInputAt = Date.now() }, { capture: true, passive: true })
  }

  const pushError = (msg) => { if (msg && errors.length < 5) errors.push(String(msg).slice(0, 300)) }
  window.addEventListener('error', (e) => pushError(e.message))
  window.addEventListener('unhandledrejection', (e) => pushError(e.reason?.message || e.reason))

  setInterval(() => {
    if (typeof isLicenseLocked === 'function' && isLicenseLocked()) return
    const active = document.hasFocus() && Date.now() - lastInputAt < 60 * 1000
    if (!active && Object.keys(screens).length === 0 && errors.length === 0) return
    const body = JSON.stringify({ active, screens, errors })
    screens = {}
    errors = []
    fetch('/api/usage/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {})
  }, 60 * 1000)
})()
