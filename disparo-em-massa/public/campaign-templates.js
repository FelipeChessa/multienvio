// Modelos prontos de campanha por ramo de atuação, usados no assistente "Nova campanha"
// (public/campaigns.js). Só dados — pra adicionar um ramo ou objetivo novo, basta incluir
// aqui, sem mexer em mais nada.
//
// Cada objetivo (setup) traz:
// - goal: pra que serve, mostrado no cartão do modelo
// - audienceHint: sugestão de público
// - variables: campos que o usuário preenche uma vez e entram no texto como {{chave}}
//   ({{nome}} e {{primeiro_nome}} são automáticos, por contato — não precisam estar aqui)
// - message: primeira mensagem
// - followups: [{ delayDays, message }] — saem só pra quem não respondeu
// - sendWindow (opcional): horário sugerido pros follow-ups daquele ramo
//
// Boas práticas seguidas em todos os textos: curtos, com o nome da pessoa, uma pergunta
// fácil de responder no final (resposta = conversa = menos risco de bloqueio e mais venda),
// e follow-ups que agregam algo novo em vez de só cobrar resposta.

const COMMERCIAL_HOURS = { days: [1, 2, 3, 4, 5, 6], start: '09:00', end: '19:00' }
const WEEKDAYS_ONLY = { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }
const RETAIL_HOURS = { days: [1, 2, 3, 4, 5, 6], start: '10:00', end: '20:00' }

const CAMPAIGN_TEMPLATE_CATALOG = [
  {
    id: 'moda',
    name: 'Moda e acessórios',
    icon: '👗',
    setups: [
      {
        id: 'moda-colecao',
        name: 'Lançamento de coleção',
        goal: 'Apresentar a coleção nova e levar a cliente até a loja ou o catálogo.',
        audienceHint: 'Clientes que já compraram com você.',
        variables: [
          { key: 'colecao', label: 'Nome da coleção', example: 'Verão 2027' },
          { key: 'link', label: 'Link do catálogo ou da loja', example: 'https://sualoja.com.br/verao' }
        ],
        message: 'Oi {{primeiro_nome}}! 🌸 A coleção {{colecao}} acabou de chegar e separei as peças que têm a sua cara.\n\nDá uma olhada: {{link}}\n\nQuer que eu te mande fotos de alguma peça específica?',
        followups: [
          { delayDays: 2, message: '{{primeiro_nome}}, as peças mais pedidas da {{colecao}} já estão acabando em alguns tamanhos. Qual é o seu número? Confiro pra você agora 😊' },
          { delayDays: 4, message: 'Última chamada, {{primeiro_nome}}! Se quiser, separo um look completo da {{colecao}} e te mando as fotos. É só responder "quero" 💬' }
        ],
        sendWindow: RETAIL_HOURS
      },
      {
        id: 'moda-liquidacao',
        name: 'Liquidação ou promoção relâmpago',
        goal: 'Gerar vendas rápidas com urgência e prazo definido.',
        audienceHint: 'Toda a base de clientes.',
        variables: [
          { key: 'desconto', label: 'Desconto', example: 'até 50% OFF' },
          { key: 'prazo', label: 'Até quando vale', example: 'domingo' },
          { key: 'link', label: 'Link da promoção', example: 'https://sualoja.com.br/sale' }
        ],
        message: '{{primeiro_nome}}, começou nossa liquidação com {{desconto}}! 🔥\n\nVale só até {{prazo}} e as peças são limitadas.\n\nVeja aqui: {{link}}\n\nQuer que eu reserve alguma coisa pra você?',
        followups: [
          { delayDays: 1, message: 'Passando pra avisar que a liquidação ({{desconto}}) termina {{prazo}}, {{primeiro_nome}}. Ainda dá tempo! Quer ajuda pra escolher?' }
        ],
        sendWindow: RETAIL_HOURS
      },
      {
        id: 'moda-reativar',
        name: 'Reativar clientes sumidas',
        goal: 'Trazer de volta quem não compra há meses, com um mimo exclusivo.',
        audienceHint: 'Clientes que não compram há 3 meses ou mais.',
        variables: [
          { key: 'cupom', label: 'Cupom ou mimo', example: 'VOLTEI15 (15% OFF)' },
          { key: 'validade', label: 'Validade do cupom', example: 'até o fim do mês' }
        ],
        message: 'Oi {{primeiro_nome}}, que saudade! 💛 Faz um tempinho que você não aparece por aqui.\n\nPreparei um presente só pra você: {{cupom}}, válido {{validade}}.\n\nPosso te mostrar as novidades?',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, seu cupom {{cupom}} continua guardado aqui. Me diz o que você está procurando que eu te mando as opções 😉' }
        ],
        sendWindow: RETAIL_HOURS
      }
    ]
  },
  {
    id: 'restaurante',
    name: 'Restaurantes e delivery',
    icon: '🍔',
    setups: [
      {
        id: 'rest-promo',
        name: 'Promoção do dia ou da semana',
        goal: 'Aumentar pedidos em dias mais fracos.',
        audienceHint: 'Clientes que já pediram.',
        variables: [
          { key: 'oferta', label: 'Oferta', example: 'Combo burger + batata + refri por R$ 29,90' },
          { key: 'quando', label: 'Quando vale', example: 'só hoje' },
          { key: 'link', label: 'Link do cardápio/pedido', example: 'https://seucardapio.com.br' }
        ],
        message: '{{primeiro_nome}}, bateu a fome? 😋\n\n{{oferta}} — {{quando}}!\n\nPeça aqui: {{link}} ou responda esta mensagem que a gente anota seu pedido.',
        followups: [],
        sendWindow: { days: [0, 1, 2, 3, 4, 5, 6], start: '10:30', end: '20:30' }
      },
      {
        id: 'rest-reativar',
        name: 'Recuperar quem parou de pedir',
        goal: 'Trazer de volta clientes que não pedem há semanas.',
        audienceHint: 'Clientes sem pedido há 30 dias ou mais.',
        variables: [
          { key: 'cupom', label: 'Cupom de retorno', example: 'frete grátis no próximo pedido' }
        ],
        message: 'Oi {{primeiro_nome}}! Sentimos sua falta por aqui 🧡\n\nPra você voltar com tudo: {{cupom}}.\n\nQuer que eu te mande o cardápio atualizado?',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, seu presente ({{cupom}}) ainda está valendo! Que tal hoje? É só responder "cardápio" 😉' }
        ],
        sendWindow: { days: [0, 1, 2, 3, 4, 5, 6], start: '10:30', end: '20:30' }
      },
      {
        id: 'rest-avaliacao',
        name: 'Pesquisa de satisfação',
        goal: 'Ouvir o cliente e pedir avaliação no Google.',
        audienceHint: 'Quem pediu nos últimos dias.',
        variables: [
          { key: 'link_avaliacao', label: 'Link da avaliação no Google', example: 'https://g.page/r/...' }
        ],
        message: 'Oi {{primeiro_nome}}, tudo bem? Aqui é do restaurante 😊\n\nDe 0 a 10, quanto você gostou do seu último pedido? Sua resposta ajuda muito a gente a melhorar!',
        followups: [
          { delayDays: 2, message: 'Se puder, deixa sua avaliação pra gente no Google, leva 30 segundos e ajuda demais um negócio local: {{link_avaliacao}} 🙏' }
        ],
        sendWindow: COMMERCIAL_HOURS
      }
    ]
  },
  {
    id: 'beleza',
    name: 'Salão, barbearia e estética',
    icon: '💇',
    setups: [
      {
        id: 'beleza-retorno',
        name: 'Lembrete de retorno',
        goal: 'Chamar o cliente na hora certa de refazer o serviço (corte, unha, sobrancelha...).',
        audienceHint: 'Clientes atendidos há 3 a 5 semanas.',
        variables: [
          { key: 'servico', label: 'Serviço', example: 'corte' },
          { key: 'link_agenda', label: 'Link da agenda (opcional)', example: 'https://agenda.com/seusalao' }
        ],
        message: 'Oi {{primeiro_nome}}! ✂️ Já está chegando a hora de renovar o seu {{servico}}.\n\nQuer que eu veja um horário pra você esta semana? Me diz o melhor dia e período.',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, a agenda da semana está enchendo! Se preferir, escolha direto aqui: {{link_agenda}} 💈' }
        ],
        sendWindow: COMMERCIAL_HOURS
      },
      {
        id: 'beleza-horarios',
        name: 'Horários vagos da semana',
        goal: 'Preencher buracos na agenda com uma condição especial.',
        audienceHint: 'Clientes frequentes.',
        variables: [
          { key: 'horarios', label: 'Horários livres', example: 'terça 14h, quarta 10h e 16h' },
          { key: 'condicao', label: 'Condição especial', example: '10% de desconto' }
        ],
        message: '{{primeiro_nome}}, abriram alguns horários esta semana: {{horarios}}.\n\nQuem agendar nesses horários ganha {{condicao}} 💅\n\nQuer garantir o seu?',
        followups: [],
        sendWindow: COMMERCIAL_HOURS
      },
      {
        id: 'beleza-pacote',
        name: 'Pacote ou tratamento',
        goal: 'Vender pacotes de sessões (estética, depilação, tratamentos).',
        audienceHint: 'Clientes que já fizeram o serviço avulso.',
        variables: [
          { key: 'pacote', label: 'Pacote', example: 'Pacote 5 sessões de limpeza de pele' },
          { key: 'preco', label: 'Preço/condição', example: 'R$ 399 em até 3x' }
        ],
        message: 'Oi {{primeiro_nome}}! 🌿 Criamos o {{pacote}} por {{preco}}, bem mais em conta que as sessões avulsas.\n\nPosso te explicar como funciona?',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, ficou alguma dúvida sobre o {{pacote}}? Posso montar um cronograma de sessões que encaixe na sua rotina 😊' }
        ],
        sendWindow: COMMERCIAL_HOURS
      }
    ]
  },
  {
    id: 'saude',
    name: 'Clínicas e consultórios',
    icon: '🩺',
    setups: [
      {
        id: 'saude-retorno',
        name: 'Lembrete de retorno ou check-up',
        goal: 'Lembrar pacientes de agendar o retorno ou a consulta de rotina.',
        audienceHint: 'Pacientes com retorno previsto.',
        variables: [
          { key: 'clinica', label: 'Nome da clínica/profissional', example: 'Clínica Sorriso' }
        ],
        message: 'Olá {{primeiro_nome}}, aqui é da {{clinica}}. Já está na época do seu retorno/check-up de rotina.\n\nPodemos agendar? Me diga o melhor dia e período para você.',
        followups: [
          { delayDays: 4, message: '{{primeiro_nome}}, ainda temos horários disponíveis para o seu retorno na {{clinica}}. Quer que eu reserve um para você?' }
        ],
        sendWindow: WEEKDAYS_ONLY
      },
      {
        id: 'saude-prevencao',
        name: 'Campanha de prevenção',
        goal: 'Divulgar campanhas sazonais (vacinação, limpeza, exames de rotina).',
        audienceHint: 'Toda a base de pacientes.',
        variables: [
          { key: 'campanha', label: 'Campanha', example: 'Campanha de vacinação da gripe' },
          { key: 'periodo', label: 'Período', example: 'até 30 de maio' }
        ],
        message: 'Olá {{primeiro_nome}}! A {{campanha}} está acontecendo {{periodo}}.\n\nQuer agendar o seu horário? É só responder esta mensagem.',
        followups: [],
        sendWindow: WEEKDAYS_ONLY
      },
      {
        id: 'saude-reativar',
        name: 'Reativar pacientes',
        goal: 'Reaproximar pacientes que não aparecem há mais de um ano.',
        audienceHint: 'Pacientes sem consulta há 12 meses ou mais.',
        variables: [
          { key: 'clinica', label: 'Nome da clínica/profissional', example: 'Clínica Sorriso' }
        ],
        message: 'Olá {{primeiro_nome}}, tudo bem? Aqui é da {{clinica}}. Faz um tempo desde a sua última consulta e queremos saber como você está.\n\nGostaria de agendar uma avaliação?',
        followups: [
          { delayDays: 5, message: '{{primeiro_nome}}, nossa agenda do mês está aberta. Se quiser, já deixo um horário reservado para você na {{clinica}}.' }
        ],
        sendWindow: WEEKDAYS_ONLY
      }
    ]
  },
  {
    id: 'imoveis',
    name: 'Imobiliárias e corretores',
    icon: '🏠',
    setups: [
      {
        id: 'imov-novo',
        name: 'Imóvel novo no perfil',
        goal: 'Apresentar um imóvel para quem procura algo parecido.',
        audienceHint: 'Leads que buscam esse tipo de imóvel/região.',
        variables: [
          { key: 'imovel', label: 'Descrição curta', example: 'apartamento de 2 quartos com varanda no Tatuapé' },
          { key: 'valor', label: 'Valor', example: 'R$ 520 mil' },
          { key: 'link', label: 'Link com fotos', example: 'https://seusite.com/imovel/123' }
        ],
        message: 'Oi {{primeiro_nome}}! 🏡 Acabou de entrar um {{imovel}} por {{valor}}, bem no perfil que você procura.\n\nFotos e detalhes: {{link}}\n\nQuer agendar uma visita?',
        followups: [
          { delayDays: 2, message: '{{primeiro_nome}}, esse imóvel está recebendo bastante procura. Quer que eu reserve um horário de visita ainda esta semana?' },
          { delayDays: 5, message: 'Se esse não for exatamente o que você busca, me conta o que mudaria (região, tamanho, valor) que eu filtro outras opções pra você 😉' }
        ],
        sendWindow: COMMERCIAL_HOURS
      },
      {
        id: 'imov-visita',
        name: 'Follow-up pós-visita',
        goal: 'Retomar a conversa com quem visitou e ainda não decidiu.',
        audienceHint: 'Quem visitou imóveis recentemente.',
        variables: [],
        message: 'Oi {{primeiro_nome}}, tudo bem? E aí, o que achou do imóvel que visitamos? Ficou alguma dúvida sobre valores, financiamento ou documentação?',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, posso fazer uma simulação de financiamento sem compromisso pra você ter uma ideia das parcelas. Quer?' }
        ],
        sendWindow: COMMERCIAL_HOURS
      },
      {
        id: 'imov-captacao',
        name: 'Captação de imóveis',
        goal: 'Encontrar proprietários interessados em vender ou alugar.',
        audienceHint: 'Lista de proprietários (planilha).',
        variables: [
          { key: 'regiao', label: 'Região', example: 'Vila Mariana' }
        ],
        message: 'Olá {{primeiro_nome}}, sou corretor(a) na região de {{regiao}} e tenho clientes procurando imóveis por aí.\n\nVocê teria interesse em vender ou alugar o seu? Faço a avaliação sem custo.',
        followups: [
          { delayDays: 5, message: '{{primeiro_nome}}, só reforçando: a avaliação é gratuita e sem compromisso. Se quiser saber quanto vale seu imóvel hoje, é só responder 🙂' }
        ],
        sendWindow: COMMERCIAL_HOURS
      }
    ]
  },
  {
    id: 'academia',
    name: 'Academias e personal trainers',
    icon: '🏋️',
    setups: [
      {
        id: 'acad-matricula',
        name: 'Matrícula com condição especial',
        goal: 'Converter interessados em alunos.',
        audienceHint: 'Leads e ex-alunos.',
        variables: [
          { key: 'oferta', label: 'Oferta', example: 'matrícula grátis + 1º mês por R$ 79' },
          { key: 'prazo', label: 'Até quando', example: 'até sexta' }
        ],
        message: 'E aí, {{primeiro_nome}}! 💪 Bora começar? Até {{prazo}} estamos com {{oferta}}.\n\nQuer agendar uma aula experimental gratuita?',
        followups: [
          { delayDays: 2, message: '{{primeiro_nome}}, a condição especial ({{oferta}}) vai {{prazo}}. Qual o melhor horário pra você treinar? Já vejo uma turma 😉' }
        ],
        sendWindow: { days: [1, 2, 3, 4, 5, 6], start: '07:00', end: '20:00' }
      },
      {
        id: 'acad-inativos',
        name: 'Recuperar alunos inativos',
        goal: 'Trazer de volta quem parou de treinar.',
        audienceHint: 'Alunos sem frequência há 2 semanas ou mais.',
        variables: [],
        message: 'Oi {{primeiro_nome}}, sentimos sua falta nos treinos! 🏃 Aconteceu alguma coisa?\n\nSe quiser, monto um treino mais curto que caiba na sua rotina agora.',
        followups: [
          { delayDays: 4, message: '{{primeiro_nome}}, que tal voltar com um treino de 30 minutos essa semana? Me fala o horário que eu deixo tudo pronto 💪' }
        ],
        sendWindow: { days: [1, 2, 3, 4, 5, 6], start: '07:00', end: '20:00' }
      },
      {
        id: 'acad-desafio',
        name: 'Desafio ou evento',
        goal: 'Engajar alunos com desafios (30 dias, verão etc.).',
        audienceHint: 'Alunos ativos.',
        variables: [
          { key: 'desafio', label: 'Nome do desafio', example: 'Desafio 30 dias' },
          { key: 'inicio', label: 'Data de início', example: 'segunda, dia 10' }
        ],
        message: '{{primeiro_nome}}, vem aí o {{desafio}}! 🔥 Começa {{inicio}}, com prêmios para quem completar.\n\nPosso colocar seu nome na lista?',
        followups: [],
        sendWindow: { days: [1, 2, 3, 4, 5, 6], start: '07:00', end: '20:00' }
      }
    ]
  },
  {
    id: 'educacao',
    name: 'Cursos, escolas e infoprodutos',
    icon: '🎓',
    setups: [
      {
        id: 'edu-matriculas',
        name: 'Abertura de matrículas ou turma nova',
        goal: 'Encher uma turma nova ou o lançamento de um curso.',
        audienceHint: 'Interessados e ex-alunos.',
        variables: [
          { key: 'curso', label: 'Curso', example: 'Curso de Excel do zero ao avançado' },
          { key: 'inicio', label: 'Início', example: '3 de março' },
          { key: 'link', label: 'Link de inscrição', example: 'https://seucurso.com/inscricao' }
        ],
        message: 'Oi {{primeiro_nome}}! 📚 As inscrições para o {{curso}} estão abertas, com início em {{inicio}}.\n\nDetalhes e inscrição: {{link}}\n\nQuer que eu te mande o conteúdo completo das aulas?',
        followups: [
          { delayDays: 2, message: '{{primeiro_nome}}, as vagas do {{curso}} são limitadas. Ficou alguma dúvida sobre horários ou pagamento?' },
          { delayDays: 4, message: 'Últimos dias de inscrição para o {{curso}}, {{primeiro_nome}}! Se quiser, faço sua matrícula por aqui mesmo 😉' }
        ],
        sendWindow: COMMERCIAL_HOURS
      },
      {
        id: 'edu-aovivo',
        name: 'Aula ao vivo ou webinar',
        goal: 'Levar pessoas para um evento online.',
        audienceHint: 'Toda a base ou leads novos.',
        variables: [
          { key: 'tema', label: 'Tema', example: 'Como organizar suas finanças em 2027' },
          { key: 'data', label: 'Data e hora', example: 'quinta, 20h' },
          { key: 'link', label: 'Link da aula', example: 'https://youtube.com/live/...' }
        ],
        message: '{{primeiro_nome}}, vou fazer uma aula ao vivo e gratuita sobre "{{tema}}" — {{data}}.\n\nPosso te mandar o link no dia?',
        followups: [
          { delayDays: 1, message: 'É hoje, {{primeiro_nome}}! 🎥 {{data}}: {{link}}' }
        ],
        sendWindow: { days: [0, 1, 2, 3, 4, 5, 6], start: '09:00', end: '20:00' }
      },
      {
        id: 'edu-inscricao',
        name: 'Inscrição não concluída',
        goal: 'Recuperar quem começou a inscrição ou pediu informação e parou.',
        audienceHint: 'Quem pediu informações e não fechou.',
        variables: [
          { key: 'curso', label: 'Curso', example: 'Curso de Inglês' },
          { key: 'condicao', label: 'Condição para fechar', example: 'parcelamento em 12x sem juros' }
        ],
        message: 'Oi {{primeiro_nome}}, vi que você se interessou pelo {{curso}}. Ficou alguma dúvida que eu possa responder?',
        followups: [
          { delayDays: 2, message: '{{primeiro_nome}}, consegui liberar {{condicao}} para fechar o {{curso}} esta semana. Quer aproveitar?' }
        ],
        sendWindow: COMMERCIAL_HOURS
      }
    ]
  },
  {
    id: 'auto',
    name: 'Oficinas e serviços automotivos',
    icon: '🚗',
    setups: [
      {
        id: 'auto-revisao',
        name: 'Lembrete de revisão / troca de óleo',
        goal: 'Chamar o cliente na época da manutenção preventiva.',
        audienceHint: 'Clientes atendidos há 4 a 6 meses.',
        variables: [
          { key: 'oficina', label: 'Nome da oficina', example: 'Auto Center Silva' }
        ],
        message: 'Olá {{primeiro_nome}}, aqui é da {{oficina}} 🔧 Já está na hora da revisão/troca de óleo do seu carro.\n\nQuer agendar? Me diga o melhor dia.',
        followups: [
          { delayDays: 4, message: '{{primeiro_nome}}, manutenção em dia evita gasto maior depois. Temos horários esta semana, posso reservar um para você?' }
        ],
        sendWindow: WEEKDAYS_ONLY
      },
      {
        id: 'auto-promo',
        name: 'Promoção de serviço',
        goal: 'Divulgar um serviço com preço especial (alinhamento, ar-condicionado, pneus).',
        audienceHint: 'Toda a base de clientes.',
        variables: [
          { key: 'servico', label: 'Serviço e preço', example: 'Higienização do ar-condicionado por R$ 89' },
          { key: 'prazo', label: 'Validade', example: 'até o fim do mês' }
        ],
        message: '{{primeiro_nome}}, promoção na oficina: {{servico}}, {{prazo}}. 🚘\n\nQuer agendar?',
        followups: [],
        sendWindow: WEEKDAYS_ONLY
      },
      {
        id: 'auto-pos',
        name: 'Pós-serviço e indicação',
        goal: 'Confirmar a satisfação e pedir indicação.',
        audienceHint: 'Clientes atendidos na última semana.',
        variables: [
          { key: 'beneficio', label: 'Benefício por indicação', example: '10% no próximo serviço' }
        ],
        message: 'Oi {{primeiro_nome}}, tudo certo com o carro depois do serviço? Qualquer coisa, estamos aqui!',
        followups: [
          { delayDays: 3, message: 'Se você indicar um amigo e ele fizer um serviço com a gente, você ganha {{beneficio}} 🙌 É só me mandar o contato dele.' }
        ],
        sendWindow: WEEKDAYS_ONLY
      }
    ]
  },
  {
    id: 'pet',
    name: 'Pet shops e veterinárias',
    icon: '🐶',
    setups: [
      {
        id: 'pet-banho',
        name: 'Banho e tosa',
        goal: 'Manter a agenda de banho e tosa cheia.',
        audienceHint: 'Clientes que fazem banho e tosa.',
        variables: [
          { key: 'condicao', label: 'Condição (opcional)', example: 'a hidratação sai de graça esta semana' }
        ],
        message: 'Oi {{primeiro_nome}}! 🛁 Que tal um banho caprichado pro seu pet esta semana? E tem mais: {{condicao}}.\n\nQual o melhor dia pra você?',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, ainda temos horários com busca e entrega 🐾 Quer que eu reserve?' }
        ],
        sendWindow: COMMERCIAL_HOURS
      },
      {
        id: 'pet-vacina',
        name: 'Lembrete de vacina ou vermífugo',
        goal: 'Lembrar tutores da próxima dose.',
        audienceHint: 'Tutores com dose prevista.',
        variables: [],
        message: 'Olá {{primeiro_nome}}! 💉 Está chegando a época da próxima vacina/vermífugo do seu pet.\n\nQuer agendar a aplicação?',
        followups: [
          { delayDays: 4, message: '{{primeiro_nome}}, manter a vacinação em dia protege seu pet de doenças sérias. Posso reservar um horário?' }
        ],
        sendWindow: COMMERCIAL_HOURS
      },
      {
        id: 'pet-racao',
        name: 'Reposição de ração',
        goal: 'Avisar na hora em que a ração deve estar acabando.',
        audienceHint: 'Clientes que compram ração com frequência.',
        variables: [
          { key: 'oferta', label: 'Oferta', example: 'entrega grátis + 5% de desconto' }
        ],
        message: 'Oi {{primeiro_nome}}! A ração do seu pet já deve estar acabando 🐕 Quer que eu separe a mesma de sempre? Hoje tem {{oferta}}.',
        followups: [],
        sendWindow: COMMERCIAL_HOURS
      }
    ]
  },
  {
    id: 'servicos',
    name: 'Contabilidade, advocacia e consultoria',
    icon: '💼',
    setups: [
      {
        id: 'serv-prazo',
        name: 'Prazo ou obrigação',
        goal: 'Avisar sobre um prazo importante (IR, MEI, renovação) e oferecer o serviço.',
        audienceHint: 'Clientes e contatos que podem precisar.',
        variables: [
          { key: 'obrigacao', label: 'Obrigação', example: 'declaração do Imposto de Renda' },
          { key: 'prazo', label: 'Prazo final', example: '31 de maio' }
        ],
        message: 'Olá {{primeiro_nome}}, tudo bem? O prazo da {{obrigacao}} termina em {{prazo}}.\n\nPosso cuidar disso para você? Me avise que eu te passo a lista de documentos.',
        followups: [
          { delayDays: 5, message: '{{primeiro_nome}}, o prazo da {{obrigacao}} está chegando ({{prazo}}). Deixar para a última hora aumenta o risco de multa. Quer que eu já comece?' }
        ],
        sendWindow: WEEKDAYS_ONLY
      },
      {
        id: 'serv-oferta',
        name: 'Apresentar um serviço',
        goal: 'Oferecer um serviço novo ou pouco conhecido para a base.',
        audienceHint: 'Clientes atuais.',
        variables: [
          { key: 'servico', label: 'Serviço', example: 'planejamento tributário' },
          { key: 'beneficio', label: 'Principal benefício', example: 'reduzir legalmente os impostos da sua empresa' }
        ],
        message: 'Olá {{primeiro_nome}}! Agora também oferecemos {{servico}}, que pode {{beneficio}}.\n\nPosso fazer uma análise inicial gratuita do seu caso?',
        followups: [
          { delayDays: 5, message: '{{primeiro_nome}}, a análise inicial de {{servico}} é rápida e sem compromisso. Qual o melhor dia para uma conversa de 15 minutos?' }
        ],
        sendWindow: WEEKDAYS_ONLY
      },
      {
        id: 'serv-reativar',
        name: 'Retomar contato com ex-clientes',
        goal: 'Reabrir relacionamento com quem já foi cliente.',
        audienceHint: 'Ex-clientes.',
        variables: [],
        message: 'Olá {{primeiro_nome}}, tudo bem? Faz tempo que não conversamos! Como estão as coisas por aí? Se precisar de ajuda com algo, conte comigo.',
        followups: [],
        sendWindow: WEEKDAYS_ONLY
      }
    ]
  },
  {
    id: 'eventos',
    name: 'Eventos, buffet e turismo',
    icon: '🎉',
    setups: [
      {
        id: 'ev-datas',
        name: 'Datas disponíveis',
        goal: 'Vender datas livres na agenda.',
        audienceHint: 'Quem já pediu orçamento.',
        variables: [
          { key: 'datas', label: 'Datas livres', example: '14/03, 21/03 e 04/04' },
          { key: 'condicao', label: 'Condição', example: '15% de desconto para fechar este mês' }
        ],
        message: 'Oi {{primeiro_nome}}! 🎈 Temos as datas {{datas}} disponíveis, e para fechar agora: {{condicao}}.\n\nQuer que eu monte um orçamento?',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, essas datas costumam ser reservadas rápido. Posso segurar uma por 48h enquanto você decide?' }
        ],
        sendWindow: COMMERCIAL_HOURS
      },
      {
        id: 'ev-pacote',
        name: 'Pacote promocional',
        goal: 'Divulgar pacotes de viagem ou de festa.',
        audienceHint: 'Toda a base.',
        variables: [
          { key: 'pacote', label: 'Pacote', example: 'Porto de Galinhas, 5 noites com aéreo' },
          { key: 'preco', label: 'Preço', example: 'a partir de 10x R$ 289' },
          { key: 'link', label: 'Link', example: 'https://suaagencia.com/pacote' }
        ],
        message: '{{primeiro_nome}}, olha que oportunidade: {{pacote}}, {{preco}} ✈️\n\nDetalhes: {{link}}\n\nQuer que eu verifique datas para você?',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, as vagas desse pacote estão acabando. Quer uma cotação para as suas datas?' }
        ],
        sendWindow: COMMERCIAL_HOURS
      },
      {
        id: 'ev-pos',
        name: 'Pós-evento: avaliação e indicação',
        goal: 'Pedir depoimento e indicações depois do evento.',
        audienceHint: 'Clientes de eventos recentes.',
        variables: [
          { key: 'link_avaliacao', label: 'Link da avaliação', example: 'https://g.page/r/...' }
        ],
        message: 'Oi {{primeiro_nome}}! Foi um prazer fazer parte do seu evento 💛 Como foi a experiência para você?',
        followups: [
          { delayDays: 3, message: 'Se puder, deixe uma avaliação pra gente: {{link_avaliacao}}. E se conhecer alguém planejando um evento, adoraríamos atender 🙏' }
        ],
        sendWindow: COMMERCIAL_HOURS
      }
    ]
  },
  {
    id: 'varejo',
    name: 'Varejo e lojas em geral',
    icon: '🛍️',
    setups: [
      {
        id: 'var-ofertas',
        name: 'Ofertas da semana',
        goal: 'Rotina semanal de ofertas para a base.',
        audienceHint: 'Toda a base de clientes.',
        variables: [
          { key: 'ofertas', label: 'Ofertas (uma por linha)', example: '• Produto A por R$ 19,90\n• Produto B por R$ 49,90' },
          { key: 'prazo', label: 'Validade', example: 'até sábado' }
        ],
        message: '{{primeiro_nome}}, separei as ofertas da semana pra você 🛒\n\n{{ofertas}}\n\nVálido {{prazo}}. Quer que eu separe algum?',
        followups: [],
        sendWindow: RETAIL_HOURS
      },
      {
        id: 'var-data',
        name: 'Data comemorativa',
        goal: 'Aproveitar Dia das Mães, Namorados, Natal, Black Friday etc.',
        audienceHint: 'Toda a base.',
        variables: [
          { key: 'data', label: 'Data comemorativa', example: 'Dia das Mães' },
          { key: 'oferta', label: 'Oferta', example: 'kits presente a partir de R$ 59 com embalagem grátis' }
        ],
        message: 'Oi {{primeiro_nome}}! 🎁 O {{data}} está chegando e preparamos {{oferta}}.\n\nQuer ajuda para escolher o presente ideal?',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, faltam poucos dias para o {{data}}! Posso separar e embalar para você retirar ou entregar 😉' }
        ],
        sendWindow: RETAIL_HOURS
      },
      {
        id: 'var-indicacao',
        name: 'Programa de indicação',
        goal: 'Transformar clientes em divulgadores.',
        audienceHint: 'Clientes satisfeitos.',
        variables: [
          { key: 'premio', label: 'Prêmio por indicação', example: 'R$ 20 de desconto para você e para o amigo' }
        ],
        message: '{{primeiro_nome}}, obrigado por ser nosso cliente! 💚 Indique um amigo e ganhem {{premio}}.\n\nÉ só me mandar o contato dele por aqui.',
        followups: [],
        sendWindow: RETAIL_HOURS
      }
    ]
  },
  {
    id: 'b2b',
    name: 'Vendas B2B e representantes',
    icon: '🤝',
    setups: [
      {
        id: 'b2b-prospeccao',
        name: 'Prospecção de novos clientes',
        goal: 'Abrir conversa com empresas que ainda não compram de você.',
        audienceHint: 'Planilha de leads (use a opção Planilha).',
        variables: [
          { key: 'empresa', label: 'Sua empresa', example: 'Distribuidora Alfa' },
          { key: 'proposta', label: 'Proposta de valor em uma frase', example: 'reduzir o custo com embalagens em até 20%' }
        ],
        message: 'Olá {{primeiro_nome}}, tudo bem? Sou da {{empresa}} e ajudamos empresas como a sua a {{proposta}}.\n\nFaz sentido uma conversa rápida de 10 minutos esta semana?',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, posso te mandar um exemplo de como fizemos isso para um cliente do seu segmento?' },
          { delayDays: 5, message: 'Vou encerrar meu contato por aqui para não incomodar, {{primeiro_nome}}. Se em algum momento quiser {{proposta}}, é só me chamar 🙂' }
        ],
        sendWindow: WEEKDAYS_ONLY
      },
      {
        id: 'b2b-reposicao',
        name: 'Reposição de estoque',
        goal: 'Antecipar o pedido de recompra dos clientes.',
        audienceHint: 'Clientes com compra recorrente.',
        variables: [
          { key: 'condicao', label: 'Condição do mês', example: 'frete CIF para pedidos acima de R$ 1.500' }
        ],
        message: 'Olá {{primeiro_nome}}! Passando para ver se já é hora de repor o estoque. Este mês temos {{condicao}}.\n\nQuer que eu monte o pedido com base no último?',
        followups: [
          { delayDays: 3, message: '{{primeiro_nome}}, consigo garantir o prazo de entrega se o pedido entrar até sexta. Posso seguir com o mesmo do último pedido?' }
        ],
        sendWindow: WEEKDAYS_ONLY
      },
      {
        id: 'b2b-catalogo',
        name: 'Novo catálogo ou lançamento',
        goal: 'Apresentar produtos novos para a carteira.',
        audienceHint: 'Carteira de clientes.',
        variables: [
          { key: 'novidade', label: 'Novidade', example: 'linha nova de produtos de limpeza' }
        ],
        message: 'Olá {{primeiro_nome}}! Chegou nossa {{novidade}}. Anexei o catálogo com preços.\n\nQuer que eu te mande amostras ou condições para o primeiro pedido?',
        followups: [
          { delayDays: 4, message: '{{primeiro_nome}}, conseguiu ver o catálogo da {{novidade}}? Os primeiros pedidos têm condição especial.' }
        ],
        sendWindow: WEEKDAYS_ONLY
      }
    ]
  },
  {
    id: 'comunidade',
    name: 'Igrejas, ONGs e comunidades',
    icon: '🙏',
    setups: [
      {
        id: 'com-convite',
        name: 'Convite para evento',
        goal: 'Convidar membros e simpatizantes para um encontro.',
        audienceHint: 'Membros e participantes.',
        variables: [
          { key: 'evento', label: 'Evento', example: 'Encontro de Jovens' },
          { key: 'quando', label: 'Data e local', example: 'sábado às 19h, no salão principal' }
        ],
        message: 'Olá {{primeiro_nome}}! Você está convidado(a) para o {{evento}}, {{quando}} 💛\n\nPodemos contar com a sua presença?',
        followups: [
          { delayDays: 2, message: 'Lembrete: o {{evento}} é {{quando}}. Esperamos você, {{primeiro_nome}}!' }
        ],
        sendWindow: { days: [0, 1, 2, 3, 4, 5, 6], start: '09:00', end: '20:00' }
      },
      {
        id: 'com-doacao',
        name: 'Campanha de doação',
        goal: 'Mobilizar doações para uma causa.',
        audienceHint: 'Apoiadores.',
        variables: [
          { key: 'causa', label: 'Causa', example: 'campanha do agasalho' },
          { key: 'como', label: 'Como doar', example: 'Pix: doacoes@instituto.org ou entrega na sede' }
        ],
        message: 'Olá {{primeiro_nome}}! Estamos com a {{causa}} e a sua ajuda faz toda a diferença 🤲\n\nComo ajudar: {{como}}\n\nPodemos contar com você?',
        followups: [
          { delayDays: 4, message: '{{primeiro_nome}}, já arrecadamos bastante, mas ainda falta! Se puder ajudar ou compartilhar com amigos, agradecemos muito 💛' }
        ],
        sendWindow: { days: [0, 1, 2, 3, 4, 5, 6], start: '09:00', end: '20:00' }
      },
      {
        id: 'com-aviso',
        name: 'Aviso geral',
        goal: 'Comunicado sem necessidade de resposta (sem follow-up).',
        audienceHint: 'Toda a comunidade.',
        variables: [
          { key: 'aviso', label: 'Aviso', example: 'mudança de horário das atividades a partir de março' }
        ],
        message: 'Olá {{primeiro_nome}}! Comunicado importante: {{aviso}}.\n\nQualquer dúvida, é só responder esta mensagem.',
        followups: [],
        sendWindow: { days: [0, 1, 2, 3, 4, 5, 6], start: '09:00', end: '20:00' }
      }
    ]
  }
]
