import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SR = 44100;
const cuesPath = path.resolve('src/video/cues.json');
const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
const DUR = cues.dur;
const N = Math.floor(DUR * SR) + SR;
const BEAT = 60.0 / cues.music.bpm;
const BAR = BEAT * 4;

// Deterministic PRNG so audio synthesis is 100% reproducible
let seed = 1337;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
function randn() {
  const u1 = Math.max(1e-7, rand());
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const musicL = new Float32Array(N);
const musicR = new Float32Array(N);
const drumsL = new Float32Array(N);
const drumsR = new Float32Array(N);
const sfxL = new Float32Array(N);
const sfxR = new Float32Array(N);
const voiceL = new Float32Array(N);
const voiceR = new Float32Array(N);

function place(bufL, bufR, sig, t, pan = 0, gain = 1) {
  const i0 = Math.floor(t * SR);
  if (i0 >= N) return;
  const startK = i0 < 0 ? -i0 : 0;
  const len = Math.min(sig.length, N - i0);
  const l = Math.cos(((pan + 1) * Math.PI) / 4) * 1.4142;
  const r = Math.sin(((pan + 1) * Math.PI) / 4) * 1.4142;
  for (let k = startK; k < len; k++) {
    const v = sig[k] * gain;
    bufL[i0 + k] += v * l;
    bufR[i0 + k] += v * r;
  }
}

// Simple 1-pole & biquad helpers
function lowpass(sig, cutoff) {
  const out = new Float32Array(sig.length);
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SR;
  const alpha = dt / (rc + dt);
  let prev = 0;
  for (let i = 0; i < sig.length; i++) {
    prev = prev + alpha * (sig[i] - prev);
    out[i] = prev;
  }
  return out;
}

function highpass(sig, cutoff) {
  const lp = lowpass(sig, cutoff);
  const out = new Float32Array(sig.length);
  for (let i = 0; i < sig.length; i++) out[i] = sig[i] - lp[i];
  return out;
}

function bandpass(sig, fLow, fHigh) {
  return lowpass(highpass(sig, fLow), fHigh);
}

// Sound building blocks
function makeKick() {
  const len = Math.floor(0.35 * SR);
  const out = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 48 + 115 * Math.exp(-t * 32);
    phase += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t * 10) * 0.85;
  }
  return out;
}

function makeRim() {
  const len = Math.floor(0.08 * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] =
      (Math.sin(2 * Math.PI * 820 * t) * 0.6 +
        Math.sin(2 * Math.PI * 1450 * t) * 0.35 +
        randn() * 0.25) *
      Math.exp(-t * 55);
  }
  return out;
}

function makeShaker() {
  const len = Math.floor(0.06 * SR);
  const n = new Float32Array(len);
  for (let i = 0; i < len; i++) n[i] = randn() * Math.exp(-(i / SR) * 65);
  return highpass(n, 5500);
}

function makeStep() {
  const len = Math.floor(0.11 * SR);
  const n = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    n[i] =
      (Math.sin(2 * Math.PI * (120 - 45 * (t / 0.11)) * t) * 0.55 + randn() * 0.45) *
      Math.exp(-t * 34);
  }
  return lowpass(n, 900);
}

function makeThud() {
  const len = Math.floor(0.28 * SR);
  const out = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 55 + 75 * Math.exp(-t * 25);
    phase += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t * 14) * 0.8;
  }
  return out;
}

function makePop() {
  const len = Math.floor(0.14 * SR);
  const out = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 360 + 760 * Math.exp(-t * 32);
    phase += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t * 28) * 0.7;
  }
  return out;
}

function makeBoing() {
  const len = Math.floor(0.45 * SR);
  const out = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 260 + 180 * Math.sin(t * 28) * Math.exp(-t * 5);
    phase += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t * 6.5) * 0.55;
  }
  return out;
}

function makeMeow() {
  const len = Math.floor(0.42 * SR);
  const out = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const u = t / 0.42;
    const f = 620 + 360 * Math.sin(Math.PI * u) - 180 * u;
    phase += (2 * Math.PI * f) / SR;
    const env = Math.sin(Math.PI * u) * Math.exp(-t * 1.8);
    out[i] = (Math.sin(phase) * 0.65 + Math.sin(phase * 2) * 0.25 + Math.sin(phase * 3) * 0.1) * env * 0.6;
  }
  return bandpass(out, 450, 2600);
}

function makeWhoosh(d = 0.35) {
  const len = Math.floor(d * SR);
  const n = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const u = i / len;
    n[i] = randn() * Math.sin(Math.PI * u) ** 2;
  }
  return bandpass(n, 350, 3200);
}

function makeFlutter(d = 1.2) {
  const len = Math.floor(d * SR);
  const n = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const mod = 0.4 + 0.6 * Math.abs(Math.sin(2 * Math.PI * 6.5 * t));
    n[i] = randn() * mod * Math.sin((Math.PI * i) / len);
  }
  return bandpass(n, 220, 1200);
}

function makeBell(f = 1318, d = 1.0) {
  const len = Math.floor(d * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] =
      (Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 3.5) +
        0.4 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t * 6)) *
      0.5;
  }
  return out;
}

function makeImpact() {
  const len = Math.floor(1.1 * SR);
  const out = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 36 + 72 * Math.exp(-t * 6);
    phase += (2 * Math.PI * f) / SR;
    out[i] = (Math.sin(phase) * Math.exp(-t * 3.2) + randn() * 0.25 * Math.exp(-t * 5)) * 0.7;
  }
  return lowpass(out, 700);
}

function makeTick() {
  const len = Math.floor(0.03 * SR);
  const n = new Float32Array(len);
  for (let i = 0; i < len; i++) n[i] = randn() * Math.exp(-(i / SR) * 140);
  return highpass(n, 2500);
}

// Warm acoustic marimba/ukulele chord synthesizer (cheerful, gentle under narration)
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function chordFreqs(name) {
  const rootChar = name[0];
  const minor = name.includes('m');
  const r = NOTE[rootChar];
  const midiRoot = 48 + r;
  return [0, minor ? 3 : 4, 7].map((semi) => 440 * 2 ** ((midiRoot + semi - 69) / 12));
}

function makePluck(f, d = 0.35) {
  const len = Math.floor(d * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const att = Math.min(1, t / 0.005);
    out[i] =
      att *
      (Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 7.5) +
        0.35 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t * 14) +
        0.1 * Math.sin(2 * Math.PI * f * 3 * t) * Math.exp(-t * 20));
  }
  return out;
}

function makeWarmBass(f, d = 0.35) {
  const len = Math.floor(d * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const att = Math.min(1, t / 0.01);
    out[i] = att * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 2 * t)) * Math.exp(-t * 5);
  }
  return out;
}

function makePad(freqs, d) {
  const len = Math.floor(d * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.45) * Math.min(1, (d - t) / 0.45);
    let s = 0;
    for (const f of freqs) {
      s += Math.sin(2 * Math.PI * f * 2 * t) * 0.6 + Math.sin(2 * Math.PI * f * 2.004 * t) * 0.4;
    }
    out[i] = (s / freqs.length) * env * 0.35;
  }
  return out;
}

// 1. Drums & Music Loop (light, cheerful, stays gently underneath narration!)
const kickSig = makeKick();
const rimSig = makeRim();
const shakerSig = makeShaker();
const FINAL = cues.music.final;
const kicks = [];

for (let t = 0; t < FINAL; t += BEAT) {
  const beatInBar = Math.round((t % BAR) / BEAT) % 4;
  if (beatInBar === 0 || beatInBar === 2) {
    place(drumsL, drumsR, kickSig, t, 0, 0.55);
    kicks.push(t);
  }
  if (beatInBar === 1 || beatInBar === 3) {
    place(drumsL, drumsR, rimSig, t, 0.1, 0.35);
  }
  place(drumsL, drumsR, shakerSig, t + BEAT * 0.5, 0.28, 0.22);
}

const numBars = Math.ceil(FINAL / BAR);
for (let bi = 0; bi < numBars; bi++) {
  const t0 = bi * BAR;
  const cname = cues.music.bars[bi % cues.music.bars.length];
  const ch = chordFreqs(cname);
  // Warm bass on beats 1 and 3
  if (t0 < FINAL) place(musicL, musicR, makeWarmBass(ch[0] * 0.5, BEAT * 1.4), t0, 0, 0.42);
  if (t0 + BEAT * 2 < FINAL) place(musicL, musicR, makeWarmBass(ch[0] * 0.5, BEAT * 1.4), t0 + BEAT * 2, 0, 0.35);

  // Light cheerful marimba arpeggio
  const arpNotes = [ch[0] * 2, ch[1] * 2, ch[2] * 2, ch[1] * 2, ch[0] * 4, ch[2] * 2, ch[1] * 2, ch[2] * 2];
  for (let k = 0; k < 8; k++) {
    const tk = t0 + k * (BEAT / 2);
    if (tk < FINAL) {
      place(musicL, musicR, makePluck(arpNotes[k], 0.32), tk, ((k % 3) - 1) * 0.28, 0.22);
    }
  }
  // Soft warm pad
  if (t0 < FINAL) {
    place(musicL, musicR, makePad(ch, Math.min(BAR, FINAL - t0 + 0.4)), t0, 0, 0.22);
  }
}

// Final cheerful chord ring-out
const endCh = chordFreqs('C');
place(musicL, musicR, makePad([endCh[0], endCh[1], endCh[2], endCh[0] * 2], 1.6), FINAL - 0.1, 0, 0.38);
place(musicL, musicR, makeBell(endCh[0] * 4, 1.4), FINAL, 0, 0.24);

// 2. SFX from cues.json
for (const e of cues.sfx) {
  const { t, type, gain = 0.7, pan = 0, d = 0.4, f = 1318 } = e;
  if (type === 'step') place(sfxL, sfxR, makeStep(), t, pan, gain);
  else if (type === 'thud') place(sfxL, sfxR, makeThud(), t, pan, gain);
  else if (type === 'pop') place(sfxL, sfxR, makePop(), t, pan, gain);
  else if (type === 'boing') place(sfxL, sfxR, makeBoing(), t, pan, gain);
  else if (type === 'meow') place(sfxL, sfxR, makeMeow(), t, pan, gain);
  else if (type === 'whoosh') place(sfxL, sfxR, makeWhoosh(d), t, pan, gain);
  else if (type === 'flutter') place(sfxL, sfxR, makeFlutter(d), t, pan, gain);
  else if (type === 'bell') place(sfxL, sfxR, makeBell(f, 0.9), t, pan, gain);
  else if (type === 'impact') place(sfxL, sfxR, makeImpact(), t, pan, gain);
  else if (type === 'tick') place(sfxL, sfxR, makeTick(), t, pan, gain);
  else if (type === 'sparkle') {
    [880, 1108, 1318, 1760, 2217].forEach((fq, idx) => {
      place(sfxL, sfxR, makeBell(fq, 0.75), t + idx * 0.055, pan + (idx - 2) * 0.15, gain * 0.45);
    });
  }
}

// 3. Optional real Voice-Over WAV clips (from public/tts/beat_1.wav .. beat_6.wav)
// Reads standard 16-bit PCM WAV (mono or stereo) and resamples linearly to 44.1kHz
function readWavMono(filePath) {
  const buf = fs.readFileSync(filePath);
  const numChannels = buf.readUInt16LE(22);
  const sampleRate = buf.readUInt32LE(24);
  const bitsPerSample = buf.readUInt16LE(34);
  // Find 'data' chunk
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
  const frameCount = Math.floor(dataSize / (bytesPerSample * numChannels));
  const mono = new Float32Array(frameCount);
  for (let i = 0; i < frameCount; i++) {
    let sum = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      const pos = dataOffset + (i * numChannels + ch) * bytesPerSample;
      if (pos + 2 <= buf.length) {
        sum += buf.readInt16LE(pos) / 32768;
      }
    }
    mono[i] = sum / numChannels;
  }
  if (sampleRate === SR) return mono;
  const outLen = Math.floor((frameCount * SR) / sampleRate);
  const resampled = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIdx = (i * sampleRate) / SR;
    const i0 = Math.floor(srcIdx);
    const i1 = Math.min(frameCount - 1, i0 + 1);
    const frac = srcIdx - i0;
    resampled[i] = mono[i0] * (1 - frac) + mono[i1] * frac;
  }
  return resampled;
}

let hasRealTts = false;
const speechDuck = new Float32Array(N).fill(1.0);
for (const beat of cues.beats) {
  const wavPath = path.resolve(`public/tts/beat_${beat.id}.wav`);
  if (fs.existsSync(wavPath)) {
    hasRealTts = true;
    const sig = readWavMono(wavPath);
    const startSec = beat.clauses[0]?.words[0]?.s ?? beat.start + 0.15;
    place(voiceL, voiceR, sig, startSec, 0, 1.0);
    // Duck background music cleanly while Pak Kades speaks
    const s0 = Math.max(0, Math.floor((startSec - 0.12) * SR));
    const s1 = Math.min(N, Math.floor((startSec + sig.length / SR + 0.18) * SR));
    for (let i = s0; i < s1; i++) {
      speechDuck[i] = 0.36;
    }
  }
}

// Smooth ducking envelope
const smoothDuck = lowpass(speechDuck, 12);

// Sidechain kick ducking on music
const kickDuck = new Float32Array(N).fill(1.0);
for (const kt of kicks) {
  const i0 = Math.floor(kt * SR);
  const len = Math.floor(0.32 * SR);
  for (let k = 0; k < len && i0 + k < N; k++) {
    const e = 1 - 0.42 * Math.exp(-(k / SR) * 11);
    if (e < kickDuck[i0 + k]) kickDuck[i0 + k] = e;
  }
}

// Mix all stems to 16-bit stereo WAV
const totalSamples = Math.floor(DUR * SR);
const rawMix = new Float32Array(totalSamples * 2);
let maxAbs = 1e-6;
for (let i = 0; i < totalSamples; i++) {
  const mDuck = kickDuck[i] * smoothDuck[i];
  const musicScale = hasRealTts ? 0.42 : 0.62;
  const drumScale = hasRealTts ? 0.38 : 0.55;
  const sfxScale = hasRealTts ? 0.65 : 0.85;
  let l = Math.tanh(musicL[i] * mDuck * musicScale + drumsL[i] * smoothDuck[i] * drumScale + sfxL[i] * sfxScale + voiceL[i] * 1.15);
  let r = Math.tanh(musicR[i] * mDuck * musicScale + drumsR[i] * smoothDuck[i] * drumScale + sfxR[i] * sfxScale + voiceR[i] * 1.15);
  // Gentle fade-out last 0.6s
  const fadeSamples = Math.floor(0.6 * SR);
  if (i > totalSamples - fadeSamples) {
    const g = (totalSamples - i) / fadeSamples;
    l *= g;
    r *= g;
  }
  rawMix[i * 2] = l;
  rawMix[i * 2 + 1] = r;
  maxAbs = Math.max(maxAbs, Math.abs(l), Math.abs(r));
}

const outDir = path.resolve('public/audio');
fs.mkdirSync(outDir, { recursive: true });
const rawWavPath = path.resolve('out/raw_mix.wav');
fs.mkdirSync(path.dirname(rawWavPath), { recursive: true });

const wavBuf = Buffer.alloc(44 + totalSamples * 4);
wavBuf.write('RIFF', 0);
wavBuf.writeUInt32LE(36 + totalSamples * 4, 4);
wavBuf.write('WAVE', 8);
wavBuf.write('fmt ', 12);
wavBuf.writeUInt32LE(16, 16);
wavBuf.writeUInt16LE(1, 20);
wavBuf.writeUInt16LE(2, 22);
wavBuf.writeUInt32LE(SR, 24);
wavBuf.writeUInt32LE(SR * 4, 28);
wavBuf.writeUInt16LE(4, 32);
wavBuf.writeUInt16LE(16, 34);
wavBuf.write('data', 36);
wavBuf.writeUInt32LE(totalSamples * 4, 40);

const normGain = 0.88 / maxAbs;
for (let i = 0; i < totalSamples * 2; i++) {
  const s = Math.max(-1, Math.min(1, rawMix[i] * normGain));
  wavBuf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
}
fs.writeFileSync(rawWavPath, wavBuf);

const finalWav = path.join(outDir, 'mix.wav');
const finalMp3 = path.join(outDir, 'mix.mp3');

execSync(
  `ffmpeg -y -loglevel error -i "${rawWavPath}" -af "loudnorm=I=-14:TP=-2.2:LRA=11" -ar 44100 "${finalWav}"`,
  { stdio: 'inherit' }
);
execSync(
  `ffmpeg -y -loglevel error -i "${finalWav}" -c:a libmp3lame -b:a 192k "${finalMp3}"`,
  { stdio: 'inherit' }
);

console.log(`Mixed audio -> ${finalWav} & ${finalMp3} (hasRealTts=${hasRealTts})`);
