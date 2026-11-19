import React from 'react';
import defaultEp2Cues from './cues_ep2.json';
import { FPS, H, W, clamp, easeInOutCubic, easeOutCubic, fr, lerp, shake, spring, squash } from './motion';
import { EmptyVillageBackdrop, EmptyVillageGround, FlagpoleMerahPutih } from './characters/VillageProps';
import { KucingOranye } from './characters/KucingOranye';
import { PakKades, PakKadesPose } from './characters/PakKades';
import { CROWD_WARGA, MAIN_WARGA, WargaCharacter, WargaNameTag } from './characters/WargaCast';
import {
  OrangeBus,
  PendudukSignBoardEp2,
  PhoneProfileOverlay,
  TimelapsedBuildings,
} from './characters/Ep2Props';

export interface Ep2WordCue {
  w: string;
  s: number;
  e: number;
  kw: boolean;
  syl: number;
  v: string;
}

export interface Ep2ClauseCue {
  speaker?: string;
  start: number;
  end: number;
  words: Ep2WordCue[];
}

export interface Ep2UtteranceCue {
  id: string;
  speaker: string;
  voice: string;
  start: number;
  end: number;
  text: string;
  clauses: { start?: number; end?: number; words: Ep2WordCue[] }[];
}

export interface Ep2BeatCue {
  id: number;
  start: number;
  end: number;
  scene: string;
  camZoom: number[];
  camPanX: number[];
  camPanY: number[];
  text: string;
  utterances: Ep2UtteranceCue[];
  clauses: Ep2ClauseCue[];
}

export interface Ep2VideoCues {
  series: string;
  episode: number;
  title: string;
  dur: number;
  fps: number;
  totalFrames: number;
  ttsActive?: boolean;
  bounds: number[];
  beats: Ep2BeatCue[];
  mouthFrames: { speaker: string; open: number; v: string }[];
  sfx: { t: number; type: string; gain?: number; pan?: number; d?: number; f?: number; step?: number }[];
  music: { bpm: number; bars: string[]; final: number };
}

interface Props {
  frame: number;
  cues?: Ep2VideoCues;
}

const SPEAKER_LABELS: Record<string, string> = {
  kades: 'Pak Kades',
  vinzz: '@vinzz4726',
  epan: '@3p4n.24',
  dzik: '@dzikkkksd2',
  ary: '@_26ary4stnn',
};

export const KampungAmanahEp2Video: React.FC<Props> = ({
  frame,
  cues = defaultEp2Cues as Ep2VideoCues,
}) => {
  const f = clamp(Math.round(frame), 0, cues.totalFrames - 1);
  const t = f / FPS;

  const activeBeat =
    cues.beats.find((b) => t >= b.start && t < b.end) || cues.beats[cues.beats.length - 1];

  const b1 = cues.beats[0];
  const b2 = cues.beats[1];
  const b3 = cues.beats[2];
  const b4 = cues.beats[3];
  const b5 = cues.beats[4];
  const b6 = cues.beats[5];
  const b7 = cues.beats[6];
  const b8 = cues.beats[7];
  const b9 = cues.beats[8];
  const b10 = cues.beats[9];

  // Camera zoom & pan interpolation
  const beatDur = Math.max(0.1, activeBeat.end - activeBeat.start);
  const beatProgress = easeInOutCubic((t - activeBeat.start) / beatDur);
  const camZoom = lerp(activeBeat.camZoom[0], activeBeat.camZoom[1], beatProgress);
  const camPanX = lerp(activeBeat.camPanX[0], activeBeat.camPanX[1], beatProgress);
  const camPanY = lerp(activeBeat.camPanY[0], activeBeat.camPanY[1], beatProgress);

  // Subtle impact shakes at bus brake, 100 hit, buildings finish, and closing card
  const busStopSec = b2.start + 1.05;
  const count100Sec = b3.start + 4.1;
  const ctaSec = Math.max(b10.start + 0.85, cues.dur - 2.35);
  const microShake =
    shake(f - fr(busStopSec), 7) +
    shake(f - fr(count100Sec), 6) +
    shake(f - fr(b9.end - 0.6), 6) +
    shake(f - fr(ctaSec), 7);

  // Mouth state for active speaker
  const mouthSample = cues.mouthFrames[f] || { speaker: 'none', open: 0, v: 'closed' };
  const kadesMouthOpen = mouthSample.speaker === 'kades' ? mouthSample.open : 0;
  const kadesMouthVowel = mouthSample.speaker === 'kades' ? mouthSample.v : 'closed';

  // Penduduk counter: 0 in Beat 1..2, climbs 0 -> 100 during Beat 3, stays 100 after
  let pendudukCount = 0;
  if (t >= b3.start + 0.5 && t < b3.start + 4.1) {
    const u = clamp((t - (b3.start + 0.5)) / 3.6);
    pendudukCount = Math.round(easeInOutCubic(u) * 100);
  } else if (t >= b3.start + 4.1) {
    pendudukCount = 100;
  }
  const signPulsing = t >= b3.start + 4.0 && t <= b3.end;

  // Bus animation across Beat 2 and Beat 3
  const showBus = t >= b2.start && t <= b3.end;
  let busX = -400;
  let busY = 1155;
  let busScale = 0.86;
  let busSpeed = 0;
  let busDoor = 0;
  if (t >= b2.start && t < b3.start) {
    const arriveU = easeOutCubic(clamp((t - b2.start) / 1.15));
    busX = lerp(-380, 355, arriveU);
    busSpeed = arriveU < 0.96 ? 1 : 0;
  } else if (t >= b3.start && t <= b3.end) {
    const parkU = easeOutCubic(clamp((t - b3.start) / 0.5));
    const leaveU = easeInOutCubic(clamp((t - (b3.end - 1.25)) / 1.25));
    busX = lerp(355, 430, parkU) - leaveU * 960;
    busY = lerp(1155, 1020, parkU);
    busScale = lerp(0.86, 0.66, parkU);
    busDoor = t < b3.end - 1.5 ? clamp((t - (b3.start + 0.2)) / 0.3) : clamp((b3.end - 1.3 - t) / 0.25);
    busSpeed = leaveU > 0.02 ? 1 : 0;
  }

  // Pak Kades position, scale & pose per beat
  let kadesX = 455;
  let kadesY = 1030;
  let kadesScale = 0.78;
  let kadesPose: PakKadesPose = 'present';
  let kadesLookX = 0;
  let kadesLookY = 0;
  let kadesEyebrow: 'cheerful' | 'amused' | 'warm' | 'excited' | 'playful' = 'cheerful';

  if (activeBeat.id === 1) {
    const walkFrames = fr(0.8);
    const isWalk = f < walkFrames;
    const walkU = easeOutCubic(clamp(f / walkFrames));
    kadesX = isWalk ? lerp(-120, 455, walkU) : 455;
    kadesY = 1030 + (isWalk ? -Math.abs(Math.sin(f * 0.5)) * 18 : 0);
    kadesScale = 0.78;
    kadesPose = isWalk ? 'walk' : t < b1.start + 2.8 ? 'present' : 'lookout';
  } else if (activeBeat.id === 2) {
    const stepRightU = easeOutCubic(clamp((t - b2.start) / 0.7));
    kadesX = lerp(455, 735, stepRightU);
    kadesY = 1135;
    kadesScale = 0.64;
    kadesPose = t < b2.start + 1.2 ? 'lookout' : 'present';
    kadesLookX = -0.8;
    kadesEyebrow = 'excited';
  } else if (activeBeat.id === 3) {
    const centerU = easeOutCubic(clamp((t - b3.start) / 0.7));
    kadesX = lerp(735, 535, centerU);
    kadesY = 1175;
    kadesScale = lerp(0.64, 0.55, centerU);
    kadesPose = t > b3.start + 4.1 ? 'thumbs_up' : 'present';
    kadesEyebrow = 'excited';
  } else if (activeBeat.id === 4) {
    kadesX = 205;
    kadesY = 1145;
    kadesScale = 0.76;
    kadesPose = 'point_cat';
    kadesLookX = 0.65;
    kadesEyebrow = 'warm';
  } else if (activeBeat.id === 5) {
    kadesX = 535;
    kadesY = 1175;
    kadesScale = 0.55;
    kadesLookX = mouthSample.speaker === 'vinzz' ? -0.75 : 0;
    kadesPose = mouthSample.speaker === 'kades' ? 'shrug_cat' : 'present';
    kadesEyebrow = 'amused';
  } else if (activeBeat.id === 6) {
    kadesX = 535;
    kadesY = 1175;
    kadesScale = 0.55;
    kadesLookX = mouthSample.speaker === 'epan' ? -0.55 : 0;
    kadesPose = mouthSample.speaker === 'kades' ? 'point_cam' : 'present';
    kadesEyebrow = 'playful';
  } else if (activeBeat.id === 7) {
    kadesX = 535;
    kadesY = 1175;
    kadesScale = 0.55;
    kadesLookX = mouthSample.speaker === 'dzik' ? 0.65 : 0;
    kadesPose = mouthSample.speaker === 'kades' ? 'thumbs_up' : 'present';
    kadesEyebrow = 'cheerful';
  } else if (activeBeat.id === 8) {
    kadesX = 535;
    kadesY = 1175;
    kadesScale = 0.55;
    kadesLookX = mouthSample.speaker === 'ary' ? 0.8 : 0;
    kadesPose = mouthSample.speaker === 'kades' ? 'count_1' : 'present';
    kadesEyebrow = 'excited';
  } else if (activeBeat.id === 9) {
    kadesX = 535;
    kadesY = 1185;
    kadesScale = 0.54;
    kadesPose = t < b9.end - 1.2 ? 'invite' : 'thumbs_up';
    kadesEyebrow = 'excited';
  } else {
    kadesX = 535;
    kadesY = 1185;
    kadesScale = 0.55;
    kadesPose = 'invite';
    kadesLookY = 0.15;
    kadesEyebrow = 'cheerful';
  }

  // Phone Profile overlay in Beat 4
  const showPhone = activeBeat.id === 4;
  const phoneEnter = showPhone ? spring(f, fr(b4.start), 11, 210) : 0;
  const phoneSlideProgress = showPhone ? clamp((t - b4.start) / Math.max(0.5, b4.end - b4.start)) : 0;

  // Crowd + Main Warga visibility (appear starting Beat 3, hide briefly in Beat 4 close-up phone shot)
  const showVillagers = t >= b3.start + 0.3 && activeBeat.id !== 4;
  const showRoleBadges = activeBeat.id >= 5;

  // Timelapse construction progress (Beat 9: 0 -> 1, Beat 10: 1)
  let buildProgress = 0;
  if (activeBeat.id === 9) {
    buildProgress = clamp((t - (b9.start + 0.35)) / Math.max(1.2, b9.end - b9.start - 0.95));
  } else if (activeBeat.id >= 10) {
    buildProgress = 1;
  }

  // Clock time text during Beat 9 timelapse
  const timelapseHour = Math.min(17, 9 + Math.floor(buildProgress * 8.5));

  // Badge "HARI 2" visible from frame 0
  const badgePop = 0.78 + 0.22 * spring(f, 0, 10, 210);

  // Active kinetic subtitle clause
  const activeClause = activeBeat.clauses.find((c) => t >= c.start - 0.04 && t <= c.end + 0.1);
  const speakerLabel =
    activeBeat.id >= 5 && activeBeat.id <= 8 && activeClause?.speaker
      ? SPEAKER_LABELS[activeClause.speaker]
      : null;

  // Closing CTA card
  const ctaStartFrame = fr(ctaSec);
  const showCta = f >= ctaStartFrame;
  const ctaSpring = showCta ? spring(f, ctaStartFrame, 10, 220) : 0;
  const landSq = activeBeat.id === 1 && f >= fr(0.8) ? squash(f - fr(0.8)) : { sx: 1, sy: 1 };

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
          transform={`translate(${W / 2 + camPanX + microShake}, ${H / 2 + camPanY + microShake * 0.4}) scale(${camZoom}) translate(${-W / 2}, ${-H / 2})`}
        >
          {/* LAYER 0: Sky, Sun, Clouds & Trees Backdrop */}
          <EmptyVillageBackdrop
            frame={f}
            parallaxBgX={-camPanX * 0.45}
            parallaxBgY={-camPanY * 0.45}
          />

          {/* LAYER 1: Green Meadow, Village Road, Flagpole, Penduduk 0->100 Board, and Timelapse Buildings */}
          <g transform={`translate(${-camPanX * 0.2}, ${-camPanY * 0.2})`}>
            <EmptyVillageGround frame={f} />

            {/* Side-by-side Sekolah + Masjid + Gereja built in Beat 9 Timelapse & standing in Beat 10 */}
            <TimelapsedBuildings frame={f} progress={buildProgress} />

            {/* Flagpole on far-left grass */}
            <g transform="translate(-44, 25) scale(0.92)">
              <FlagpoleMerahPutih frame={f} highlight={false} />
            </g>

            {/* Wooden PENDUDUK: 0 -> 100 signboard */}
            <PendudukSignBoardEp2 frame={f} count={pendudukCount} pulse={signPulsing} />
          </g>

          {/* Back-row Crowd Villagers (14 extra villagers WITHOUT usernames) */}
          {showVillagers &&
            CROWD_WARGA.map((cw, idx) => {
              const exitTime = b3.start + cw.exitDelay;
              if (t < exitTime) return null;
              const popU = activeBeat.id === 3 ? spring(f, fr(exitTime), 11, 200) : 1;
              const startX = activeBeat.id === 3 ? lerp(460, cw.x, popU) : cw.x;
              const startY = activeBeat.id === 3 ? lerp(1090, cw.y, popU) : cw.y;
              const cwPose =
                activeBeat.id === 9 && buildProgress < 0.95
                  ? 'work_hammer'
                  : activeBeat.id >= 9
                  ? 'cheer'
                  : 'idle';

              return (
                <WargaCharacter
                  key={`crowd-${idx}`}
                  frame={f}
                  x={startX}
                  y={startY}
                  scale={cw.scale * (0.7 + 0.3 * popU)}
                  shirt={cw.shirt}
                  shirtShade={cw.shirtShade}
                  hairColor={cw.hairColor}
                  hairStyle={cw.hairStyle}
                  skin={cw.skin}
                  pose={cwPose}
                  seed={idx + 10}
                />
              );
            })}

          {/* SpongeBob-style Orange Bus (Beats 2 & 3) */}
          {showBus && (
            <OrangeBus
              frame={f}
              x={busX}
              y={busY}
              scale={busScale}
              doorOpen={busDoor}
              speed={busSpeed}
            />
          )}

          {/* 6 Named Main IG Villagers (ONLY these 6 have usernames above heads!) */}
          {showVillagers &&
            MAIN_WARGA.map((mw, idx) => {
              const exitTime = b3.start + mw.exitDelay;
              if (t < exitTime) return null;
              const popU = activeBeat.id === 3 ? spring(f, fr(exitTime), 10, 195) : 1;
              const mx = activeBeat.id === 3 ? lerp(460, mw.x, popU) : mw.x;
              const my = activeBeat.id === 3 ? lerp(1100, mw.y, popU) : mw.y;

              const isSpeaking = mouthSample.speaker === mw.id;
              let wPose: 'idle' | 'raise_hand' | 'wave' | 'work_hammer' | 'cheer' = 'idle';
              if (activeBeat.id === 9 && buildProgress < 0.95) {
                wPose = 'work_hammer';
              } else if (activeBeat.id >= 9) {
                wPose = 'cheer';
              } else if (isSpeaking) {
                wPose = 'raise_hand';
              } else if (
                (activeBeat.id === 5 && mw.id === 'vinzz') ||
                (activeBeat.id === 6 && mw.id === 'epan') ||
                (activeBeat.id === 7 && mw.id === 'dzik') ||
                (activeBeat.id === 8 && mw.id === 'ary')
              ) {
                wPose = 'wave';
              }

              return (
                <WargaCharacter
                  key={mw.id}
                  frame={f}
                  x={mx}
                  y={my}
                  scale={mw.scale * (0.7 + 0.3 * popU)}
                  shirt={mw.shirt}
                  shirtShade={mw.shirtShade}
                  hairColor={mw.hairColor}
                  hairStyle={mw.hairStyle}
                  skin={mw.skin}
                  skinShadow={mw.skinShadow}
                  glasses={mw.glasses}
                  username={mw.username}
                  roleBadge={showRoleBadges ? mw.roleBadge : undefined}
                  pose={wPose}
                  mouthOpen={isSpeaking ? mouthSample.open : 0}
                  mouthVowel={isSpeaking ? mouthSample.v : 'closed'}
                  highlighted={isSpeaking}
                  showLabel={false}
                  seed={idx + 1}
                />
              );
            })}

          {/* Pak Kades (exact same Ep 1 design, scaled for wide group shots) */}
          <PakKades
            frame={f}
            x={kadesX}
            y={kadesY}
            scale={kadesScale}
            pose={kadesPose}
            mouthOpen={kadesMouthOpen}
            mouthVowel={kadesMouthVowel}
            lookX={kadesLookX}
            lookY={kadesLookY}
            eyebrowMood={kadesEyebrow}
            squashX={landSq.sx}
            squashY={landSq.sy}
          />

          {/* Kucing Oranye (still hanging out, NOT counted as resident!) */}
          {activeBeat.id !== 4 && (
            <g>
              <KucingOranye
                frame={f}
                x={632}
                y={1308}
                scale={0.68}
                excited={activeBeat.id === 10}
                lookAtKades={activeBeat.id === 10}
              />
              {activeBeat.id === 10 && (
                <g transform={`translate(632, 1388) scale(${spring(f, fr(b10.start + 0.2), 10, 210)})`}>
                  <rect x={-72} y={-16} width={144} height={30} rx={9} fill="#FFF7ED" stroke="#18181B" strokeWidth={3.5} />
                  <text
                    x={0}
                    y={5}
                    textAnchor="middle"
                    fontFamily="Poppins, sans-serif"
                    fontWeight={800}
                    fontSize={16}
                    fill="#C2410C"
                  >
                    MASIH NUMPANG
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Top-pass Username + Role labels for ONLY the 6 Main Named Warga (always crisp & unoccluded!) */}
          {showVillagers &&
            MAIN_WARGA.map((mw) => {
              const exitTime = b3.start + mw.exitDelay;
              if (t < exitTime) return null;
              const popU = activeBeat.id === 3 ? spring(f, fr(exitTime), 10, 195) : 1;
              const mx = activeBeat.id === 3 ? lerp(460, mw.x, popU) : mw.x;
              const my = activeBeat.id === 3 ? lerp(1100, mw.y, popU) : mw.y;
              const isSpeaking = mouthSample.speaker === mw.id;
              const activeScale = (mw.scale * (0.7 + 0.3 * popU)) * (isSpeaking ? 1.09 : 1);
              return (
                <WargaNameTag
                  key={`tag-${mw.id}`}
                  x={mx}
                  y={my}
                  scale={activeScale}
                  username={mw.username}
                  roleBadge={showRoleBadges ? mw.roleBadge : undefined}
                  highlighted={isSpeaking}
                />
              );
            })}

          {/* Smartphone IG (@kampung.amanah 100 pengikut) -> FB Page (no follower count) in Beat 4 */}
          {showPhone && (
            <PhoneProfileOverlay
              slideProgress={phoneSlideProgress}
              enterScale={0.76 * (0.65 + 0.35 * phoneEnter)}
            />
          )}
        </g>
      </svg>

      {/* ON-SCREEN HUD & SUBTITLES */}

      {/* 1. Badge "HARI 2" (visible from frame 0) */}
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
          <span>HARI 2</span>
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

      {/* Timelapse Indicator during Beat 9 (below HARI 2 on left sky, clear of sun) */}
      {activeBeat.id === 9 && (
        <div
          style={{
            position: 'absolute',
            top: 326,
            left: 64,
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
              fontSize: 26,
            }}
          >
            TIMELAPSE · {String(timelapseHour).padStart(2, '0')}:00
          </span>
        </div>
      )}

      {/* 2. KINETIC WORD-BY-WORD SUBTITLES */}
      {activeClause && (
        <div
          style={{
            position: 'absolute',
            left: 56,
            right: 56,
            top: activeBeat.id === 10 ? 1445 : 1410,
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
              columnGap: 28,
              rowGap: 8,
              textAlign: 'center',
            }}
          >
            {activeClause.words.map((word, idx) => {
              if (t < word.s) return null;
              const wordStartFrame = fr(word.s);
              const pop = spring(f, wordStartFrame, 10, 280, 0.6);
              const isSpeakingNow = t >= word.s && t <= word.e;
              const wordScale = (0.58 + 0.42 * pop) * (isSpeakingNow ? 1.05 : 1.0);
              const ty = (1 - pop) * 24;

              return (
                <span
                  key={`${activeClause.start}-${idx}`}
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Bricolage Grotesque', 'Poppins', sans-serif",
                    fontWeight: 900,
                    fontSize: 60,
                    lineHeight: 1.1,
                    color: word.kw ? '#FACC15' : '#FFFFFF',
                    WebkitTextStroke: '13px #18181B',
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
        </div>
      )}

      {/* 3. CLOSING CARD (Beat 10 only, AFTER Beat 9 timelapse building!) */}
      {showCta && (
        <div
          style={{
            position: 'absolute',
            left: 64,
            right: 64,
            top: 1625,
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
              padding: '20px 36px',
              fontFamily: "'Bricolage Grotesque', 'Poppins', sans-serif",
              fontWeight: 900,
              fontSize: 42,
              letterSpacing: '0.01em',
              lineHeight: 1.15,
              textAlign: 'center',
            }}
          >
            Besok bangun apa lagi?
            <br />
            Komen, yang paling rame duluan.
          </div>
        </div>
      )}
    </div>
  );
};
