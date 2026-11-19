import fs from 'fs';
import path from 'path';

const FPS = 30;
const KEYWORDS = new Set([
  'amanah', '3', 'ketiga', '100', '245', 'follow', 'warga', 'komen', 'bangun',
  'lapangan', 'bola', 'rame', 'becek', 'semak', 'nyangkut', 'atap', 'sekolah',
  'geser', 'lahan', 'samping', 'rumput', 'gotong', 'royong', 'garis', 'gawang',
  'jadi', 'guru', 'masuk', 'ngaji', 'flora', 'masjid', 'kepala', 'kuli',
  'bangunan', 'gas', 'rumah', 'banyak', 'sekaligus', 'kucing', 'numpang',
  'besok', 'likenya', 'like', 'duluan',
]);

function guessVowel(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 'ah';
  if (w.includes('o') || w.includes('u')) return 'oh';
  if (w.includes('i') || w.includes('e')) return 'ee';
  return 'ah';
}

function countSyl(word) {
  const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^\d+$/.test(clean)) {
    if (clean === '245') return 7;
    if (clean === '100') return 3;
    return 2;
  }
  const m = clean.match(/[aeiou]+/g);
  return Math.max(1, m ? m.length : Math.ceil(clean.length / 3));
}

function splitClauses(text) {
  const parts = text
    .split(/(?<=[.!?])\s+|(?<=—)\s*|(?<=,)\s+(?=[A-Z]|warga|tapi|masa|dan|di|langsung|yang|nama|bangun)/)
    .map((s) => s.trim())
    .filter(Boolean);

  const grouped = [];
  for (const p of parts) {
    const words = p.split(/\s+/).filter(Boolean);
    if (words.length <= 7) {
      grouped.push(p);
    } else {
      const mid = Math.ceil(words.length / 2);
      grouped.push(words.slice(0, mid).join(' '));
      grouped.push(words.slice(mid).join(' '));
    }
  }
  return grouped.filter(Boolean);
}

// 10-beat Episode 3 narrative order:
// 1. Baca komen (100 -> 245)
// 2. Dialog minta lapangan (@virgod29 + Pak Kades)
// 3. Masalah lahan (becek + bola nyangkut atap sekolah)
// 4. Pindah ke lahan samping (jauh dari jalan)
// 5. Bangun lapangan bola (gotong royong timelapse)
// 6. Peran masuk: Guru (@isqi_sani2316 + @nadia._single_era00 -> Sekolah)
// 7. Peran masuk: Guru ngaji (@lida_aja_gin / Flora -> Masjid)
// 8. Dialog Kepala Kuli (@rehannoperwan411 + Pak Kades)
// 9. Kepala Kuli LANGSUNG bangun banyak rumah warga sekaligus
// 10. Aerial fly-over kampung + Kucing + End Card
const rawBeats = [
  {
    id: 1,
    scene: 'intro_comments',
    holdBefore: 0.45,
    holdAfter: 0.25,
    minDur: 8.2,
    utterances: [
      {
        id: 'ep3v2_b1_kades',
        speaker: 'kades',
        voice: 'Charon',
        text: 'Hari ke 3 di Kampung Amanah, warga dari 100 udah bertambah menjadi 245. Yang follow, jadi warga. Yang komen, usulannya saya bangun.',
      },
    ],
  },
  {
    id: 2,
    scene: 'dialog_virgod',
    holdBefore: 0.2,
    holdAfter: 0.22,
    minDur: 6.2,
    utterances: [
      {
        id: 'ep3v2_b2_virgod',
        speaker: 'virgod',
        voice: 'Puck',
        text: 'Pak, kampung udah rame, tapi nggak ada lapangan bola!',
      },
      {
        id: 'ep3v2_b2_kades',
        speaker: 'kades',
        voice: 'Charon',
        text: 'Bener juga, masa kampung segede ini nggak ada tempat main bola.',
      },
    ],
  },
  {
    id: 3,
    scene: 'muddy_roof_ball',
    holdBefore: 0.22,
    holdAfter: 0.35,
    minDur: 6.4,
    utterances: [
      {
        id: 'ep3v2_b3_kades',
        speaker: 'kades',
        voice: 'Charon',
        text: 'Masalahnya pinggir jalan masih becek penuh semak. Sekali tendang... loh, nyangkut di atap sekolah!',
      },
    ],
  },
  {
    id: 4,
    scene: 'move_clearing',
    holdBefore: 0.22,
    holdAfter: 0.22,
    minDur: 5.4,
    utterances: [
      {
        id: 'ep3v2_b4_kades',
        speaker: 'kades',
        voice: 'Charon',
        text: 'Ya udah, ayo geser ke lahan samping sini. Di tanah rumput ini kita bikin lapangan, jauh dari jalan!',
      },
    ],
  },
  {
    id: 5,
    scene: 'build_field',
    holdBefore: 0.22,
    holdAfter: 0.48,
    minDur: 6.8,
    utterances: [
      {
        id: 'ep3v2_b5_kades',
        speaker: 'kades',
        voice: 'Charon',
        text: 'Semua warga turun gotong royong! Ratain rumput, tarik garis putih, pasang gawang... lapangan bolanya langsung jadi!',
      },
    ],
  },
  {
    id: 6,
    scene: 'dialog_guru',
    holdBefore: 0.18,
    holdAfter: 1.55,
    minDur: 5.4,
    utterances: [
      {
        id: 'ep3v2_b6_isqi',
        speaker: 'isqi',
        voice: 'Kore',
        text: 'Pak, saya mau jadi guru.',
      },
      {
        id: 'ep3v2_b6_kades',
        speaker: 'kades',
        voice: 'Charon',
        text: 'Masuk sekolah.',
      },
    ],
  },
  {
    id: 7,
    scene: 'dialog_guru_ngaji',
    holdBefore: 0.18,
    holdAfter: 1.55,
    minDur: 5.8,
    utterances: [
      {
        id: 'ep3v2_b7_lida',
        speaker: 'lida',
        voice: 'Aoede',
        text: 'Pak, saya mau jadi guru ngaji, nama saya Flora.',
      },
      {
        id: 'ep3v2_b7_kades',
        speaker: 'kades',
        voice: 'Charon',
        text: 'Masuk masjid.',
      },
    ],
  },
  {
    id: 8,
    scene: 'dialog_kepala_kuli',
    holdBefore: 0.18,
    holdAfter: 0.28,
    minDur: 5.4,
    utterances: [
      {
        id: 'ep3v2_b8_rehan',
        speaker: 'rehan',
        voice: 'Fenrir',
        text: 'Pak, saya jadi kepala kuli bangunan.',
      },
      {
        id: 'ep3v2_b8_kades',
        speaker: 'kades',
        voice: 'Charon',
        text: 'Gas, bangun rumah warga, yang banyak ya.',
      },
    ],
  },
  {
    id: 9,
    scene: 'build_houses',
    holdBefore: 0.22,
    holdAfter: 0.55,
    minDur: 7.4,
    utterances: [
      {
        id: 'ep3v2_b9_kades',
        speaker: 'kades',
        voice: 'Charon',
        text: 'Langsung gas! Kepala kuli bareng warga gotong royong bangun banyak rumah warga sekaligus... kampungnya makin rame!',
      },
    ],
  },
  {
    id: 10,
    scene: 'closing_cta',
    holdBefore: 0.25,
    holdAfter: 1.5,
    minDur: 7.4,
    utterances: [
      {
        id: 'ep3v2_b10_kades',
        speaker: 'kades',
        voice: 'Charon',
        text: 'Kucing masih numpang. Besok bangun apa lagi? Komen, yang like-nya paling banyak duluan!',
      },
    ],
  },
];

let cursor = 0;
const beats = [];
const bounds = [];

for (let bi = 0; bi < rawBeats.length; bi++) {
  const rb = rawBeats[bi];
  const beatStart = Number(cursor.toFixed(3));
  let uCur = beatStart + rb.holdBefore;
  const builtUtt = [];

  for (let ui = 0; ui < rb.utterances.length; ui++) {
    const u = rb.utterances[ui];
    const wordsRaw = u.text.split(/\s+/).filter(Boolean);
    const estDur = Math.max(1.2, wordsRaw.reduce((acc, w) => acc + countSyl(w) * 0.155, 0) + 0.3);
    const uStart = Number(uCur.toFixed(3));
    const uEnd = Number((uStart + estDur).toFixed(3));

    const clauseTexts = splitClauses(u.text);
    const totalSyl = wordsRaw.reduce((acc, w) => acc + countSyl(w), 0);
    let wCur = uStart;

    const clauses = clauseTexts.map((ct) => {
      const cWordsRaw = ct.split(/\s+/).filter(Boolean);
      const cStart = wCur;
      const words = cWordsRaw.map((w) => {
        const syl = countSyl(w);
        const wDur = (syl / totalSyl) * estDur;
        const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
        const entry = {
          w,
          s: Number(wCur.toFixed(3)),
          e: Number((wCur + wDur).toFixed(3)),
          kw: KEYWORDS.has(clean),
          syl,
          v: guessVowel(w),
        };
        wCur += wDur;
        return entry;
      });
      return {
        speaker: u.speaker,
        start: Number(Math.max(beatStart, cStart - 0.03).toFixed(3)),
        end: Number((wCur + 0.08).toFixed(3)),
        words,
      };
    });

    builtUtt.push({
      id: u.id,
      speaker: u.speaker,
      voice: u.voice,
      start: uStart,
      end: uEnd,
      text: u.text,
      clauses,
    });

    uCur = uEnd + (ui < rb.utterances.length - 1 ? 0.16 : 0);
  }

  const beatEnd = Number(Math.max(beatStart + rb.minDur, uCur + rb.holdAfter).toFixed(3));
  const flatClauses = builtUtt.flatMap((u) => u.clauses);

  beats.push({
    id: rb.id,
    start: beatStart,
    end: beatEnd,
    scene: rb.scene,
    text: rb.utterances.map((u) => u.text).join(' '),
    utterances: builtUtt,
    clauses: flatClauses,
  });

  if (bi < rawBeats.length - 1) {
    bounds.push(beatEnd);
  }
  cursor = beatEnd;
}

const totalDur = Number(cursor.toFixed(1));
const totalFrames = Math.round(totalDur * FPS);

const allWords = beats.flatMap((b) =>
  b.utterances.flatMap((u) =>
    u.clauses.flatMap((c) => c.words.map((w) => ({ ...w, speaker: u.speaker })))
  )
);

const mouthFrames = Array.from({ length: totalFrames }, (_, f) => {
  const t = f / FPS;
  const active = allWords.find((w) => t >= w.s && t <= w.e);
  if (!active) return { speaker: 'none', open: 0, v: 'closed' };
  const p = (t - active.s) / Math.max(0.05, active.e - active.s);
  const pulse = Math.sin(p * Math.PI * Math.max(1, active.syl));
  const open = Math.min(1, Math.max(0.2, Math.abs(pulse) * 0.85));
  return {
    speaker: active.speaker,
    open: Number(open.toFixed(3)),
    v: active.v,
  };
});

const cues = {
  series: 'Kampung Amanah',
  episode: 3,
  title: 'Lapangan Bola & Rumah Warga',
  dur: totalDur,
  fps: FPS,
  totalFrames,
  ttsActive: false,
  bounds,
  beats,
  mouthFrames,
  sfx: [
    { t: 0.05, type: 'whoosh', d: 0.45, gain: 0.65 },
    { t: 1.4, type: 'ticks', d: 1.8, step: 0.14, gain: 0.6 },
    { t: 3.3, type: 'bell', f: 1174, gain: 0.6 },
    { t: Number((beats[0].start + (beats[0].end - beats[0].start) * 0.48).toFixed(2)), type: 'pop', gain: 0.7 },
    { t: Number(beats[1].start.toFixed(2)), type: 'pop', gain: 0.65 },
    { t: Number((beats[2].start + 0.05).toFixed(2)), type: 'whoosh', d: 0.35, gain: 0.7 },
    { t: Number((beats[2].start + (beats[2].end - beats[2].start) * 0.42).toFixed(2)), type: 'kick', gain: 0.85 },
    { t: Number((beats[2].start + (beats[2].end - beats[2].start) * 0.68).toFixed(2)), type: 'boing', gain: 0.8 },
    { t: Number((beats[2].start + (beats[2].end - beats[2].start) * 0.71).toFixed(2)), type: 'thud', gain: 0.75 },
    { t: Number((beats[3].start + 0.05).toFixed(2)), type: 'whoosh', d: 0.35, gain: 0.7 },
    { t: Number((beats[4].start + 0.05).toFixed(2)), type: 'whoosh', d: 0.32, gain: 0.7 },
    { t: Number((beats[4].start + 0.25).toFixed(2)), type: 'build_fast', d: 5.0, gain: 0.8 },
    { t: Number((beats[4].end - 0.55).toFixed(2)), type: 'whistle', gain: 0.75 },
    { t: Number((beats[4].end - 0.45).toFixed(2)), type: 'sparkle', gain: 0.8 },
    { t: Number(beats[5].start.toFixed(2)), type: 'pop', gain: 0.65 },
    { t: Number((beats[5].end - 1.5).toFixed(2)), type: 'whoosh', d: 0.28, gain: 0.65 },
    { t: Number(beats[6].start.toFixed(2)), type: 'pop', gain: 0.65 },
    { t: Number((beats[6].end - 1.5).toFixed(2)), type: 'whoosh', d: 0.28, gain: 0.65 },
    { t: Number(beats[7].start.toFixed(2)), type: 'pop', gain: 0.65 },
    { t: Number((beats[8].start + 0.05).toFixed(2)), type: 'whoosh', d: 0.35, gain: 0.75 },
    { t: Number((beats[8].start + 0.25).toFixed(2)), type: 'build_fast', d: 5.8, gain: 0.85 },
    { t: Number((beats[8].end - 0.55).toFixed(2)), type: 'bell', f: 1046, gain: 0.65 },
    { t: Number((beats[8].end - 0.45).toFixed(2)), type: 'sparkle', gain: 0.85 },
    { t: Number((beats[9].start + 0.1).toFixed(2)), type: 'whoosh', d: 0.45, gain: 0.7 },
    { t: Number((beats[9].start + (beats[9].end - beats[9].start) * 0.42).toFixed(2)), type: 'meow', gain: 0.78, pan: 0.45 },
    { t: Number((beats[9].start + (beats[9].end - beats[9].start) * 0.46).toFixed(2)), type: 'impact', gain: 0.65 },
    { t: Number((beats[9].start + (beats[9].end - beats[9].start) * 0.48).toFixed(2)), type: 'sparkle', gain: 0.8 },
  ],
  music: {
    bpm: 120,
    bars: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'],
    final: Number((totalDur - 1.1).toFixed(2)),
  },
};

fs.writeFileSync(path.resolve('src/video/cues_ep3.json'), JSON.stringify(cues, null, 2));
console.log(`Generated src/video/cues_ep3.json (${cues.dur}s, ${cues.totalFrames} frames)`);
