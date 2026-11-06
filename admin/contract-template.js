// Modelo do contrato de licença do MultiEnvio. O painel de contratos preenche com os dados do
// formulário; campos vazios viram uma linha pontilhada para preencher à mão.
(function () {
  const BLANK = '......................'

  const UNITS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze',
    'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const TENS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const HUNDREDS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

  function below1000(n) {
    if (n === 0) return ''
    if (n === 100) return 'cem'
    const parts = []
    const h = Math.floor(n / 100)
    const rest = n % 100
    if (h) parts.push(HUNDREDS[h])
    if (rest) {
      if (rest < 20) parts.push(UNITS[rest])
      else {
        const t = Math.floor(rest / 10)
        const u = rest % 10
        parts.push(u ? TENS[t] + ' e ' + UNITS[u] : TENS[t])
      }
    }
    return parts.join(' e ')
  }

  function integerInWords(n) {
    if (n === 0) return 'zero'
    const thousands = Math.floor(n / 1000)
    const rest = n % 1000
    const parts = []
    if (thousands) parts.push(thousands === 1 ? 'mil' : below1000(thousands) + ' mil')
    if (rest) parts.push(below1000(rest))
    // "mil e quinhentos", mas "mil duzentos e cinquenta"
    const joiner = thousands && rest && (rest < 100 || rest % 100 === 0) ? ' e ' : ' '
    return parts.join(joiner)
  }

  function moneyInWords(value) {
    const cents = Math.round(value * 100)
    const reais = Math.floor(cents / 100)
    const c = cents % 100
    const parts = []
    if (reais) parts.push(integerInWords(reais) + (reais === 1 ? ' real' : ' reais'))
    if (c) parts.push(integerInWords(c) + (c === 1 ? ' centavo' : ' centavos'))
    return parts.join(' e ') || 'zero reais'
  }

  function money(value) {
    return 'R$ ' + Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function numberInWords(n) {
    const words = integerInWords(n)
    return words.charAt(0) === 'u' && n === 1 ? 'um' : words
  }

  function fmtDate(iso) {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return d + '/' + m + '/' + y
  }

  function endDate(startIso, months) {
    if (!startIso || !months) return ''
    const [y, m, d] = startIso.split('-').map(Number)
    const end = new Date(Date.UTC(y, m - 1 + months, d))
    end.setUTCDate(end.getUTCDate() - 1)
    return end.toISOString().slice(0, 10)
  }

  const v = (value) => (value && String(value).trim()) || BLANK

  function buildMultiEnvioContract(f) {
    const months = Number(f.meses) || 6
    const monthly = Number(f.valor) || 250
    const total = monthly * months
    const accounts = Number(f.contas) || 1
    const inicio = fmtDate(f.inicio)
    const fim = fmtDate(endDate(f.inicio, months))
    const local = [f.cidade, f.uf].filter(Boolean).join('/')
    const representante = f.representante
      ? ', neste ato representado(a) por ' + f.representante + (f.representanteCpf ? ', CPF nº ' + f.representanteCpf : '')
      : ''

    return [
      '## Das partes',
      '',
      'Pelo presente instrumento particular, as partes abaixo qualificadas celebram este Contrato de Licença de Uso de Software, que se regerá pelas cláusulas a seguir.',
      '',
      '**CONTRATADA:** FELIPE CHESSA BARBERO INFORMÁTICA LTDA (nome fantasia CHESSA CONSULTORIA DE TI), pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 54.978.799/0001-14, com sede na Rua Raimundo Barbosa Nogueira, nº 260, Bloco A, Apto. 23, Palmeiras de São José, São José dos Campos/SP, CEP 12237-828, neste ato representada por seu sócio-administrador, FELIPE CHESSA BARBERO, CPF nº ' + v(f.contratadaCpf) + '.',
      '',
      '**CONTRATANTE:** ' + v(f.contratanteNome) + ', inscrito(a) no CPF/CNPJ sob o nº ' + v(f.contratanteDoc) +
        ', com endereço em ' + v(f.endereco) + ', ' + v(local) + ', CEP ' + v(f.cep) +
        ', e-mail ' + v(f.email) + ', telefone ' + v(f.telefone) + representante + '.',
      '',
      '## Cláusula 1 — Do objeto',
      '',
      '1.1. O objeto deste contrato é a concessão, pela CONTRATADA à CONTRATANTE, de licença de uso não exclusiva, intransferível e temporária do software **MultiEnvio**, aplicativo para computador destinado ao envio de mensagens em massa, campanhas e agendamentos pelo WhatsApp.',
      '',
      '1.2. A licença abrange a instalação e o uso do software em 1 (um) computador da CONTRATANTE, conectado a ' + accounts + ' (' +
        numberInWords(accounts).replace(/\bum\b/g, 'uma').replace(/\bdois\b/g, 'duas') + ') ' + (accounts === 1 ? 'conta' : 'contas') +
        ' de WhatsApp, durante a vigência deste contrato.',
      '',
      '1.3. Estão incluídos na licença: as atualizações do software liberadas durante a vigência, o auxílio na instalação e configuração inicial e o suporte técnico descrito na Cláusula 4.',
      '',
      '1.4. Não estão incluídos: o computador, a conexão à internet, o aparelho celular, o número de telefone e a conta de WhatsApp, que são de responsabilidade da CONTRATANTE.',
      '',
      '## Cláusula 2 — Do prazo',
      '',
      '2.1. Este contrato vigora por ' + months + ' (' + numberInWords(months) + ') meses, com início em ' + v(inicio) + ' e término em ' + v(fim) + '.',
      '',
      '2.2. Ao fim do prazo, o contrato poderá ser renovado por acordo entre as partes, por escrito ou por troca de mensagens, nas mesmas condições ou em novas condições negociadas. Sem renovação, a licença se encerra e o acesso ao software é desativado.',
      '',
      '## Cláusula 3 — Do valor e do pagamento',
      '',
      '3.1. Pela licença, a CONTRATANTE pagará à CONTRATADA **' + money(monthly) + ' (' + moneyInWords(monthly) + ') por mês**, em ' + months + ' (' + numberInWords(months) + ') parcelas mensais, totalizando **' + money(total) + ' (' + moneyInWords(total) + ')**.',
      '',
      '3.2. A primeira parcela vence na data de início do contrato e as demais no dia ' + v(f.diaVencimento) + ' de cada mês subsequente.',
      '',
      '3.3. O pagamento será feito por PIX para a chave ' + v(f.pix) + ', de titularidade da CONTRATADA, ou por outro meio combinado entre as partes.',
      '',
      '3.4. O atraso no pagamento sujeita a parcela em atraso a multa de 2% (dois por cento) e juros de 1% (um por cento) ao mês, proporcionais aos dias de atraso.',
      '',
      '3.5. Atraso superior a 10 (dez) dias permite à CONTRATADA suspender o acesso ao software até a quitação, sem prejuízo das parcelas a vencer.',
      '',
      '## Cláusula 4 — Das obrigações e do suporte',
      '',
      '4.1. São obrigações da CONTRATADA:',
      '',
      '- liberar o acesso ao software e auxiliar na instalação e configuração inicial;',
      '- prestar suporte técnico remoto por WhatsApp ou e-mail, em dias úteis, das 9h às 18h, com resposta em até 1 (um) dia útil;',
      '- corrigir falhas do software que impeçam seu funcionamento, em prazo razoável conforme a complexidade;',
      '- disponibilizar as atualizações lançadas durante a vigência.',
      '',
      '4.2. São obrigações da CONTRATANTE:',
      '',
      '- pagar as parcelas nas datas combinadas;',
      '- manter computador, internet e conta de WhatsApp em condições de uso;',
      '- usar o software apenas para fins lícitos e conforme a Cláusula 5;',
      '- não copiar, revender, ceder, sublicenciar, descompilar ou modificar o software;',
      '- informar à CONTRATADA, com a maior brevidade, qualquer falha encontrada.',
      '',
      '4.3. O suporte não inclui criação de conteúdo das mensagens, gestão de campanhas ou serviços fora do software, que poderão ser contratados à parte.',
      '',
      '## Cláusula 5 — Do uso responsável, dos dados e da responsabilidade',
      '',
      '5.1. O MultiEnvio funciona conectado à conta de WhatsApp da CONTRATANTE. O WhatsApp é um serviço de terceiros (Meta), que não tem vínculo com a CONTRATADA e pode alterar suas regras, limitar ou bloquear contas a qualquer tempo.',
      '',
      '5.2. A CONTRATANTE declara estar ciente de que o envio em massa, sobretudo para contatos que não autorizaram o recebimento, pode levar ao bloqueio do número. A CONTRATADA não se responsabiliza por bloqueios, banimentos ou restrições aplicados pelo WhatsApp.',
      '',
      '5.3. A CONTRATANTE é a única responsável pelo conteúdo das mensagens, pelas listas de contatos que utiliza e pelo cumprimento da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), do Código de Defesa do Consumidor e das demais normas aplicáveis, inclusive quanto ao consentimento dos destinatários. É proibido o uso para spam, golpes, conteúdo ilícito ou ofensivo.',
      '',
      '5.4. Os contatos, mensagens e arquivos ficam armazenados no computador da CONTRATANTE. A CONTRATADA não acessa nem comercializa esses dados, salvo quando a CONTRATANTE autorizar o acesso remoto para suporte.',
      '',
      '5.5. A responsabilidade da CONTRATADA por qualquer dano decorrente deste contrato limita-se ao valor efetivamente pago pela CONTRATANTE nos 3 (três) meses anteriores ao fato. A CONTRATADA não responde por lucros cessantes, perda de vendas ou indisponibilidade causada por terceiros, internet ou falhas do equipamento da CONTRATANTE.',
      '',
      '## Cláusula 6 — Da rescisão',
      '',
      '6.1. Qualquer das partes pode rescindir este contrato antes do prazo mediante aviso por escrito (inclusive por e-mail ou WhatsApp) com 30 (trinta) dias de antecedência.',
      '',
      '6.2. Se a rescisão antecipada partir da CONTRATANTE sem justo motivo, ela pagará multa de 20% (vinte por cento) sobre a soma das parcelas que ainda venceriam até o fim do prazo.',
      '',
      '6.3. O contrato pode ser rescindido de imediato, sem multa para a parte inocente, em caso de descumprimento de qualquer cláusula, especialmente a Cláusula 5, ou de atraso de pagamento superior a 30 (trinta) dias.',
      '',
      '6.4. Encerrado o contrato, a licença é cancelada e a CONTRATANTE deve deixar de usar o software. Os valores já pagos não são devolvidos, salvo rescisão por culpa da CONTRATADA.',
      '',
      '## Cláusula 7 — Da propriedade intelectual',
      '',
      '7.1. O software MultiEnvio, seu código, marca, layout e documentação são de propriedade exclusiva da CONTRATADA, protegidos pela Lei nº 9.609/1998 (Lei do Software) e pela Lei nº 9.610/1998 (Direitos Autorais). Este contrato não transfere à CONTRATANTE nenhum direito além da licença de uso aqui prevista.',
      '',
      '## Cláusula 8 — Das disposições gerais e do foro',
      '',
      '8.1. Este contrato não cria vínculo empregatício, societário ou de representação entre as partes.',
      '',
      '8.2. Alterações a este contrato só valem se feitas por escrito e aceitas por ambas as partes.',
      '',
      '8.3. As partes elegem o foro da Comarca de São José dos Campos/SP para resolver questões oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.',
      '',
      '## Assinaturas',
      '',
      'As partes assinam este contrato eletronicamente e reconhecem a validade dessa assinatura, nos termos da Lei nº 14.063/2020 e da MP nº 2.200-2/2001. Cada assinatura registra nome, CPF, e-mail, endereço IP, data, hora e o código SHA-256 do texto assinado, que garante a integridade do documento. Fica dispensada a assinatura de testemunhas, conforme o art. 784, § 4º, do Código de Processo Civil.',
      '',
      'São José dos Campos/SP, na data da última assinatura eletrônica.'
    ].join('\n')
  }

  window.buildMultiEnvioContract = buildMultiEnvioContract
  window.contractEndDate = endDate
  window.moneyInWords = moneyInWords
})()
