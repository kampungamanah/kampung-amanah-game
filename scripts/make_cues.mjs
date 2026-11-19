import fs from 'fs';
import path from 'path';

const FPS = 30;
const DUR = 32.0;
const TOTAL_FRAMES = Math.round(DUR * FPS);

const beats = [
  {
    id: 1,
    start: 0.0,
    end: 5.2,
    pose: 'present_self',
    lookAt: 'camera',
    eyebrow: 'cheerful',
    camZoom: [1.0, 1.04],
    camPanX: [0, -8],
    camPanY: [0, -6],
    text: 'Ini Kampung Amanah. Isinya... saya doang.',
    clauses: [
      {
        start: 0.6,
        end: 2.55,
        words: [
          { w: 'Ini', s: 0.65, e: 0.92, kw: false, syl: 2, v: 'eh' },
          { w: 'Kampung', s: 0.92, e: 1.48, kw: true, syl: 2, v: 'ah' },
          { w: 'Amanah.', s: 1.48, e: 2.18, kw: true, syl: 3, v: 'ah' },
        ],
      },
      {
        start: 2.65,
        end: 5.05,
        words: [
          { w: 'Isinya...', s: 2.70, e: 3.45, kw: false, syl: 3, v: 'eh' },
          { w: 'saya', s: 3.65, e: 4.02, kw: true, syl: 2, v: 'ah' },
          { w: 'doang.', s: 4.02, e: 4.60, kw: true, syl: 2, v: 'oh' },
        ],
      },
    ],
  },
  {
    id: 2,
    start: 5.2,
    end: 11.2,
    pose: 'flag_then_cat',
    lookAt: 'flag_cat',
    eyebrow: 'amused',
    camZoom: [1.04, 1.08],
    camPanX: [-8, 18],
    camPanY: [-6, 12],
    text: 'Bendera nggak dihitung. Kucing ini cuma numpang, nggak dihitung juga.',
    clauses: [
      {
        start: 5.22,
        end: 7.20,
        words: [
          { w: 'Bendera', s: 5.25, e: 5.85, kw: true, syl: 3, v: 'eh' },
          { w: 'nggak', s: 5.85, e: 6.22, kw: false, syl: 1, v: 'ah' },
          { w: 'dihitung.', s: 6.22, e: 6.95, kw: true, syl: 3, v: 'oh' },
        ],
      },
      {
        start: 7.30,
        end: 9.30,
        words: [
          { w: 'Kucing', s: 7.35, e: 7.85, kw: true, syl: 2, v: 'oh' },
          { w: 'ini', s: 7.85, e: 8.15, kw: false, syl: 2, v: 'eh' },
          { w: 'cuma', s: 8.15, e: 8.55, kw: false, syl: 2, v: 'ah' },
          { w: 'numpang,', s: 8.55, e: 9.20, kw: true, syl: 2, v: 'ah' },
        ],
      },
      {
        start: 9.30,
        end: 11.10,
        words: [
          { w: 'nggak', s: 9.35, e: 9.70, kw: false, syl: 1, v: 'ah' },
          { w: 'dihitung', s: 9.70, e: 10.32, kw: true, syl: 3, v: 'oh' },
          { w: 'juga.', s: 10.32, e: 10.88, kw: false, syl: 2, v: 'ah' },
        ],
      },
    ],
  },
  {
    id: 3,
    start: 11.2,
    end: 15.8,
    pose: 'chest_then_cam',
    lookAt: 'camera',
    eyebrow: 'warm',
    camZoom: [1.08, 1.13],
    camPanX: [18, 0],
    camPanY: [12, -10],
    text: 'Tapi kampung ini bukan punya saya. Ini punya kalian yang nonton.',
    clauses: [
      {
        start: 11.22,
        end: 13.50,
        words: [
          { w: 'Tapi', s: 11.25, e: 11.60, kw: false, syl: 2, v: 'ah' },
          { w: 'kampung', s: 11.60, e: 12.05, kw: false, syl: 2, v: 'oh' },
          { w: 'ini', s: 12.05, e: 12.30, kw: false, syl: 2, v: 'eh' },
          { w: 'bukan', s: 12.30, e: 12.68, kw: true, syl: 2, v: 'ah' },
          { w: 'punya', s: 12.68, e: 13.02, kw: false, syl: 2, v: 'ah' },
          { w: 'saya.', s: 13.02, e: 13.42, kw: false, syl: 2, v: 'ah' },
        ],
      },
      {
        start: 13.55,
        end: 15.70,
        words: [
          { w: 'Ini', s: 13.60, e: 13.86, kw: false, syl: 2, v: 'eh' },
          { w: 'punya', s: 13.86, e: 14.20, kw: false, syl: 2, v: 'ah' },
          { w: 'kalian', s: 14.20, e: 14.70, kw: true, syl: 3, v: 'ah' },
          { w: 'yang', s: 14.70, e: 14.95, kw: false, syl: 1, v: 'ah' },
          { w: 'nonton.', s: 14.95, e: 15.55, kw: true, syl: 2, v: 'oh' },
        ],
      },
    ],
  },
  {
    id: 4,
    start: 15.8,
    end: 22.0,
    pose: 'count_rules',
    lookAt: 'camera',
    eyebrow: 'excited',
    camZoom: [1.13, 1.16],
    camPanX: [0, -10],
    camPanY: [-10, -4],
    text: 'Yang follow, jadi warga. Yang komen, usulannya saya bangun. Yang paling rame, duluan.',
    clauses: [
      {
        start: 15.82,
        end: 17.55,
        words: [
          { w: 'Yang', s: 15.85, e: 16.12, kw: false, syl: 1, v: 'ah' },
          { w: 'follow,', s: 16.12, e: 16.62, kw: true, syl: 2, v: 'oh' },
          { w: 'jadi', s: 16.62, e: 16.96, kw: false, syl: 2, v: 'eh' },
          { w: 'warga.', s: 16.96, e: 17.45, kw: true, syl: 2, v: 'ah' },
        ],
      },
      {
        start: 17.60,
        end: 20.00,
        words: [
          { w: 'Yang', s: 17.65, e: 17.90, kw: false, syl: 1, v: 'ah' },
          { w: 'komen,', s: 17.90, e: 18.42, kw: true, syl: 2, v: 'oh' },
          { w: 'usulannya', s: 18.42, e: 19.06, kw: false, syl: 4, v: 'ah' },
          { w: 'saya', s: 19.06, e: 19.36, kw: false, syl: 2, v: 'ah' },
          { w: 'bangun.', s: 19.36, e: 19.90, kw: true, syl: 2, v: 'oh' },
        ],
      },
      {
        start: 20.05,
        end: 21.95,
        words: [
          { w: 'Yang', s: 20.10, e: 20.36, kw: false, syl: 1, v: 'ah' },
          { w: 'paling', s: 20.36, e: 20.75, kw: false, syl: 2, v: 'eh' },
          { w: 'rame,', s: 20.75, e: 21.22, kw: true, syl: 2, v: 'eh' },
          { w: 'duluan.', s: 21.22, e: 21.85, kw: true, syl: 3, v: 'ah' },
        ],
      },
    ],
  },
  {
    id: 5,
    start: 22.0,
    end: 28.6,
    pose: 'check_then_cat',
    lookAt: 'sign_cat',
    eyebrow: 'playful',
    camZoom: [1.16, 1.12],
    camPanX: [-10, 14],
    camPanY: [-4, 10],
    text: 'Besok saya cek, udah ada yang follow apa belum. Kalau masih kosong... ya saya ngobrol sama kucing lagi.',
    clauses: [
      {
        start: 22.02,
        end: 25.25,
        words: [
          { w: 'Besok', s: 22.05, e: 22.50, kw: true, syl: 2, v: 'oh' },
          { w: 'saya', s: 22.50, e: 22.80, kw: false, syl: 2, v: 'ah' },
          { w: 'cek,', s: 22.80, e: 23.20, kw: true, syl: 1, v: 'eh' },
          { w: 'udah', s: 23.30, e: 23.60, kw: false, syl: 2, v: 'ah' },
          { w: 'ada', s: 23.60, e: 23.86, kw: false, syl: 2, v: 'ah' },
          { w: 'yang', s: 23.86, e: 24.10, kw: false, syl: 1, v: 'ah' },
          { w: 'follow', s: 24.10, e: 24.52, kw: true, syl: 2, v: 'oh' },
          { w: 'apa', s: 24.52, e: 24.78, kw: false, syl: 2, v: 'ah' },
          { w: 'belum.', s: 24.78, e: 25.18, kw: false, syl: 2, v: 'oh' },
        ],
      },
      {
        start: 25.30,
        end: 28.55,
        words: [
          { w: 'Kalau', s: 25.35, e: 25.66, kw: false, syl: 2, v: 'ah' },
          { w: 'masih', s: 25.66, e: 26.02, kw: false, syl: 2, v: 'eh' },
          { w: 'kosong...', s: 26.02, e: 26.62, kw: true, syl: 2, v: 'oh' },
          { w: 'ya', s: 26.75, e: 26.96, kw: false, syl: 1, v: 'ah' },
          { w: 'saya', s: 26.96, e: 27.26, kw: false, syl: 2, v: 'ah' },
          { w: 'ngobrol', s: 27.26, e: 27.68, kw: true, syl: 2, v: 'oh' },
          { w: 'sama', s: 27.68, e: 27.92, kw: false, syl: 2, v: 'ah' },
          { w: 'kucing', s: 27.92, e: 28.28, kw: true, syl: 2, v: 'oh' },
          { w: 'lagi.', s: 28.28, e: 28.60, kw: false, syl: 2, v: 'eh' },
        ],
      },
    ],
  },
  {
    id: 6,
    start: 28.6,
    end: 32.0,
    pose: 'invite_cta',
    lookAt: 'camera',
    eyebrow: 'cheerful',
    camZoom: [1.12, 1.18],
    camPanX: [14, 0],
    camPanY: [10, -8],
    text: 'Jadi, mau jadi warga nomor berapa?',
    clauses: [
      {
        start: 28.65,
        end: 31.65,
        words: [
          { w: 'Jadi,', s: 28.70, e: 29.16, kw: false, syl: 2, v: 'ah' },
          { w: 'mau', s: 29.24, e: 29.56, kw: false, syl: 2, v: 'ah' },
          { w: 'jadi', s: 29.56, e: 29.88, kw: false, syl: 2, v: 'eh' },
          { w: 'warga', s: 29.88, e: 30.28, kw: true, syl: 2, v: 'ah' },
          { w: 'nomor', s: 30.28, e: 30.68, kw: false, syl: 2, v: 'oh' },
          { w: 'berapa?', s: 30.68, e: 31.30, kw: true, syl: 3, v: 'ah' },
        ],
      },
    ],
  },
];

// Build deterministic 30fps mouth-openness envelope [0..1] + vowel shape per frame
// Guaranteed active open-close oscillation during EVERY spoken word, closed (0) during pauses
const allWords = beats.flatMap((b) => b.clauses.flatMap((c) => c.words));
const mouthFrames = Array.from({ length: TOTAL_FRAMES }, (_, f) => {
  const t = f / FPS;
  const active = allWords.find((w) => t >= w.s && t <= w.e);
  if (!active) {
    return { open: 0, v: 'closed' };
  }
  const dur = Math.max(0.08, active.e - active.s);
  const u = (t - active.s) / dur; // 0..1 across word
  const sylCount = Math.max(1, active.syl || 2);
  // Syllable pulse: smoothly opens and closes on every syllable, never stuck static
  const pulse = Math.abs(Math.sin(u * Math.PI * sylCount));
  // Taper slightly at very start/end of word for natural articulation
  const edge = Math.sin(Math.min(1, u) * Math.PI);
  const open = Number(Math.min(1, 0.25 + 0.75 * pulse * (0.45 + 0.55 * edge)).toFixed(3));
  return { open, v: active.v || 'ah' };
});

const sfx = [
  // Entrance footsteps & badge pop
  { t: 0.05, type: 'pop', gain: 0.7 },
  { t: 0.14, type: 'step', gain: 0.55 },
  { t: 0.30, type: 'step', gain: 0.55 },
  { t: 0.46, type: 'step', gain: 0.55 },
  { t: 0.62, type: 'thud', gain: 0.5 },
  // Beat 1 punchline "saya doang"
  { t: 3.65, type: 'pop', gain: 0.6 },
  { t: 4.58, type: 'boing', gain: 0.65 },
  // Beat 2 transition + flag + cat meow
  { t: 5.05, type: 'whoosh', d: 0.35, gain: 0.65, pan: -0.2 },
  { t: 5.30, type: 'flutter', d: 1.4, gain: 0.4, pan: -0.5 },
  { t: 7.35, type: 'meow', gain: 0.75, pan: 0.45 },
  // Beat 3 transition + point camera
  { t: 11.05, type: 'whoosh', d: 0.35, gain: 0.6, pan: 0.15 },
  { t: 14.20, type: 'pop', gain: 0.7 },
  // Beat 4 finger counts + thumbs up
  { t: 15.80, type: 'whoosh', d: 0.3, gain: 0.55 },
  { t: 16.12, type: 'pop', gain: 0.7 },
  { t: 17.90, type: 'pop', gain: 0.75 },
  { t: 20.10, type: 'bell', f: 1174, gain: 0.45 },
  { t: 21.22, type: 'sparkle', gain: 0.65 },
  // Beat 5 check sign + cat again
  { t: 21.88, type: 'whoosh', d: 0.32, gain: 0.6, pan: 0.25 },
  { t: 22.80, type: 'tick', gain: 0.7 },
  { t: 27.90, type: 'meow', gain: 0.7, pan: 0.45 },
  // Beat 6 closing + CTA card "FOLLOW = JADI WARGA"
  { t: 28.50, type: 'whoosh', d: 0.32, gain: 0.65 },
  { t: 29.60, type: 'impact', gain: 0.65 },
  { t: 29.65, type: 'sparkle', gain: 0.75 },
];

const cues = {
  series: 'Kampung Amanah',
  episode: 1,
  title: 'Hari Pertama',
  dur: DUR,
  fps: FPS,
  totalFrames: TOTAL_FRAMES,
  ttsActive: false,
  bounds: [5.2, 11.2, 15.8, 22.0, 28.6],
  beats,
  mouthFrames,
  sfx,
  music: {
    bpm: 112,
    bars: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'],
    final: 30.8,
  },
};

const outPath = path.resolve('src/video/cues.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(cues, null, 2));
console.log(`Generated ${outPath} (${TOTAL_FRAMES} frames, ${DUR}s, ${allWords.length} words)`);
