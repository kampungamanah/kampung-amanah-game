import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum tersedia di environment server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseWavPcm16(buf: Buffer): { sampleRate: number; samples: Float32Array } {
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
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let sum = 0;
    for (let c = 0; c < numChannels; c++) {
      const pos = dataOffset + (i * numChannels + c) * bytesPerSample;
      if (pos + 2 <= buf.length) {
        sum += buf.readInt16LE(pos) / 32768;
      }
    }
    samples[i] = sum / numChannels;
  }
  return { sampleRate, samples };
}

async function fetchGeminiTtsWav(
  ai: GoogleGenAI,
  text: string,
  voiceName: string,
  speaker: string,
  style: string
): Promise<Buffer> {
  let response: any = null;
  let lastErr: any = null;
  const modelsToTry = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];

  for (let attempt = 0; attempt < 4; attempt++) {
    const model = modelsToTry[Math.min(attempt, modelsToTry.length - 1)];
    try {
      response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: model === 'gemini-3.8-flash-tts' ? { speaker, style } : { style },
              } as any,
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
      break;
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || '');
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        if (attempt === 0) {
          // Immediately try gemini-3.8-flash-lite-tts on next iteration
          continue;
        }
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 15000));
          continue;
        }
      }
      throw err;
    }
  }

  const base64Audio = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error(
      `Gemini TTS gagal menghasilkan audio untuk: ${text}${lastErr ? ` (${lastErr.message || lastErr})` : ''}`
    );
  }
  return Buffer.from(base64Audio, 'base64');
}

export async function generateIndonesianVoiceOver(episode: 1 | 2 | 3 = 1, force = false) {
  if (episode === 3) {
    return generateEpisode3VoiceOver(force);
  }
  if (episode === 2) {
    return generateEpisode2VoiceOver(force);
  }

  const ai = getAiClient();
  const cuesPath = path.resolve('src/video/cues.json');
  const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
  const ttsDir = path.resolve('public/tts');
  fs.mkdirSync(ttsDir, { recursive: true });

  const rawClips: { beat: any; samples: Float32Array; sampleRate: number; durSec: number }[] = [];

  for (const beat of cues.beats) {
    const wavPath = path.join(ttsDir, `beat_${beat.id}.wav`);
    let wavBuf: Buffer;

    if (!force && fs.existsSync(wavPath) && fs.statSync(wavPath).size > 1000) {
      wavBuf = fs.readFileSync(wavPath);
    } else {
      wavBuf = await fetchGeminiTtsWav(
        ai,
        beat.text,
        'Charon',
        'Pak Kades',
        'Pria Indonesia paruh baya umur 45 tahun, suara hangat, santai, ramah, ngobrol akrab seperti konten kreator kepala desa di TikTok/Reels, tidak kaku atau formal, pengucapan Bahasa Indonesia natural.'
      );
      fs.writeFileSync(wavPath, wavBuf);
    }

    const parsed = parseWavPcm16(wavBuf);
    rawClips.push({
      beat,
      samples: parsed.samples,
      sampleRate: parsed.sampleRate,
      durSec: parsed.samples.length / parsed.sampleRate,
    });
  }

  const fps = cues.fps || 30;
  let cursor = 0.65;
  const newBounds: number[] = [];
  const beatClips: { id: number; startSec: number; durationSec: number; samples: Float32Array; sampleRate: number }[] = [];

  for (let i = 0; i < rawClips.length; i++) {
    const { beat, samples, sampleRate, durSec } = rawClips[i];
    const beatStart = i === 0 ? 0.0 : Number((cursor - 0.12).toFixed(3));
    const speechStart = Number(cursor.toFixed(3));
    const speechEnd = Number((speechStart + durSec).toFixed(3));
    const tailPad = i === rawClips.length - 1 ? 1.35 : 0.35;
    const beatEnd = Number((speechEnd + tailPad).toFixed(3));

    beat.start = beatStart;
    beat.end = beatEnd;

    const allBeatWords = beat.clauses.flatMap((c: any) => c.words);
    if (allBeatWords.length > 0) {
      const origStart = allBeatWords[0].s;
      const origEnd = allBeatWords[allBeatWords.length - 1].e;
      const origSpan = Math.max(0.2, origEnd - origStart);
      const ratio = durSec / origSpan;

      for (const clause of beat.clauses) {
        for (const word of clause.words) {
          word.s = Number((speechStart + (word.s - origStart) * ratio).toFixed(3));
          word.e = Number((speechStart + (word.e - origStart) * ratio).toFixed(3));
        }
        clause.start = Number(Math.max(beatStart, clause.words[0].s - 0.04).toFixed(3));
        clause.end = Number((clause.words[clause.words.length - 1].e + 0.14).toFixed(3));
      }
    }

    beatClips.push({ id: beat.id, startSec: speechStart, durationSec: durSec, samples, sampleRate });

    if (i < rawClips.length - 1) {
      newBounds.push(beatEnd);
      cursor = beatEnd + 0.12;
    } else {
      cursor = beatEnd;
    }
  }

  const totalDur = Number(Math.ceil(cursor * 10) / 10);
  const totalFrames = Math.round(totalDur * fps);
  cues.dur = totalDur;
  cues.totalFrames = totalFrames;
  cues.bounds = newBounds;
  cues.music.final = Number((totalDur - 1.1).toFixed(2));

  const b = cues.beats;
  cues.sfx = [
    { t: 0.05, type: 'pop', gain: 0.7 },
    { t: 0.14, type: 'step', gain: 0.55 },
    { t: 0.3, type: 'step', gain: 0.55 },
    { t: 0.46, type: 'step', gain: 0.55 },
    { t: 0.62, type: 'thud', gain: 0.5 },
    { t: b[0].clauses[1]?.words[1]?.s || b[0].end - 1.2, type: 'pop', gain: 0.6 },
    { t: Number((b[0].end - 0.35).toFixed(2)), type: 'boing', gain: 0.65 },
    { t: Number((b[1].start - 0.1).toFixed(2)), type: 'whoosh', d: 0.35, gain: 0.6, pan: -0.2 },
    { t: Number((b[1].start + 0.1).toFixed(2)), type: 'flutter', d: 1.4, gain: 0.38, pan: -0.5 },
    { t: b[1].clauses[1]?.words[0]?.s || b[1].start + 2.2, type: 'meow', gain: 0.75, pan: 0.45 },
    { t: Number((b[2].start - 0.1).toFixed(2)), type: 'whoosh', d: 0.35, gain: 0.6, pan: 0.15 },
    { t: b[2].clauses[1]?.words[2]?.s || b[2].start + 2.4, type: 'pop', gain: 0.65 },
    { t: Number((b[3].start - 0.1).toFixed(2)), type: 'whoosh', d: 0.3, gain: 0.55 },
    { t: b[3].clauses[0]?.words[1]?.s || b[3].start + 0.4, type: 'pop', gain: 0.65 },
    { t: b[3].clauses[1]?.words[1]?.s || b[3].start + 2.2, type: 'pop', gain: 0.7 },
    { t: b[3].clauses[2]?.words[0]?.s || b[3].start + 4.5, type: 'bell', f: 1174, gain: 0.45 },
    { t: b[3].clauses[2]?.words[3]?.s || b[3].end - 0.6, type: 'sparkle', gain: 0.65 },
    { t: Number((b[4].start - 0.1).toFixed(2)), type: 'whoosh', d: 0.32, gain: 0.6, pan: 0.25 },
    { t: b[4].clauses[0]?.words[2]?.s || b[4].start + 0.9, type: 'tick', gain: 0.7 },
    { t: b[4].clauses[1]?.words[7]?.s || b[4].end - 0.9, type: 'meow', gain: 0.7, pan: 0.45 },
    { t: Number((b[5].start - 0.1).toFixed(2)), type: 'whoosh', d: 0.32, gain: 0.6 },
    { t: Number((totalDur - 2.3).toFixed(2)), type: 'impact', gain: 0.65 },
    { t: Number((totalDur - 2.25).toFixed(2)), type: 'sparkle', gain: 0.75 },
  ];

  const allWords = cues.beats.flatMap((bt: any) => bt.clauses.flatMap((c: any) => c.words));
  cues.mouthFrames = Array.from({ length: totalFrames }, (_, f) => {
    const t = f / fps;
    let rms = 0;
    for (const clip of beatClips) {
      const localT = t - clip.startSec;
      if (localT >= 0 && localT < clip.durationSec) {
        const s0 = Math.max(0, Math.floor((localT - 0.015) * clip.sampleRate));
        const s1 = Math.min(clip.samples.length, Math.floor((localT + 0.025) * clip.sampleRate));
        let sumSq = 0;
        for (let i = s0; i < s1; i++) sumSq += clip.samples[i] * clip.samples[i];
        rms = Math.sqrt(sumSq / Math.max(1, s1 - s0));
        break;
      }
    }
    const activeWord = allWords.find((w: any) => t >= w.s && t <= w.e);
    const normalizedOpen = rms > 0.018 ? Math.min(1, rms * 5.6) : 0;
    return {
      open: Number(normalizedOpen.toFixed(3)),
      v: normalizedOpen > 0.08 ? activeWord?.v || 'ah' : 'closed',
    };
  });

  cues.ttsActive = true;
  fs.writeFileSync(cuesPath, JSON.stringify(cues, null, 2));
  execSync('node scripts/make_audio.mjs', { stdio: 'inherit' });
  return cues;
}

export async function generateEpisode2VoiceOver(force = false) {
  const ai = getAiClient();
  const cuesPath = path.resolve('src/video/cues_ep2.json');
  const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
  const ttsDir = path.resolve('public/tts_ep2');
  const rawDir = path.resolve('public/tts_ep2_raw');
  fs.mkdirSync(ttsDir, { recursive: true });
  fs.mkdirSync(rawDir, { recursive: true });

  const uttClips: {
    id: string;
    speaker: string;
    startSec: number;
    durationSec: number;
    samples: Float32Array;
    sampleRate: number;
  }[] = [];

  // 1. Fetch or load WAV for all utterances across all 10 beats using TWO distinct Indonesian voices:
  //    Pak Kades = Charon (warm middle-aged friendly village head)
  //    Warga     = Puck   (younger, lively Indonesian male voice)
  const rawUtterances = new Map<string, { samples: Float32Array; sampleRate: number; durSec: number }>();

  for (const beat of cues.beats) {
    for (const utt of beat.utterances) {
      const rawPath = path.join(rawDir, `${utt.id}.wav`);
      const wavPath = path.join(ttsDir, `${utt.id}.wav`);

      // Migrate pre-existing cached WAV into rawDir once if needed
      if (!fs.existsSync(rawPath) && fs.existsSync(wavPath) && fs.statSync(wavPath).size > 1000) {
        fs.copyFileSync(wavPath, rawPath);
      }

      if (force || !fs.existsSync(rawPath) || fs.statSync(rawPath).size <= 1000) {
        const isKades = utt.speaker === 'kades';
        const voice = isKades ? 'Charon' : 'Puck';
        const speakerLabel = isKades ? 'Pak Kades' : 'Warga Desa';
        const style = isKades
          ? 'Pria Indonesia paruh baya umur 45 tahun, suara hangat, santai, ramah, ngobrol akrab seperti konten kreator kepala desa, tidak kaku, pengucapan Bahasa Indonesia natural.'
          : 'Pemuda Indonesia umur 22 tahun, suara cerah, antusias, santai, ngobrol langsung ke Pak Kades dalam Bahasa Indonesia sehari-hari.';

        const fetched = await fetchGeminiTtsWav(ai, utt.text, voice, speakerLabel, style);
        fs.writeFileSync(rawPath, fetched);
      }

      // Trim leading/trailing silence + apply crisp 1.12x Shorts pacing (pitch-preserving)
      const needsPace =
        force ||
        !fs.existsSync(wavPath) ||
        fs.statSync(wavPath).mtimeMs < fs.statSync(rawPath).mtimeMs;
      if (needsPace) {
        execSync(
          `ffmpeg -y -loglevel error -i "${rawPath}" -af "silenceremove=start_periods=1:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_threshold=-40dB,areverse,atempo=1.12" "${wavPath}"`
        );
      }

      const wavBuf = fs.readFileSync(wavPath);
      const parsed = parseWavPcm16(wavBuf);
      rawUtterances.set(utt.id, {
        samples: parsed.samples,
        sampleRate: parsed.sampleRate,
        durSec: parsed.samples.length / parsed.sampleRate,
      });
    }
  }

  // 2. Schedule all 10 beats cleanly without speech overlap (target ~57-60s)
  const fps = cues.fps || 30;
  let cursor = 0.42; // brisk walk-in room at start of Beat 1
  const newBounds: number[] = [];

  for (let i = 0; i < cues.beats.length; i++) {
    const beat = cues.beats[i];
    const beatStart = i === 0 ? 0.0 : Number(cursor.toFixed(3));
    let localCursor = beatStart + (beat.id === 2 ? 0.42 : beat.id === 3 ? 0.28 : beat.id === 9 ? 0.3 : 0.16);

    for (let j = 0; j < beat.utterances.length; j++) {
      const utt = beat.utterances[j];
      const clip = rawUtterances.get(utt.id)!;
      const speechStart = Number(localCursor.toFixed(3));
      const speechEnd = Number((speechStart + clip.durSec).toFixed(3));

      utt.start = speechStart;
      utt.end = speechEnd;

      // Distribute word timestamps proportionally inside the actual WAV duration
      const words = utt.clauses.flatMap((c: any) => c.words);
      const totalSyl = words.reduce((acc: number, w: any) => acc + Math.max(1, w.syl || 2), 0);
      let wCur = speechStart;
      for (const clause of utt.clauses) {
        const cStart = wCur;
        for (const word of clause.words) {
          const wDur = (Math.max(1, word.syl || 2) / totalSyl) * clip.durSec;
          word.s = Number(wCur.toFixed(3));
          word.e = Number((wCur + wDur).toFixed(3));
          wCur += wDur;
        }
        clause.start = Number(Math.max(beatStart, cStart - 0.03).toFixed(3));
        clause.end = Number((wCur + 0.08).toFixed(3));
      }

      uttClips.push({
        id: utt.id,
        speaker: utt.speaker,
        startSec: speechStart,
        durationSec: clip.durSec,
        samples: clip.samples,
        sampleRate: clip.sampleRate,
      });

      localCursor = speechEnd + (j < beat.utterances.length - 1 ? 0.14 : 0.0);
    }

    // Flatten clauses onto beat for subtitle rendering
    beat.clauses = beat.utterances.flatMap((u: any) =>
      u.clauses.map((c: any) => ({
        speaker: u.speaker,
        start: c.start,
        end: c.end,
        words: c.words,
      }))
    );

    const minBeatLen = beat.id === 3 ? 5.2 : beat.id === 4 ? 5.4 : beat.id === 9 ? 5.8 : 0;
    const endPad = beat.id === 10 ? 0.95 : 0.16;
    const beatEnd = Number(Math.max(beatStart + minBeatLen, localCursor + endPad).toFixed(3));

    beat.start = beatStart;
    beat.end = beatEnd;

    if (i < cues.beats.length - 1) {
      newBounds.push(beatEnd);
      cursor = beatEnd;
    } else {
      cursor = beatEnd;
    }
  }

  const totalDur = Number(Math.ceil(cursor * 10) / 10);
  const totalFrames = Math.round(totalDur * fps);
  cues.dur = totalDur;
  cues.totalFrames = totalFrames;
  cues.bounds = newBounds;
  cues.music.final = Number((totalDur - 1.1).toFixed(2));

  // 3. Recompute SFX aligned to real beat timestamps
  const b = cues.beats;
  cues.sfx = [
    { t: 0.05, type: 'pop', gain: 0.7 },
    { t: 0.16, type: 'step', gain: 0.5 },
    { t: 0.34, type: 'step', gain: 0.5 },
    { t: Number((b[1].start - 0.1).toFixed(2)), type: 'whoosh', d: 0.4, gain: 0.7, pan: -0.3 },
    { t: Number((b[1].start + 0.3).toFixed(2)), type: 'bus_horn', gain: 0.75, pan: -0.2 },
    { t: Number((b[1].start + 1.05).toFixed(2)), type: 'thud', gain: 0.7 },
    { t: Number((b[2].start + 0.05).toFixed(2)), type: 'whoosh', d: 0.3, gain: 0.6 },
    { t: Number((b[2].start + 0.5).toFixed(2)), type: 'ticks', d: 3.5, step: 0.16, gain: 0.65 },
    { t: Number((b[2].start + 4.1).toFixed(2)), type: 'bell', f: 1174, gain: 0.65 },
    { t: Number((b[2].start + 4.2).toFixed(2)), type: 'sparkle', gain: 0.7 },
    { t: Number((b[3].start + 0.05).toFixed(2)), type: 'pop', gain: 0.7 },
    { t: Number(((b[3].start + b[3].end) / 2).toFixed(2)), type: 'whoosh', d: 0.3, gain: 0.7, pan: 0.25 },
    { t: Number(b[4].start.toFixed(2)), type: 'pop', gain: 0.6 },
    { t: Number((b[4].utterances[1]?.start || b[4].start + 2.0).toFixed(2)), type: 'boing', gain: 0.55 },
    { t: Number(b[5].start.toFixed(2)), type: 'pop', gain: 0.6 },
    { t: Number((b[5].end - 0.2).toFixed(2)), type: 'tick', gain: 0.7 },
    { t: Number(b[6].start.toFixed(2)), type: 'pop', gain: 0.6 },
    { t: Number((b[6].utterances[1]?.start || b[6].start + 2.0).toFixed(2)), type: 'bell', f: 1318, gain: 0.5 },
    { t: Number(b[7].start.toFixed(2)), type: 'pop', gain: 0.6 },
    { t: Number((b[7].utterances[1]?.start || b[7].start + 3.5).toFixed(2)), type: 'impact', gain: 0.6 },
    { t: Number((b[8].start + 0.1).toFixed(2)), type: 'whoosh', d: 0.35, gain: 0.7 },
    {
      t: Number((b[8].start + 0.35).toFixed(2)),
      type: 'build_fast',
      d: Number(Math.max(2.0, b[8].end - b[8].start - 0.95).toFixed(2)),
      gain: 0.75,
    },
    { t: Number((b[8].end - 0.6).toFixed(2)), type: 'sparkle', gain: 0.85 },
    { t: Number((b[8].end - 0.55).toFixed(2)), type: 'bell', f: 1046, gain: 0.6 },
    { t: Number((b[9].start + 0.35).toFixed(2)), type: 'meow', gain: 0.75, pan: 0.45 },
    { t: Number((totalDur - 2.2).toFixed(2)), type: 'impact', gain: 0.65 },
    { t: Number((totalDur - 2.15).toFixed(2)), type: 'sparkle', gain: 0.8 },
  ];

  // 4. Real acoustic 30fps RMS lip-sync mapped strictly to the active speaker (Pak Kades OR specific Warga!)
  const allWords = cues.beats.flatMap((bt: any) =>
    bt.utterances.flatMap((u: any) =>
      u.clauses.flatMap((c: any) => c.words.map((w: any) => ({ ...w, speaker: u.speaker })))
    )
  );

  cues.mouthFrames = Array.from({ length: totalFrames }, (_, f) => {
    const t = f / fps;
    let rms = 0;
    let activeSpeaker = 'none';
    for (const clip of uttClips) {
      const localT = t - clip.startSec;
      if (localT >= 0 && localT < clip.durationSec) {
        const s0 = Math.max(0, Math.floor((localT - 0.015) * clip.sampleRate));
        const s1 = Math.min(clip.samples.length, Math.floor((localT + 0.025) * clip.sampleRate));
        let sumSq = 0;
        for (let i = s0; i < s1; i++) sumSq += clip.samples[i] * clip.samples[i];
        rms = Math.sqrt(sumSq / Math.max(1, s1 - s0));
        activeSpeaker = clip.speaker;
        break;
      }
    }
    const activeWord = allWords.find((w: any) => t >= w.s && t <= w.e);
    const normalizedOpen = rms > 0.016 ? Math.min(1, rms * 5.8) : 0;
    return {
      speaker: normalizedOpen > 0.08 ? activeSpeaker : 'none',
      open: Number(normalizedOpen.toFixed(3)),
      v: normalizedOpen > 0.08 ? activeWord?.v || 'ah' : 'closed',
    };
  });

  cues.ttsActive = true;
  fs.writeFileSync(cuesPath, JSON.stringify(cues, null, 2));
  execSync('node scripts/make_audio_ep2.mjs', { stdio: 'inherit' });
  return cues;
}

export async function generateEpisode3VoiceOver(force = false) {
  const ai = getAiClient();
  const cuesPath = path.resolve('src/video/cues_ep3.json');
  const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
  const ttsDir = path.resolve('public/tts_ep3');
  const rawDir = path.resolve('public/tts_ep3_raw');
  fs.mkdirSync(ttsDir, { recursive: true });
  fs.mkdirSync(rawDir, { recursive: true });

  const uttClips: {
    id: string;
    speaker: string;
    startSec: number;
    durationSec: number;
    samples: Float32Array;
    sampleRate: number;
  }[] = [];

  const speakerVoiceConfig: Record<string, { voice: string; label: string; style: string }> = {
    kades: {
      voice: 'Charon',
      label: 'Pak Kades',
      style:
        'Pria Indonesia paruh baya umur 45 tahun, suara hangat, santai, ramah, ngobrol akrab seperti konten kreator kepala desa, tidak kaku, pengucapan Bahasa Indonesia natural.',
    },
    virgod: {
      voice: 'Puck',
      label: 'Warga Pria',
      style:
        'Pemuda Indonesia umur 22 tahun, suara cerah, antusias, santai, ngobrol langsung ke Pak Kades dalam Bahasa Indonesia sehari-hari.',
    },
    isqi: {
      voice: 'Kore',
      label: 'Guru Perempuan',
      style:
        'Wanita muda Indonesia umur 24 tahun, suara ramah, ceria, jelas, sopan santai saat melamar jadi guru di desa.',
    },
    lida: {
      voice: 'Aoede',
      label: 'Flora Guru Ngaji',
      style:
        'Wanita muda Indonesia umur 23 tahun bernama Flora, suara lembut, hangat, ramah dan antusias saat berbicara ke Pak Kades.',
    },
    rehan: {
      voice: 'Fenrir',
      label: 'Kepala Kuli',
      style:
        'Pria Indonesia umur 27 tahun, suara tegas, semangat, akrab dan siap kerja saat mengajukan diri jadi kepala kuli bangunan.',
    },
  };

  const rawUtterances = new Map<string, { samples: Float32Array; sampleRate: number; durSec: number }>();

  for (const beat of cues.beats) {
    for (const utt of beat.utterances) {
      const rawPath = path.join(rawDir, `${utt.id}.wav`);
      const wavPath = path.join(ttsDir, `${utt.id}.wav`);

      if (force || !fs.existsSync(rawPath) || fs.statSync(rawPath).size <= 1000) {
        const cfg = speakerVoiceConfig[utt.speaker] || speakerVoiceConfig.virgod;
        const fetched = await fetchGeminiTtsWav(ai, utt.text, cfg.voice, cfg.label, cfg.style);
        fs.writeFileSync(rawPath, fetched);
      }

      const needsPace =
        force ||
        !fs.existsSync(wavPath) ||
        fs.statSync(wavPath).mtimeMs < fs.statSync(rawPath).mtimeMs;
      if (needsPace) {
        execSync(
          `ffmpeg -y -loglevel error -i "${rawPath}" -af "silenceremove=start_periods=1:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_threshold=-40dB,areverse,atempo=1.10" "${wavPath}"`
        );
      }

      const wavBuf = fs.readFileSync(wavPath);
      const parsed = parseWavPcm16(wavBuf);
      rawUtterances.set(utt.id, {
        samples: parsed.samples,
        sampleRate: parsed.sampleRate,
        durSec: parsed.samples.length / parsed.sampleRate,
      });
    }
  }

  // Schedule all 10 beats naturally without rushing (duration can exceed 60s!)
  const fps = cues.fps || 30;
  let cursor = 0.42;
  const newBounds: number[] = [];

  for (let i = 0; i < cues.beats.length; i++) {
    const beat = cues.beats[i];
    const beatStart = i === 0 ? 0.0 : Number(cursor.toFixed(3));
    let localCursor = beatStart + (beat.id === 1 ? 0.45 : beat.id === 10 ? 0.28 : 0.2);

    for (let j = 0; j < beat.utterances.length; j++) {
      const utt = beat.utterances[j];
      const clip = rawUtterances.get(utt.id)!;
      const speechStart = Number(localCursor.toFixed(3));
      const speechEnd = Number((speechStart + clip.durSec).toFixed(3));

      utt.start = speechStart;
      utt.end = speechEnd;

      const words = utt.clauses.flatMap((c: any) => c.words);
      const totalSyl = words.reduce((acc: number, w: any) => acc + Math.max(1, w.syl || 2), 0);
      let wCur = speechStart;
      for (const clause of utt.clauses) {
        const cStart = wCur;
        for (const word of clause.words) {
          const wDur = (Math.max(1, word.syl || 2) / totalSyl) * clip.durSec;
          word.s = Number(wCur.toFixed(3));
          word.e = Number((wCur + wDur).toFixed(3));
          wCur += wDur;
        }
        clause.start = Number(Math.max(beatStart, cStart - 0.03).toFixed(3));
        clause.end = Number((wCur + 0.08).toFixed(3));
      }

      uttClips.push({
        id: utt.id,
        speaker: utt.speaker,
        startSec: speechStart,
        durationSec: clip.durSec,
        samples: clip.samples,
        sampleRate: clip.sampleRate,
      });

      localCursor = speechEnd + (j < beat.utterances.length - 1 ? 0.16 : 0.0);
    }

    beat.clauses = beat.utterances.flatMap((u: any) =>
      u.clauses.map((c: any) => ({
        speaker: u.speaker,
        start: c.start,
        end: c.end,
        words: c.words,
      }))
    );

    const minBeatLen =
      beat.id === 1 ? 8.2 :
      beat.id === 3 ? 6.2 :
      beat.id === 4 ? 5.2 :
      beat.id === 5 ? 6.6 :
      beat.id === 9 ? 7.2 :
      beat.id === 10 ? 7.4 : 0;
    const endPad =
      beat.id === 6 || beat.id === 7
        ? 1.55 // room to visually walk into Sekolah & Masjid!
        : beat.id === 10
        ? 1.35
        : 0.26;
    const beatEnd = Number(Math.max(beatStart + minBeatLen, localCursor + endPad).toFixed(3));

    beat.start = beatStart;
    beat.end = beatEnd;

    if (i < cues.beats.length - 1) {
      newBounds.push(beatEnd);
      cursor = beatEnd;
    } else {
      cursor = beatEnd;
    }
  }

  const totalDur = Number(Math.ceil(cursor * 10) / 10);
  const totalFrames = Math.round(totalDur * fps);
  cues.dur = totalDur;
  cues.totalFrames = totalFrames;
  cues.bounds = newBounds;
  cues.music.final = Number((totalDur - 1.1).toFixed(2));

  // Recompute SFX aligned to real 10-beat timestamps
  const b = cues.beats;
  cues.sfx = [
    { t: 0.05, type: 'whoosh', d: 0.45, gain: 0.65 },
    { t: 1.0, type: 'ticks', d: 1.8, step: 0.14, gain: 0.6 },
    { t: 2.9, type: 'bell', f: 1174, gain: 0.6 },
    { t: Number((b[0].start + (b[0].end - b[0].start) * 0.48).toFixed(2)), type: 'pop', gain: 0.7 },
    { t: Number(b[1].start.toFixed(2)), type: 'pop', gain: 0.65 },
    { t: Number((b[2].start + 0.05).toFixed(2)), type: 'whoosh', d: 0.35, gain: 0.7 },
    { t: Number((b[2].start + (b[2].end - b[2].start) * 0.42).toFixed(2)), type: 'kick', gain: 0.85 },
    { t: Number((b[2].start + (b[2].end - b[2].start) * 0.68).toFixed(2)), type: 'boing', gain: 0.8 },
    { t: Number((b[2].start + (b[2].end - b[2].start) * 0.71).toFixed(2)), type: 'thud', gain: 0.75 },
    { t: Number((b[3].start + 0.05).toFixed(2)), type: 'whoosh', d: 0.35, gain: 0.7 },
    { t: Number((b[4].start + 0.05).toFixed(2)), type: 'whoosh', d: 0.32, gain: 0.7 },
    {
      t: Number((b[4].start + 0.22).toFixed(2)),
      type: 'build_fast',
      d: Number(Math.max(2.0, b[4].end - b[4].start - 0.85).toFixed(2)),
      gain: 0.8,
    },
    { t: Number((b[4].end - 0.52).toFixed(2)), type: 'whistle', gain: 0.75 },
    { t: Number((b[4].end - 0.45).toFixed(2)), type: 'sparkle', gain: 0.8 },
    { t: Number(b[5].start.toFixed(2)), type: 'pop', gain: 0.65 },
    { t: Number((b[5].end - 1.45).toFixed(2)), type: 'whoosh', d: 0.28, gain: 0.65 },
    { t: Number(b[6].start.toFixed(2)), type: 'pop', gain: 0.65 },
    { t: Number((b[6].end - 1.45).toFixed(2)), type: 'whoosh', d: 0.28, gain: 0.65 },
    { t: Number(b[7].start.toFixed(2)), type: 'pop', gain: 0.65 },
    { t: Number((b[8].start + 0.05).toFixed(2)), type: 'whoosh', d: 0.35, gain: 0.75 },
    {
      t: Number((b[8].start + 0.2).toFixed(2)),
      type: 'build_fast',
      d: Number(Math.max(2.2, b[8].end - b[8].start - 0.9).toFixed(2)),
      gain: 0.85,
    },
    { t: Number((b[8].end - 0.52).toFixed(2)), type: 'bell', f: 1046, gain: 0.65 },
    { t: Number((b[8].end - 0.45).toFixed(2)), type: 'sparkle', gain: 0.85 },
    { t: Number((b[9].start + 0.1).toFixed(2)), type: 'whoosh', d: 0.45, gain: 0.7 },
    { t: Number((b[9].start + (b[9].end - b[9].start) * 0.42).toFixed(2)), type: 'meow', gain: 0.78, pan: 0.45 },
    { t: Number((b[9].start + (b[9].end - b[9].start) * 0.46).toFixed(2)), type: 'impact', gain: 0.65 },
    { t: Number((b[9].start + (b[9].end - b[9].start) * 0.48).toFixed(2)), type: 'sparkle', gain: 0.8 },
  ];

  // Real acoustic 30fps RMS lip-sync mapped strictly to the active speaker
  const allWords = cues.beats.flatMap((bt: any) =>
    bt.utterances.flatMap((u: any) =>
      u.clauses.flatMap((c: any) => c.words.map((w: any) => ({ ...w, speaker: u.speaker })))
    )
  );

  cues.mouthFrames = Array.from({ length: totalFrames }, (_, f) => {
    const t = f / fps;
    let rms = 0;
    let activeSpeaker = 'none';
    for (const clip of uttClips) {
      const localT = t - clip.startSec;
      if (localT >= 0 && localT < clip.durationSec) {
        const s0 = Math.max(0, Math.floor((localT - 0.015) * clip.sampleRate));
        const s1 = Math.min(clip.samples.length, Math.floor((localT + 0.025) * clip.sampleRate));
        let sumSq = 0;
        for (let i = s0; i < s1; i++) sumSq += clip.samples[i] * clip.samples[i];
        rms = Math.sqrt(sumSq / Math.max(1, s1 - s0));
        activeSpeaker = clip.speaker;
        break;
      }
    }
    const activeWord = allWords.find((w: any) => t >= w.s && t <= w.e);
    const normalizedOpen = rms > 0.016 ? Math.min(1, rms * 5.8) : 0;
    return {
      speaker: normalizedOpen > 0.08 ? activeSpeaker : 'none',
      open: Number(normalizedOpen.toFixed(3)),
      v: normalizedOpen > 0.08 ? activeWord?.v || 'ah' : 'closed',
    };
  });

  cues.ttsActive = true;
  fs.writeFileSync(cuesPath, JSON.stringify(cues, null, 2));
  execSync('node scripts/make_audio_ep3.mjs', { stdio: 'inherit' });
  return cues;
}

export function renderMp4OnServer(episode: 1 | 2 | 3 = 1) {
  if (episode === 3) {
    execSync('node scripts/render_video_ep3.mjs', { stdio: 'inherit' });
    const mp4Path = path.resolve('public/kampung-amanah-ep3.mp4');
    const stats = fs.statSync(mp4Path);
    return { sizeBytes: stats.size, url: '/kampung-amanah-ep3.mp4' };
  }
  if (episode === 2) {
    execSync('node scripts/render_video_ep2.mjs', { stdio: 'inherit' });
    const mp4Path = path.resolve('public/kampung-amanah-ep2.mp4');
    const stats = fs.statSync(mp4Path);
    return { sizeBytes: stats.size, url: '/kampung-amanah-ep2.mp4' };
  }
  execSync('node scripts/render_video.mjs', { stdio: 'inherit' });
  const mp4Path = path.resolve('public/kampung-amanah-ep1.mp4');
  const stats = fs.statSync(mp4Path);
  return { sizeBytes: stats.size, url: '/kampung-amanah-ep1.mp4' };
}
