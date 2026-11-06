// Trilha original do comercial, sintetizada do zero (sem samples nem música de terceiros).
// 100 BPM — 1 compasso = 2,4 s, casado com as cenas de commercial.html.
//   node soundtrack.mjs  ->  soundtrack.wav
import fs from 'fs'

const SR = 44100
const DUR = 57.6
const N = Math.floor(SR * DUR)
const L = new Float32Array(N)
const Rch = new Float32Array(N)
const BEAT = 0.6
const BAR = 2.4

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12)
const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
let seed = 7
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 * 2 - 1 }

// Am9 — Fmaj7 — C(add9) — G6  (repetindo a cada 4 compassos)
const CHORDS = [
  [57, 60, 64, 67, 71], // A C E G B
  [53, 57, 60, 64, 67], // F A C E G
  [48, 55, 60, 64, 62], // C G C E D
  [55, 59, 62, 64, 67] // G B D E G
]
const ROOTS = [45, 41, 48, 43]
const chordAt = (t) => Math.floor(t / BAR) % 4

function add(i, l, r) { if (i >= 0 && i < N) { L[i] += l; Rch[i] += r } }

// ---- Pad (ondas "serra" suaves, levemente desafinadas, com filtro que abre na entrada do produto)
{
  const voices = []
  for (let bar = 0; bar * BAR < DUR; bar++) {
    const c = CHORDS[bar % 4]
    for (const note of c) for (const det of [-0.07, 0, 0.07]) voices.push({ bar, f: midi(note) * Math.pow(2, det / 12), pan: det * 5 })
  }
  let lp = 0, lpR = 0
  const tmpL = new Float32Array(N), tmpR = new Float32Array(N)
  for (const v of voices) {
    const start = v.bar * BAR - 0.3
    const end = start + BAR + 0.9
    const i0 = Math.max(0, Math.floor(start * SR)), i1 = Math.min(N, Math.floor(end * SR))
    let ph = Math.random() * 6.28
    const w = 2 * Math.PI * v.f / SR
    for (let i = i0; i < i1; i++) {
      const tt = i / SR - start
      const env = clamp(tt / 0.5, 0, 1) * clamp((end - i / SR) / 0.7, 0, 1)
      ph += w
      // série harmônica curta (serra suave)
      const s = Math.sin(ph) + Math.sin(2 * ph) / 2.2 + Math.sin(3 * ph) / 3.5 + Math.sin(4 * ph) / 5
      const g = env * 0.016
      tmpL[i] += s * g * (1 - v.pan * 0.5)
      tmpR[i] += s * g * (1 + v.pan * 0.5)
    }
  }
  for (let i = 0; i < N; i++) {
    const t = i / SR
    // filtro: escuro no gancho, abre na marca, aberto no resto, fecha no fim
    let cutoff = t < 4.8 ? 500 + t * 120 : t < 9.6 ? 1300 + (t - 4.8) * 260 : 2600
    if (t > 55) cutoff = 2600 - (t - 55) * 700
    const a = 1 - Math.exp(-2 * Math.PI * Math.max(200, cutoff) / SR)
    lp += a * (tmpL[i] - lp); lpR += a * (tmpR[i] - lpR)
    const vol = t < 4.8 ? 0.75 : 1
    L[i] += lp * vol; Rch[i] += lpR * vol
  }
}

// ---- Baixo (seno com leve saturação), a partir da marca
for (let bar = 2; bar * BAR < DUR - BAR; bar++) {
  const root = ROOTS[bar % 4]
  for (const beatPos of [0, 1.5, 2, 3.5]) {
    const t0 = bar * BAR + beatPos * BEAT
    if (t0 < 4.8 || t0 > 55.2) continue
    const f = midi(root - 12 + (beatPos === 1.5 ? 12 : 0))
    const len = beatPos === 0 ? 0.55 : 0.32
    const i0 = Math.floor(t0 * SR)
    for (let k = 0; k < len * SR; k++) {
      const tt = k / SR
      const env = Math.min(1, tt / 0.005) * Math.exp(-tt * 5)
      const s = Math.tanh(Math.sin(2 * Math.PI * f * tt) * 1.6) * env * 0.16
      add(i0 + k, s, s)
    }
  }
}

// ---- Bateria: kick em todo tempo, palma no 2 e 4, chimbal nos contratempos
function kick(t0, vol = 0.5) {
  const i0 = Math.floor(t0 * SR)
  let ph = 0
  for (let k = 0; k < 0.32 * SR; k++) {
    const tt = k / SR
    const f = 45 + 95 * Math.exp(-tt * 28)
    ph += 2 * Math.PI * f / SR
    const s = Math.sin(ph) * Math.exp(-tt * 9) * vol
    add(i0 + k, s, s)
  }
}
function clap(t0, vol = 0.13) {
  const i0 = Math.floor(t0 * SR)
  let hp = 0, prev = 0
  for (let k = 0; k < 0.2 * SR; k++) {
    const tt = k / SR
    const n = rand()
    hp = 0.92 * (hp + n - prev); prev = n
    const env = (tt < 0.012 ? 1 : 0.6) * Math.exp(-tt * 22)
    add(i0 + k, hp * env * vol, hp * env * vol * 0.9)
  }
}
function hat(t0, vol = 0.05) {
  const i0 = Math.floor(t0 * SR)
  let hp = 0, prev = 0
  for (let k = 0; k < 0.06 * SR; k++) {
    const n = rand()
    hp = 0.6 * (hp + n - prev); prev = n
    const s = hp * Math.exp(-k / SR * 70) * vol
    add(i0 + k, s * 0.8, s)
  }
}
for (let b = 0; b * BEAT < DUR; b++) {
  const t0 = b * BEAT
  if (t0 >= 9.6 && t0 < 55.2) {
    kick(t0, t0 >= 43.2 && t0 < 48 ? 0.42 : 0.5)
    if (b % 2 === 1 && t0 >= 16.8) clap(t0)
    hat(t0 + BEAT / 2)
    if (t0 >= 24) hat(t0 + BEAT / 4, 0.025)
  }
}

// ---- Arpejo brilhante (marca e fechamento)
function pluck(t0, f, vol = 0.06, pan = 0) {
  const i0 = Math.floor(t0 * SR)
  for (let k = 0; k < 0.7 * SR; k++) {
    const tt = k / SR
    const s = (Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(4 * Math.PI * f * tt)) * Math.exp(-tt * 6) * vol
    add(i0 + k, s * (1 - pan), s * (1 + pan))
  }
}
for (const [a, b] of [[5.0, 9.4], [48.2, 55.0]]) {
  for (let t0 = a, k = 0; t0 < b; t0 += BEAT / 2, k++) {
    const c = CHORDS[chordAt(t0)]
    pluck(t0, midi(c[k % c.length] + 12), 0.05, Math.sin(k) * 0.4)
  }
}

// ---- Whooshes nas transições + impactos
function whoosh(tEnd, len = 0.9, vol = 0.22) {
  const t0 = tEnd - len
  const i0 = Math.floor(t0 * SR)
  let bp = 0, lp2 = 0
  for (let k = 0; k < len * SR; k++) {
    const x = k / (len * SR)
    const cutoff = 300 + x * x * 7000
    const a = 1 - Math.exp(-2 * Math.PI * cutoff / SR)
    const n = rand()
    bp += a * (n - bp)
    lp2 += 0.5 * (bp - lp2)
    const env = Math.pow(x, 2.2) * (1 - Math.pow(x, 12))
    const s = (bp - lp2) * env * vol * 3
    const pan = (x - 0.5) * 0.8
    add(i0 + k, s * (1 - pan), s * (1 + pan))
  }
}
function impact(t0, vol = 0.55) {
  const i0 = Math.floor(t0 * SR)
  let ph = 0
  for (let k = 0; k < 2.2 * SR; k++) {
    const tt = k / SR
    const f = 32 + 70 * Math.exp(-tt * 6)
    ph += 2 * Math.PI * f / SR
    const s = Math.sin(ph) * Math.exp(-tt * 2.2) * vol + rand() * Math.exp(-tt * 30) * 0.12
    add(i0 + k, s, s)
  }
}
// subida antes da marca
{
  const t0 = 2.6, len = 2.2
  const i0 = Math.floor(t0 * SR)
  let ph = 0
  for (let k = 0; k < len * SR; k++) {
    const x = k / (len * SR)
    ph += 2 * Math.PI * (220 + x * x * 880) / SR
    const s = Math.sin(ph) * Math.pow(x, 2) * 0.05
    add(i0 + k, s, s)
  }
}
for (const tr of [4.8, 9.6, 16.8, 24.0, 31.2, 38.4, 43.2, 48.0]) whoosh(tr, tr === 4.8 || tr === 48.0 ? 1.4 : 0.8)
impact(4.8)
impact(48.0, 0.5)

// ---- "Ping" de mensagem nas notificações do gancho e nas respostas
function ping(t0, vol = 0.07) {
  for (const [m, d] of [[88, 0], [93, 0.07]]) pluck(t0 + d, midi(m), vol)
}
for (let i = 0; i < 8; i++) ping(2.1 + i * 0.16, 0.035)
ping(27.6, 0.06) // cliente respondeu
ping(36.0, 0.06) // venda fechada
ping(39.5, 0.04); ping(41.9, 0.05)

// ---- Master: eco curto estéreo, saturação suave, fade e normalização
const dL = Math.floor(0.3 * SR), dR = Math.floor(0.45 * SR)
for (let i = 0; i < N; i++) {
  if (i >= dL) L[i] += L[i - dL] * 0.18
  if (i >= dR) Rch[i] += Rch[i - dR] * 0.18
}
let peak = 0
for (let i = 0; i < N; i++) {
  const t = i / SR
  const fade = Math.min(1, t / 0.4) * (t > 56.2 ? Math.max(0, (DUR - t) / 1.4) : 1)
  L[i] = Math.tanh(L[i] * 1.2) * fade
  Rch[i] = Math.tanh(Rch[i] * 1.2) * fade
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rch[i]))
}
const gain = 0.89 / peak

const buf = Buffer.alloc(44 + N * 4)
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8)
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22)
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34)
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(clamp(L[i] * gain, -1, 1) * 32767), 44 + i * 4)
  buf.writeInt16LE(Math.round(clamp(Rch[i] * gain, -1, 1) * 32767), 46 + i * 4)
}
fs.writeFileSync(new URL('./soundtrack.wav', import.meta.url), buf)
console.log('soundtrack.wav gerado:', DUR, 's, pico normalizado de', peak.toFixed(2))
