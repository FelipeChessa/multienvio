// GET /api/latest-version — checado pelo app do cliente (disparo/) pra saber se tem
// atualização disponível. Mesma convenção do resto do projeto (ver ARQUITETURA.md do
// workspace disparo/): valores hardcoded aqui, atualizados manualmente a cada release.
//
// IMPORTANTE: downloadUrl precisa apontar pra um asset .zip publicado num GitHub Release
// deste repositório (github.com/FelipeChessa/multienvio/releases) contendo só
// src/, public/, package.json e package-lock.json do projeto disparo/ (não é o mesmo
// .zip/.exe/.msi do instalador completo — é um pacote menor, só de código, pensado pra
// sobrescrever uma instalação já existente).

const LATEST_VERSION = {
  version: '1.2.0',
  downloadUrl: 'https://github.com/FelipeChessa/multienvio/releases/download/v1.2.0/disparo-update-v1.2.0.zip',
  notes: 'Agora também dá pra disparar para todos os seus contatos (não só por etiqueta) e para quem ainda não é contato, a partir de uma planilha — cada número é conferido no WhatsApp antes de qualquer envio. Redesenho visual completo.'
}

export default function handler(req, res) {
  res.status(200).json(LATEST_VERSION)
}
