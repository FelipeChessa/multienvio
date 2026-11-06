# Comercial MultiEnvio (vídeo)

Vídeo de ~58 s em 1920×1080 com motion graphics, telas reais do sistema (dados fictícios) e
trilha original sintetizada. Tudo é gerado por código — dá para mudar textos, cenas ou
música e gerar de novo.

## Arquivos

| Arquivo | O que é |
|---|---|
| `commercial.html` | A animação. Abra no navegador para assistir em loop (sem som). Textos e tempos de cada cena ficam aqui. |
| `soundtrack.mjs` | Gera `soundtrack.wav` (100 BPM, cenas casadas com os compassos). |
| `render-video.mjs` | "Filma" o HTML quadro a quadro e monta `multienvio-comercial.mp4` com a trilha. |
| `seed-demo.mjs` / `demo-server.mjs` / `capture-shots.mjs` | Criam uma cópia do sistema com contatos fictícios e capturam as telas usadas no vídeo (`shots/`). |

`shots/`, `frames/`, `*.wav` e `*.mp4` não vão para o git (são gerados).

## Como gerar de novo

Na pasta `marketing/comercial`:

```bash
# 1. telas do sistema (só se a interface mudou)
ELECTRON_USER_DATA_DIR="$LOCALAPPDATA/Temp/mdemo" node seed-demo.mjs
node demo-server.mjs   # deixe rodando em outro terminal
../../disparo-em-massa/node_modules/electron/dist/electron.exe capture-shots.mjs

# 2. trilha
node soundtrack.mjs

# 3. conferir alguns quadros (frames/*.png) e depois gerar o vídeo
../../disparo-em-massa/node_modules/electron/dist/electron.exe render-video.mjs --preview
../../disparo-em-massa/node_modules/electron/dist/electron.exe render-video.mjs
```

As cenas seguem o ritmo da trilha (1 compasso = 2,4 s). Ao mudar a duração de uma cena,
ajuste também `SCENES` em `commercial.html` e as transições em `soundtrack.mjs`.
