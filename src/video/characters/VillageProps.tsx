import React from 'react';
import { spring } from '../motion';

const OUTLINE = '#18181B';

export const EmptyVillageBackdrop: React.FC<{
  frame: number;
  parallaxBgX: number;
  parallaxBgY: number;
}> = ({ frame, parallaxBgX, parallaxBgY }) => {
  // Drifting flat cartoon clouds
  const cloud1X = ((120 + frame * 0.45) % 1350) - 180;
  const cloud2X = ((680 + frame * 0.28) % 1350) - 180;
  const cloud3X = ((390 + frame * 0.36) % 1350) - 180;
  const sunPulse = 1 + 0.03 * Math.sin(frame * 0.08);

  return (
    <g transform={`translate(${parallaxBgX}, ${parallaxBgY})`}>
      {/* Saturated flat cartoon sky */}
      <rect x={-160} y={-160} width={1400} height={1350} fill="#38BDF8" />
      <rect x={-160} y={560} width={1400} height={620} fill="#7DD3FC" />

      {/* Warm cartoon sun */}
      <g transform={`translate(905, 250) scale(${sunPulse})`}>
        <circle cx={0} cy={0} r={92} fill="#FEF08A" opacity={0.45} />
        <circle cx={0} cy={0} r={66} fill="#FACC15" stroke={OUTLINE} strokeWidth={4} />
        <circle cx={-16} cy={-16} r={16} fill="#FEF9C3" opacity={0.75} />
      </g>

      {/* Flat 2D clouds with thin black outlines & cel underside */}
      <CartoonCloud x={cloud1X} y={235} scale={1.0} />
      <CartoonCloud x={cloud2X} y={365} scale={0.8} />
      <CartoonCloud x={cloud3X} y={160} scale={0.68} />

      {/* Distant rolling green hills (no buildings) */}
      <path
        d="M -180 990 Q 170 930 520 965 Q 880 1000 1280 945 L 1280 1200 L -180 1200 Z"
        fill="#4ADE80"
        stroke={OUTLINE}
        strokeWidth={4}
      />

      {/* Distant background trees along the back hill ridge (placed away from Pak Kades's face) */}
      <DistantTree frame={frame} x={48} y={965} scale={0.72} phase={0.2} variant="round" />
      <DistantTree frame={frame} x={248} y={960} scale={0.58} phase={1.4} variant="tall" />
      <DistantTree frame={frame} x={685} y={972} scale={0.55} phase={2.1} variant="round" />
      <DistantTree frame={frame} x={855} y={968} scale={0.68} phase={0.9} variant="tall" />
      <DistantTree frame={frame} x={1025} y={958} scale={0.76} phase={3.0} variant="round" />

      {/* Midground lush green grass ridge */}
      <path
        d="M -180 1035 Q 320 990 680 1020 Q 1020 1050 1280 1005 L 1280 2100 L -180 2100 Z"
        fill="#22C55E"
        stroke={OUTLINE}
        strokeWidth={4}
      />

      {/* Midground background trees & bushes behind the empty clearing (zero houses/buildings) */}
      <DistantTree frame={frame} x={-10} y={1035} scale={1.08} phase={0.7} variant="tall" />
      <DistantTree frame={frame} x={175} y={1018} scale={0.84} phase={1.9} variant="round" />
      <DistantBushes x={265} y={1022} scale={0.82} />
      <DistantBushes x={745} y={1026} scale={0.85} />
      <DistantTree frame={frame} x={945} y={1028} scale={0.96} phase={2.6} variant="round" />
      <DistantTree frame={frame} x={1088} y={1032} scale={1.05} phase={1.1} variant="tall" />
    </g>
  );
};

const DistantTree: React.FC<{
  frame: number;
  x: number;
  y: number;
  scale: number;
  phase: number;
  variant: 'round' | 'tall';
}> = ({ frame, x, y, scale, phase, variant }) => {
  const sway = Math.sin(frame * 0.055 + phase) * 2.0;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Soft tree ground shadow */}
      <ellipse cx={0} cy={4} rx={48} ry={10} fill="#15803D" opacity={0.45} />

      <g transform={`rotate(${sway}, 0, 0)`}>
        {/* Trunk */}
        <path
          d={
            variant === 'tall'
              ? 'M -13 0 L -9 -115 L 9 -115 L 14 0 Z'
              : 'M -15 0 L -10 -95 L 10 -95 L 16 0 Z'
          }
          fill="#92400E"
          stroke={OUTLINE}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        {/* Branch V */}
        <path
          d={variant === 'tall' ? 'M 0 -75 L -22 -105 M 2 -82 L 24 -108' : 'M -2 -62 L -24 -88 M 3 -68 L 22 -90'}
          stroke="#78350F"
          strokeWidth={6}
          strokeLinecap="round"
        />

        {/* Lush flat-2D cel-shaded foliage */}
        {variant === 'tall' ? (
          <g transform="translate(0, -148)">
            <circle cx={-34} cy={18} r={40} fill="#16A34A" stroke={OUTLINE} strokeWidth={4} />
            <circle cx={34} cy={20} r={38} fill="#15803D" stroke={OUTLINE} strokeWidth={4} />
            <circle cx={0} cy={-26} r={52} fill="#22C55E" stroke={OUTLINE} strokeWidth={4} />
            <circle cx={-6} cy={14} r={44} fill="#22C55E" />
            {/* Cel highlight puffs */}
            <path
              d="M -32 -44 C -18 -64, 18 -66, 30 -44 C 14 -52, -16 -50, -32 -44 Z"
              fill="#86EFAC"
              opacity={0.7}
            />
            <circle cx={-42} cy={4} r={14} fill="#4ADE80" opacity={0.65} />
          </g>
        ) : (
          <g transform="translate(0, -124)">
            <ellipse cx={0} cy={8} rx={68} ry={46} fill="#16A34A" stroke={OUTLINE} strokeWidth={4} />
            <circle cx={-36} cy={-16} r={36} fill="#22C55E" stroke={OUTLINE} strokeWidth={4} />
            <circle cx={32} cy={-14} r={34} fill="#16A34A" stroke={OUTLINE} strokeWidth={4} />
            <circle cx={0} cy={-32} r={42} fill="#4ADE80" stroke={OUTLINE} strokeWidth={4} />
            {/* Inner merge to hide interior strokes */}
            <ellipse cx={0} cy={-6} rx={52} ry={34} fill="#22C55E" />
            <ellipse cx={-12} cy={-44} rx={24} ry={13} fill="#86EFAC" opacity={0.75} />
          </g>
        )}
      </g>
    </g>
  );
};

const DistantBushes: React.FC<{ x: number; y: number; scale: number }> = ({ x, y, scale }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <path
      d="M -52 0 C -58 -24, -32 -36, -16 -24 C -6 -46, 28 -44, 34 -20 C 54 -26, 66 -8, 56 0 Z"
      fill="#16A34A"
      stroke={OUTLINE}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path
      d="M -34 -6 C -28 -22, -8 -24, 2 -14 C 14 -26, 32 -22, 36 -6 Z"
      fill="#4ADE80"
      opacity={0.55}
    />
  </g>
);

const CartoonCloud: React.FC<{ x: number; y: number; scale: number }> = ({ x, y, scale }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <path
      d="M -95 28 C -115 28 -125 4 -105 -12 C -98 -42 -60 -52 -38 -32 C -22 -66 36 -66 52 -30 C 82 -36 108 -10 98 16 C 110 28 96 42 78 42 L -82 42 C -95 42 -102 34 -95 28 Z"
      fill="#FFFFFF"
      stroke={OUTLINE}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path
      d="M -82 34 L 78 34 C 90 34 94 26 88 22 L -88 22 C -94 26 -90 34 -82 34 Z"
      fill="#E0F2FE"
    />
  </g>
);

export const EmptyVillageGround: React.FC<{ frame: number }> = ({ frame }) => {
  const sway = Math.sin(frame * 0.08) * 3;
  return (
    <g>
      {/* Full lush green grass foreground — replacing bare brown dirt */}
      <path
        d="M -160 1120 Q 220 1070 540 1090 Q 860 1110 1240 1075 L 1240 2100 L -160 2100 Z"
        fill="#4ADE80"
        stroke={OUTLINE}
        strokeWidth={4}
      />
      <path
        d="M -160 1225 Q 240 1170 600 1200 Q 940 1230 1240 1185 L 1240 2100 L -160 2100 Z"
        fill="#22C55E"
      />
      <path
        d="M -160 1445 Q 320 1385 680 1425 Q 980 1455 1240 1410 L 1240 2100 L -160 2100 Z"
        fill="#16A34A"
      />

      {/* Winding Flat-2D Village Road (Jalan Kampung) cutting across the green meadow */}
      <g>
        {/* Grassy road shoulder shadow / curb */}
        <path
          d="M 488 1018 Q 525 1135 452 1280 Q 382 1420 285 1960 L 820 1960 Q 700 1425 602 1260 Q 535 1145 538 1018 Z"
          fill="#64748B"
          stroke={OUTLINE}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        {/* Clean paved village road surface */}
        <path
          d="M 495 1018 Q 532 1135 466 1280 Q 404 1420 315 1960 L 790 1960 Q 676 1425 588 1260 Q 528 1145 531 1018 Z"
          fill="#CBD5E1"
        />
        {/* Warm sunlit center sheen on road */}
        <path
          d="M 505 1018 Q 536 1135 486 1280 Q 440 1420 385 1960 L 725 1960 Q 642 1425 574 1260 Q 525 1145 524 1018 Z"
          fill="#E2E8F0"
        />
        {/* Dashed road center markings receding into empty village */}
        <path
          d="M 514 1045 Q 542 1145 516 1275 Q 492 1410 538 1920"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray="34 28"
          opacity={0.85}
        />
        {/* Side road stone curbs */}
        <path
          d="M 495 1018 Q 532 1135 466 1280 Q 404 1420 315 1960"
          fill="none"
          stroke="#F8FAFC"
          strokeWidth={6}
          opacity={0.75}
        />
        <path
          d="M 531 1018 Q 528 1145 588 1260 Q 676 1425 790 1960"
          fill="none"
          stroke="#94A3B8"
          strokeWidth={6}
          opacity={0.75}
        />
      </g>

      {/* Grass shadows & subtle wildflower / clover dots on the lawn */}
      <ellipse cx={165} cy={1235} rx={125} ry={24} fill="#15803D" opacity={0.32} />
      <ellipse cx={865} cy={1210} rx={140} ry={26} fill="#15803D" opacity={0.32} />

      {[
        { x: 105, y: 1290, c: '#FEF08A' },
        { x: 245, y: 1360, c: '#FFFFFF' },
        { x: 760, y: 1335, c: '#FEF08A' },
        { x: 965, y: 1270, c: '#FFFFFF' },
        { x: 185, y: 1520, c: '#FEF08A' },
        { x: 910, y: 1495, c: '#FFFFFF' },
      ].map((fl, idx) => (
        <g key={idx} transform={`translate(${fl.x}, ${fl.y})`}>
          <circle cx={0} cy={0} r={5} fill={fl.c} stroke={OUTLINE} strokeWidth={2} />
        </g>
      ))}

      {/* Swaying grass tufts across the green meadow — zero buildings */}
      {[
        { x: 95, y: 1175, s: 1.0 },
        { x: 270, y: 1140, s: 0.85 },
        { x: 695, y: 1135, s: 0.9 },
        { x: 970, y: 1175, s: 1.05 },
        { x: 145, y: 1410, s: 1.1 },
        { x: 935, y: 1390, s: 1.05 },
      ].map((g, i) => (
        <g
          key={i}
          transform={`translate(${g.x}, ${g.y}) scale(${g.s}) rotate(${sway * (i % 2 === 0 ? 1 : -1)})`}
        >
          <path
            d="M -14 0 L -22 -24 L -5 -6 L 2 -30 L 8 -6 L 22 -22 L 14 0 Z"
            fill="#4ADE80"
            stroke={OUTLINE}
            strokeWidth={3.5}
            strokeLinejoin="round"
          />
        </g>
      ))}
    </g>
  );
};

export const FlagpoleMerahPutih: React.FC<{
  frame: number;
  highlight?: boolean;
}> = ({ frame, highlight = false }) => {
  // Smooth waving flag points
  const w1 = Math.sin(frame * 0.22) * 14;
  const w2 = Math.sin(frame * 0.22 - 1.4) * 18;
  const w3 = Math.sin(frame * 0.22 - 2.8) * 16;

  const topRedPath = `M 0 0 C 65 ${w1}, 130 ${w2}, 205 ${w3} L 205 ${58 + w3} C 130 ${58 + w2}, 65 ${58 + w1}, 0 58 Z`;
  const botWhitePath = `M 0 58 C 65 ${58 + w1}, 130 ${58 + w2}, 205 ${w3 + 58} L 205 ${116 + w3} C 130 ${116 + w2}, 65 ${116 + w1}, 0 116 Z`;

  return (
    <g transform="translate(132, 485)">
      {/* Grass tuft & stone base planted on green grass beside the road */}
      <path
        d="M -32 675 L 32 675 L 40 706 L -40 706 Z"
        fill="#94A3B8"
        stroke={OUTLINE}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <rect x={-32} y={675} width={64} height={10} fill="#CBD5E1" />

      {/* Metallic flagpole */}
      <rect
        x={-8}
        y={0}
        width={16}
        height={676}
        rx={4}
        fill="#E2E8F0"
        stroke={OUTLINE}
        strokeWidth={4}
      />
      <rect x={0} y={0} width={7} height={676} fill="#94A3B8" opacity={0.55} />
      {/* Gold finial */}
      <circle cx={0} cy={-6} r={14} fill="#FACC15" stroke={OUTLINE} strokeWidth={4} />

      {/* Waving Merah-Putih Flag */}
      <g transform="translate(8, 18)">
        <path d={topRedPath} fill="#EF4444" stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />
        <path d={botWhitePath} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />
        <path
          d={`M 0 58 C 65 ${58 + w1}, 130 ${58 + w2}, 205 ${58 + w3}`}
          stroke={OUTLINE}
          strokeWidth={2.5}
          fill="none"
        />
      </g>

      {/* Clean comedic tag above the flag in open sky */}
      {highlight && (
        <g transform={`translate(115, -34) scale(${spring(frame, 165, 10, 210)})`}>
          <rect
            x={-82}
            y={-24}
            width={164}
            height={44}
            rx={12}
            fill="#FEF2F2"
            stroke={OUTLINE}
            strokeWidth={4}
          />
          <text
            x={0}
            y={6}
            textAnchor="middle"
            fontFamily="Poppins, sans-serif"
            fontWeight={800}
            fontSize={21}
            fill="#DC2626"
          >
            BUKAN WARGA
          </text>
        </g>
      )}
    </g>
  );
};

export const PendudukSignBoard: React.FC<{
  frame: number;
  pulse?: boolean;
}> = ({ frame, pulse = false }) => {
  const sway = Math.sin(frame * 0.06) * 0.7;
  const nudge = pulse ? 1 + 0.05 * Math.sin((frame - 660) * 0.35) : 1;

  return (
    <g transform={`translate(855, 875) rotate(${sway}) scale(${nudge})`}>
      {/* Wooden posts */}
      <rect
        x={-84}
        y={70}
        width={22}
        height={225}
        rx={4}
        fill="#92400E"
        stroke={OUTLINE}
        strokeWidth={4}
      />
      <rect
        x={62}
        y={70}
        width={22}
        height={225}
        rx={4}
        fill="#78350F"
        stroke={OUTLINE}
        strokeWidth={4}
      />
      {/* Grass tuft around post base */}
      <path
        d="M -100 295 L -88 272 L -74 290 L -60 276 L -48 295 Z"
        fill="#4ADE80"
        stroke={OUTLINE}
        strokeWidth={3.5}
      />
      <path
        d="M 48 295 L 60 276 L 74 290 L 88 272 L 100 295 Z"
        fill="#4ADE80"
        stroke={OUTLINE}
        strokeWidth={3.5}
      />

      {/* Signboard shadow */}
      <rect x={-124} y={-68} width={256} height={164} rx={16} fill={OUTLINE} />
      {/* Wooden board face */}
      <rect
        x={-130}
        y={-74}
        width={256}
        height={164}
        rx={16}
        fill="#FEF3C7"
        stroke={OUTLINE}
        strokeWidth={4.5}
      />
      {/* Top wooden trim */}
      <rect
        x={-130}
        y={-74}
        width={256}
        height={44}
        rx={14}
        fill="#D97706"
        stroke={OUTLINE}
        strokeWidth={4}
      />
      {/* Nails */}
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
        fontSize={92}
        fill="#DC2626"
        stroke={OUTLINE}
        strokeWidth={5}
        style={{ paintOrder: 'stroke fill' }}
      >
        0
      </text>
    </g>
  );
};
