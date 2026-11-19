import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SR = 44100;
const cues = JSON.parse(fs.readFileSync(path.resolve('src/video/cues_ep2.json'), 'utf8'));
const DUR = cues.dur;
const M = cues.music;
const BEAT = 60.0 / M.bpm;
const BAR = BEAT * 4;
const N = Math.ceil(DUR * SR) + SR;

const musicL = new Float32Array(N);
const musicR = new Float32Array(N);
const drumsL = new Float32Array(N);
const drumsR = new Float32Array(N);
const sfxL = new Float32Array(N);
const sfxR = new Float32Array(N);
const voiceL = new Float32Array(N);
const voiceR = new Float32Array(N);

let rngState = 19;
function randn() {
  rngState = (rngState * 1664525 + 1013904223) >>> 0;
  const u1 = Math.max(1e-7, rngState / 4294967296);
  rngState = (rngState * 1664525 + 1013904223) >>> 0;
  const u2 = rngState / 4294967296;
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function place(bufL, bufR, sig, tSec, pan = 0, gain = 1) {
  const i0 = Math.floor(tSec * SR);
  if (i0 < 0 || i0 >= N) return;
  const n = Math.min(sig.length, N - i0);
  const angle = ((pan + 1) * Math.PI) / 4;
  const l = Math.cos(angle) * 1.4142 * gain;
  const r = Math.sin(angle) * 1.4142 * gain;
  for (let k = 0; k < n; k++) {
    bufL[i0 + k] += sig[k] * l;
    bufR[i0 + k] += sig[k] * r;
  }
}

function lowpass(arr, cutoffHz) {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / SR;
  const a = dt / (rc + dt);
  const out = new Float32Array(arr.length);
  let y = 0;
  for (let i = 0; i < arr.length; i++) {
    y += a * (arr[i] - y);
    out[i] = y;
  }
  return out;
}

function highpass(arr, cutoffHz) {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / SR;
  const a = rc / (rc + dt);
  const out = new Float32Array(arr.length);
  let prevX = 0;
  let prevY = 0;
  for (let i = 0; i < arr.length; i++) {
    prevY = a * (prevY + arr[i] - prevX);
    prevX = arr[i];
    out[i] = prevY;
  }
  return out;
}

function makeKick() {
  const len = Math.floor(0.32 * SR);
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const freq = 52 + 120 * Math.exp(-t * 32);
    ph += (2 * Math.PI * freq) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 10) * 0.8;
  }
  return out;
}

function makeShaker(open = false) {
  const d = open ? 0.14 : 0.05;
  const len = Math.floor(d * SR);
  const n = new Float32Array(len);
  for (let i = 0; i < len; i++) n[i] = randn();
  const hp = highpass(n, 5800);
  for (let i = 0; i < len; i++) hp[i] *= Math.exp(-(i / SR) * (open ? 22 : 70)) * 0.3;
  return hp;
}

function makeWoodblock() {
  const len = Math.floor(0.11 * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * 820 * t) + 0.4 * Math.sin(2 * Math.PI * 1240 * t)) * Math.exp(-t * 38) * 0.45;
  }
  return out;
}

function makePop() {
  const len = Math.floor(0.15 * SR);
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (340 + 780 * Math.exp(-t * 32))) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 28) * 0.7;
  }
  return out;
}

function makeThud() {
  const len = Math.floor(0.28 * SR);
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (55 + 75 * Math.exp(-t * 25))) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 13) * 0.7;
  }
  return out;
}

function makeStep() {
  const len = Math.floor(0.08 * SR);
  const n = new Float32Array(len);
  for (let i = 0; i < len; i++) n[i] = randn();
  const lp = lowpass(n, 550);
  for (let i = 0; i < len; i++) lp[i] *= Math.exp(-(i / SR) * 50) * 0.7;
  return lp;
}

function makeBoing() {
  const len = Math.floor(0.35 * SR);
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 220 + 180 * Math.sin(2 * Math.PI * 12 * t) * Math.exp(-t * 5);
    ph += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 6) * 0.48;
  }
  return out;
}

function makeWhoosh(d = 0.35) {
  const len = Math.floor(d * SR);
  const n = new Float32Array(len);
  for (let i = 0; i < len; i++) n[i] = randn();
  const lp = lowpass(n, 2600);
  const hp = highpass(lp, 260);
  for (let i = 0; i < len; i++) {
    const u = i / len;
    hp[i] *= Math.pow(Math.sin(Math.PI * u), 1.8) * 1.1;
  }
  return hp;
}

function makeTick() {
  const len = Math.floor(0.035 * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] = Math.sin(2 * Math.PI * 1900 * t) * Math.exp(-t * 110) * 0.5;
  }
  return out;
}

function makeBell(f = 1174, d = 0.85) {
  const len = Math.floor(d * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 4) + 0.4 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t * 8)) * 0.45;
  }
  return out;
}

function makeImpact() {
  const len = Math.floor(0.9 * SR);
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (34 + 75 * Math.exp(-t * 6))) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 3.8) * 0.8;
  }
  return out;
}

function makeBusHorn() {
  const len = Math.floor(0.58 * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const pulse = (t < 0.2 ? 1 : t > 0.26 ? 1 : 0.08);
    const env = Math.min(1, t / 0.02) * Math.min(1, (0.58 - t) / 0.04) * pulse;
    const s =
      Math.sin(2 * Math.PI * 330 * t) +
      0.7 * Math.sin(2 * Math.PI * 415 * t) +
      0.3 * Math.sin(2 * Math.PI * 660 * t);
    out[i] = Math.tanh(s * 0.45) * env * 0.48;
  }
  return out;
}

function makeMeow() {
  const len = Math.floor(0.45 * SR);
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const u = t / 0.45;
    const f = 540 + 250 * Math.sin(Math.PI * u) - 180 * u;
    ph += (2 * Math.PI * f) / SR;
    out[i] = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.15 * Math.sin(3 * ph)) * Math.sin(Math.PI * u) * 0.36;
  }
  return out;
}

function makeBuildFast(d = 5.2) {
  const len = Math.floor(d * SR);
  const out = new Float32Array(len);
  // Rapid comic hammer hits + ascending construction energy
  const step = 0.16;
  for (let t0 = 0; t0 < d - 0.15; t0 += step) {
    const i0 = Math.floor(t0 * SR);
    const pitch = 650 + (t0 / d) * 650 + (Math.round(t0 / step) % 3) * 140;
    const hitLen = Math.floor(0.08 * SR);
    for (let k = 0; k < hitLen && i0 + k < len; k++) {
      const kt = k / SR;
      const clink = Math.sin(2 * Math.PI * pitch * kt) * Math.exp(-kt * 45) * 0.36;
      const thump = Math.sin(2 * Math.PI * 130 * kt) * Math.exp(-kt * 32) * 0.32;
      out[i0 + k] += clink + thump;
    }
  }
  return out;
}

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function chordFreqs(name) {
  const root = 48 + NOTE[name[0]];
  const minor = name.includes('m');
  const third = minor ? 3 : 4;
  return [root, root + third, root + 7].map((m) => 440 * Math.pow(2, (m - 69) / 12));
}

function makePluck(f, d = 0.36) {
  const len = Math.floor(d * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9) + 0.32 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t * 15)) * 0.35;
  }
  return out;
}

function makeBass(f, d = 0.26) {
  const len = Math.floor(d * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] = Math.sin(2 * Math.PI * f * 0.5 * t) * Math.min(1, t / 0.008) * Math.exp(-t * 5) * 0.5;
  }
  return out;
}

// 1. Drums & upbeat village music bed (116 BPM)
const FINAL = M.final;
const kicks = [];
for (let t = 0; t < FINAL; t += BEAT) {
  place(drumsL, drumsR, makeKick(), t, 0, 0.55);
  kicks.push(t);
  const beatInBar = Math.round((t % BAR) / BEAT);
  if (beatInBar === 1 || beatInBar === 3) {
    place(drumsL, drumsR, makeWoodblock(), t, 0.15, 0.36);
  }
  place(drumsL, drumsR, makeShaker(false), t + BEAT * 0.5, 0.25, 0.34);
  if (beatInBar === 3) {
    place(drumsL, drumsR, makeShaker(true), t + BEAT * 0.75, -0.25, 0.28);
  }
}

const numBars = Math.ceil(FINAL / BAR);
for (let bi = 0; bi < numBars; bi++) {
  const t0 = bi * BAR;
  const ch = chordFreqs(M.bars[bi % M.bars.length]);
  for (let k = 0; k < 4; k++) {
    place(musicL, musicR, makeBass(ch[0]), t0 + k * BEAT, 0, 0.45);
  }
  const arp = [ch[0] * 2, ch[1] * 2, ch[2] * 2, ch[1] * 2, ch[0] * 2, ch[2] * 2, ch[1] * 2, ch[2] * 2];
  for (let k = 0; k < 8; k++) {
    const tk = t0 + k * (BEAT / 2);
    if (tk < FINAL) {
      place(musicL, musicR, makePluck(arp[k % arp.length], 0.34), tk, ((k % 3) - 1) * 0.25, 0.38);
    }
  }
}
const fc = chordFreqs(M.bars[M.bars.length - 1]);
for (const fq of fc) {
  place(musicL, musicR, makePluck(fq * 2, 1.3), FINAL, 0, 0.45);
}

// 2. Mapped SFX
for (const e of cues.sfx) {
  const { t, type, gain = 0.7, pan = 0, d = 0.4, f = 1174 } = e;
  if (type === 'pop') place(sfxL, sfxR, makePop(), t, pan, gain);
  else if (type === 'step') place(sfxL, sfxR, makeStep(), t, pan, gain);
  else if (type === 'thud') place(sfxL, sfxR, makeThud(), t, pan, gain);
  else if (type === 'boing') place(sfxL, sfxR, makeBoing(), t, pan, gain);
  else if (type === 'whoosh') place(sfxL, sfxR, makeWhoosh(d), t, pan, gain);
  else if (type === 'tick') place(sfxL, sfxR, makeTick(), t, pan, gain);
  else if (type === 'ticks') {
    const step = e.step || 0.15;
    for (let xt = t; xt < t + d; xt += step) {
      place(sfxL, sfxR, makeTick(), xt, pan, gain * 0.85);
    }
  } else if (type === 'bell') place(sfxL, sfxR, makeBell(f, 0.9), t, pan, gain);
  else if (type === 'impact') place(sfxL, sfxR, makeImpact(), t, pan, gain);
  else if (type === 'bus_horn') place(sfxL, sfxR, makeBusHorn(), t, pan, gain);
  else if (type === 'meow') place(sfxL, sfxR, makeMeow(), t, pan, gain);
  else if (type === 'build_fast') place(sfxL, sfxR, makeBuildFast(d), t, pan, gain);
  else if (type === 'sparkle') {
    [880, 1318, 1760, 2637].forEach((fq, idx) => {
      place(sfxL, sfxR, makeBell(fq, 0.65), t + idx * 0.055, (idx - 1.5) * 0.25, gain * 0.55);
    });
  }
}

// 3. Mix per-utterance WAV voice-overs if generated by Gemini TTS
function readWavMono(filePath) {
  const buf = fs.readFileSync(filePath);
  const numChannels = buf.readUInt16LE(22);
  const sampleRate = buf.readUInt32LE(24);
  const bitsPerSample = buf.readUInt16LE(34);
  let offset = 12;
  let dataOffset = 44;
  let dataSize = buf.length - 44;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const sz = buf.readUInt32LE(offset + 4);
    if (id === 'data') {
      dataOffset = offset + 8;
      dataSize = sz;
      break;
    }
    offset += 8 + sz;
  }
  const bytesPerSample = bitsPerSample / 8;
  const count = Math.floor(dataSize / (bytesPerSample * numChannels));
  const raw = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let sum = 0;
    for (let c = 0; c < numChannels; c++) {
      const pos = dataOffset + (i * numChannels + c) * bytesPerSample;
      if (pos + 2 <= buf.length) sum += buf.readInt16LE(pos) / 32768;
    }
    raw[i] = sum / numChannels;
  }
  if (sampleRate === SR) return raw;
  const outLen = Math.floor((count * SR) / sampleRate);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = (i * sampleRate) / SR;
    const idx = Math.floor(src);
    const frac = src - idx;
    const s0 = raw[Math.min(idx, count - 1)];
    const s1 = raw[Math.min(idx + 1, count - 1)];
    out[i] = s0 + (s1 - s0) * frac;
  }
  return out;
}

let hasVoiceOver = false;
const speechDuck = new Float32Array(N).fill(1.0);

for (const beat of cues.beats) {
  for (const utt of beat.utterances) {
    const wavFile = path.resolve(`public/tts_ep2/${utt.id}.wav`);
    if (fs.existsSync(wavFile)) {
      hasVoiceOver = true;
      const samples = readWavMono(wavFile);
      const startSample = Math.floor(utt.start * SR);
      const pan = utt.speaker === 'kades' ? 0 : -0.06;
      place(voiceL, voiceR, samples, utt.start, pan, 1.0);
      const duckEnd = Math.min(N, startSample + samples.length + Math.floor(0.1 * SR));
      for (let i = Math.max(0, startSample - Math.floor(0.06 * SR)); i < duckEnd; i++) {
        speechDuck[i] = 0.25;
      }
    }
  }
}

// Sidechain duck on kick
const kickDuck = new Float32Array(N).fill(1.0);
for (const k of kicks) {
  const i0 = Math.floor(k * SR);
  const len = Math.floor(0.32 * SR);
  for (let i = 0; i < len && i0 + i < N; i++) {
    const env = 1 - 0.45 * Math.exp(-(i / SR) * 10);
    kickDuck[i0 + i] = Math.min(kickDuck[i0 + i], env);
  }
}

const totalSamples = Math.floor(DUR * SR);
const rawMix = Buffer.alloc(44 + totalSamples * 4);
rawMix.write('RIFF', 0);
rawMix.writeUInt32LE(36 + totalSamples * 4, 4);
rawMix.write('WAVE', 8);
rawMix.write('fmt ', 12);
rawMix.writeUInt32LE(16, 16);
rawMix.writeUInt16LE(1, 20);
rawMix.writeUInt16LE(2, 22);
rawMix.writeUInt32LE(SR, 24);
rawMix.writeUInt32LE(SR * 4, 28);
rawMix.writeUInt16LE(4, 32);
rawMix.writeUInt16LE(16, 34);
rawMix.write('data', 36);
rawMix.writeUInt32LE(totalSamples * 4, 40);

const fadeLen = Math.floor(0.6 * SR);
const bgGain = hasVoiceOver ? 0.28 : 0.72;
const sfxGain = hasVoiceOver ? 0.56 : 0.85;

for (let i = 0; i < totalSamples; i++) {
  const fade = i > totalSamples - fadeLen ? (totalSamples - i) / fadeLen : 1;
  const bedL = (musicL[i] * kickDuck[i] + drumsL[i] * 0.52) * bgGain * speechDuck[i];
  const bedR = (musicR[i] * kickDuck[i] + drumsR[i] * 0.52) * bgGain * speechDuck[i];
  const sL = Math.tanh((bedL + sfxL[i] * sfxGain + voiceL[i] * 1.15) * 0.92) * fade;
  const sR = Math.tanh((bedR + sfxR[i] * sfxGain + voiceR[i] * 1.15) * 0.92) * fade;
  rawMix.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(sL * 32000))), 44 + i * 4);
  rawMix.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(sR * 32000))), 44 + i * 4 + 2);
}

const outDir = path.resolve('public/audio');
fs.mkdirSync(outDir, { recursive: true });
const rawPath = path.join(outDir, 'raw_mix_ep2.wav');
const mixWavPath = path.join(outDir, 'mix_ep2.wav');
const mixMp3Path = path.join(outDir, 'mix_ep2.mp3');

fs.writeFileSync(rawPath, rawMix);
execSync(
  `ffmpeg -y -loglevel error -i "${rawPath}" -af "loudnorm=I=-14:TP=-2.2:LRA=11" -ar 44100 "${mixWavPath}"`
);
execSync(`ffmpeg -y -loglevel error -i "${mixWavPath}" -c:a libmp3lame -q:a 2 "${mixMp3Path}"`);
fs.unlinkSync(rawPath);

const ebu = execSync(
  `ffmpeg -nostats -i "${mixWavPath}" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2`,
  { encoding: 'utf8' }
);
console.log(ebu.trim());
