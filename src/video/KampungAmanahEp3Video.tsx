import React from 'react';
import defaultEp3Cues from './cues_ep3.json';
import { FPS, H, W, clamp, easeInOutCubic, easeOutCubic, fr, lerp, shake, spring, squash } from './motion';
import { FlagpoleMerahPutih } from './characters/VillageProps';
import { KucingOranye } from './characters/KucingOranye';
import { PakKades, PakKadesPose } from './characters/PakKades';
import { WargaCharacter } from './characters/WargaCast';
import { EP3_CROWD_WARGA, EP3_MAIN_WARGA, Ep3MainVillager } from './characters/Ep3Cast';
import {
  Ep3CommentPhoneOverlay,
  Ep3ExistingBuildings,
  Ep3ExtendedBackdrop,
  Ep3ExtendedGround,
  Ep3HousesNeighborhood,
  FootballField2D,
  MuddyBushesPlot,
  PendudukSignBoardEp3,
} from './characters/Ep3Props';

export interface Ep3WordCue {
  w: string;
  s: number;
  e: number;
  kw: boolean;
  syl: number;
  v: string;
}

export interface Ep3ClauseCue {
  speaker?: string;
  start: number;
  end: number;
  words: Ep3WordCue[];
}

export interface Ep3UtteranceCue {
  id: string;
  speaker: string;
  voice: string;
  start: number;
  end: number;
  text: string;
  clauses: { start?: number; end?: number; words: Ep3WordCue[] }[];
}

export interface Ep3BeatCue {
  id: number;
  start: number;
  end: number;
  scene: string;
  text: string;
  utterances: Ep3UtteranceCue[];
  clauses: Ep3ClauseCue[];
}

export interface Ep3VideoCues {
  series: string;
  episode: number;
  title: string;
  dur: number;
  fps: number;
  totalFrames: number;
  ttsActive?: boolean;
  bounds: number[];
  beats: Ep3BeatCue[];
  mouthFrames: { speaker: string; open: number; v: string }[];
  sfx: { t: number; type: string; gain?: number; pan?: number; d?: number; f?: number; step?: number }[];
  music: { bpm: number; bars: string[]; final: number };
}

interface Props {
  frame: number;
  cues?: Ep3VideoCues;
}

const SPEAKER_LABELS: Record<string, string> = {
  kades: 'Pak Kades',
  virgod: '@virgod29',
  isqi: '@isqi_sani2316',
  lida: '@lida_aja_gin (Flora)',
  rehan: '@rehannoperwan411',
};

interface CameraState {
  targetX: number;
  targetY: number;
  zoom: number;
}

function getCameraForTime(t: number, beats: Ep3BeatCue[]): CameraState {
  const [b1, b2, b3, b4, b5, b6, b7, b8, b9, b10] = beats;

  // BEAT 1: Dynamic aerial fly-over push-in across 36+ villagers & PENDUDUK 100->245 -> Medium Close-Up phone comments
  if (t < b1.end) {
    const u = clamp((t - b1.start) / Math.max(0.2, b1.end - b1.start));
    if (u < 0.48) {
      const e = easeInOutCubic(u / 0.48);
      return {
        targetX: lerp(420, 690, e),
        targetY: lerp(1050, 1140, e),
        zoom: lerp(0.64, 0.96, e),
      };
    }
    const e = easeInOutCubic((u - 0.48) / 0.52);
    return {
      targetX: lerp(495, 512, e),
      targetY: lerp(1155, 1142, e),
      zoom: lerp(1.26, 1.36, e),
    };
  }

  // BEAT 2: Dialog minta lapangan (@virgod29 <-> Pak Kades) — shot/reverse-shot angle shift + gentle push-in
  if (t < b2.end) {
    const splitT = b2.utterances[1]?.start ?? (b2.start + (b2.end - b2.start) * 0.48);
    if (t < splitT) {
      const e = easeInOutCubic(clamp((t - b2.start) / Math.max(0.2, splitT - b2.start)));
      return {
        targetX: lerp(455, 480, e),
        targetY: lerp(1205, 1198, e),
        zoom: lerp(1.12, 1.22, e),
      };
    }
    const e = easeInOutCubic(clamp((t - splitT) / Math.max(0.2, b2.end - splitT)));
    return {
      targetX: lerp(575, 540, e),
      targetY: lerp(1198, 1205, e),
      zoom: lerp(1.18, 1.26, e),
    };
  }

  // BEAT 3: Masalah lahan — tracking pan on muddy roadside -> whip-pan up-left onto Sekolah roof ball
  if (t < b3.end) {
    const u = clamp((t - b3.start) / Math.max(0.2, b3.end - b3.start));
    if (u < 0.46) {
      const e = easeInOutCubic(u / 0.46);
      return {
        targetX: lerp(795, 920, e),
        targetY: lerp(1250, 1285, e),
        zoom: lerp(0.94, 1.12, e),
      };
    }
    const e = easeOutCubic((u - 0.46) / 0.54);
    return {
      targetX: lerp(685, 360, e),
      targetY: lerp(1175, 1065, e),
      zoom: lerp(0.95, 1.14, e),
    };
  }

  // BEAT 4: Pindah ke lahan samping — continuous follow-cam sweeping east to green side meadow (jauh dari jalan)
  if (t < b4.end) {
    const u = easeInOutCubic(clamp((t - b4.start) / Math.max(0.2, b4.end - b4.start)));
    return {
      targetX: lerp(840, 1660, u),
      targetY: lerp(1235, 1220, u),
      zoom: lerp(0.84, 0.78, u),
    };
  }

  // BEAT 5: Bangun Lapangan Bola di lahan samping — 3 moving cuts (aerial pull-back -> low tracking pan -> reveal push-in)
  if (t < b5.end) {
    const u = clamp((t - b5.start) / Math.max(0.2, b5.end - b5.start));
    if (u < 0.36) {
      const e = easeInOutCubic(u / 0.36);
      return {
        targetX: lerp(1560, 1660, e),
        targetY: lerp(1230, 1190, e),
        zoom: lerp(0.96, 0.70, e),
      };
    }
    if (u < 0.70) {
      const e = easeInOutCubic((u - 0.36) / 0.34);
      return {
        targetX: lerp(1410, 1910, e),
        targetY: lerp(1255, 1245, e),
        zoom: lerp(1.12, 1.04, e),
      };
    }
    const e = easeOutCubic((u - 0.70) / 0.30);
    return {
      targetX: 1660,
      targetY: lerp(1185, 1218, e),
      zoom: lerp(0.76, 0.96, e),
    };
  }

  // BEAT 6: Dialog Guru (@isqi_sani2316 + @nadia._single_era00) -> dynamic push-in walking into Sekolah
  if (t < b6.end) {
    const entryStart = (b6.utterances[1]?.end ?? (b6.end - 1.5)) + 0.12;
    if (t < entryStart) {
      const e = easeInOutCubic(clamp((t - b6.start) / Math.max(0.2, entryStart - b6.start)));
      return {
        targetX: lerp(420, 455, e),
        targetY: lerp(1215, 1205, e),
        zoom: lerp(1.04, 1.14, e),
      };
    }
    const e = easeInOutCubic(clamp((t - entryStart) / Math.max(0.2, b6.end - entryStart)));
    return {
      targetX: lerp(275, 228, e),
      targetY: lerp(1135, 1025, e),
      zoom: lerp(1.06, 1.32, e),
    };
  }

  // BEAT 7: Dialog Guru Ngaji (@lida_aja_gin / Flora) -> dynamic push-in walking into Masjid
  if (t < b7.end) {
    const entryStart = (b7.utterances[1]?.end ?? (b7.end - 1.5)) + 0.12;
    if (t < entryStart) {
      const e = easeInOutCubic(clamp((t - b7.start) / Math.max(0.2, entryStart - b7.start)));
      return {
        targetX: lerp(555, 585, e),
        targetY: lerp(1215, 1205, e),
        zoom: lerp(1.08, 1.18, e),
      };
    }
    const e = easeInOutCubic(clamp((t - entryStart) / Math.max(0.2, b7.end - entryStart)));
    return {
      targetX: lerp(460, 478, e),
      targetY: lerp(1135, 1025, e),
      zoom: lerp(1.08, 1.34, e),
    };
  }

  // BEAT 8: Dialog Kepala Kuli (@rehannoperwan411 <-> Pak Kades) — varied two-shot framing cut
  if (t < b8.end) {
    const splitT = b8.utterances[1]?.start ?? (b8.start + (b8.end - b8.start) * 0.5);
    if (t < splitT) {
      const e = easeInOutCubic(clamp((t - b8.start) / Math.max(0.2, splitT - b8.start)));
      return {
        targetX: lerp(2335, 2360, e),
        targetY: lerp(1215, 1208, e),
        zoom: lerp(1.10, 1.20, e),
      };
    }
    const e = easeInOutCubic(clamp((t - splitT) / Math.max(0.2, b8.end - splitT)));
    return {
      targetX: lerp(2440, 2405, e),
      targetY: lerp(1208, 1215, e),
      zoom: lerp(1.18, 1.26, e),
    };
  }

  // BEAT 9: Kepala Kuli LANGSUNG bangun 9 rumah warga sekaligus — 3 moving cuts!
  if (t < b9.end) {
    const u = clamp((t - b9.start) / Math.max(0.2, b9.end - b9.start));
    if (u < 0.36) {
      const e = easeInOutCubic(u / 0.36);
      return {
        targetX: lerp(2450, 2980, e),
        targetY: lerp(1245, 1230, e),
        zoom: lerp(0.92, 0.84, e),
      };
    }
    if (u < 0.70) {
      const e = easeInOutCubic((u - 0.36) / 0.34);
      return {
        targetX: lerp(3060, 2610, e),
        targetY: lerp(1270, 1245, e),
        zoom: lerp(1.06, 0.96, e),
      };
    }
    const e = easeOutCubic((u - 0.70) / 0.30);
    return {
      targetX: lerp(2785, 2795, e),
      targetY: lerp(1245, 1220, e),
      zoom: lerp(0.88, 0.68, e),
    };
  }

  // BEAT 10: Sweeping aerial fly-over (Rumah Warga -> Lapangan Bola -> Sekolah/Masjid/Gereja) -> Close-Up Kucing + End Card
  const u10 = clamp((t - b10.start) / Math.max(0.2, b10.end - b10.start));
  if (u10 < 0.42) {
    const e = easeInOutCubic(u10 / 0.42);
    return {
      targetX: lerp(2660, 740, e),
      targetY: lerp(1150, 1110, e),
      zoom: lerp(0.56, 0.66, e),
    };
  }
  const eClose = easeInOutCubic((u10 - 0.42) / 0.58);
  return {
    targetX: lerp(515, 522, eClose),
    targetY: lerp(1195, 1188, eClose),
    zoom: lerp(1.30, 1.38, eClose),
  };
}

export const KampungAmanahEp3Video: React.FC<Props> = ({
  frame,
  cues = defaultEp3Cues as Ep3VideoCues,
}) => {
  const f = clamp(Math.round(frame), 0, cues.totalFrames - 1);
  const t = f / FPS;

  const activeBeat =
    cues.beats.find((b) => t >= b.start && t < b.end) || cues.beats[cues.beats.length - 1];

  const [b1, b2, b3, b4, b5, b6, b7, b8, b9, b10] = cues.beats;

  const cam = getCameraForTime(t, cues.beats);

  // Subtle impact shakes
  const ballHitSec = b3.start + (b3.end - b3.start) * 0.68;
  const fieldDoneSec = b5.end - 0.45;
  const housesDoneSec = b9.end - 0.45;
  const b10CtaStartSec = b10.start + (b10.end - b10.start) * 0.46;
  const microShake =
    shake(f - fr(ballHitSec), 8) +
    shake(f - fr(fieldDoneSec), 6) +
    shake(f - fr(housesDoneSec), 6) +
    shake(f - fr(b10CtaStartSec), 6);

  // Active speaker mouth sample
  const mouthSample = cues.mouthFrames[f] || { speaker: 'none', open: 0, v: 'closed' };
  const kadesMouthOpen = mouthSample.speaker === 'kades' ? mouthSample.open : 0;
  const kadesMouthVowel = mouthSample.speaker === 'kades' ? mouthSample.v : 'closed';

  // Penduduk counter: rises swiftly from 100 -> 245 in Beat 1 and stays 245!
  let pendudukCount = 100;
  if (t >= b1.start + 0.7 && t < b1.start + 2.9) {
    const u = clamp((t - (b1.start + 0.7)) / 2.2);
    pendudukCount = 100 + Math.round(easeOutCubic(u) * 145);
  } else if (t >= b1.start + 2.9) {
    pendudukCount = 245;
  }
  const boardPulsing = t >= b1.start + 2.8 && t <= b1.end;

  // Sub-shot flags
  const b1U = activeBeat.id === 1 ? clamp((t - b1.start) / Math.max(0.2, b1.end - b1.start)) : 0;
  const isB1CloseUp = activeBeat.id === 1 && b1U >= 0.48;

  const b3U = activeBeat.id === 3 ? clamp((t - b3.start) / Math.max(0.2, b3.end - b3.start)) : 0;
  const showRoofBall = activeBeat.id === 3 ? b3U >= 0.42 : activeBeat.id >= 4;
  const ballFlightT = activeBeat.id === 3 ? clamp((b3U - 0.42) / 0.28) : 1;

  // Football field construction progress (Beat 5)
  let fieldProgress = 0;
  if (activeBeat.id === 5) {
    fieldProgress = clamp((t - (b5.start + 0.22)) / Math.max(1.0, b5.end - b5.start - 0.85));
  } else if (activeBeat.id >= 6) {
    fieldProgress = 1;
  }

  // Beat 6 & Beat 7 entry phases (entering Sekolah & Masjid right after Kades's reply!)
  const b6EntryStart = (b6.utterances[1]?.end ?? (b6.end - 1.5)) + 0.12;
  const isB6Entering = activeBeat.id === 6 && t >= b6EntryStart;
  const b6EntryU = isB6Entering ? clamp((t - b6EntryStart) / Math.max(0.2, b6.end - b6EntryStart)) : 0;

  const b7EntryStart = (b7.utterances[1]?.end ?? (b7.end - 1.5)) + 0.12;
  const isB7Entering = activeBeat.id === 7 && t >= b7EntryStart;
  const b7EntryU = isB7Entering ? clamp((t - b7EntryStart) / Math.max(0.2, b7.end - b7EntryStart)) : 0;

  // Houses construction progress (Beat 9 — built simultaneously right in Episode 3!)
  let housesProgress = 0;
  if (activeBeat.id === 9) {
    housesProgress = clamp((t - (b9.start + 0.2)) / Math.max(1.0, b9.end - b9.start - 0.9));
  } else if (activeBeat.id >= 10) {
    housesProgress = 1;
  }

  const b10U = activeBeat.id === 10 ? clamp((t - b10.start) / Math.max(0.2, b10.end - b10.start)) : 0;
  const isB10CtaShot = activeBeat.id === 10 && b10U >= 0.42;

  // Pak Kades pose, placement & scale per beat (feet anchored on lush meadow y~1265..1295, NEVER on road!)
  let kadesX = 485;
  let kadesY = 1270;
  let kadesScale = 0.72;
  let kadesPose: PakKadesPose = 'present';
  let kadesLookX = 0;
  let kadesEyebrow: 'cheerful' | 'amused' | 'warm' | 'excited' | 'playful' = 'cheerful';
  let showKades = true;

  if (activeBeat.id === 1) {
    if (!isB1CloseUp) {
      kadesX = 520;
      kadesY = 1265;
      kadesScale = 0.72;
      kadesPose = 'present';
    } else {
      kadesX = 335;
      kadesY = 1270;
      kadesScale = 0.84;
      kadesPose = 'point_cat';
      kadesLookX = 0.55;
      kadesEyebrow = 'excited';
    }
  } else if (activeBeat.id === 2) {
    kadesX = 685;
    kadesY = 1275;
    kadesScale = 0.74;
    kadesLookX = mouthSample.speaker !== 'kades' ? -0.65 : 0;
    kadesPose = mouthSample.speaker === 'kades' ? 'shrug_cat' : 'present';
    kadesEyebrow = 'amused';
  } else if (activeBeat.id === 3) {
    kadesX = 735;
    kadesY = 1295;
    kadesScale = 0.64;
    kadesPose = b3U < 0.45 ? 'lookout' : 'shrug_cat';
    kadesLookX = -0.65;
    kadesEyebrow = 'amused';
  } else if (activeBeat.id === 4) {
    const walkU = easeInOutCubic(clamp((t - b4.start) / Math.max(0.2, b4.end - b4.start)));
    kadesX = lerp(740, 1580, walkU);
    kadesY = 1285 - Math.abs(Math.sin(f * 0.48)) * 12;
    kadesScale = 0.64;
    kadesPose = 'walk';
    kadesLookX = 0.45;
    kadesEyebrow = 'excited';
  } else if (activeBeat.id === 5) {
    kadesX = 1220;
    kadesY = 1275;
    kadesScale = 0.58;
    kadesPose = fieldProgress < 0.92 ? 'invite' : 'thumbs_up';
    kadesLookX = 0.5;
    kadesEyebrow = 'excited';
  } else if (activeBeat.id === 6) {
    if (isB6Entering) {
      showKades = false;
    } else {
      kadesX = 635;
      kadesY = 1275;
      kadesScale = 0.72;
      kadesLookX = mouthSample.speaker !== 'kades' ? -0.6 : 0;
      kadesPose = mouthSample.speaker === 'kades' ? 'point_flag' : 'present';
      kadesEyebrow = 'cheerful';
    }
  } else if (activeBeat.id === 7) {
    if (isB7Entering) {
      showKades = false;
    } else {
      kadesX = 740;
      kadesY = 1275;
      kadesScale = 0.72;
      kadesLookX = mouthSample.speaker !== 'kades' ? -0.6 : 0;
      kadesPose = mouthSample.speaker === 'kades' ? 'point_flag' : 'present';
      kadesEyebrow = 'warm';
    }
  } else if (activeBeat.id === 8) {
    kadesX = 2545;
    kadesY = 1275;
    kadesScale = 0.74;
    kadesLookX = mouthSample.speaker !== 'kades' ? -0.65 : 0;
    kadesPose = mouthSample.speaker === 'kades' ? 'thumbs_up' : 'present';
    kadesEyebrow = 'excited';
  } else if (activeBeat.id === 9) {
    kadesX = 2235;
    kadesY = 1285;
    kadesScale = 0.6;
    kadesPose = housesProgress < 0.92 ? 'invite' : 'thumbs_up';
    kadesLookX = 0.55;
    kadesEyebrow = 'excited';
  } else {
    if (!isB10CtaShot) {
      kadesX = 1040;
      kadesY = 1265;
      kadesScale = 0.68;
      kadesPose = 'invite';
      kadesEyebrow = 'cheerful';
    } else {
      kadesX = 405;
      kadesY = 1275;
      kadesScale = 0.84;
      kadesPose = 'invite';
      kadesEyebrow = 'cheerful';
    }
  }

  // 36 bustling crowd villagers (NO usernames!) arranged in 3 lively layered rows
  const getCrowdWorldPos = (idx: number, row: 0 | 1 | 2, col: number) => {
    if (activeBeat.id === 1 || activeBeat.id === 2 || activeBeat.id === 3) {
      // Packed village square across Zone A in 3 dense depth rows (clearly busier than Ep 2!)
      const rowY = row === 0 ? 1095 : row === 1 ? 1158 : 1222;
      const spacing = row === 0 ? 72 : row === 1 ? 82 : 94;
      const startX = row === 0 ? 60 : row === 1 ? 95 : 130;
      return {
        x: startX + col * spacing,
        y: rowY + ((idx % 2) * 14),
        pose: activeBeat.id === 1 ? ('cheer' as const) : ('idle' as const),
      };
    }
    if (activeBeat.id === 4) {
      const walkU = easeInOutCubic(clamp((t - b4.start) / Math.max(0.2, b4.end - b4.start)));
      const rowY = 1130 + row * 68;
      const colShift = (col - 5.5) * 62;
      return {
        x: lerp(620 + colShift * 0.8, 1660 + colShift, walkU),
        y: rowY - Math.abs(Math.sin(f * 0.45 + idx)) * 10,
        pose: 'idle' as const,
      };
    }
    if (activeBeat.id === 5) {
      // Crowd stays neatly around the TOP sideline & LEFT/RIGHT wings so the entire Football Pitch is 100% VISIBLE!
      if (idx < 24) {
        const subRow = idx < 12 ? 0 : 1;
        const subCol = idx % 12;
        return {
          x: 1205 + subCol * 84,
          y: subRow === 0 ? 1020 : 1068,
          pose: fieldProgress < 0.85 ? ('work_hammer' as const) : ('cheer' as const),
        };
      }
      const sideIdx = idx - 24;
      const isLeft = sideIdx < 6;
      const k = sideIdx % 6;
      return {
        x: isLeft ? 1145 + (k % 2) * 52 : 2135 + (k % 2) * 52,
        y: 1175 + Math.floor(k / 2) * 78,
        pose: fieldProgress < 0.85 ? ('work_hammer' as const) : ('cheer' as const),
      };
    }
    if (activeBeat.id === 6 || activeBeat.id === 7) {
      // Dense villagers watching in front of Sekolah/Masjid/Gereja
      const rowY = row === 0 ? 1088 : row === 1 ? 1142 : 1196;
      const spacing = row === 0 ? 74 : row === 1 ? 84 : 96;
      return {
        x: 55 + col * spacing,
        y: rowY + (idx % 2) * 10,
        pose: 'idle' as const,
      };
    }
    if (activeBeat.id === 8) {
      // Dense cheering crowd behind Kepala Kuli & Pak Kades in Beat 8 dialog
      const rowY = row === 0 ? 1115 : row === 1 ? 1168 : 1222;
      const spacing = row === 0 ? 78 : row === 1 ? 88 : 102;
      return {
        x: 2150 + col * spacing,
        y: rowY + (idx % 2) * 12,
        pose: 'idle' as const,
      };
    }
    if (activeBeat.id === 9) {
      // Crowd neatly lines the FRONT lawn edge (below houses, above fence) and LEFT/RIGHT edges so ALL 9 colorful houses are 100% VISIBLE!
      if (idx < 20) {
        return {
          x: 2295 + idx * 54,
          y: 1412 + (idx % 2) * 14,
          pose: housesProgress < 0.86 ? ('work_hammer' as const) : ('cheer' as const),
        };
      }
      const flank = idx - 20;
      const isLeft = flank < 8;
      const k = flank % 8;
      return {
        x: isLeft ? 2140 + (k % 2) * 58 : 3375 + (k % 2) * 58,
        y: 1150 + Math.floor(k / 2) * 72,
        pose: housesProgress < 0.86 ? ('work_hammer' as const) : ('cheer' as const),
      };
    }
    // Beat 10: Aerial fly-over — villagers spread across ALL 3 zones (village + football pitch + new houses!)
    if (idx < 12) {
      return { x: 110 + idx * 80, y: 1125 + (idx % 2) * 42, pose: 'cheer' as const };
    }
    if (idx < 24) {
      return { x: 1270 + (idx - 12) * 72, y: 1110 + (idx % 2) * 265, pose: 'cheer' as const };
    }
    return { x: 2330 + (idx - 24) * 84, y: 1255 + (idx % 2) * 135, pose: 'cheer' as const };
  };

  // Visibility of crowd villagers
  const showCrowd =
    (activeBeat.id === 1 && !isB1CloseUp) ||
    activeBeat.id === 2 ||
    activeBeat.id === 3 ||
    activeBeat.id === 4 ||
    activeBeat.id === 5 ||
    (activeBeat.id === 6 && !isB6Entering) ||
    (activeBeat.id === 7 && !isB7Entering) ||
    activeBeat.id === 8 ||
    activeBeat.id === 9 ||
    (activeBeat.id === 10 && !isB10CtaShot);

  // Beat 1 phone pop
  const phoneEnter = isB1CloseUp ? spring(f, fr(b1.start + (b1.end - b1.start) * 0.48), 11, 210) : 0;

  // Badge "HARI 3"
  const badgePop = 0.78 + 0.22 * spring(f, 0, 10, 210);
  const fieldHour = Math.min(14, 9 + Math.floor(fieldProgress * 5.5));
  const houseHour = Math.min(17, 14 + Math.floor(housesProgress * 3.5));

  // Kinetic subtitle clause
  const activeClause = activeBeat.clauses.find((c) => t >= c.start - 0.04 && t <= c.end + 0.1);
  const isDialogBeat = activeBeat.id === 2 || activeBeat.id === 6 || activeBeat.id === 7 || activeBeat.id === 8;
  const speakerLabel =
    isDialogBeat && activeClause?.speaker
      ? SPEAKER_LABELS[activeClause.speaker]
      : null;

  // Closing CTA card (Beat 10 close-up ONLY)
  const ctaStartFrame = fr(b10CtaStartSec);
  const showCta = f >= ctaStartFrame;
  const ctaSpring = showCta ? spring(f, ctaStartFrame, 10, 220) : 0;
  const landSq = activeBeat.id === 1 && f < fr(0.9) ? squash(f) : { sx: 1, sy: 1 };

  return (
    <div
      style={{
        width: W,
        height: H,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#38BDF8',
        fontFamily: "'Poppins', sans-serif",
        userSelect: 'none',
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      >
        <g
          transform={`translate(${W / 2 + microShake}, ${H / 2 + microShake * 0.4}) scale(${cam.zoom}) translate(${-cam.targetX}, ${-cam.targetY})`}
        >
          {/* LAYER 0: Extended 5000px Sky, Sun, Clouds & Trees */}
          <Ep3ExtendedBackdrop
            frame={f}
            parallaxBgX={(cam.targetX - 540) * 0.15}
            parallaxBgY={(cam.targetY - 960) * 0.12}
          />

          {/* LAYER 1: Green Meadow, Fence & Foreground Paved Road (road stays BELOW pitch & houses!) */}
          <Ep3ExtendedGround frame={f} />

          {/* Flagpole on far-left lawn */}
          <g transform="translate(-44, 25) scale(0.92)">
            <FlagpoleMerahPutih frame={f} highlight={false} />
          </g>

          {/* Standing Ep2 Buildings (Sekolah, Masjid, Gereja) + Beat 3 Soccer Ball on Sekolah Roof */}
          <Ep3ExistingBuildings
            frame={f}
            ballOnSchoolRoof={showRoofBall}
            ballFlightT={ballFlightT}
          />

          {/* Muddy / bushy roadside spot (Beat 3 problem) */}
          <MuddyBushesPlot x={960} y={1405} />

          {/* Wooden PENDUDUK: 100 -> 245 signboard */}
          <PendudukSignBoardEp3
            frame={f}
            x={975}
            y={925}
            count={pendudukCount}
            pulse={boardPulsing}
          />

          {/* FOOTBALL FIELD anchored 100% ON green side meadow (y=1240, well ABOVE road y=1525!) */}
          {activeBeat.id >= 4 && (
            <FootballField2D
              frame={f}
              x={1660}
              y={1240}
              progress={activeBeat.id === 4 ? 0 : fieldProgress}
            />
          )}

          {/* 9 NEW VILLAGER HOUSES built simultaneously in Beat 9 on green meadow (y=1175..1380)! */}
          {activeBeat.id >= 9 && (
            <Ep3HousesNeighborhood frame={f} progress={housesProgress} />
          )}

          {/* 36 CROWD VILLAGERS — STRICTLY NO USERNAMES! */}
          {showCrowd &&
            EP3_CROWD_WARGA.map((cw, idx) => {
              const pos = getCrowdWorldPos(idx, cw.row, cw.col);
              return (
                <WargaCharacter
                  key={cw.id}
                  frame={f}
                  x={pos.x}
                  y={pos.y}
                  scale={cw.scale}
                  shirt={cw.shirt}
                  shirtShade={cw.shirtShade}
                  hairColor={cw.hairColor}
                  hairStyle={cw.hairStyle}
                  skin={cw.skin}
                  pose={pos.pose}
                  seed={cw.seed}
                />
              );
            })}

          {/* MAIN NAMED VILLAGERS PER BEAT — STRICTLY ONLY THE 6 NEW USERNAMES! */}

          {/* Beat 2: Dialog minta lapangan (@virgod29 <-> Pak Kades) */}
          {activeBeat.id === 2 && (
            <Ep3MainVillager
              cfg={EP3_MAIN_WARGA.virgod}
              frame={f}
              x={330}
              y={1285}
              scale={0.72}
              pose={mouthSample.speaker === 'virgod' ? 'raise_hand' : 'idle'}
              mouthOpen={mouthSample.speaker === 'virgod' ? mouthSample.open : 0}
              mouthVowel={mouthSample.speaker === 'virgod' ? mouthSample.v : 'closed'}
              highlighted={mouthSample.speaker === 'virgod'}
              seed={1}
            />
          )}

          {/* Beat 3: @virgod29 watching muddy plot & roof ball */}
          {activeBeat.id === 3 && (
            <Ep3MainVillager
              cfg={EP3_MAIN_WARGA.virgod}
              frame={f}
              x={515}
              y={1300}
              scale={0.58}
              pose="raise_hand"
              seed={1}
            />
          )}

          {/* Beat 4: Named villagers walking east to side meadow */}
          {activeBeat.id === 4 &&
            (['virgod', 'singgel', 'rehan'] as const).map((id, idx) => {
              const walkU = easeInOutCubic(clamp((t - b4.start) / Math.max(0.2, b4.end - b4.start)));
              const startX = 520 + idx * 185;
              const endX = 1280 + idx * 240;
              return (
                <Ep3MainVillager
                  key={id}
                  cfg={EP3_MAIN_WARGA[id]}
                  frame={f}
                  x={lerp(startX, endX, walkU)}
                  y={1295 + (idx % 2) * 32}
                  scale={0.54}
                  pose="wave"
                  walking
                  showRoleBadge={id === 'rehan'}
                  seed={idx + 1}
                />
              );
            })}

          {/* Beat 5: @virgod29, @singgel_boyys11, @rehannoperwan411 on the sidelines so pitch is 100% clear! */}
          {activeBeat.id === 5 && (
            <>
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.virgod}
                frame={f}
                x={1245}
                y={1402}
                scale={0.46}
                pose={fieldProgress < 0.85 ? 'work_hammer' : 'cheer'}
                seed={1}
              />
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.singgel}
                frame={f}
                x={1660}
                y={1408}
                scale={0.46}
                pose={fieldProgress < 0.85 ? 'work_hammer' : 'cheer'}
                seed={2}
              />
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.rehan}
                frame={f}
                x={2065}
                y={1402}
                scale={0.48}
                pose={fieldProgress < 0.85 ? 'work_hammer' : 'cheer'}
                showRoleBadge
                seed={6}
              />
            </>
          )}

          {/* Beat 6: Dialog Guru (@isqi_sani2316 + @nadia._single_era00) -> walk into Sekolah */}
          {activeBeat.id === 6 && !isB6Entering && (
            <>
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.nadia}
                frame={f}
                x={125}
                y={1285}
                scale={0.62}
                pose="wave"
                labelOffsetY={-48}
                seed={4}
              />
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.isqi}
                frame={f}
                x={365}
                y={1285}
                scale={0.68}
                pose={mouthSample.speaker === 'isqi' ? 'raise_hand' : 'idle'}
                mouthOpen={mouthSample.speaker === 'isqi' ? mouthSample.open : 0}
                mouthVowel={mouthSample.speaker === 'isqi' ? mouthSample.v : 'closed'}
                highlighted={mouthSample.speaker === 'isqi'}
                showRoleBadge
                seed={3}
              />
            </>
          )}

          {activeBeat.id === 6 && isB6Entering && (
            <g opacity={clamp(1.25 - b6EntryU * 0.45)}>
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.isqi}
                frame={f}
                x={lerp(75, 175, easeInOutCubic(b6EntryU))}
                y={lerp(1210, 1024, easeInOutCubic(b6EntryU))}
                scale={lerp(0.62, 0.42, easeInOutCubic(b6EntryU))}
                pose="wave"
                walking
                labelOffsetY={-56}
                seed={3}
              />
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.nadia}
                frame={f}
                x={lerp(395, 285, easeInOutCubic(b6EntryU))}
                y={lerp(1210, 1024, easeInOutCubic(b6EntryU))}
                scale={lerp(0.62, 0.42, easeInOutCubic(b6EntryU))}
                pose="wave"
                walking
                labelOffsetY={-6}
                seed={4}
              />
            </g>
          )}

          {/* Beat 7: Dialog Guru Ngaji (@lida_aja_gin / Flora) -> walk into Masjid */}
          {activeBeat.id === 7 && !isB7Entering && (
            <Ep3MainVillager
              cfg={EP3_MAIN_WARGA.lida}
              frame={f}
              x={415}
              y={1285}
              scale={0.72}
              pose={mouthSample.speaker === 'lida' ? 'raise_hand' : 'idle'}
              mouthOpen={mouthSample.speaker === 'lida' ? mouthSample.open : 0}
              mouthVowel={mouthSample.speaker === 'lida' ? mouthSample.v : 'closed'}
              highlighted={mouthSample.speaker === 'lida'}
              showRoleBadge
              seed={5}
            />
          )}

          {activeBeat.id === 7 && isB7Entering && (
            <g opacity={clamp(1.25 - b7EntryU * 0.45)}>
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.lida}
                frame={f}
                x={lerp(410, 478, easeInOutCubic(b7EntryU))}
                y={lerp(1210, 1020, easeInOutCubic(b7EntryU))}
                scale={lerp(0.66, 0.44, easeInOutCubic(b7EntryU))}
                pose="wave"
                walking
                showRoleBadge
                seed={5}
              />
            </g>
          )}

          {/* Beat 8: Dialog Kepala Kuli (@rehannoperwan411 <-> Pak Kades) */}
          {activeBeat.id === 8 && (
            <Ep3MainVillager
              cfg={EP3_MAIN_WARGA.rehan}
              frame={f}
              x={2215}
              y={1285}
              scale={0.72}
              pose={mouthSample.speaker === 'rehan' ? 'raise_hand' : 'idle'}
              mouthOpen={mouthSample.speaker === 'rehan' ? mouthSample.open : 0}
              mouthVowel={mouthSample.speaker === 'rehan' ? mouthSample.v : 'closed'}
              highlighted={mouthSample.speaker === 'rehan'}
              showRoleBadge
              seed={6}
            />
          )}

          {/* Beat 9: Kepala Kuli (@rehannoperwan411) + @singgel_boyys11 + @virgod29 on front lawn so all 9 houses shine! */}
          {activeBeat.id === 9 && (
            <>
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.rehan}
                frame={f}
                x={2455}
                y={1422}
                scale={0.48}
                pose={housesProgress < 0.88 ? 'work_hammer' : 'cheer'}
                showRoleBadge
                highlighted
                seed={6}
              />
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.singgel}
                frame={f}
                x={2800}
                y={1422}
                scale={0.46}
                pose={housesProgress < 0.88 ? 'work_hammer' : 'cheer'}
                seed={2}
              />
              <Ep3MainVillager
                cfg={EP3_MAIN_WARGA.virgod}
                frame={f}
                x={3145}
                y={1422}
                scale={0.46}
                pose={housesProgress < 0.88 ? 'work_hammer' : 'cheer'}
                seed={1}
              />
            </>
          )}

          {/* Pak Kades (exact same Ep 1 & 2 character design) */}
          {showKades && (
            <PakKades
              frame={f}
              x={kadesX}
              y={kadesY}
              scale={kadesScale}
              pose={kadesPose}
              mouthOpen={kadesMouthOpen}
              mouthVowel={kadesMouthVowel}
              lookX={kadesLookX}
              eyebrowMood={kadesEyebrow}
              squashX={landSq.sx}
              squashY={landSq.sy}
            />
          )}

          {/* Kucing Oranye (still hanging out, NOT counted!) */}
          {(activeBeat.id === 1 || activeBeat.id === 3 || activeBeat.id === 10) && (
            <g>
              <KucingOranye
                frame={f}
                x={activeBeat.id === 10 && isB10CtaShot ? 695 : 615}
                y={activeBeat.id === 10 && isB10CtaShot ? 1335 : 1410}
                scale={activeBeat.id === 10 && isB10CtaShot ? 0.78 : 0.66}
                excited={activeBeat.id === 10}
                lookAtKades={activeBeat.id === 10}
              />
              {activeBeat.id === 10 && isB10CtaShot && (
                <g
                  transform={`translate(695, 1418) scale(${spring(
                    f,
                    fr(b10.start + (b10.end - b10.start) * 0.43),
                    10,
                    210
                  )})`}
                >
                  <rect x={-72} y={-16} width={144} height={30} rx={9} fill="#FFF7ED" stroke="#18181B" strokeWidth={3.5} />
                  <text x={0} y={5} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={16} fill="#C2410C">
                    MASIH NUMPANG
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Beat 1 Comment Phone Overlay */}
          {isB1CloseUp && (
            <Ep3CommentPhoneOverlay
              x={665}
              y={1105}
              enterScale={0.58 * (0.65 + 0.35 * phoneEnter)}
            />
          )}
        </g>
      </svg>

      {/* ON-SCREEN HUD & KINETIC SUBTITLES */}

      {/* 1. Badge "HARI 3" */}
      <div
        style={{
          position: 'absolute',
          top: 184,
          left: 60,
          transform: `scale(${badgePop})`,
          transformOrigin: 'top left',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#FACC15',
            color: '#18181B',
            border: '5px solid #18181B',
            boxShadow: '7px 7px 0px #18181B',
            borderRadius: 18,
            padding: '10px 28px',
            fontFamily: "'Bricolage Grotesque', 'Poppins', sans-serif",
            fontWeight: 900,
            fontSize: 44,
            letterSpacing: '0.03em',
            lineHeight: 1,
          }}
        >
          <span>HARI 3</span>
        </div>
        <div
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: '#FFFFFF',
            letterSpacing: '0.04em',
            WebkitTextStroke: '7px #18181B',
            paintOrder: 'stroke fill',
            textShadow: '0 4px 0 #18181B',
            paddingLeft: 4,
          }}
        >
          KAMPUNG AMANAH
        </div>
      </div>

      {/* Beat 5 / Beat 9 Timelapse Badge */}
      {(activeBeat.id === 5 || activeBeat.id === 9) && (
        <div
          style={{
            position: 'absolute',
            top: 320,
            left: 60,
            backgroundColor: '#FFFFFF',
            color: '#18181B',
            border: '4px solid #18181B',
            boxShadow: '6px 6px 0px #18181B',
            borderRadius: 16,
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 12,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 99,
              backgroundColor: '#EF4444',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: "'Bricolage Grotesque', 'Poppins', sans-serif",
              fontWeight: 900,
              fontSize: 25,
            }}
          >
            {activeBeat.id === 5
              ? `BANGUN LAPANGAN · ${String(fieldHour).padStart(2, '0')}:00`
              : `BANGUN RUMAH WARGA · ${String(houseHour).padStart(2, '0')}:00`}
          </span>
        </div>
      )}

      {/* Beat 6 & Beat 7 Role Entry Pill */}
      {(isB6Entering || isB7Entering) && (
        <div
          style={{
            position: 'absolute',
            top: 320,
            left: 60,
            backgroundColor: '#DCFCE7',
            color: '#18181B',
            border: '4px solid #18181B',
            boxShadow: '6px 6px 0px #18181B',
            borderRadius: 16,
            padding: '8px 20px',
            fontFamily: "'Bricolage Grotesque', 'Poppins', sans-serif",
            fontWeight: 900,
            fontSize: 24,
            zIndex: 12,
          }}
        >
          {isB6Entering ? 'GURU MASUK SEKOLAH' : 'GURU NGAJI MASUK MASJID'}
        </div>
      )}

      {/* 2. KINETIC WORD-BY-WORD SUBTITLES */}
      {activeClause && (
        <div
          style={{
            position: 'absolute',
            left: 56,
            right: 56,
            top: activeBeat.id === 10 ? 1425 : 1435,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            zIndex: 15,
          }}
        >
          {speakerLabel && (
            <div
              style={{
                backgroundColor: activeClause.speaker === 'kades' ? '#FFFFFF' : '#FACC15',
                color: '#18181B',
                border: '4px solid #18181B',
                boxShadow: '4px 4px 0px #18181B',
                borderRadius: 12,
                padding: '4px 18px',
                fontFamily: "'Bricolage Grotesque', 'Poppins', sans-serif",
                fontWeight: 900,
                fontSize: 26,
              }}
            >
              {speakerLabel}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              columnGap: 26,
              rowGap: 8,
              textAlign: 'center',
            }}
          >
            {activeClause.words.map((word, idx) => {
              if (t < word.s) return null;
              const wordStartFrame = fr(word.s);
              const pop = spring(f, wordStartFrame, 10, 280, 0.6);
              const isSpeakingNow = t >= word.s && t <= word.e;
              const wordScale = (0.74 + 0.26 * pop) * (isSpeakingNow ? 1.05 : 1.0);
              const ty = (1 - pop) * 18;

              return (
                <span
                  key={`${activeClause.start}-${idx}`}
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Bricolage Grotesque', 'Poppins', sans-serif",
                    fontWeight: 900,
                    fontSize: 58,
                    lineHeight: 1.1,
                    color: word.kw ? '#FACC15' : '#FFFFFF',
                    WebkitTextStroke: '12px #18181B',
                    paintOrder: 'stroke fill',
                    textShadow: '0px 6px 0px #18181B',
                    transform: `translateY(${ty}px) scale(${wordScale})`,
                    transformOrigin: 'center bottom',
                  }}
                >
                  {word.w}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CLOSING CTA CARD (Exact requested text!) */}
      {showCta && (
        <div
          style={{
            position: 'absolute',
            left: 56,
            right: 56,
            top: 1620,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 20,
            transform: `translateY(${(1 - ctaSpring) * 44}px) scale(${0.72 + 0.28 * ctaSpring})`,
            opacity: clamp(ctaSpring * 1.6),
          }}
        >
          <div
            style={{
              backgroundColor: '#FACC15',
              color: '#18181B',
              border: '6px solid #18181B',
              boxShadow: '10px 10px 0px #18181B',
              borderRadius: 24,
              padding: '20px 32px',
              fontFamily: "'Bricolage Grotesque', 'Poppins', sans-serif",
              fontWeight: 900,
              fontSize: 38,
              letterSpacing: '0.01em',
              lineHeight: 1.18,
              textAlign: 'center',
            }}
          >
            Besok bangun apa lagi?
            <br />
            Komen, yang like-nya paling banyak duluan.
          </div>
        </div>
      )}
    </div>
  );
};
