// Converte o texto do contrato em HTML. Usado pela página de assinatura e pelo painel admin.
// Formato: "## Título" → seção · "- item" → lista · linha em branco → novo parágrafo · **negrito**
(function () {
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  }
  function inline(text) {
    return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  }
  function renderContract(body) {
    const out = []
    let para = []
    let list = []
    const flushPara = () => { if (para.length) out.push('<p>' + inline(para.join(' ')) + '</p>'); para = [] }
    const flushList = () => { if (list.length) out.push('<ul>' + list.map((li) => '<li>' + inline(li) + '</li>').join('') + '</ul>'); list = [] }
    String(body || '').split(/\r?\n/).forEach((raw) => {
      const line = raw.trim()
      if (!line) { flushPara(); flushList(); return }
      if (line.startsWith('## ') || line.startsWith('# ')) {
        flushPara(); flushList()
        out.push('<h3>' + inline(line.replace(/^#+\s/, '')) + '</h3>')
        return
      }
      if (line.startsWith('- ')) { flushPara(); list.push(line.slice(2)); return }
      flushList()
      para.push(line)
    })
    flushPara(); flushList()
    return out.join('\n')
  }
  window.renderContract = renderContract
  window.escapeHtml = escapeHtml
})()
