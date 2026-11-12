# Passos Manuais para Release v1.3.0

Este documento detalha os passos que **não pude automatizar** e que você precisa executar manualmente.

---

## 📋 Resumo do que foi feito automaticamente

✅ `package.json` atualizado para v1.3.0 com:
- electron, electron-builder, electron-updater como devDependencies
- Scripts: `start`, `dist`, `dist:win`, `dist:win:nsis`, `dist:win:msi`
- Configuração completa de build (NSIS + MSI)

✅ Pasta `build/` criada com:
- `icon.ico` (placeholder gerado a partir de SVG)
- `license.txt`
- `icon.svg` e `icon.png` (fontes)

✅ Workflow GitHub Actions criado em `.github/workflows/build-windows.yml`

---

## ⚠️ Problemas já resolvidos na release v1.4.0 (não repetir)

A release v1.4.0 precisou de várias tentativas no GitHub Actions até sair certa. Os
problemas reais, em ordem, pra não perder tempo redescobrindo:

1. **`actions/setup-node` com `cache: 'npm'` não achava o lockfile** — depois que
   `disparo-em-massa/` virou uma subpasta deste repositório (fusão dos dois repositórios em
   2026-09-09), o workflow passou a rodar da raiz, mas o cache do setup-node procura o
   lockfile na raiz por padrão. Precisa de `cache-dependency-path:
   disparo-em-massa/package-lock.json` explícito no step.
2. **Target MSI quebra com `error LGHT0094: Icon:... could not be found`** — bug conhecido
   do `electron-builder` com WiX 4 que só aparece em runner limpo (localmente não reproduz
   se já tiver cache do WiX de builds antigas). `electron-updater` também não suporta
   auto-update via MSI no Windows de qualquer forma — solução foi remover o target MSI de
   `build.win.target` e do `build.msi`, ficando só com NSIS (`.exe`).
3. **`build/icon.ico` e `build/license.txt` nunca foram commitados** — `build/` estava no
   `.gitignore` desde sempre. Local sempre funcionou porque a pasta existe em disco; o
   checkout limpo do Actions não tinha esses arquivos e o NSIS falhava com "cannot find
   specified resource build/icon.ico". `build/` precisa estar versionado (só `dist/`, a
   saída do build, deve ser ignorado).
4. **Release saía como rascunho com tag genérica (`untagged-XXXXX`)** — o `electron-builder`
   usa `releaseType: "draft"` por padrão, e nesse modo às vezes cria/atualiza um rascunho com
   uma tag placeholder em vez de `v${version}`. Ao publicar manualmente pela interface do
   GitHub dá pra corrigir a tag na hora (foi o que salvou a v1.4.0), mas o certo é nem
   precisar disso: `"releaseType": "release"` explícito em `build.publish` publica direto com
   a tag correta, sem passar por rascunho.
5. **v1.4.0 crashava na abertura**: `import { autoUpdater } from 'electron-updater'` — esse
   pacote é CommonJS puro, o Node não detecta `autoUpdater` como named export estaticamente
   (`SyntaxError: Named export 'autoUpdater' not found`). `node --check` NÃO pega esse erro
   (é só sintaxe, não resolve o módulo de verdade) — só aparece rodando o Electron de
   verdade. Corrigido em v1.4.1 com `import pkg from 'electron-updater'; const { autoUpdater
   } = pkg`. **Lição**: depois de qualquer mudança em `electron/main.js`, testar com
   `electron .` de verdade antes de publicar, não só `node --check`.
6. **v1.4.0/v1.4.1 mandavam a nota de voz gravada como arquivo de áudio comum, não como PTT
   nativo do WhatsApp**: `ffmpeg-static` resolve o próprio caminho como algo dentro de
   `app.asar` — isso "existe" pra `fs.existsSync`/leitura (o Electron redireciona
   transparentemente pra `app.asar.unpacked`), mas `spawnSync` chama o SO diretamente pra
   executar o processo, sem esse redirecionamento, e falha com `ENOENT` **silenciosamente**
   (o catch de `src/audio.js` só loga no console, que não existe no app empacotado — cai no
   fallback de mandar o webm original sem converter, sem avisar ninguém). Corrigido em v1.4.2
   trocando `app.asar` por `app.asar.unpacked` no caminho antes de rodar. **Lição**: pra
   testar código que faz `spawnSync`/`spawn` de um binário empacotado via `asarUnpack`, rodar
   `ELECTRON_RUN_AS_NODE=1 "dist\win-unpacked\Disparo em Massa.exe" script.mjs` — isso executa
   com a resolução de módulos/asar real do app empacotado, sem precisar instalar nada nem
   simular. `node --check` e testes fora do asar não pegam esse tipo de bug.

Se uma release futura falhar de um jeito novo: o log completo de cada step só é visível
logado no GitHub (não dá pra baixar via API sem ser admin/ter token) — abra o run em
Actions, expanda o step que falhou, e copie a mensagem de erro real (não só "Process
completed with exit code 1", que é genérica e não ajuda a diagnosticar nada).

---

## ⚠️ Problema conhecido: Build local no Windows

O `electron-builder` baixa `winCodeSign` (necessário para assinar o instalador), que contém symlinks do macOS. **No Windows, extrair esses symlinks requer privilégios de administrador**.

**Soluções:**
1. **Recomendado**: Use o GitHub Actions (push tag `v1.3.0`)
2. **Alternativa**: Rode o terminal como **Administrador** e execute `npm run dist:win`
3. **Alternativa**: Build em máquina Linux/macOS ou WSL2

---

## 🚀 OPÇÃO A: Release via GitHub Actions (Recomendado)

### 1. Commit e push das mudanças
```bash
cd C:\Users\Felipe\Desktop\claude\vanessa\disparo-em-massa
git add .
git commit -m "chore: setup electron-builder for v1.3.0 release"
git push origin main
```

### 2. Criar e push da tag
```bash
git tag v1.3.0
git push origin v1.3.0
```

### 3. Acompanhar o build
- Vá em: https://github.com/FelipeChessa/multienvio/actions
- O workflow "Build Windows Installers" será executado automaticamente
- Aguarde ~5-10 minutos

### 4. Verificar Release
- Vá em: https://github.com/FelipeChessa/multienvio/releases
- A release `v1.3.0` será criada automaticamente com:
  - `Disparo.em.Massa.Setup.1.3.0.exe` (NSIS)
  - `Disparo.em.Massa.Setup.1.3.0.msi`

---

## 🛠 OPÇÃO B: Build Local (Terminal como Administrador)

### 1. Abra PowerShell como Administrador
- Win + X → "Terminal (Admin)" ou "Windows PowerShell (Admin)"

### 2. Execute o build
```powershell
cd C:\Users\Felipe\Desktop\claude\vanessa\disparo-em-massa
npm run dist:win
```

### 3. Arquivos gerados em `dist/`
- `Disparo.em.Massa.Setup.1.3.0.exe`
- `Disparo.em.Massa.Setup.1.3.0.msi`

### 4. Subir assets manualmente no GitHub
```bash
# Vá em https://github.com/FelipeChessa/multienvio/releases/tag/v1.3.0
# Clique em "Edit release" → "Attach binaries" → selecione os 2 arquivos
```

---

## 🌐 Atualizar Vercel API (`multienvio/api/latest-version.js`)

**Você precisa ter acesso ao projeto `multienvio` no Vercel.**

### 1. Acesse o dashboard Vercel
- https://vercel.com/dashboard
- Selecione o projeto `multienvio`

### 2. Edite o arquivo `api/latest-version.js`
No editor do Vercel (ou localmente se tiver o repo clonado):

```javascript
// api/latest-version.js
export default function handler(req, res) {
  res.status(200).json({
    version: "1.3.0",
    downloadUrl: "https://github.com/FelipeChessa/multienvio/releases/download/v1.3.0/Disparo.em.Massa.Setup.1.3.0.exe",
    notes: "v1.3.0 - Instaladores corrigidos (NSIS + MSI). Inclui todas as features v1.1 e v1.2: multi-etiqueta, álbum, enquete, localização, cartão de contato, aba Todos os Contatos, Clientes Frios, disjuntor, opt-out automático, dashboard de métricas."
  });
}
```

### 3. Deploy
- Se editou no dashboard: clique em "Save" → "Deploy"
- Se editou localmente: `git push` no repo `multienvio` (se conectado ao Vercel)

### 4. Testar
```bash
curl https://multienvio.vercel.app/api/latest-version
```
Deve retornar:
```json
{
  "version": "1.3.0",
  "downloadUrl": "https://github.com/FelipeChessa/multienvio/releases/download/v1.3.0/Disparo.em.Massa.Setup.1.3.0.exe",
  "notes": "..."
}
```

---

## 🔗 Atualizar Site de Download (`multienvio.vercel.app`)

O site em https://multienvio.vercel.app/ deve apontar para o novo instalador.

### Opção 1: Site consome a API dinamicamente (recomendado)
Se o frontend já faz `fetch('/api/latest-version')`, **não precisa fazer nada** — vai pegar o novo link automaticamente.

### Opção 2: Link hardcoded no HTML
Se o link está hardcoded no HTML do site:
1. Edite o arquivo correspondente no projeto `multienvio` (provavelmente `public/index.html` ou similar)
2. Atualize o `href` do botão de download para:
   ```
   https://github.com/FelipeChessa/multienvio/releases/download/v1.3.0/Disparo.em.Massa.Setup.1.3.0.exe
   ```
3. Deploy no Vercel

---

## ✅ Checklist Final

- [ ] Tag `v1.3.0` criada e pushada
- [ ] GitHub Actions buildou com sucesso (✅ verde)
- [ ] Release `v1.3.0` criada no GitHub com `.exe` e `.msi`
- [ ] `https://multienvio.vercel.app/api/latest-version` retorna `version: "1.3.0"` e `downloadUrl` correto
- [ ] Site https://multienvio.vercel.app/ aponta para o novo instalador
- [ ] Testar download: clicar no botão do site → baixa v1.3.0
- [ ] (Opcional) Testar auto-update no app real (se integrar electron-updater no futuro)

---

## 📝 Notas Importantes

### Versão do App Real
O `disparo-em-massa/package.json` está em **1.3.0**. Se no futuro fizer mais mudanças:
```bash
npm version patch  # 1.3.1
npm version minor  # 1.4.0
npm version major  # 2.0.0
git push origin main --tags
```

### Ícone
O `build/icon.ico` atual é um **placeholder**. Para produção:
1. Crie um ícone profissional (256x256, 48x48, 32x32, 16x16)
2. Substitua `build/icon.ico`
3. Rebuild

### electron-updater (Auto-update no app real)
O app real (`disparo-em-massa`) **não tem** código de auto-update hoje. O protótipo (`disparo/`) tem (`updater.js`). Para habilitar no futuro:
1. Adicione `electron-updater` no `main.js` do Electron
2. Configure `autoUpdater.setFeedURL('https://multienvio.vercel.app/api/latest-version')`
3. Trate eventos `update-available`, `update-downloaded`, etc.

---

## 🆘 Suporte

Se algo der errado:
1. **GitHub Actions falhou**: Verifique os logs em Actions → Build Windows Installers
2. **Vercel não atualiza**: Verifique se o projeto `multienvio` está deployado corretamente
3. **Release não aparece**: Verifique se a tag foi pushada (`git push origin v1.3.0`)