import React from 'react';
import defaultCues from './cues.json';
import { FPS, H, W, clamp, easeInOutCubic, easeOutCubic, fr, lerp, shake, spring, squash } from './motion';
import { EmptyVillageBackdrop, EmptyVillageGround, FlagpoleMerahPutih, PendudukSignBoard } from './characters/VillageProps';
import { KucingOranye } from './characters/KucingOranye';
import { PakKades, PakKadesPose } from './characters/PakKades';

export interface WordCue {
  w: string;
  s: number;
  e: number;
  kw: boolean;
  syl: number;
  v: string;
}

export interface ClauseCue {
  start: number;
  end: number;
  words: WordCue[];
}

export interface BeatCue {
  id: number;
  start: number;
  end: number;
  pose: string;
  lookAt: string;
  eyebrow: 'cheerful' | 'amused' | 'warm' | 'excited' | 'playful';
  camZoom: number[];
  camPanX: number[];
  camPanY: number[];
  text: string;
  clauses: ClauseCue[];
}

export interface VideoCues {
  series: string;
  episode: number;
  title: string;
  dur: number;
  fps: number;
  totalFrames: number;
  ttsActive?: boolean;
  bounds: number[];
  beats: BeatCue[];
  mouthFrames: { open: number; v: string }[];
  sfx: { t: number; type: string; gain?: number; pan?: number; d?: number; f?: number }[];
  music: { bpm: number; bars: string[]; final: number };
}

interface Props {
  frame: number;
  cues?: VideoCues;
}

export const KampungAmanahVideo: React.FC<Props> = ({ frame, cues = defaultCues as VideoCues }) => {
  const f = clamp(Math.round(frame), 0, cues.totalFrames - 1);
  const t = f / FPS;

  // Find active beat
  const activeBeat =
    cues.beats.find((b) => t >= b.start && t < b.end) || cues.beats[cues.beats.length - 1];

  // Camera zoom & pan interpolation within active beat
  const beatDur = Math.max(0.1, activeBeat.end - activeBeat.start);
  const beatProgress = easeInOutCubic((t - activeBeat.start) / beatDur);
  const camZoom = lerp(activeBeat.camZoom[0], activeBeat.camZoom[1], beatProgress);
  const camPanX = lerp(activeBeat.camPanX[0], activeBeat.camPanX[1], beatProgress);
  const camPanY = lerp(activeBeat.camPanY[0], activeBeat.camPanY[1], beatProgress);

  // Subtle impact micro-shakes at key punchline/card moments
  const b0 = cues.beats[0];
  const b1 = cues.beats[1];
  const b2 = cues.beats[2];
  const b3 = cues.beats[3];
  const b4 = cues.beats[4];
  const b5 = cues.beats[5];

  const ctaSec = Math.max(b5.start + 0.8, cues.dur - 2.4);
  const punch1Sec = b0.clauses[1]?.words[1]?.s ?? 3.65;
  const thumbsUpSec = b3.clauses[2]?.start ?? 20.05;

  const microShake =
    shake(f - fr(0.62), 6) +
    shake(f - fr(punch1Sec), 5) +
    shake(f - fr(thumbsUpSec), 5) +
    shake(f - fr(ctaSec), 8);

  // Pak Kades walk-in entrance (0.0s .. 0.65s -> frames 0..20)
  const walkEndFrame = fr(0.65);
  const isWalking = f < walkEndFrame;
  const walkU = easeOutCubic(clamp(f / walkEndFrame));
  const kadesX = isWalking ? lerp(-140, 455, walkU) : 455;
  const walkBob = isWalking ? -Math.abs(Math.sin(f * 0.52)) * 20 : 0;
  const landSq = f >= walkEndFrame ? squash(f - walkEndFrame) : { sx: 1, sy: 1 };
  const kadesY = 985 + walkBob;

  // Determine granular pose & gaze direction inside each beat dynamically from clauses
  let pose: PakKadesPose = 'present';
  let lookX = 0;
  let lookY = 0;

  const b0Split = b0.clauses[1]?.start ?? 2.65;
  const b1Split = b1.clauses[1]?.start ?? 7.25;
  const b2Split = b2.clauses[1]?.start ?? 13.55;
  const b3Split1 = b3.clauses[1]?.start ?? 17.6;
  const b3Split2 = b3.clauses[2]?.start ?? 20.05;
  const b4Split = b4.clauses[1]?.start ?? 25.28;

  if (isWalking) {
    pose = 'walk';
    lookX = 0.3;
  } else if (activeBeat.id === 1) {
    if (t < b0Split) {
      pose = 'present';
      lookX = 0;
    } else {
      pose = 'self';
      lookX = 0.1;
    }
  } else if (activeBeat.id === 2) {
    if (t < b1Split) {
      pose = 'point_flag';
      lookX = -0.85;
      lookY = -0.25;
    } else {
      pose = 'point_cat';
      lookX = 0.8;
      lookY = 0.55;
    }
  } else if (activeBeat.id === 3) {
    if (t < b2Split) {
      pose = 'chest';
      lookX = 0;
    } else {
      pose = 'point_cam';
      lookX = 0;
    }
  } else if (activeBeat.id === 4) {
    if (t < b3Split1) {
      pose = 'count_1';
    } else if (t < b3Split2) {
      pose = 'count_2';
    } else {
      pose = 'thumbs_up';
    }
  } else if (activeBeat.id === 5) {
    if (t < b4Split) {
      pose = 'lookout';
      lookX = 0.85;
      lookY = -0.15;
    } else {
      pose = 'shrug_cat';
      lookX = 0.78;
      lookY = 0.55;
    }
  } else {
    pose = 'invite';
    lookX = 0;
    lookY = 0;
  }

  // Mouth lip-sync state from cues.mouthFrames
  const mouthSample = cues.mouthFrames[f] || { open: 0, v: 'closed' };

  // Cat reacts when Pak Kades talks about the cat (Beat 2b or Beat 5b)
  const catExcited = (t >= b1Split && t <= b1.end) || (t >= b4Split && t <= b4.end);
  const flagHighlighted = t >= b1.start && t < b1Split;
  const signPulsing = t >= b4.start && t < b4Split;

  // Active kinetic subtitle clause
  const activeClause = activeBeat.clauses.find((c) => t >= c.start - 0.05 && t <= c.end + 0.12);

  // "HARI 1" badge entrance (already visible at frame 0 at 0.75 scale, pops to 1.0)
  const badgePop = 0.75 + 0.25 * spring(f, 0, 10, 210);

  // Closing CTA card "FOLLOW = JADI WARGA" entrance
  const ctaStartFrame = fr(ctaSec);
  const showCta = f >= ctaStartFrame;
  const ctaSpring = showCta ? spring(f, ctaStartFrame, 10, 220) : 0;

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
      {/* CAMERA VIEWPORT (Medium shot + slow push-in + 3-layer parallax) */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      >
        <g
          transform={`translate(${W / 2 + camPanX + microShake}, ${H / 2 + camPanY + microShake * 0.4}) scale(${camZoom}) translate(${-W / 2}, ${-H / 2})`}
        >
          {/* LAYER 0: Sky, Sun, Clouds & Bare Empty Horizon */}
          <EmptyVillageBackdrop
            frame={f}
            parallaxBgX={-camPanX * 0.45}
            parallaxBgY={-camPanY * 0.45}
          />

          {/* LAYER 1: Empty Dirt & Grass Field + Flagpole + PENDUDUK: 0 Sign */}
          <g transform={`translate(${-camPanX * 0.2}, ${-camPanY * 0.2})`}>
            <EmptyVillageGround frame={f} />
            <FlagpoleMerahPutih frame={f} highlight={flagHighlighted} />
            <PendudukSignBoard frame={f} pulse={signPulsing} />
          </g>

          {/* LAYER 2: Foreground Characters (Pak Kades & Orange Cat — NO chickens, NO buildings) */}
          <KucingOranye frame={f} excited={catExcited} lookAtKades={catExcited} />

          <PakKades
            frame={f}
            x={kadesX}
            y={kadesY}
            pose={pose}
            mouthOpen={mouthSample.open}
            mouthVowel={mouthSample.v}
            lookX={lookX}
            lookY={lookY}
            eyebrowMood={activeBeat.eyebrow}
            squashX={landSq.sx}
            squashY={landSq.sy}
          />
        </g>
      </svg>

      {/* ON-SCREEN TEXT OVERLAY (Safe zone: x 60..1020, y 180..1650) */}

      {/* 1. Badge "HARI 1" (top-left safe zone, visible from frame 0) */}
      <div
        style={{
          position: 'absolute',
          top: 192,
          left: 64,
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
          <span>HARI 1</span>
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

      {/* 2. KINETIC WORD-BY-WORD SUBTITLES (below Pak Kades & cat, inside safe zone) */}
      {activeClause && (
        <div
          style={{
            position: 'absolute',
            left: 64,
            right: 64,
            top: activeBeat.id === 6 ? 1335 : 1410,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            columnGap: 26,
            rowGap: 10,
            textAlign: 'center',
            zIndex: 15,
          }}
        >
          {activeClause.words.map((word, idx) => {
            if (t < word.s) return null;
            const wordStartFrame = fr(word.s);
            const pop = spring(f, wordStartFrame, 10, 280, 0.6);
            const isSpeakingNow = t >= word.s && t <= word.e;
            const wordScale = (0.58 + 0.42 * pop) * (isSpeakingNow ? 1.09 : 1.0);
            const ty = (1 - pop) * 28;

            return (
              <span
                key={`${activeClause.start}-${idx}`}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Bricolage Grotesque', 'Poppins', sans-serif",
                  fontWeight: 900,
                  fontSize: 64,
                  lineHeight: 1.12,
                  color: word.kw ? '#FACC15' : '#FFFFFF',
                  WebkitTextStroke: '14px #18181B',
                  paintOrder: 'stroke fill',
                  filter: 'drop-shadow(0px 6px 0px #18181B)',
                  transform: `translateY(${ty}px) scale(${wordScale})`,
                  transformOrigin: 'center bottom',
                }}
              >
                {word.w}
              </span>
            );
          })}
        </div>
      )}

      {/* 3. CLOSING CARD "FOLLOW = JADI WARGA" (Beat 6 ending, inside safe zone y=1485..1615) */}
      {showCta && (
        <div
          style={{
            position: 'absolute',
            left: 72,
            right: 72,
            top: 1485,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 20,
            transform: `translateY(${(1 - ctaSpring) * 48}px) scale(${0.7 + 0.3 * ctaSpring})`,
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
              padding: '22px 46px',
              fontFamily: "'Bricolage Grotesque', 'Poppins', sans-serif",
              fontWeight: 900,
              fontSize: 54,
              letterSpacing: '0.02em',
              lineHeight: 1.05,
              textAlign: 'center',
            }}
          >
            FOLLOW = JADI WARGA
          </div>
        </div>
      )}
    </div>
  );
};
