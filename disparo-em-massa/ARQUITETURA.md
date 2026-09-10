# Arquitetura — Disparo em Massa (app real)

> **Este é o codebase real.** Se você (humano ou IA) chegou aqui vindo de uma pasta chamada
> `disparo/` no mesmo nível — aquela é um **protótipo desconectado**, nunca chegou a um
> usuário real e não deve ser confundida com este projeto. Veja
> [`INCIDENTE-2026-09-09.md`](./INCIDENTE-2026-09-09.md) pra entender exatamente por que essa
> distinção existe e o que já deu errado por causa dela.

## O que é

App desktop (Electron) de disparo em massa de mensagens no WhatsApp Business. Distribuído
como instalador Windows (`Disparo.em.Massa.Setup.X.Y.Z.exe` / `.msi`), publicado como asset de
GitHub Release no repositório `FelipeChessa/multienvio`. Licenciado — só funciona com uma
chave de licença ativa, verificada contra um servidor de ativação (ver seção Licenciamento).

## Como este código chegou aqui

Este workspace (`disparo-em-massa/`) foi reconstruído em 2026-09-09 **extraindo o `app.asar`**
de uma instalação real já em produção (`C:\Users\Felipe\AppData\Local\Programs\Disparo em
Massa\resources\app.asar`), depois de confirmar por hash SHA256 que o instalador instalado
batia exatamente com o release oficial `v1.0.0` publicado no GitHub. Não havia, até esse
momento, nenhum repositório git rastreando esse código-fonte — ele existia só dentro do
instalador empacotado, construído originalmente em outra sessão/notebook.

A partir daqui, ESTE repositório git (iniciado em `git init` no mesmo dia) é a fonte de
verdade mais atual que existe. Se você tem acesso a um repositório remoto mais atualizado,
sincronize com cuidado (compare antes de sobrescrever). Se não tem, considere criar um remoto
pra este repositório o quanto antes — hoje ele só existe localmente nesta máquina.

## Estrutura

```
disparo-em-massa/
├── electron/main.js       # processo principal do Electron — janela, bandeja, sobe o server.js
├── src/
│   ├── server.js          # Express — toda a API HTTP + serve public/
│   ├── sender.js           # motor de disparo (fila, disjuntor, naturalidade, álbum)
│   ├── db.js               # persistência em data/app.json (JSON puro, sem banco externo)
│   ├── whatsapp.js         # conexão Baileys — pareamento, reconexão, opt-out automático
│   ├── license.js          # ativação/verificação de licença (Ed25519)
│   ├── paths.js            # resolve auth/ e data/ (userData do Electron vs pasta do projeto)
│   ├── env.js               # carrega .env manualmente
│   ├── spreadsheet.js      # leitura de planilha (.xlsx/.csv) — "Clientes frios"
│   ├── phone.js            # normalização de telefone — "Clientes frios"
│   ├── audio.js            # remuxa gravação do navegador (webm/opus) pra ogg/opus via ffmpeg-static
│   ├── updateState.js      # ponte entre electron/main.js (autoUpdater) e a API — farol de versão na UI
│   ├── scheduler.js        # dispara mensagens agendadas no horário certo, rearma ao iniciar o app
│   ├── scheduledFiles.js   # persiste em disco os anexos de mensagens agendadas (sobrevive a restart)
│   └── scheduledRoutes.js  # rotas /api/scheduled (router separado — server.js já tava grande)
├── public/                 # frontend puro (HTML/CSS/JS, sem build step, sem framework)
│   └── emoji-data.js       # lista curada de emojis pro seletor (sem dependência externa)
├── auth/                   # sessão Baileys (gitignored) — NUNCA commitar, é a credencial do WhatsApp
└── data/                   # data/app.json + data/license.json (gitignored)
```

**`node_modules/` não vem do `app.asar`** (electron-builder não empacota isso dentro do asar
da forma que dá pra reextrair como fonte utilizável) — rode `npm install` depois de clonar.

## Como rodar em desenvolvimento

Duas formas:

1. **Como servidor puro** (mais rápido pra iterar, sem abrir janela Electron):
   ```
   node src/server.js
   ```
   Sobe em `http://localhost:3210`. Sem `ELECTRON_USER_DATA_DIR` definida, `auth/` e `data/`
   ficam direto na raiz do projeto (`src/paths.js` cai nesse fallback).

2. **Como app Electron de verdade**:
   ```
   npm start
   ```
   (confira o script em `package.json` — se não existir, `electron .` deve funcionar já que
   `main` aponta pra `electron/main.js`). Nesse modo, `auth/`/`data/` vão pra
   `app.getPath('userData')` (ex: `%APPDATA%\Disparo em Massa` no Windows).

**Cuidado**: se você também tem a instalação real (`.exe`) rodando ou pareada com uma sessão
de WhatsApp de produção, NÃO rode o dev server apontando pra mesma pasta `auth/` ao mesmo
tempo — duas conexões brigando pela mesma sessão derrubam uma à outra. Use uma sessão de
WhatsApp de teste separada enquanto uma mudança não estiver validada.

## Licenciamento — como as peças se conectam

Isso não é óbvio e já causou confusão real (ver histórico do incidente). O quadro completo:

- **`src/license.js`** verifica a chave de licença localmente (assinatura Ed25519, chave
  pública hardcoded no arquivo) e, se `ACTIVATION_SERVER_URL` estiver configurado (tem um
  default hardcoded), também confere contra um servidor remoto pra impedir a mesma chave de
  ativar em dois computadores (device binding).
- O default hardcoded é `https://disparo-em-massa-releases.vercel.app/api`.
- **Esse domínio é só um alias** — confirmei em 2026-09-09 que ele redireciona (HTTP 307) pra
  `https://multienvio.vercel.app/api`. Ou seja: **é o mesmo backend** do repositório
  `FelipeChessa/multienvio` (Vercel), não um serviço separado. `curl -I
  https://disparo-em-massa-releases.vercel.app/api` mostra o `Location:` do redirect se
  precisar reconferir no futuro.
- O repositório `multienvio` também é onde os releases (`.exe`/`.msi`) ficam hospedados como
  GitHub Release assets — duas responsabilidades (ativação de licença + hospedagem de
  instalador) no mesmo repositório/deploy.
- **`multienvio/api/latest-version.js`** existe (endpoint de auto-atualização manual, usado
  pelo site de download) mas continua **pausado de propósito** (`version: '0.0.1'`, sem
  downloadUrl) desde 2026-09-09 — ver `INCIDENTE-2026-09-09.md`. Não reative sem confirmar as
  duas condições descritas lá.
- **Auto-atualização de verdade (implementada em 2026-09-09, depois do incidente)**: usa
  `electron-updater` (`electron/main.js`), configurado com o provider `github` que já existe
  em `package.json` (`build.publish`, repositório `FelipeChessa/multienvio`, onde os releases
  `.exe`/`.msi` já são publicados). **Não tem nenhuma relação com o endpoint acima** — lê
  diretamente os assets + `latest.yml` do GitHub Release mais recente. Ao abrir, o app confere
  se há uma versão nova, baixa em segundo plano (`autoUpdater.autoDownload = true`) e só
  instala de fato na próxima vez que o app fechar de verdade — pelo menu da bandeja ("Sair" ou,
  se já tiver baixado, "Reiniciar para atualizar"), nunca no meio de um disparo em andamento.
  Só roda se `app.isPackaged` (em dev, `node src/server.js`/`electron .` sem build publicado,
  fica inerte). Publicar uma release no GitHub (`electron-builder --publish always`, ou o
  workflow do GitHub Actions) já é suficiente para os usuários que já instalaram o app
  receberem a atualização sozinhos, sem precisar baixar o instalador de novo.

## Recursos existentes (não remover/quebrar sem querer)

Estes recursos já existiam na v1.0.0 real e são o motivo de o app ter licença/dashboard — se
uma mudança futura "simplificar" o código sem querer e algum destes sumir, é uma regressão:

- **Dashboard de métricas** (topo da tela principal): etiquetas ativas, envios nas últimas
  24h, taxa de sucesso, contatos que saíram.
- **Configurações de envio** (modal): delay min/max entre mensagens, tamanho de lote, pausa
  entre lotes, limite diário de envios — tudo persistido em `data/app.json` (`settings`).
- **Disjuntor automático** (dentro do mesmo modal, seção avançada): interrompe o disparo
  sozinho se muitas mensagens seguidas falharem, ou se a taxa de falha passar de um limite —
  configurável (`circuitBreaker` dentro de `settings`).
- **Personalização `{{nome}}`**: qualquer mensagem de texto pode usar esse placeholder,
  substituído pelo nome do contato (ou "cliente" se não tiver nome salvo).
- **Gravar nota de voz dentro do app** (botão "🎙️ Gravar áudio", em Arquivo/texto): grava pelo
  microfone do computador (como o próprio WhatsApp), sem precisar importar um arquivo pronto.
  O navegador grava em webm/opus; o servidor remuxa pra ogg/opus (`src/audio.js`, via
  `ffmpeg-static` — só remuxagem de contêiner, não reencoda o áudio) antes de mandar como nota
  de voz de verdade (`ptt: true`). Continua possível importar um arquivo de áudio existente e
  marcar "enviar como nota de voz" manualmente, como antes.
- **Opt-out automático**: se um contato responder "parar", "sair", "cancelar" etc. (lista em
  `src/whatsapp.js`), ele é adicionado a `data/app.json` (`optOuts`) e passa a ser
  automaticamente excluído de: contagem de etiquetas, listagem de contatos, disparo por
  etiqueta, "Todos os contatos" e validação de "Clientes frios".
- **Exportar CSV** (`GET /api/logs/export.csv`) e **reenviar falhas selecionadas** — histórico
  de envios com filtro de falhas recentes.
- **Tutorial de primeiro uso** (modal, 4 passos, controlado por `localStorage`).
- **Farol de versão + auto-update manual** (cabeçalho): mostra a versão instalada; fica
  amarelo quando há atualização disponível, com botão "Atualizar para versão mais recente"
  que aparece só depois que o download terminar (`GET/POST /api/app-version*`,
  `src/updateState.js`) — clicar chama `autoUpdater.quitAndInstall()`, reinicia e já abre na
  versão nova, sem passar pelo instalador manual.
- **Emoji picker** (botão 😊 nos campos de mensagem/legenda): lista curada local
  (`public/emoji-data.js`, ~280 emojis em 10 categorias), sem dependência externa nem rede.
- **Programar envio** (checkbox "Programar para depois" perto do botão Disparar): agenda
  qualquer tipo de mensagem (texto, mídia com arquivo, álbum, enquete, localização, cartão)
  pra um horário futuro. Anexos ficam persistidos em disco (`src/scheduledFiles.js`,
  `data/scheduled-attachments/`) até a hora chegar — sobrevive a fechar/reabrir o app.
  `src/scheduler.js` rearma os pendentes ao iniciar; se o horário passou há mais de 15min
  enquanto o app estava fechado, marca como falho em vez de disparar um envio muito atrasado
  sem avisar. Painel "Mensagens agendadas" mostra pendentes/enviadas/falhadas, com cancelar.

## Recursos portados de `disparo/` em 2026-09-09 (6 fases)

Ver commits `7732410` a `6d70bc5` no histórico deste repositório pra detalhe fase a fase. Em
resumo, o que ganhou em cima da base acima:

1. **Multi-etiqueta com dedupe** — antes só dava pra escolher uma etiqueta por disparo.
2. **Tipos de mensagem novos**: vídeo, áudio (nota de voz), enquete, localização, cartão de
   contato (vCard) — antes só PDF/imagem.
3. **Naturalidade do envio**: simular digitação, pular contatos bloqueados, marcar conversa
   como lida — mais **etiqueta automática pós-envio** (aplicar/remover etiqueta depois de
   mandar).
4. **Álbum** (2-5 fotos/vídeos numa mensagem só, protocolo Baileys de 2 etapas). Decisão de
   design: conta como 1 envio só pro disjuntor/limite diário, não 1+N.
5. **Aba "Todos os contatos"** — dispara pra qualquer contato já sincronizado, não só quem
   está em etiqueta.
6. **Aba "Clientes frios"** — dispara pra quem ainda NÃO é contato, a partir de uma planilha
   (.xlsx/.csv). Cada telefone é normalizado (`src/phone.js`) e conferido de verdade no
   WhatsApp (`sock.onWhatsApp`) antes de aparecer selecionável — nada é enviado sem essa
   validação passar primeiro.

Todas as 3 fontes de contato (etiqueta, "Todos os contatos", "Clientes frios") convergem no
mesmo mecanismo: o campo `adHocContacts` do frontend (`public/app.js`) e o campo `contactsJson`
que `POST /api/dispatch` já aceitava (originalmente só pra reenvio de falhas selecionadas) —
generalizado, não recriado do zero.

## API — endpoints principais

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/license/status` / POST `/api/license/activate` | licenciamento |
| GET | `/api/status` | status da conexão WhatsApp (ou `unlicensed`) |
| GET | `/api/labels` / `/api/labels/:id/contacts` / `/api/labels/contacts-count` | etiquetas |
| GET | `/api/contacts?q=` | todos os contatos individuais sincronizados (Fase 5) |
| POST | `/api/cold-contacts/preview` / `/validate` | planilha de clientes frios (Fase 6) |
| POST | `/api/connection/disconnect` \| `/reconnect` \| `/reset` | controle de sessão |
| GET | `/api/logs/failed` / `/api/logs/export.csv` | histórico de falhas |
| GET/DELETE | `/api/optouts` / `/api/optouts/:jid` | quem pediu pra sair |
| GET/PUT | `/api/settings` / `/api/settings/usage` | ritmo de envio + disjuntor |
| GET/PUT | `/api/messaging-profile` | cartão de contato + localização (Fase 2) |
| POST | `/api/dispatch` | inicia um disparo — `labelIds[]` OU `contactsJson` (JSON) |
| GET | `/api/dispatch/:jobId/stream` | SSE — progresso em tempo real |

## Verificação — antes de qualquer mudança grande

Sem suíte automatizada. Antes de considerar algo pronto:

1. `node --check` em todo arquivo `.js` tocado.
2. Rodar `node src/server.js` (ou `npm start` pro modo Electron) e confirmar que sobe sem
   erro — se tiver licença ativada localmente, confirma que `/api/status` não regride pra
   `unlicensed` à toa.
3. Testar contra uma sessão de WhatsApp de TESTE, nunca contra etiquetas/contatos reais de
   cliente, especialmente pra tipos de mensagem novos ou mudanças no motor de disparo
   (`src/sender.js`).
4. Depois de qualquer mudança em `src/sender.js`: confirmar que disjuntor e limite diário
   continuam funcionando (ainda contam certo mesmo com os tipos de mensagem/fontes de contato
   novos) — é fácil quebrar isso sem perceber ao generalizar o motor de disparo.
5. Gravação de áudio: testar dentro do app empacotado (`.exe`), não só `node src/server.js` —
   o Windows tem uma permissão de privacidade separada ("Configurações > Privacidade >
   Microfone > Permitir que aplicativos de área de trabalho acessem o microfone") que só
   aparece pra um app de verdade, não pro dev server no navegador.
6. Auto-atualização: só é testável de fato publicando uma release real (não dá pra simular
   localmente sem um build assinado/publicado) — antes de confirmar publicação de qualquer
   release, ver o checklist do topo deste documento e do `INCIDENTE-2026-09-09.md`.
