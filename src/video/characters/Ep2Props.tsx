import React from 'react';
import { clamp, easeOutCubic } from '../motion';

const OUTLINE = '#18181B';

export const OrangeBus: React.FC<{
  frame: number;
  x: number;
  y: number;
  scale?: number;
  doorOpen?: number; // 0..1
  speed?: number;
}> = ({ frame, x, y, scale = 1, doorOpen = 0, speed = 0 }) => {
  const wheelSpin = speed > 0.05 ? frame * 26 : 0;
  const bounce = speed > 0.05 ? Math.sin(frame * 0.7) * 4 : Math.sin(frame * 0.14) * 1.2;

  return (
    <g transform={`translate(${x}, ${y + bounce}) scale(${scale})`}>
      {/* Road contact shadow */}
      <ellipse cx={0} cy={148} rx={235} ry={24} fill="#334155" opacity={0.38} />

      {/* Cartoon exhaust puffs when moving */}
      {speed > 0.05 &&
        [0, 1, 2].map((p) => {
          const offset = ((frame * 9 + p * 34) % 95);
          return (
            <circle
              key={p}
              cx={-245 - offset}
              cy={115 - offset * 0.35}
              r={14 + offset * 0.18}
              fill="#E2E8F0"
              stroke={OUTLINE}
              strokeWidth={3}
              opacity={1 - offset / 95}
            />
          );
        })}

      {/* Retro SpongeBob-style rounded boxy Orange Bus body */}
      <path
        d="M -220 -82 C -220 -132, -182 -152, -110 -152 L 150 -152 C 204 -152, 228 -118, 232 -60 L 236 105 C 236 122, 222 132, 200 132 L -205 132 C -220 132, -228 118, -226 96 Z"
        fill="#F97316"
        stroke={OUTLINE}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      {/* Roof cel highlight */}
      <path
        d="M -185 -134 L 150 -134 C 178 -134, 195 -122, 202 -104 L -200 -104 C -196 -122, -189 -134, -185 -134 Z"
        fill="#FDBA74"
        opacity={0.6}
      />
      {/* Sunny yellow SpongeBob-bus belt stripe */}
      <rect x={-224} y={24} width={458} height={28} fill="#FACC15" stroke={OUTLINE} strokeWidth={4} />
      {/* Bus destination banner */}
      <rect x={-130} y={-142} width={220} height={30} rx={8} fill="#18181B" />
      <text
        x={-20}
        y={-120}
        textAnchor="middle"
        fontFamily="Bricolage Grotesque, Poppins, sans-serif"
        fontWeight={900}
        fontSize={19}
        fill="#FACC15"
      >
        BUS KAMPUNG AMANAH
      </text>

      {/* Rounded Glossy Windows with passenger silhouettes */}
      {[-175, -90, -5, 80].map((wx, idx) => (
        <g key={idx} transform={`translate(${wx}, -78)`}>
          <rect width={72} height={76} rx={16} fill="#BAE6FD" stroke={OUTLINE} strokeWidth={4} />
          <circle cx={36} cy={46} r={16} fill="#0284C7" opacity={0.38} />
          <path d="M 14 14 L 34 14 L 14 38 Z" fill="#FFFFFF" opacity={0.7} />
        </g>
      ))}

      {/* Front Windshield */}
      <path
        d="M 166 -78 L 214 -78 C 222 -78, 228 -44, 228 -2 L 166 -2 Z"
        fill="#BAE6FD"
        stroke={OUTLINE}
        strokeWidth={4}
        strokeLinejoin="round"
      />

      {/* Swing Door (opens when villagers hop out!) */}
      <g transform="translate(108, 12)">
        <rect x={0} y={0} width={52} height={114} rx={8} fill="#1E293B" stroke={OUTLINE} strokeWidth={4} />
        <g transform={`translate(${-doorOpen * 38}, 0) scale(${1 - doorOpen * 0.55}, 1)`}>
          <rect x={0} y={0} width={52} height={114} rx={8} fill="#FB923C" stroke={OUTLINE} strokeWidth={4} />
          <rect x={9} y={10} width={34} height={46} rx={6} fill="#BAE6FD" stroke={OUTLINE} strokeWidth={3} />
        </g>
      </g>

      {/* Chrome Bumper & Glowing Headlight */}
      <rect x={212} y={76} width={34} height={24} rx={10} fill="#E2E8F0" stroke={OUTLINE} strokeWidth={4} />
      <rect x={-236} y={76} width={28} height={24} rx={8} fill="#E2E8F0" stroke={OUTLINE} strokeWidth={4} />
      <circle cx={224} cy={42} r={14} fill="#FEF08A" stroke={OUTLINE} strokeWidth={4} />

      {/* Big Cartoon Wheels */}
      {[-130, 145].map((wx, idx) => (
        <g key={idx} transform={`translate(${wx}, 130) rotate(${wheelSpin})`}>
          <circle cx={0} cy={0} r={38} fill="#18181B" stroke={OUTLINE} strokeWidth={4} />
          <circle cx={0} cy={0} r={20} fill="#E2E8F0" stroke={OUTLINE} strokeWidth={3.5} />
          <line x1={-16} y1={0} x2={16} y2={0} stroke="#64748B" strokeWidth={4} />
          <line x1={0} y1={-16} x2={0} y2={16} stroke="#64748B" strokeWidth={4} />
          <circle cx={0} cy={0} r={6} fill="#FACC15" stroke={OUTLINE} strokeWidth={2.5} />
        </g>
      ))}
    </g>
  );
};

export const PendudukSignBoardEp2: React.FC<{
  frame: number;
  count: number;
  pulse?: boolean;
}> = ({ frame, count, pulse = false }) => {
  const sway = Math.sin(frame * 0.06) * 0.6;
  const nudge = pulse ? 1 + 0.06 * Math.sin(frame * 0.45) : 1;

  return (
    <g transform={`translate(958, 905) rotate(${sway}) scale(${nudge * 0.72})`}>
      <rect x={-84} y={70} width={22} height={225} rx={4} fill="#92400E" stroke={OUTLINE} strokeWidth={4} />
      <rect x={62} y={70} width={22} height={225} rx={4} fill="#78350F" stroke={OUTLINE} strokeWidth={4} />
      <path d="M -100 295 L -88 272 L -74 290 L -60 276 L -48 295 Z" fill="#4ADE80" stroke={OUTLINE} strokeWidth={3.5} />
      <path d="M 48 295 L 60 276 L 74 290 L 88 272 L 100 295 Z" fill="#4ADE80" stroke={OUTLINE} strokeWidth={3.5} />

      <rect x={-124} y={-68} width={256} height={164} rx={16} fill={OUTLINE} />
      <rect x={-130} y={-74} width={256} height={164} rx={16} fill="#FEF3C7" stroke={OUTLINE} strokeWidth={4.5} />
      <rect x={-130} y={-74} width={256} height={44} rx={14} fill="#D97706" stroke={OUTLINE} strokeWidth={4} />
      <circle cx={-106} cy={-52} r={5} fill="#451A03" />
      <circle cx={102} cy={-52} r={5} fill="#451A03" />

      <text
        x={-2}
        y={-43}
        textAnchor="middle"
        fontFamily="Poppins, sans-serif"
        fontWeight={900}
        fontSize={24}
        letterSpacing={1.5}
        fill="#FFFFFF"
      >
        PENDUDUK:
      </text>

      <text
        x={-2}
        y={60}
        textAnchor="middle"
        fontFamily="Bricolage Grotesque, Poppins, sans-serif"
        fontWeight={900}
        fontSize={count >= 100 ? 78 : 88}
        fill={count >= 100 ? '#16A34A' : '#DC2626'}
        stroke={OUTLINE}
        strokeWidth={5}
        style={{ paintOrder: 'stroke fill' }}
      >
        {count}
      </text>
    </g>
  );
};

export const PhoneProfileOverlay: React.FC<{
  slideProgress: number; // 0..1 (0..0.42 IG, 0.42..0.58 swipe, 0.58..1.0 FB)
  enterScale: number;
}> = ({ slideProgress, enterScale }) => {
  const swipeT = clamp((slideProgress - 0.44) / 0.16);
  const swipeEase = easeOutCubic(swipeT);
  const igX = -swipeEase * 560;
  const fbX = (1 - swipeEase) * 560;

  return (
    <g transform={`translate(540, 775) scale(${enterScale})`}>
      {/* Drop shadow */}
      <rect x={-268} y={-405} width={548} height={810} rx={54} fill={OUTLINE} />
      {/* Smartphone outer frame */}
      <rect
        x={-278}
        y={-415}
        width={548}
        height={810}
        rx={54}
        fill="#18181B"
        stroke={OUTLINE}
        strokeWidth={6}
      />

      <defs>
        <clipPath id="phoneScreenClip">
          <rect x={-250} y={-382} width={492} height={744} rx={36} />
        </clipPath>
      </defs>

      {/* Screen canvas */}
      <rect x={-250} y={-382} width={492} height={744} rx={36} fill="#FFFFFF" />

      <g clipPath="url(#phoneScreenClip)">
        {/* SLIDE 1: INSTAGRAM @kampung.amanah with LARGE "100 pengikut" */}
        <g transform={`translate(${igX}, 0)`}>
          <rect x={-250} y={-382} width={492} height={744} fill="#FFFFFF" />
          {/* Top IG Header */}
          <rect x={-250} y={-382} width={492} height={116} fill="#FAFAFA" stroke="#E4E4E7" strokeWidth={3} />
          <text
            x={-4}
            y={-304}
            textAnchor="middle"
            fontFamily="Bricolage Grotesque, Poppins, sans-serif"
            fontWeight={900}
            fontSize={34}
            fill="#18181B"
          >
            @kampung.amanah
          </text>

          {/* IG Gradient ring + Avatar */}
          <circle cx={-146} cy={-166} r={66} fill="#E1306C" stroke={OUTLINE} strokeWidth={4} />
          <circle cx={-146} cy={-166} r={54} fill="#38BDF8" stroke="#FFFFFF" strokeWidth={5} />
          <rect x={-168} y={-194} width={44} height={24} rx={10} fill="#18181B" />
          <circle cx={-146} cy={-162} r={20} fill="#E2A87E" stroke={OUTLINE} strokeWidth={3} />

          {/* BIG "100 pengikut" card highlight */}
          <rect
            x={-52}
            y={-236}
            width={265}
            height={146}
            rx={24}
            fill="#FEF08A"
            stroke={OUTLINE}
            strokeWidth={5}
          />
          <text
            x={80}
            y={-152}
            textAnchor="middle"
            fontFamily="Bricolage Grotesque, Poppins, sans-serif"
            fontWeight={900}
            fontSize={74}
            fill="#18181B"
          >
            100
          </text>
          <text
            x={80}
            y={-108}
            textAnchor="middle"
            fontFamily="Poppins, sans-serif"
            fontWeight={800}
            fontSize={30}
            fill="#18181B"
          >
            pengikut
          </text>

          {/* Bio */}
          <text x={-212} y={-40} fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={28} fill="#18181B">
            Kampung Amanah
          </text>
          <text x={-212} y={-2} fontFamily="Poppins, sans-serif" fontWeight={600} fontSize={23} fill="#52525B">
            Desa dibangun bareng netizen!
          </text>

          {/* Follow button */}
          <rect x={-212} y={32} width={416} height={60} rx={16} fill="#0095F6" stroke={OUTLINE} strokeWidth={4} />
          <text x={-4} y={71} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={26} fill="#FFFFFF">
            Mengikuti ✓
          </text>

          {/* Post grid preview (Ep 1 tile) */}
          {[0, 1, 2].map((col) => (
            <g key={col} transform={`translate(${-212 + col * 142}, 124)`}>
              <rect width={130} height={190} rx={12} fill={col === 0 ? '#7DD3FC' : '#E4E4E7'} stroke={OUTLINE} strokeWidth={3} />
              {col === 0 && (
                <>
                  <rect x={0} y={118} width={130} height={72} rx={8} fill="#22C55E" />
                  <rect x={14} y={16} width={54} height={24} rx={6} fill="#FACC15" stroke={OUTLINE} strokeWidth={2} />
                  <text x={41} y={33} textAnchor="middle" fontSize={13} fontWeight={900} fill="#18181B">
                    HARI 1
                  </text>
                </>
              )}
            </g>
          ))}
        </g>

        {/* SLIDE 2: FACEBOOK PAGE "Kampung Amanah" (NAME + LOGO ONLY — STRICTLY NO FOLLOWER COUNT!) */}
        <g transform={`translate(${fbX}, 0)`}>
          <rect x={-250} y={-382} width={492} height={744} fill="#FFFFFF" />
          {/* Blue Facebook cover banner */}
          <rect x={-250} y={-382} width={492} height={248} fill="#1877F2" />
          <path d="M -250 -175 Q -40 -220 242 -165 L 242 -134 L -250 -134 Z" fill="#22C55E" />

          {/* Facebook Page Logo Circle */}
          <circle cx={-4} cy={-146} r={82} fill="#1877F2" stroke="#FFFFFF" strokeWidth={8} />
          <text
            x={-4}
            y={-114}
            textAnchor="middle"
            fontFamily="Bricolage Grotesque, Poppins, sans-serif"
            fontWeight={900}
            fontSize={106}
            fill="#FFFFFF"
          >
            f
          </text>

          {/* Page Name (NO follower count displayed!) */}
          <text
            x={-4}
            y={-8}
            textAnchor="middle"
            fontFamily="Bricolage Grotesque, Poppins, sans-serif"
            fontWeight={900}
            fontSize={44}
            fill="#18181B"
          >
            Kampung Amanah
          </text>
          <rect x={-136} y={18} width={264} height={42} rx={12} fill="#EFF6FF" stroke="#BFDBFE" strokeWidth={3} />
          <text x={-4} y={47} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight={700} fontSize={22} fill="#1D4ED8">
            Halaman Resmi Desa
          </text>

          {/* Action button */}
          <rect x={-196} y={96} width={384} height={66} rx={16} fill="#1877F2" stroke={OUTLINE} strokeWidth={4} />
          <text x={-4} y={138} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={28} fill="#FFFFFF">
            👍 Ikuti Halaman
          </text>

          {/* Clean post card preview */}
          <rect x={-196} y={190} width={384} height={134} rx={18} fill="#F4F4F5" stroke="#D4D4D8" strokeWidth={3} />
          <text x={-170} y={232} fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={22} fill="#18181B">
            Kampung Amanah
          </text>
          <text x={-170} y={268} fontFamily="Poppins, sans-serif" fontWeight={500} fontSize={20} fill="#52525B">
            Hari kedua — ayo kasih usulan
          </text>
          <text x={-170} y={298} fontFamily="Poppins, sans-serif" fontWeight={500} fontSize={20} fill="#52525B">
            bangunan kampung di komentar!
          </text>
        </g>
      </g>

      {/* Notch & Home Indicator */}
      <rect x={-64} y={-370} width={128} height={22} rx={11} fill="#18181B" />
      <rect x={-68} y={338} width={136} height={8} rx={4} fill="#18181B" opacity={0.45} />

      {/* Pak Kades cartoon fingers gripping the side edge */}
      <ellipse cx={256} cy={120} rx={36} ry={22} fill="#E2A87E" stroke={OUTLINE} strokeWidth={4.5} />
      <ellipse cx={256} cy={175} rx={36} ry={22} fill="#E2A87E" stroke={OUTLINE} strokeWidth={4.5} />
      <ellipse cx={256} cy={230} rx={34} ry={20} fill="#E2A87E" stroke={OUTLINE} strokeWidth={4.5} />
    </g>
  );
};

export const TimelapsedBuildings: React.FC<{
  frame: number;
  progress: number; // 0..1 during timelapse, 1 when done
}> = ({ frame, progress }) => {
  if (progress <= 0.01) return null;
  const rise1 = easeOutCubic(clamp(progress * 1.4));
  const rise2 = easeOutCubic(clamp((progress - 0.14) * 1.4));
  const rise3 = easeOutCubic(clamp((progress - 0.28) * 1.4));
  const buildingNow = progress < 0.96;

  return (
    <g>
      {/* 1. SEKOLAH (Left) */}
      <g transform={`translate(238, 1020) scale(${(0.75 + 0.25 * rise1) * 0.84}, ${rise1 * 0.84})`}>
        {/* Building shadow */}
        <ellipse cx={0} cy={6} rx={142} ry={18} fill="#15803D" opacity={0.35} />
        {/* Main cream wall */}
        <rect x={-122} y={-146} width={244} height={148} rx={6} fill="#FEF3C7" stroke={OUTLINE} strokeWidth={4.5} />
        {/* Terracotta gable roof */}
        <path
          d="M -140 -142 L 0 -224 L 140 -142 Z"
          fill="#DC2626"
          stroke={OUTLINE}
          strokeWidth={4.5}
          strokeLinejoin="round"
        />
        {/* Signboard "SEKOLAH" */}
        <rect x={-72} y={-136} width={144} height={32} rx={8} fill="#FACC15" stroke={OUTLINE} strokeWidth={3.5} />
        <text
          x={0}
          y={-113}
          textAnchor="middle"
          fontFamily="Bricolage Grotesque, Poppins, sans-serif"
          fontWeight={900}
          fontSize={21}
          fill="#18181B"
        >
          SEKOLAH
        </text>
        {/* Double doors & windows */}
        <rect x={-26} y={-72} width={52} height={74} rx={5} fill="#92400E" stroke={OUTLINE} strokeWidth={3.5} />
        <line x1={0} y1={-72} x2={0} y2={2} stroke={OUTLINE} strokeWidth={3} />
        {[-92, 50].map((wx, idx) => (
          <rect key={idx} x={wx} y={-88} width={42} height={44} rx={6} fill="#7DD3FC" stroke={OUTLINE} strokeWidth={3.5} />
        ))}
        {/* School bell */}
        <circle cx={0} cy={-174} r={14} fill="#FACC15" stroke={OUTLINE} strokeWidth={3} />
      </g>

      {/* 2. MASJID (Center) */}
      <g transform={`translate(488, 1018) scale(${(0.75 + 0.25 * rise2) * 0.85}, ${rise2 * 0.85})`}>
        <ellipse cx={0} cy={6} rx={148} ry={18} fill="#15803D" opacity={0.35} />
        {/* Side Minaret */}
        <rect x={88} y={-236} width={38} height={238} rx={4} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={4} />
        <path d="M 82 -236 C 82 -264, 132 -264, 132 -236 Z" fill="#16A34A" stroke={OUTLINE} strokeWidth={4} />
        <line x1={107} y1={-258} x2={107} y2={-276} stroke={OUTLINE} strokeWidth={3.5} />
        <circle cx={107} cy={-280} r={6} fill="#FACC15" stroke={OUTLINE} strokeWidth={2.5} />

        {/* Main Mosque body */}
        <rect x={-114} y={-142} width={212} height={144} rx={6} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={4.5} />
        {/* Green trim band */}
        <rect x={-114} y={-142} width={212} height={24} fill="#16A34A" stroke={OUTLINE} strokeWidth={4} />
        {/* Emerald Dome + Gold Crescent */}
        <path
          d="M -84 -142 C -86 -224, 68 -224, 66 -142 Z"
          fill="#22C55E"
          stroke={OUTLINE}
          strokeWidth={4.5}
        />
        <path
          d="M -46 -152 C -42 -200, -4 -206, 6 -196 C -20 -192, -32 -168, -32 -152 Z"
          fill="#86EFAC"
          opacity={0.7}
        />
        <line x1={-9} y1={-204} x2={-9} y2={-236} stroke={OUTLINE} strokeWidth={4} />
        <path d="M -9 -248 A 11 11 0 1 0 3 -236 A 8 8 0 1 1 -9 -248 Z" fill="#FACC15" stroke={OUTLINE} strokeWidth={2.5} />

        {/* Arched doorway & windows */}
        <path d="M -32 2 L -32 -66 C -32 -94, 14 -94, 14 -66 L 14 2 Z" fill="#0F766E" stroke={OUTLINE} strokeWidth={3.8} />
        {[-82, 42].map((wx, idx) => (
          <path
            key={idx}
            d={`M ${wx} -36 L ${wx} -78 C ${wx} -94, ${wx + 32} -94, ${wx + 32} -78 L ${wx + 32} -36 Z`}
            fill="#BAE6FD"
            stroke={OUTLINE}
            strokeWidth={3.5}
          />
        ))}
      </g>

      {/* 3. GEREJA (Right, side-by-side next to Masjid) */}
      <g transform={`translate(724, 1020) scale(${(0.75 + 0.25 * rise3) * 0.84}, ${rise3 * 0.84})`}>
        <ellipse cx={0} cy={6} rx={138} ry={18} fill="#15803D" opacity={0.35} />
        {/* Main Sanctuary Wall */}
        <rect x={-106} y={-144} width={212} height={146} rx={6} fill="#F8FAFC" stroke={OUTLINE} strokeWidth={4.5} />
        {/* Sky-Blue Gable Roof */}
        <path
          d="M -124 -140 L 0 -216 L 124 -140 Z"
          fill="#2563EB"
          stroke={OUTLINE}
          strokeWidth={4.5}
          strokeLinejoin="round"
        />
        {/* Steeple & Cross */}
        <rect x={-26} y={-258} width={52} height={64} fill="#F8FAFC" stroke={OUTLINE} strokeWidth={4} />
        <path d="M -34 -256 L 0 -308 L 34 -256 Z" fill="#1D4ED8" stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />
        {/* Cross */}
        <line x1={0} y1={-308} x2={0} y2={-346} stroke="#FACC15" strokeWidth={8} strokeLinecap="round" />
        <line x1={-14} y1={-332} x2={14} y2={-332} stroke="#FACC15" strokeWidth={8} strokeLinecap="round" />
        <line x1={0} y1={-308} x2={0} y2={-346} stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />
        <line x1={-14} y1={-332} x2={14} y2={-332} stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />

        {/* Round stained glass window + arched door */}
        <circle cx={0} cy={-166} r={18} fill="#FDE047" stroke={OUTLINE} strokeWidth={3.5} />
        <path d="M -26 2 L -26 -68 C -26 -94, 26 -94, 26 -68 L 26 2 Z" fill="#78350F" stroke={OUTLINE} strokeWidth={3.8} />
        {[-80, 48].map((wx, idx) => (
          <path
            key={idx}
            d={`M ${wx} -36 L ${wx} -78 C ${wx} -94, ${wx + 32} -94, ${wx + 32} -78 L ${wx + 32} -36 Z`}
            fill="#BAE6FD"
            stroke={OUTLINE}
            strokeWidth={3.5}
          />
        ))}
      </g>

      {/* Cartoon dust puffs during active construction timelapse */}
      {buildingNow &&
        [175, 310, 440, 625, 775].map((dx, i) => {
          const puffY = 930 - ((frame * 7 + i * 28) % 80);
          const puffR = 20 + Math.sin(frame * 0.5 + i) * 7;
          return (
            <circle
              key={i}
              cx={dx + Math.sin(frame * 0.4 + i) * 16}
              cy={puffY}
              r={puffR}
              fill="#F8FAFC"
              stroke={OUTLINE}
              strokeWidth={3}
              opacity={0.72}
            />
          );
        })}
    </g>
  );
};
