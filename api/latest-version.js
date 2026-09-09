// GET /api/latest-version — checado pelo app do cliente pra saber se tem atualização
// disponível.
//
// PAUSADO EM 2026-09-09: o app real distribuído (instalador Electron, releases v1.0.0 —
// Disparo.em.Massa.Setup.1.0.0.exe/.msi) é um codebase DIFERENTE e mais avançado do que o
// projeto disparo/ deste workspace (que é um protótipo/dev separado, sem dashboard,
// configurações de envio, disjuntor, etc.). O pacote de atualização v1.2.0 publicado aqui
// foi gerado a partir do disparo/ deste workspace e foi aplicado por engano sobre uma
// instalação real, sobrescrevendo src/public dela e apagando recursos que só existiam lá.
// Version travada bem abaixo de qualquer instalação real pra isNewerVersion() nunca
// retornar true — ninguém mais recebe esse "update" até isso ser investigado e corrigido
// com uma origem correta (o codebase real do app empacotado, não este protótipo).
const LATEST_VERSION = {
  version: '0.0.1',
  downloadUrl: '',
  notes: ''
}

export default function handler(req, res) {
  res.status(200).json(LATEST_VERSION)
}
