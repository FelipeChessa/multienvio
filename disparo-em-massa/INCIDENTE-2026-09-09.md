# Incidente 2026-09-09 — dois codebases divergentes

Este documento existe pra uma razão só: **evitar que isso aconteça de novo**, com este ou
outro projeto. Leia antes de assumir que uma pasta de projeto é "o" projeto.

## O que aconteceu, em ordem

1. Uma sessão de IA (Claude Code) foi aberta na pasta `disparo/` (sibling deste repositório) e
   trabalhou nela a sessão inteira — v1.1 e v1.2 completas, redesenho visual, auto-atualização
   — **achando que aquele era o produto real**.
2. `disparo/` na verdade era um **protótipo desconectado**: nunca teve tela de licença, nunca
   foi empacotado como instalador, nunca chegou a um usuário. Um app de verdade, bem mais
   maduro (dashboard, disjuntor, licenciamento, opt-out automático — tudo listado em
   `ARQUITETURA.md`), já existia em produção, construído em outra sessão/notebook, sem
   nenhuma relação de código com `disparo/`.
3. A sessão publicou um pacote de "auto-atualização" (`multienvio/api/latest-version.js`)
   pensando estar atualizando o produto real — na verdade apontava pro código do protótipo.
4. Alarme falso, mas revelador: por um instante pareceu que isso tinha sobrescrito o app real
   (usuário relatou "identidade visual sumiu" + "recursos de configuração sumiram"). Investigação
   mostrou que **nada foi perdido** — o app real (`app.asar` do instalador) é imutável, sem
   nenhum mecanismo de auto-atualização, e continuava intacto (conferido por hash SHA256
   contra o release oficial). O "sumiço" era, na real, o usuário comparando o protótipo (que a
   sessão vinha redesenhando) com o app real (que ele já conhecia) e achando que eram o mesmo
   projeto perdendo recursos — quando eram dois projetos diferentes o tempo todo.
5. A partir daí: extraiu-se o código real do `app.asar` (verificado por hash), criou-se este
   repositório (`disparo-em-massa/`), e as 6 fases de recursos construídas em `disparo/` foram
   **portadas** pra cá, adaptadas ao código/identidade visual reais — não o contrário.

## Causa raiz

Ninguém — nem a IA, nem (aparentemente) o usuário no início da sessão — verificou, ANTES de
começar a trabalhar em `disparo/`, se aquela pasta era de fato o código-fonte do produto
distribuído. Não havia nenhuma âncora de verificação simples (um README dizendo "isto é/não é
o produto real", um hash, uma URL de repositório remoto) que permitisse confirmar isso em
segundos.

## O que já existe agora pra evitar repetição

- **Este arquivo** e `ARQUITETURA.md`, no repositório que É o produto real.
- `disparo/README.md` recebeu um aviso no topo apontando pra cá (ver commit correspondente
  naquele repositório).
- `disparo-em-massa/` tem git desde a extração — qualquer mudança futura fica rastreável e
  comparável.

## Checklist antes de começar a trabalhar em "o projeto X"

Se você (humano ou IA) está prestes a abrir uma sessão de trabalho numa pasta de projeto,
antes de escrever qualquer código:

1. **Existe um `.exe`/`.msi`/build publicado desse produto?** Se sim, ele bate com o que está
   nesta pasta? (comparar versão, título da janela, recursos visíveis — não precisa ser hash,
   só uma checagem de sanidade de 1 minuto.)
2. **Essa pasta tem histórico git?** `git log --oneline | tail -5` — se o primeiro commit for
   recente e genérico ("estado inicial"), pergunte de onde veio esse estado inicial.
3. **Existe uma pasta irmã com nome parecido?** (`projeto/` vs `projeto-real/`, `app/` vs
   `app-v2/`) — se sim, pare e pergunte qual é a fonte de verdade antes de continuar.
4. **Se o usuário mencionar recursos que você não vê no código** (um dashboard, uma tela, uma
   configuração) — não assuma que "ainda não foi implementado". Pergunte diretamente se esses
   recursos já existem em algum outro lugar (outra pasta, outra sessão, outro computador).
5. **Antes de publicar/deployar qualquer coisa que afete usuários reais** (auto-update, release,
   deploy de produção): confirme explicitamente que o artefato publicado foi gerado a partir do
   código que você imagina ser "o" produto — não assuma.

## Estado das duas features seguradas (não publicadas)

Duas mudanças no `multienvio` ficaram prontas localmente mas **conscientemente não publicadas**
até aprovação explícita do usuário a cada vez:

- Coluna "Expira em" / status automático no painel admin — **esta já foi publicada** em
  2026-09-09 (commit `62a26c2`, no ar em `multienvio.vercel.app/admin`).
- `multienvio/api/latest-version.js` (auto-atualização) — **pausado de propósito**
  (`version: '0.0.1'`, downloadUrl vazio) desde este incidente. Não reative sem: (a) confirmar
  que existe um mecanismo de auto-atualização de verdade no app real (hoje não existe nenhum —
  ver `ARQUITETURA.md`), e (b) gerar o pacote de atualização a partir do código deste
  repositório (`disparo-em-massa/`), nunca de `disparo/`.
