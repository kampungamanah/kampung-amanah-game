import fs from 'fs';
import path from 'path';

const FPS = 30;
const DUR = 57.0;
const TOTAL_FRAMES = Math.round(DUR * FPS);

// 10 sequential beats matching exact prompt order, plus utterance list for two-voice Gemini TTS
const beats = [
  {
    id: 1,
    start: 0.0,
    end: 5.2,
    scene: 'intro_walk',
    camZoom: [1.04, 1.08],
    camPanX: [0, -10],
    camPanY: [10, 0],
    text: 'Hari kedua di Kampung Amanah. Masih sepi nih... eh, kok ada yang datang?',
    utterances: [
      {
        id: 'u01',
        speaker: 'kades',
        voice: 'Charon',
        start: 0.55,
        end: 4.95,
        text: 'Hari kedua di Kampung Amanah. Masih sepi nih... eh, kok ada yang datang?',
        clauses: [
          {
            words: [
              { w: 'Hari', kw: false, syl: 2, v: 'ah' },
              { w: 'kedua', kw: true, syl: 3, v: 'ah' },
              { w: 'di', kw: false, syl: 1, v: 'eh' },
              { w: 'Kampung', kw: true, syl: 2, v: 'oh' },
              { w: 'Amanah.', kw: true, syl: 3, v: 'ah' },
            ],
          },
          {
            words: [
              { w: 'Masih', kw: false, syl: 2, v: 'eh' },
              { w: 'sepi', kw: false, syl: 2, v: 'eh' },
              { w: 'nih...', kw: false, syl: 1, v: 'eh' },
              { w: 'eh,', kw: false, syl: 1, v: 'eh' },
              { w: 'kok', kw: false, syl: 1, v: 'oh' },
              { w: 'ada', kw: false, syl: 2, v: 'ah' },
              { w: 'yang', kw: false, syl: 1, v: 'ah' },
              { w: 'datang?', kw: true, syl: 2, v: 'ah' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 2,
    start: 5.2,
    end: 9.8,
    scene: 'bus_arrive',
    camZoom: [1.0, 0.96],
    camPanX: [18, 0],
    camPanY: [0, 8],
    text: 'Waduh! Ada bus oranye datang ke kampung!',
    utterances: [
      {
        id: 'u02',
        speaker: 'kades',
        voice: 'Charon',
        start: 5.75,
        end: 9.45,
        text: 'Waduh! Ada bus oranye datang ke kampung!',
        clauses: [
          {
            words: [
              { w: 'Waduh!', kw: true, syl: 2, v: 'oh' },
              { w: 'Ada', kw: false, syl: 2, v: 'ah' },
              { w: 'bus', kw: true, syl: 1, v: 'oh' },
              { w: 'oranye', kw: true, syl: 3, v: 'eh' },
              { w: 'datang', kw: false, syl: 2, v: 'ah' },
              { w: 'ke', kw: false, syl: 1, v: 'eh' },
              { w: 'kampung!', kw: true, syl: 2, v: 'oh' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 3,
    start: 9.8,
    end: 16.4,
    scene: 'crowd_arrive',
    camZoom: [0.96, 0.94],
    camPanX: [0, 0],
    camPanY: [8, 4],
    text: 'Rame banget! Warga udah pada turun, penduduk langsung tembus seratus!',
    utterances: [
      {
        id: 'u03',
        speaker: 'kades',
        voice: 'Charon',
        start: 10.2,
        end: 16.0,
        text: 'Rame banget! Warga udah pada turun, penduduk langsung tembus seratus!',
        clauses: [
          {
            words: [
              { w: 'Rame', kw: true, syl: 2, v: 'eh' },
              { w: 'banget!', kw: false, syl: 2, v: 'ah' },
              { w: 'Warga', kw: true, syl: 2, v: 'ah' },
              { w: 'udah', kw: false, syl: 2, v: 'ah' },
              { w: 'pada', kw: false, syl: 2, v: 'ah' },
              { w: 'turun,', kw: false, syl: 2, v: 'oh' },
            ],
          },
          {
            words: [
              { w: 'penduduk', kw: false, syl: 3, v: 'oh' },
              { w: 'langsung', kw: false, syl: 2, v: 'oh' },
              { w: 'tembus', kw: false, syl: 2, v: 'oh' },
              { w: 'seratus!', kw: true, syl: 3, v: 'oh' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 4,
    start: 16.4,
    end: 23.4,
    scene: 'phone_profile',
    camZoom: [1.0, 1.04],
    camPanX: [0, 0],
    camPanY: [0, -6],
    text: 'Nih buktinya: Instagram Kampung Amanah udah seratus pengikut, Facebook Page Kampung Amanah juga udah aktif!',
    utterances: [
      {
        id: 'u04',
        speaker: 'kades',
        voice: 'Charon',
        start: 16.75,
        end: 23.0,
        text: 'Nih buktinya: Instagram Kampung Amanah udah seratus pengikut, Facebook Page Kampung Amanah juga udah aktif!',
        clauses: [
          {
            words: [
              { w: 'Nih', kw: false, syl: 1, v: 'eh' },
              { w: 'buktinya:', kw: false, syl: 3, v: 'ah' },
              { w: 'Instagram', kw: true, syl: 3, v: 'ah' },
              { w: 'udah', kw: false, syl: 2, v: 'ah' },
              { w: '100', kw: true, syl: 3, v: 'oh' },
              { w: 'pengikut,', kw: true, syl: 3, v: 'oh' },
            ],
          },
          {
            words: [
              { w: 'Facebook', kw: true, syl: 2, v: 'oh' },
              { w: 'Page', kw: false, syl: 1, v: 'eh' },
              { w: 'Kampung', kw: false, syl: 2, v: 'oh' },
              { w: 'Amanah', kw: false, syl: 3, v: 'ah' },
              { w: 'juga', kw: false, syl: 2, v: 'ah' },
              { w: 'aktif!', kw: true, syl: 2, v: 'eh' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 5,
    start: 23.4,
    end: 28.2,
    scene: 'dialog_1',
    camZoom: [0.95, 0.98],
    camPanX: [0, -6],
    camPanY: [4, 2],
    text: '@vinzz4726: "Pak, saya mau jadi presiden." · Pak Kades: "haha, di kampung ga ada presiden kak."',
    utterances: [
      {
        id: 'u05',
        speaker: 'vinzz',
        voice: 'Puck',
        start: 23.6,
        end: 25.55,
        text: 'Pak, saya mau jadi presiden.',
        clauses: [
          {
            words: [
              { w: 'Pak,', kw: false, syl: 1, v: 'ah' },
              { w: 'saya', kw: false, syl: 2, v: 'ah' },
              { w: 'mau', kw: false, syl: 2, v: 'oh' },
              { w: 'jadi', kw: false, syl: 2, v: 'eh' },
              { w: 'presiden.', kw: true, syl: 3, v: 'eh' },
            ],
          },
        ],
      },
      {
        id: 'u06',
        speaker: 'kades',
        voice: 'Charon',
        start: 25.75,
        end: 28.05,
        text: 'haha, di kampung ga ada presiden kak.',
        clauses: [
          {
            words: [
              { w: 'Haha,', kw: false, syl: 2, v: 'ah' },
              { w: 'di', kw: false, syl: 1, v: 'eh' },
              { w: 'kampung', kw: false, syl: 2, v: 'oh' },
              { w: 'ga', kw: true, syl: 1, v: 'ah' },
              { w: 'ada', kw: true, syl: 2, v: 'ah' },
              { w: 'presiden', kw: true, syl: 3, v: 'eh' },
              { w: 'kak.', kw: false, syl: 1, v: 'ah' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 6,
    start: 28.2,
    end: 34.4,
    scene: 'dialog_2',
    camZoom: [0.95, 0.98],
    camPanX: [-6, 6],
    camPanY: [2, 4],
    text: '@3p4n.24: "Saya wakil presiden bang, udah follow." · Pak Kades: "Wah kebetulan banget kursi wapres lagi kosong, bisa daftar ke prab.."',
    utterances: [
      {
        id: 'u07',
        speaker: 'epan',
        voice: 'Puck',
        start: 28.4,
        end: 30.7,
        text: 'Saya wakil presiden bang, udah follow.',
        clauses: [
          {
            words: [
              { w: 'Saya', kw: false, syl: 2, v: 'ah' },
              { w: 'wakil', kw: true, syl: 2, v: 'eh' },
              { w: 'presiden', kw: true, syl: 3, v: 'eh' },
              { w: 'bang,', kw: false, syl: 1, v: 'ah' },
              { w: 'udah', kw: false, syl: 2, v: 'ah' },
              { w: 'follow.', kw: true, syl: 2, v: 'oh' },
            ],
          },
        ],
      },
      {
        id: 'u08',
        speaker: 'kades',
        voice: 'Charon',
        start: 30.9,
        end: 34.25,
        text: 'Wah kebetulan banget kursi wapres lagi kosong, bisa daftar ke prab..',
        clauses: [
          {
            words: [
              { w: 'Wah', kw: false, syl: 1, v: 'ah' },
              { w: 'kebetulan', kw: false, syl: 4, v: 'ah' },
              { w: 'banget', kw: false, syl: 2, v: 'ah' },
              { w: 'kursi', kw: true, syl: 2, v: 'eh' },
              { w: 'wapres', kw: true, syl: 2, v: 'eh' },
              { w: 'lagi', kw: false, syl: 2, v: 'eh' },
              { w: 'kosong,', kw: true, syl: 2, v: 'oh' },
            ],
          },
          {
            words: [
              { w: 'bisa', kw: false, syl: 2, v: 'ah' },
              { w: 'daftar', kw: false, syl: 2, v: 'ah' },
              { w: 'ke', kw: false, syl: 1, v: 'eh' },
              { w: 'prab..', kw: true, syl: 1, v: 'ah' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 7,
    start: 34.4,
    end: 38.8,
    scene: 'dialog_3',
    camZoom: [0.95, 0.98],
    camPanX: [6, 0],
    camPanY: [4, 2],
    text: '@dzikkkksd2: "Pak, saya mau jadi ketua RT." · Pak Kades: "Nah ini baru boleh."',
    utterances: [
      {
        id: 'u09',
        speaker: 'dzik',
        voice: 'Puck',
        start: 34.6,
        end: 36.65,
        text: 'Pak, saya mau jadi ketua RT.',
        clauses: [
          {
            words: [
              { w: 'Pak,', kw: false, syl: 1, v: 'ah' },
              { w: 'saya', kw: false, syl: 2, v: 'ah' },
              { w: 'mau', kw: false, syl: 2, v: 'oh' },
              { w: 'jadi', kw: false, syl: 2, v: 'eh' },
              { w: 'ketua', kw: true, syl: 3, v: 'ah' },
              { w: 'RT.', kw: true, syl: 2, v: 'eh' },
            ],
          },
        ],
      },
      {
        id: 'u10',
        speaker: 'kades',
        voice: 'Charon',
        start: 36.85,
        end: 38.65,
        text: 'Nah ini baru boleh.',
        clauses: [
          {
            words: [
              { w: 'Nah', kw: true, syl: 1, v: 'ah' },
              { w: 'ini', kw: false, syl: 2, v: 'eh' },
              { w: 'baru', kw: false, syl: 2, v: 'oh' },
              { w: 'boleh.', kw: true, syl: 2, v: 'eh' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 8,
    start: 38.8,
    end: 45.2,
    scene: 'dialog_4',
    camZoom: [0.95, 0.98],
    camPanX: [0, 6],
    camPanY: [2, 4],
    text: '@_26ary4stnn: "Pak, saya mau ada sekolah, di sampingnya masjid dan gereja." · Pak Kades: "Gas, kita bangun sekarang."',
    utterances: [
      {
        id: 'u11',
        speaker: 'ary',
        voice: 'Puck',
        start: 39.0,
        end: 42.85,
        text: 'Pak, saya mau ada sekolah, di sampingnya masjid dan gereja.',
        clauses: [
          {
            words: [
              { w: 'Pak,', kw: false, syl: 1, v: 'ah' },
              { w: 'saya', kw: false, syl: 2, v: 'ah' },
              { w: 'mau', kw: false, syl: 2, v: 'oh' },
              { w: 'ada', kw: false, syl: 2, v: 'ah' },
              { w: 'sekolah,', kw: true, syl: 3, v: 'ah' },
            ],
          },
          {
            words: [
              { w: 'di', kw: false, syl: 1, v: 'eh' },
              { w: 'sampingnya', kw: false, syl: 3, v: 'ah' },
              { w: 'masjid', kw: true, syl: 2, v: 'eh' },
              { w: 'dan', kw: false, syl: 1, v: 'ah' },
              { w: 'gereja.', kw: true, syl: 3, v: 'ah' },
            ],
          },
        ],
      },
      {
        id: 'u12',
        speaker: 'kades',
        voice: 'Charon',
        start: 43.05,
        end: 45.05,
        text: 'Gas, kita bangun sekarang.',
        clauses: [
          {
            words: [
              { w: 'Gas,', kw: true, syl: 1, v: 'ah' },
              { w: 'kita', kw: false, syl: 2, v: 'ah' },
              { w: 'bangun', kw: true, syl: 2, v: 'oh' },
              { w: 'sekarang.', kw: false, syl: 3, v: 'ah' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 9,
    start: 45.2,
    end: 52.6,
    scene: 'build_timelapse',
    camZoom: [0.94, 0.94],
    camPanX: [0, 0],
    camPanY: [4, -4],
    text: 'Semua warga gotong royong! Sekolah, masjid, dan gereja langsung berdiri berdampingan!',
    utterances: [
      {
        id: 'u13',
        speaker: 'kades',
        voice: 'Charon',
        start: 45.6,
        end: 51.8,
        text: 'Semua warga gotong royong! Sekolah, masjid, dan gereja langsung berdiri berdampingan!',
        clauses: [
          {
            words: [
              { w: 'Semua', kw: false, syl: 3, v: 'ah' },
              { w: 'warga', kw: true, syl: 2, v: 'ah' },
              { w: 'gotong', kw: true, syl: 2, v: 'oh' },
              { w: 'royong!', kw: true, syl: 2, v: 'oh' },
            ],
          },
          {
            words: [
              { w: 'Sekolah,', kw: true, syl: 3, v: 'ah' },
              { w: 'masjid,', kw: true, syl: 2, v: 'eh' },
              { w: 'dan', kw: false, syl: 1, v: 'ah' },
              { w: 'gereja', kw: true, syl: 3, v: 'ah' },
              { w: 'langsung', kw: false, syl: 2, v: 'oh' },
              { w: 'berdiri!', kw: false, syl: 3, v: 'eh' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 10,
    start: 52.6,
    end: 57.0,
    scene: 'closing',
    camZoom: [0.94, 0.97],
    camPanX: [0, 0],
    camPanY: [-4, -8],
    text: 'Besok bangun apa lagi? Komen, yang paling rame duluan.',
    utterances: [
      {
        id: 'u14',
        speaker: 'kades',
        voice: 'Charon',
        start: 52.95,
        end: 56.2,
        text: 'Besok bangun apa lagi? Komen, yang paling rame duluan.',
        clauses: [
          {
            words: [
              { w: 'Besok', kw: true, syl: 2, v: 'oh' },
              { w: 'bangun', kw: true, syl: 2, v: 'oh' },
              { w: 'apa', kw: false, syl: 2, v: 'ah' },
              { w: 'lagi?', kw: false, syl: 2, v: 'eh' },
            ],
          },
          {
            words: [
              { w: 'Komen,', kw: true, syl: 2, v: 'oh' },
              { w: 'yang', kw: false, syl: 1, v: 'ah' },
              { w: 'paling', kw: false, syl: 2, v: 'eh' },
              { w: 'rame', kw: true, syl: 2, v: 'eh' },
              { w: 'duluan.', kw: true, syl: 3, v: 'ah' },
            ],
          },
        ],
      },
    ],
  },
];

// Assign default proportional clause & word timestamps for every utterance
export function computeWordTimingsFromUtterances(beatsArr) {
  for (const beat of beatsArr) {
    for (const utt of beat.utterances) {
      const words = utt.clauses.flatMap((c) => c.words);
      const totalSyl = words.reduce((acc, w) => acc + Math.max(1, w.syl || 2), 0);
      const span = Math.max(0.4, utt.end - utt.start);
      let cur = utt.start;

      for (const clause of utt.clauses) {
        const cStart = cur;
        for (const word of clause.words) {
          const wDur = (Math.max(1, word.syl || 2) / totalSyl) * span;
          word.s = Number(cur.toFixed(3));
          word.e = Number((cur + wDur).toFixed(3));
          cur += wDur;
        }
        clause.start = Number(Math.max(beat.start, cStart - 0.03).toFixed(3));
        clause.end = Number((cur + 0.1).toFixed(3));
      }
    }
    // Flatten clauses on beat for subtitle rendering
    beat.clauses = beat.utterances.flatMap((u) =>
      u.clauses.map((c) => ({
        speaker: u.speaker,
        start: c.start,
        end: c.end,
        words: c.words,
      }))
    );
  }
}

computeWordTimingsFromUtterances(beats);

const allUttWords = beats.flatMap((b) =>
  b.utterances.flatMap((u) =>
    u.clauses.flatMap((c) => c.words.map((w) => ({ ...w, speaker: u.speaker })))
  )
);

const mouthFrames = Array.from({ length: TOTAL_FRAMES }, (_, f) => {
  const t = f / FPS;
  const active = allUttWords.find((w) => t >= w.s && t <= w.e);
  if (!active) {
    return { speaker: 'none', open: 0, v: 'closed' };
  }
  const dur = Math.max(0.08, active.e - active.s);
  const u = (t - active.s) / dur;
  const sylCount = Math.max(1, active.syl || 2);
  const pulse = Math.abs(Math.sin(u * Math.PI * sylCount));
  const edge = Math.sin(Math.min(1, u) * Math.PI);
  const open = Number(Math.min(1, 0.25 + 0.75 * pulse * (0.45 + 0.55 * edge)).toFixed(3));
  return { speaker: active.speaker, open, v: active.v || 'ah' };
});

export function buildEp2Sfx(beatsArr, totalDur) {
  const b = beatsArr;
  return [
    { t: 0.05, type: 'pop', gain: 0.7 },
    { t: 0.16, type: 'step', gain: 0.5 },
    { t: 0.34, type: 'step', gain: 0.5 },
    // Bus arrival & horn + brake
    { t: Number((b[1].start - 0.1).toFixed(2)), type: 'whoosh', d: 0.4, gain: 0.7, pan: -0.3 },
    { t: Number((b[1].start + 0.3).toFixed(2)), type: 'bus_horn', gain: 0.75, pan: -0.2 },
    { t: Number((b[1].start + 1.05).toFixed(2)), type: 'thud', gain: 0.7 },
    // Warga exit + Penduduk 0 -> 100
    { t: Number((b[2].start + 0.05).toFixed(2)), type: 'whoosh', d: 0.3, gain: 0.6 },
    { t: Number((b[2].start + 0.6).toFixed(2)), type: 'ticks', d: 3.4, step: 0.16, gain: 0.65 },
    { t: Number((b[2].start + 4.1).toFixed(2)), type: 'bell', f: 1174, gain: 0.65 },
    { t: Number((b[2].start + 4.2).toFixed(2)), type: 'sparkle', gain: 0.7 },
    // Phone IG + FB swipe
    { t: Number((b[3].start + 0.05).toFixed(2)), type: 'pop', gain: 0.7 },
    { t: Number(((b[3].start + b[3].end) / 2).toFixed(2)), type: 'whoosh', d: 0.3, gain: 0.7, pan: 0.25 },
    // 4 Dialogs pops & reactions
    { t: Number(b[4].start.toFixed(2)), type: 'pop', gain: 0.6 },
    { t: Number((b[4].utterances[1]?.start || b[4].start + 2.1).toFixed(2)), type: 'boing', gain: 0.55 },
    { t: Number(b[5].start.toFixed(2)), type: 'pop', gain: 0.6 },
    { t: Number((b[5].end - 0.25).toFixed(2)), type: 'tick', gain: 0.7 },
    { t: Number(b[6].start.toFixed(2)), type: 'pop', gain: 0.6 },
    { t: Number((b[6].utterances[1]?.start || b[6].start + 2.1).toFixed(2)), type: 'bell', f: 1318, gain: 0.5 },
    { t: Number(b[7].start.toFixed(2)), type: 'pop', gain: 0.6 },
    { t: Number((b[7].utterances[1]?.start || b[7].start + 3.8).toFixed(2)), type: 'impact', gain: 0.6 },
    // Timelapse construction hammers + saws + completion sparkle
    { t: Number((b[8].start + 0.1).toFixed(2)), type: 'whoosh', d: 0.35, gain: 0.7 },
    { t: Number((b[8].start + 0.35).toFixed(2)), type: 'build_fast', d: 5.4, gain: 0.75 },
    { t: Number((b[8].end - 0.6).toFixed(2)), type: 'sparkle', gain: 0.85 },
    { t: Number((b[8].end - 0.55).toFixed(2)), type: 'bell', f: 1046, gain: 0.6 },
    // Closing cat meow + end card
    { t: Number((b[9].start + 0.35).toFixed(2)), type: 'meow', gain: 0.75, pan: 0.45 },
    { t: Number((totalDur - 2.2).toFixed(2)), type: 'impact', gain: 0.65 },
    { t: Number((totalDur - 2.15).toFixed(2)), type: 'sparkle', gain: 0.8 },
  ];
}

const bounds = beats.slice(0, -1).map((b) => b.end);

const cues = {
  series: 'Kampung Amanah',
  episode: 2,
  title: 'Kampungnya Udah Rame',
  dur: DUR,
  fps: FPS,
  totalFrames: TOTAL_FRAMES,
  ttsActive: false,
  bounds,
  beats,
  mouthFrames,
  sfx: buildEp2Sfx(beats, DUR),
  music: {
    bpm: 116,
    bars: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'],
    final: Number((DUR - 1.2).toFixed(2)),
  },
};

const outPath = path.resolve('src/video/cues_ep2.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(cues, null, 2));
console.log(`Generated ${outPath} (${TOTAL_FRAMES} frames, ${DUR}s, ${allUttWords.length} words)`);
