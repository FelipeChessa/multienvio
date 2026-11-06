// Popula uma pasta de dados de DEMONSTRAÇÃO (nomes e números fictícios) para capturar as telas
// do comercial sem expor nenhum contato real. Uso:
//   ELECTRON_USER_DATA_DIR=<pasta> node seed-demo.mjs
const base = new URL('../../disparo-em-massa/src/', import.meta.url).href
const store = await import(base + 'db.js')
const c = await import(base + 'campaigns.js')

const FIRST = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Heitor', 'Isabela', 'João', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Thiago', 'Vanessa', 'Wagner', 'Yasmin', 'Lucas', 'Mariana', 'Pedro', 'Camila', 'Rodrigo', 'Juliana', 'Gustavo', 'Beatriz', 'André']
const LAST = ['Souza', 'Lima', 'Mendes', 'Alves', 'Rocha', 'Costa', 'Nunes', 'Prado', 'Ferreira', 'Ribeiro', 'Martins', 'Gomes', 'Barbosa', 'Teixeira', 'Moreira']
const contacts = []
for (let i = 0; i < 120; i++) {
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`
  const jid = `55119${String(80000000 + i * 137).padStart(8, '0')}@s.whatsapp.net`
  store.upsertContact(jid, name)
  contacts.push({ jid, name })
}
const labels = [
  ['1', 'Clientes VIP', 3, 0, 24],
  ['2', 'Leads Instagram', 5, 20, 58],
  ['3', 'Compraram em 2026', 1, 40, 87],
  ['4', 'Black Friday', 9, 10, 46],
  ['5', 'Aguardando pagamento', 7, 70, 82],
  ['6', 'Pós-venda', 2, 85, 112]
]
for (const [id, name, color, from, to] of labels) {
  store.upsertLabel({ id, name, color })
  for (let i = from; i < to; i++) store.applyAssociation({ type: 'label_jid', chatId: contacts[i].jid, labelId: id }, 'add')
}

const H = 3600_000, D = 24 * H
function seed(name, origin, preview, steps, people, extras = {}) {
  const camp = c.createCampaign(c.persistCampaignInput({ name, steps }, extras), { origin, initialPreview: preview })
  const hooks = c.initialDispatchHooks(camp.id, people.length)
  hooks.onFinish({ sent: people.length })
  for (const p of people) {
    hooks.onResult({ jid: p.jid, name: p.name }, 'sent')
    const e = store.getCampaign(camp.id).contacts[p.jid]
    e.firstSentAt = e.lastSentAt = Date.now() - p.ago
    if (p.fu) { e.followupsSent = p.fu; e.lastSentAt = Date.now() - p.fuAgo }
    if (p.reply) { e.stage = 'replied'; e.repliedAt = e.lastReplyAt = Date.now() - p.replyAgo; e.lastReply = p.reply; e.replyCount = 1 }
    if (p.stage) e.stage = p.stage
    if (p.note) e.note = p.note
  }
  return camp
}
const P = (i, extra) => ({ ...contacts[i], ...extra })
seed('Black Friday — clientes VIP', 'Etiquetas: Clientes VIP, Black Friday', 'Oi {{primeiro_nome}}! Nossa Black Friday começou: até 40% OFF 🖤',
  [{ delayDays: 2, message: '{{primeiro_nome}}, as peças mais pedidas estão acabando. Qual o seu tamanho?' }, { delayDays: 3, message: 'Última chamada: a Black Friday termina hoje!' }],
  [
    P(0, { ago: 3 * D, reply: 'Oi! Tem o vestido preto no M?', replyAgo: 2 * H }),
    P(1, { ago: 1 * D }),
    P(2, { ago: 4 * D, fu: 1, fuAgo: 2 * D }),
    P(3, { ago: 6 * D, fu: 2, fuAgo: 1 * D }),
    P(4, { ago: 3 * D, reply: 'Quero 3 camisetas, faz desconto?', replyAgo: 20 * H, stage: 'negotiating', note: 'Ofereci 10% para 3 unidades' }),
    P(5, { ago: 3 * D, reply: 'Fechado! Manda o Pix 🙌', replyAgo: 1 * D, stage: 'won', note: 'Pagou R$ 289,90' }),
    P(6, { ago: 3 * D, reply: 'Vou querer o kit presente', replyAgo: 5 * H, stage: 'won', note: 'Kit Dia dos Pais — R$ 189' }),
    P(7, { ago: 2.5 * D }),
    P(8, { ago: 2 * D, reply: 'Vocês entregam em Campinas?', replyAgo: 3 * H }),
    P(9, { ago: 3 * D, reply: 'Pode me mandar o catálogo?', replyAgo: 8 * H, stage: 'negotiating' }),
    P(10, { ago: 5 * D, fu: 2, fuAgo: 1 * D, stage: 'lost' }),
    P(11, { ago: 1.5 * D })
  ],
  { description: 'Vender o estoque de verão até domingo', variables: { cupom: 'BLACK40' }, sendWindow: { days: [1, 2, 3, 4, 5, 6], start: '10:00', end: '20:00' } })
seed('Reativação de clientes inativos', 'Etiquetas: Compraram em 2026', 'Oi {{primeiro_nome}}, que saudade! Separei um presente para você 💛',
  [{ delayDays: 3, message: 'Seu cupom VOLTEI15 continua guardado aqui 😉' }],
  Array.from({ length: 34 }, (_, k) => P(40 + k, k % 3 === 0 ? { ago: 2 * D, reply: 'Oi! Quero ver as novidades', replyAgo: 6 * H } : { ago: 2 * D })))
seed('Lançamento coleção Verão 2027', 'Etiquetas: Leads Instagram', 'A coleção Verão 2027 chegou! Dá uma olhada 🌸',
  [{ delayDays: 2, message: 'As peças mais pedidas estão acabando!' }, { delayDays: 4, message: 'Quer que eu monte um look pra você?' }],
  Array.from({ length: 38 }, (_, k) => P(20 + k, k % 4 === 0 ? { ago: 1 * D, reply: 'Amei! Tem no rosa?', replyAgo: 4 * H, stage: k % 8 === 0 ? 'won' : 'replied' } : { ago: 1 * D })))
await new Promise((r) => setTimeout(r, 1500))
console.log('demo pronta:', store.listLabels().map((l) => `${l.name}(${l.contactCount})`).join(', '), '| campanhas:', store.listCampaigns().length)
process.exit()
