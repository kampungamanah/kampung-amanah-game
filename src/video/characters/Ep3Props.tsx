import React from 'react';
import { clamp, easeOutCubic } from '../motion';

const OUTLINE = '#18181B';

/**
 * Seamless extended village sky, sun, rolling hills, and distant trees spanning x = -1400..4400
 * covering Main Village (x=0..1100), Side Football Meadow (x=1200..2200), and New Housing Neighborhood (x=2250..3600).
 */
export const Ep3ExtendedBackdrop: React.FC<{
  frame: number;
  parallaxBgX?: number;
  parallaxBgY?: number;
}> = ({ frame, parallaxBgX = 0, parallaxBgY = 0 }) => {
  const cloudDrift = Math.sin(frame * 0.025) * 18;
  const sunPulse = 1 + Math.sin(frame * 0.08) * 0.03;

  const treePositions = [
    -520, -340, -160, 12, 168, 345, 530, 710, 895, 1085, 1270, 1455, 1645,
    1835, 2025, 2215, 2410, 2610, 2810, 3010, 3210, 3410, 3620, 3840,
  ];

  return (
    <g>
      <defs>
        <linearGradient id="ep3SkyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="55%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>

      {/* Oversized sky fill */}
      <rect x={-1600} y={-900} width={6600} height={2600} fill="url(#ep3SkyGrad)" />

      <g transform={`translate(${parallaxBgX}, ${parallaxBgY})`}>
        {/* Sun */}
        <g transform={`translate(930, 250) scale(${sunPulse})`}>
          <circle cx={0} cy={0} r={108} fill="#FDE047" opacity={0.28} />
          <circle cx={0} cy={0} r={74} fill="#FACC15" stroke={OUTLINE} strokeWidth={4} />
          <circle cx={-16} cy={-16} r={18} fill="#FEF08A" opacity={0.85} />
        </g>

        {/* Cartoon Clouds across wide 5000px sky */}
        {[
          { cx: -220, cy: 235, s: 1.0 },
          { cx: 240, cy: 255, s: 1.05 },
          { cx: 740, cy: 195, s: 0.9 },
          { cx: 1280, cy: 240, s: 1.1 },
          { cx: 1840, cy: 205, s: 0.95 },
          { cx: 2380, cy: 245, s: 1.05 },
          { cx: 2940, cy: 200, s: 0.95 },
          { cx: 3480, cy: 248, s: 1.0 },
        ].map((c, idx) => (
          <g
            key={idx}
            transform={`translate(${c.cx + cloudDrift * (idx % 2 === 0 ? 1 : -0.75)}, ${c.cy}) scale(${c.s})`}
          >
            <path
              d="M -95 25 C -125 25, -135 -18, -98 -28 C -92 -68, -32 -78, -8 -45 C 18 -72, 74 -58, 76 -20 C 118 -14, 114 25, 78 25 Z"
              fill="#FFFFFF"
              stroke={OUTLINE}
              strokeWidth={4}
              strokeLinejoin="round"
            />
          </g>
        ))}

        {/* Distant rolling green hills spanning entire world */}
        <path
          d="M -1400 1030 Q -700 845 0 980 Q 640 870 1280 970 Q 1920 855 2560 965 Q 3200 865 3840 975 Q 4300 900 4700 1020 L 4700 1280 L -1400 1280 Z"
          fill="#86EFAC"
          stroke={OUTLINE}
          strokeWidth={4}
        />

        {/* Background flat-2D cartoon trees */}
        {treePositions.map((tx, idx) => {
          const ty = 955 + ((idx % 3) - 1) * 14;
          const sc = 0.8 + (idx % 3) * 0.14;
          const sway = Math.sin(frame * 0.05 + idx) * 1.6;
          return (
            <g key={tx} transform={`translate(${tx}, ${ty}) scale(${sc}) rotate(${sway})`}>
              <rect x={-12} y={-20} width={24} height={95} rx={6} fill="#92400E" stroke={OUTLINE} strokeWidth={4} />
              <circle cx={0} cy={-64} r={54} fill="#16A34A" stroke={OUTLINE} strokeWidth={4} />
              <circle cx={-32} cy={-38} r={40} fill="#22C55E" stroke={OUTLINE} strokeWidth={4} />
              <circle cx={34} cy={-36} r={40} fill="#15803D" stroke={OUTLINE} strokeWidth={4} />
              <circle cx={-10} cy={-76} r={34} fill="#4ADE80" />
            </g>
          );
        })}
      </g>
    </g>
  );
};

/**
 * Village meadow & lower village road.
 * IMPORTANT: The paved road is placed cleanly BELOW the green side meadow (y = 1520..1670)
 * so the Football Field (y = 1105..1375) and New Houses (y = 1120..1380) sit 100% ON lush green grass,
 * NEVER overlapping the paved road!
 */
export const Ep3ExtendedGround: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <g>
      {/* Main saturated green village grass meadow spanning x = -1600..4800 */}
      <path
        d="M -1600 995 Q -400 970 600 988 Q 1800 970 3100 988 Q 4000 975 4800 998 L 4800 2600 L -1600 2600 Z"
        fill="#22C55E"
        stroke={OUTLINE}
        strokeWidth={4}
      />

      {/* Sunlit upper lawn strip */}
      <path
        d="M -1600 995 Q -400 970 600 988 Q 1800 970 3100 988 Q 4000 975 4800 998 L 4800 1160 Q 3100 1142 1800 1154 Q 600 1142 -1600 1160 Z"
        fill="#4ADE80"
        opacity={0.72}
      />

      {/* Low wooden divider fence separating the side meadow (field + housing) from the front village road */}
      <g>
        {Array.from({ length: 18 }, (_, i) => {
          const fx = 1170 + i * 130;
          return (
            <g key={fx} transform={`translate(${fx}, 1468)`}>
              <rect x={-5} y={-22} width={10} height={36} rx={3} fill="#92400E" stroke={OUTLINE} strokeWidth={3} />
            </g>
          );
        })}
        <rect x={1165} y={1454} width={2225} height={9} rx={4} fill="#B45309" stroke={OUTLINE} strokeWidth={3} />
        <rect x={1165} y={1469} width={2225} height={8} rx={4} fill="#A16207" stroke={OUTLINE} strokeWidth={3} />
      </g>

      {/* Paved village road running cleanly ALONG THE FRONT LOWER FOREGROUND (y = 1520..1670) — NEVER under the pitch or houses! */}
      <path
        d="M -1600 1525 Q 200 1508 1400 1522 Q 2800 1510 4800 1525 L 4800 1685 Q 2800 1672 1400 1680 Q 200 1668 -1600 1685 Z"
        fill="#CBD5E1"
        stroke={OUTLINE}
        strokeWidth={4.5}
      />
      <path
        d="M -1600 1602 Q 200 1588 1400 1600 Q 2800 1590 4800 1602"
        stroke="#FFFFFF"
        strokeWidth={7}
        strokeDasharray="46 34"
        fill="none"
        opacity={0.88}
      />

      {/* Grass tufts scattered gently */}
      {[-120, 140, 390, 660, 920, 1180, 2140, 2320, 3360].map((gx, idx) => (
        <path
          key={gx}
          d={`M ${gx - 14} ${1418 + (idx % 2) * 18} L ${gx - 4} ${1396 + (idx % 2) * 18} L ${gx + 4} ${1413 + (idx % 2) * 18} L ${gx + 14} ${1393 + (idx % 2) * 18} L ${gx + 22} ${1418 + (idx % 2) * 18}`}
          stroke="#15803D"
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(${Math.sin(frame * 0.06 + idx) * 2}, ${gx}, ${1418})`}
        />
      ))}
    </g>
  );
};

export const PendudukSignBoardEp3: React.FC<{
  frame: number;
  x?: number;
  y?: number;
  count: number;
  pulse?: boolean;
}> = ({ frame, x = 975, y = 925, count, pulse = false }) => {
  const sway = Math.sin(frame * 0.06) * 0.6;
  const nudge = pulse ? 1 + 0.07 * Math.sin(frame * 0.45) : 1;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${sway}) scale(${nudge * 0.72})`}>
      <rect x={-84} y={70} width={22} height={210} rx={4} fill="#92400E" stroke={OUTLINE} strokeWidth={4} />
      <rect x={62} y={70} width={22} height={210} rx={4} fill="#78350F" stroke={OUTLINE} strokeWidth={4} />
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
        fontSize={78}
        fill={count >= 245 ? '#16A34A' : '#EA580C'}
        stroke={OUTLINE}
        strokeWidth={5}
        style={{ paintOrder: 'stroke fill' }}
      >
        {count}
      </text>
    </g>
  );
};

/**
 * Standing buildings from Episode 2 (Sekolah, Masjid, Gereja), anchored cleanly on the meadow.
 */
export const Ep3ExistingBuildings: React.FC<{
  frame: number;
  ballOnSchoolRoof?: boolean;
  ballFlightT?: number;
}> = ({ frame, ballOnSchoolRoof = false, ballFlightT = 0 }) => {
  const ft = clamp(ballFlightT);
  const bx = 680 + (258 - 680) * easeOutCubic(ft);
  const arcY = 1280 + (862 - 1280) * ft - Math.sin(ft * Math.PI) * 260;
  const bounceWobble = ballOnSchoolRoof && ft >= 0.99 ? Math.sin(frame * 0.45) * 2 : 0;

  return (
    <g>
      {/* 1. SEKOLAH (Left at x:228, y:1022) */}
      <g transform="translate(228, 1022) scale(0.84)">
        <ellipse cx={0} cy={6} rx={142} ry={18} fill="#15803D" opacity={0.35} />
        <rect x={-122} y={-146} width={244} height={148} rx={6} fill="#FEF3C7" stroke={OUTLINE} strokeWidth={4.5} />
        <path d="M -140 -142 L 0 -224 L 140 -142 Z" fill="#DC2626" stroke={OUTLINE} strokeWidth={4.5} strokeLinejoin="round" />
        <rect x={-72} y={-136} width={144} height={32} rx={8} fill="#FACC15" stroke={OUTLINE} strokeWidth={3.5} />
        <text x={0} y={-113} textAnchor="middle" fontFamily="Bricolage Grotesque, Poppins, sans-serif" fontWeight={900} fontSize={21} fill="#18181B">
          SEKOLAH
        </text>
        <rect x={-26} y={-72} width={52} height={74} rx={5} fill="#92400E" stroke={OUTLINE} strokeWidth={3.5} />
        <line x1={0} y1={-72} x2={0} y2={2} stroke={OUTLINE} strokeWidth={3} />
        {[-92, 50].map((wx, idx) => (
          <rect key={idx} x={wx} y={-88} width={42} height={44} rx={6} fill="#7DD3FC" stroke={OUTLINE} strokeWidth={3.5} />
        ))}
        <circle cx={0} cy={-174} r={14} fill="#FACC15" stroke={OUTLINE} strokeWidth={3} />
      </g>

      {/* 2. MASJID (Center at x:478, y:1020) */}
      <g transform="translate(478, 1020) scale(0.85)">
        <ellipse cx={0} cy={6} rx={148} ry={18} fill="#15803D" opacity={0.35} />
        <rect x={88} y={-236} width={38} height={238} rx={4} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={4} />
        <path d="M 82 -236 C 82 -264, 132 -264, 132 -236 Z" fill="#16A34A" stroke={OUTLINE} strokeWidth={4} />
        <line x1={107} y1={-258} x2={107} y2={-276} stroke={OUTLINE} strokeWidth={3.5} />
        <circle cx={107} cy={-280} r={6} fill="#FACC15" stroke={OUTLINE} strokeWidth={2.5} />
        <rect x={-114} y={-142} width={212} height={144} rx={6} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={4.5} />
        <rect x={-114} y={-142} width={212} height={24} fill="#16A34A" stroke={OUTLINE} strokeWidth={4} />
        <path d="M -84 -142 C -86 -224, 68 -224, 66 -142 Z" fill="#22C55E" stroke={OUTLINE} strokeWidth={4.5} />
        <path d="M -46 -152 C -42 -200, -4 -206, 6 -196 C -20 -192, -32 -168, -32 -152 Z" fill="#86EFAC" opacity={0.7} />
        <line x1={-9} y1={-204} x2={-9} y2={-236} stroke={OUTLINE} strokeWidth={4} />
        <path d="M -9 -248 A 11 11 0 1 0 3 -236 A 8 8 0 1 1 -9 -248 Z" fill="#FACC15" stroke={OUTLINE} strokeWidth={2.5} />
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

      {/* 3. GEREJA (Right at x:716, y:1022) */}
      <g transform="translate(716, 1022) scale(0.84)">
        <ellipse cx={0} cy={6} rx={138} ry={18} fill="#15803D" opacity={0.35} />
        <rect x={-106} y={-144} width={212} height={146} rx={6} fill="#F8FAFC" stroke={OUTLINE} strokeWidth={4.5} />
        <path d="M -124 -140 L 0 -216 L 124 -140 Z" fill="#2563EB" stroke={OUTLINE} strokeWidth={4.5} strokeLinejoin="round" />
        <rect x={-26} y={-258} width={52} height={64} fill="#F8FAFC" stroke={OUTLINE} strokeWidth={4} />
        <path d="M -34 -256 L 0 -308 L 34 -256 Z" fill="#1D4ED8" stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />
        <line x1={0} y1={-308} x2={0} y2={-346} stroke="#FACC15" strokeWidth={8} strokeLinecap="round" />
        <line x1={-14} y1={-332} x2={14} y2={-332} stroke="#FACC15" strokeWidth={8} strokeLinecap="round" />
        <line x1={0} y1={-308} x2={0} y2={-346} stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />
        <line x1={-14} y1={-332} x2={14} y2={-332} stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />
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

      {/* Comedy Soccer Ball kicked onto Sekolah Roof */}
      {ballOnSchoolRoof && (
        <g transform={`translate(${bx}, ${arcY + bounceWobble}) rotate(${ft * 540})`}>
          <circle cx={0} cy={0} r={20} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={4} />
          <polygon points="0,-9 8,-3 5,7 -5,7 -8,-3" fill="#18181B" />
          <line x1={0} y1={-9} x2={0} y2={-19} stroke={OUTLINE} strokeWidth={2.5} />
          <line x1={8} y1={-3} x2={18} y2={-6} stroke={OUTLINE} strokeWidth={2.5} />
          <line x1={-8} y1={-3} x2={-18} y2={-6} stroke={OUTLINE} strokeWidth={2.5} />
          <line x1={5} y1={7} x2={12} y2={16} stroke={OUTLINE} strokeWidth={2.5} />
          <line x1={-5} y1={7} x2={-12} y2={16} stroke={OUTLINE} strokeWidth={2.5} />
        </g>
      )}

      {ballOnSchoolRoof && ft >= 0.94 && (
        <g transform="translate(258, 862)">
          <path
            d="M -32 -14 L -16 -26 L -22 -42 L -2 -28 L 16 -44 L 14 -24 L 34 -18 L 18 -4"
            stroke="#FACC15"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
};

/**
 * Muddy puddles & overgrown bushes along main roadside (Beat 3 problem)
 */
export const MuddyBushesPlot: React.FC<{ x?: number; y?: number }> = ({ x = 960, y = 1405 }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx={-55} cy={22} rx={78} ry={22} fill="#78350F" stroke={OUTLINE} strokeWidth={3.5} />
      <ellipse cx={-68} cy={20} rx={42} ry={10} fill="#92400E" />
      <ellipse cx={64} cy={38} rx={64} ry={18} fill="#78350F" stroke={OUTLINE} strokeWidth={3.5} />
      <ellipse cx={52} cy={35} rx={30} ry={8} fill="#A16207" />

      {[
        { bx: -102, by: 2, s: 1.0 },
        { bx: -18, by: -12, s: 1.15 },
        { bx: 82, by: 4, s: 0.95 },
      ].map((b, idx) => (
        <g key={idx} transform={`translate(${b.bx}, ${b.by}) scale(${b.s})`}>
          <path
            d="M -42 18 C -52 -12, -26 -38, -8 -24 C 6 -46, 36 -38, 36 -14 C 54 -10, 52 18, 34 18 Z"
            fill="#15803D"
            stroke={OUTLINE}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <circle cx={-12} cy={-6} r={14} fill="#22C55E" opacity={0.55} />
        </g>
      ))}
    </g>
  );
};

/**
 * Flat-2D Football Field anchored 100% ON the green side meadow (x=1660, y=1240, bottom=1375),
 * completely ABOVE the fence (y=1468) and paved road (y=1520) — NEVER on the road!
 */
export const FootballField2D: React.FC<{
  frame: number;
  x?: number;
  y?: number;
  progress: number;
}> = ({ frame, x = 1660, y = 1240, progress }) => {
  const turfU = easeOutCubic(clamp(progress / 0.4));
  const linesU = easeOutCubic(clamp((progress - 0.32) / 0.36));
  const goalsU = easeOutCubic(clamp((progress - 0.62) / 0.34));
  const buildingNow = progress > 0.02 && progress < 0.96;

  const topW = 355;
  const botW = 430;
  const topY = -126;
  const botY = 136;

  const flagWave = Math.sin(frame * 0.25) * 5;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Rough cleared meadow dirt base before turf rolls out */}
      <polygon
        points={`${-topW - 18},${topY - 10} ${topW + 18},${topY - 10} ${botW + 22},${botY + 12} ${-botW - 22},${botY + 12}`}
        fill="#A16207"
        stroke={OUTLINE}
        strokeWidth={4.5}
        strokeLinejoin="round"
        opacity={progress < 0.05 ? 0.85 : 1}
      />

      {/* Lush Mowed Turf */}
      {turfU > 0.01 && (
        <g opacity={turfU}>
          <polygon
            points={`${-topW},${topY} ${topW},${topY} ${botW},${botY} ${-botW},${botY}`}
            fill="#16A34A"
            stroke={OUTLINE}
            strokeWidth={4.5}
            strokeLinejoin="round"
          />
          {[-3, -1, 1, 3].map((si) => {
            const fracL = (si + 4) / 8;
            const fracR = (si + 5) / 8;
            const tx0 = -topW + fracL * topW * 2;
            const tx1 = -topW + fracR * topW * 2;
            const bx0 = -botW + fracL * botW * 2;
            const bx1 = -botW + fracR * botW * 2;
            return (
              <polygon
                key={si}
                points={`${tx0},${topY + 4} ${tx1},${topY + 4} ${bx1},${botY - 4} ${bx0},${botY - 4}`}
                fill="#22C55E"
                opacity={0.75}
              />
            );
          })}
        </g>
      )}

      {/* Crisp White Chalk Pitch Markings */}
      {linesU > 0.01 && (
        <g opacity={linesU} stroke="#FFFFFF" strokeWidth={6} fill="none" strokeLinejoin="round">
          <polygon points={`${-topW + 24},${topY + 16} ${topW - 24},${topY + 16} ${botW - 24},${botY - 16} ${-botW + 24},${botY - 16}`} />
          <line x1={0} y1={topY + 16} x2={0} y2={botY - 16} />
          <ellipse cx={0} cy={(topY + botY) / 2} rx={62} ry={38} />
          <circle cx={0} cy={(topY + botY) / 2} r={7} fill="#FFFFFF" />
          <polygon points={`${-topW + 24},${topY + 58} ${-topW + 118},${topY + 58} ${-botW + 132},${botY - 58} ${-botW + 24},${botY - 58}`} />
          <polygon points={`${topW - 24},${topY + 58} ${topW - 118},${topY + 58} ${botW - 132},${botY - 58} ${botW - 24},${botY - 58}`} />
        </g>
      )}

      {/* Two Goalposts with Nets + 4 Corner Flags */}
      {goalsU > 0.02 && (
        <g>
          <g transform={`translate(${-(topW + botW) / 2 + 22}, 6) scale(1, ${goalsU})`}>
            <polygon points="-58,-46 4,-60 4,34 -58,48" fill="#FFFFFF" fillOpacity={0.35} stroke="#E2E8F0" strokeWidth={2.5} />
            <polyline points="-58,48 -58,-46 4,-60 4,34" fill="none" stroke={OUTLINE} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="-58,48 -58,-46 4,-60 4,34" fill="none" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g transform={`translate(${(topW + botW) / 2 - 22}, 6) scale(1, ${goalsU})`}>
            <polygon points="58,-46 -4,-60 -4,34 58,48" fill="#FFFFFF" fillOpacity={0.35} stroke="#E2E8F0" strokeWidth={2.5} />
            <polyline points="58,48 58,-46 -4,-60 -4,34" fill="none" stroke={OUTLINE} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="58,48 58,-46 -4,-60 -4,34" fill="none" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {[
            { fx: -topW + 24, fy: topY + 16 },
            { fx: topW - 24, fy: topY + 16 },
            { fx: -botW + 24, fy: botY - 16 },
            { fx: botW - 24, fy: botY - 16 },
          ].map((cf, i) => (
            <g key={i} transform={`translate(${cf.fx}, ${cf.fy}) scale(1, ${goalsU})`}>
              <line x1={0} y1={0} x2={0} y2={-42} stroke={OUTLINE} strokeWidth={4.5} strokeLinecap="round" />
              <polygon
                points={`0,-42 ${22 + flagWave * 0.4},-35 0,-26`}
                fill="#EF4444"
                stroke={OUTLINE}
                strokeWidth={2.5}
              />
            </g>
          ))}
        </g>
      )}

      {/* Construction dust clouds while timelapse builds pitch */}
      {buildingNow &&
        [-240, -85, 65, 225].map((dx, i) => {
          const py = 18 - ((frame * 6 + i * 24) % 72);
          const pr = 22 + Math.sin(frame * 0.45 + i) * 7;
          return (
            <circle
              key={i}
              cx={dx + Math.sin(frame * 0.35 + i) * 14}
              cy={py}
              r={pr}
              fill="#F8FAFC"
              stroke={OUTLINE}
              strokeWidth={3}
              opacity={0.78}
            />
          );
        })}
    </g>
  );
};

/**
 * 9 colorful flat-2D Indonesian Village Houses built simultaneously by Kepala Kuli (@rehannoperwan411)
 * + crowd villagers in Beat 9! Anchored cleanly on the green meadow (y = 1150..1375) in middle/lower-middle frame.
 */
interface HouseSpec {
  x: number;
  y: number;
  scale: number;
  wall: string;
  roof: string;
  door: string;
  delay: number;
}

const VILLAGE_HOUSES: HouseSpec[] = [
  // Back row (5 colorful houses anchored cleanly on upper-middle green meadow at y=1155)
  { x: 2330, y: 1155, scale: 0.9, wall: '#FEF3C7', roof: '#DC2626', door: '#92400E', delay: 0.0 },
  { x: 2565, y: 1150, scale: 0.92, wall: '#E0F2FE', roof: '#EA580C', door: '#78350F', delay: 0.06 },
  { x: 2800, y: 1155, scale: 0.9, wall: '#DCFCE7', roof: '#B91C1C', door: '#92400E', delay: 0.12 },
  { x: 3035, y: 1150, scale: 0.92, wall: '#FCE7F3', roof: '#2563EB', door: '#78350F', delay: 0.18 },
  { x: 3270, y: 1155, scale: 0.9, wall: '#FEF9C3', roof: '#C2410C', door: '#92400E', delay: 0.24 },
  // Front row (4 larger houses anchored on lower-middle meadow at y=1350 — completely ABOVE fence y=1468 & road y=1525!)
  { x: 2445, y: 1350, scale: 1.0, wall: '#FFF7ED', roof: '#EF4444', door: '#92400E', delay: 0.10 },
  { x: 2690, y: 1352, scale: 1.02, wall: '#F0FDF4', roof: '#D97706', door: '#78350F', delay: 0.18 },
  { x: 2935, y: 1350, scale: 1.0, wall: '#EFF6FF', roof: '#DC2626', door: '#92400E', delay: 0.26 },
  { x: 3180, y: 1352, scale: 1.02, wall: '#FDF4FF', roof: '#059669', door: '#78350F', delay: 0.34 },
];

export const Ep3HousesNeighborhood: React.FC<{
  frame: number;
  progress: number; // 0 = empty grass plots, 0..1 = rapid simultaneous house construction, 1 = finished
}> = ({ frame, progress }) => {
  if (progress <= 0.005) return null;

  return (
    <g>
      {VILLAGE_HOUSES.map((h, idx) => {
        const localU = clamp((progress - h.delay) / 0.52);
        const riseU = easeOutCubic(clamp(localU / 0.65));
        const roofU = easeOutCubic(clamp((localU - 0.48) / 0.48));
        const buildingThis = localU > 0.02 && localU < 0.96;

        return (
          <g key={idx} transform={`translate(${h.x}, ${h.y}) scale(${h.scale})`}>
            {/* Ground shadow & garden foundation */}
            <ellipse cx={0} cy={8} rx={118} ry={16} fill="#15803D" opacity={0.4 * Math.min(1, localU * 2)} />

            {riseU > 0.01 && (
              <g transform={`scale(1, ${riseU})`}>
                {/* House body wall */}
                <rect
                  x={-92}
                  y={-118}
                  width={184}
                  height={120}
                  rx={6}
                  fill={h.wall}
                  stroke={OUTLINE}
                  strokeWidth={4.5}
                />
                {/* Lower wall trim */}
                <rect x={-92} y={-22} width={184} height={24} fill="#D6D3D1" stroke={OUTLINE} strokeWidth={3.5} />
                {/* Wooden front door */}
                <rect x={-22} y={-72} width={44} height={74} rx={5} fill={h.door} stroke={OUTLINE} strokeWidth={3.8} />
                <circle cx={12} cy={-34} r={4} fill="#FACC15" stroke={OUTLINE} strokeWidth={2} />
                {/* Two cartoon windows with warm curtains */}
                {[-72, 34].map((wx, wi) => (
                  <g key={wi}>
                    <rect x={wx} y={-86} width={38} height={38} rx={6} fill="#7DD3FC" stroke={OUTLINE} strokeWidth={3.5} />
                    <line x1={wx + 19} y1={-86} x2={wx + 19} y2={-48} stroke={OUTLINE} strokeWidth={2.5} />
                    <line x1={wx} y1={-67} x2={wx + 38} y2={-67} stroke={OUTLINE} strokeWidth={2.5} />
                  </g>
                ))}
              </g>
            )}

            {/* Pitched Indonesian genteng roof dropping smoothly into place */}
            {roofU > 0.01 && (
              <g transform={`translate(0, ${(1 - roofU) * -42}) scale(${0.85 + 0.15 * roofU})`}>
                <path
                  d="M -112 -114 L -82 -174 L 82 -174 L 112 -114 Z"
                  fill={h.roof}
                  stroke={OUTLINE}
                  strokeWidth={4.5}
                  strokeLinejoin="round"
                />
                {/* Roof ridge beam */}
                <line x1={-84} y1={-174} x2={84} y2={-174} stroke="#FEF08A" strokeWidth={5} strokeLinecap="round" />
                <line x1={-96} y1={-144} x2={96} y2={-144} stroke={OUTLINE} strokeWidth={2.5} opacity={0.35} />
              </g>
            )}

            {/* Active bamboo scaffolding + dust puffs while constructing */}
            {buildingThis && (
              <g>
                <line x1={-104} y1={4} x2={-104} y2={-135} stroke="#92400E" strokeWidth={5} />
                <line x1={104} y1={4} x2={104} y2={-135} stroke="#92400E" strokeWidth={5} />
                <line x1={-110} y1={-65} x2={110} y2={-65} stroke="#B45309" strokeWidth={5} />
                <circle
                  cx={-48 + Math.sin(frame * 0.4 + idx) * 16}
                  cy={-30 - ((frame * 7 + idx * 19) % 70)}
                  r={18 + Math.sin(frame * 0.5 + idx) * 5}
                  fill="#F8FAFC"
                  stroke={OUTLINE}
                  strokeWidth={3}
                  opacity={0.82}
                />
                <circle
                  cx={52 + Math.cos(frame * 0.35 + idx) * 16}
                  cy={-22 - ((frame * 6 + idx * 29) % 68)}
                  r={16 + Math.cos(frame * 0.45 + idx) * 5}
                  fill="#FEF3C7"
                  stroke={OUTLINE}
                  strokeWidth={3}
                  opacity={0.78}
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/**
 * Beat 1 Smartphone Comments Overlay showing ONLY the new Episode 3 commenters & 245 residents!
 */
export const Ep3CommentPhoneOverlay: React.FC<{
  enterScale: number;
  x?: number;
  y?: number;
}> = ({ enterScale, x = 720, y = 780 }) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${enterScale})`}>
      <rect x={-215} y={-285} width={442} height={580} rx={44} fill={OUTLINE} />
      <rect x={-224} y={-294} width={442} height={580} rx={44} fill="#18181B" stroke={OUTLINE} strokeWidth={5} />
      <rect x={-202} y={-266} width={398} height={524} rx={30} fill="#FFFFFF" />

      {/* Header */}
      <rect x={-202} y={-266} width={398} height={74} rx={24} fill="#F4F4F5" />
      <text x={-3} y={-220} textAnchor="middle" fontFamily="Bricolage Grotesque, Poppins, sans-serif" fontWeight={900} fontSize={26} fill="#18181B">
        KOMENTAR WARGA
      </text>

      {/* Top comment (@virgod29) */}
      <rect x={-182} y={-174} width={358} height={116} rx={18} fill="#FEF08A" stroke={OUTLINE} strokeWidth={4.5} />
      <text x={-160} y={-140} fontFamily="Bricolage Grotesque, Poppins, sans-serif" fontWeight={900} fontSize={23} fill="#DC2626">
        @virgod29 · LIKE TERBANYAK!
      </text>
      <text x={-160} y={-106} fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={22} fill="#18181B">
        “Kampung udah rame, bangun
      </text>
      <text x={-160} y={-76} fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={22} fill="#18181B">
        LAPANGAN BOLA dong Pak! ⚽”
      </text>

      {/* Other new Ep 3 commenters ONLY */}
      <rect x={-182} y={-40} width={358} height={68} rx={14} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} />
      <text x={-160} y={-12} fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={20} fill="#18181B">
        @isqi_sani2316
      </text>
      <text x={-160} y={16} fontFamily="Poppins, sans-serif" fontWeight={600} fontSize={18} fill="#52525B">
        Pak, saya mau jadi guru!
      </text>

      <rect x={-182} y={40} width={358} height={68} rx={14} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} />
      <text x={-160} y={68} fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={20} fill="#18181B">
        @lida_aja_gin
      </text>
      <text x={-160} y={96} fontFamily="Poppins, sans-serif" fontWeight={600} fontSize={18} fill="#52525B">
        Saya mau jadi guru ngaji, Flora.
      </text>

      <rect x={-182} y={120} width={358} height={68} rx={14} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} />
      <text x={-160} y={148} fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={20} fill="#18181B">
        @rehannoperwan411
      </text>
      <text x={-160} y={176} fontFamily="Poppins, sans-serif" fontWeight={600} fontSize={18} fill="#52525B">
        Saya jadi kepala kuli bangunan!
      </text>

      <rect x={-182} y={198} width={358} height={48} rx={14} fill="#DBEAFE" stroke="#60A5FA" strokeWidth={3} />
      <text x={-3} y={230} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={21} fill="#1D4ED8">
        100 → 245 Warga Sudah Follow!
      </text>
    </g>
  );
};
