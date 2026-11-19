import React from 'react';

const OUTLINE = '#18181B';

export interface MainWargaConfig {
  id: 'vinzz' | 'epan' | 'dzik' | 'rizki' | 'asep' | 'ary';
  username: string;
  roleBadge?: string;
  x: number;
  y: number;
  scale: number;
  shirt: string;
  shirtShade: string;
  hairColor: string;
  hairStyle: 'spiky' | 'parted' | 'cap' | 'curly' | 'swept' | 'fade';
  skin: string;
  skinShadow: string;
  glasses?: boolean;
  exitDelay: number; // seconds after Beat 3 start
}

export const MAIN_WARGA: MainWargaConfig[] = [
  {
    id: 'rizki',
    username: '@m.rizki_p_haikal',
    x: 158,
    y: 1170,
    scale: 0.44,
    shirt: '#DC2626',
    shirtShade: '#991B1B',
    hairColor: '#18181B',
    hairStyle: 'curly',
    skin: '#DDA176',
    skinShadow: '#BA7E54',
    exitDelay: 0.4,
  },
  {
    id: 'vinzz',
    username: '@vinzz4726',
    roleBadge: 'PRESIDEN',
    x: 245,
    y: 1262,
    scale: 0.49,
    shirt: '#2563EB',
    shirtShade: '#1D4ED8',
    hairColor: '#18181B',
    hairStyle: 'spiky',
    skin: '#E5AE86',
    skinShadow: '#C2875E',
    exitDelay: 0.85,
  },
  {
    id: 'epan',
    username: '@3p4n.24',
    roleBadge: 'WAKIL PRESIDEN',
    x: 382,
    y: 1200,
    scale: 0.46,
    shirt: '#0D9488',
    shirtShade: '#115E59',
    hairColor: '#27272A',
    hairStyle: 'parted',
    skin: '#E8B894',
    skinShadow: '#C7926A',
    glasses: true,
    exitDelay: 1.35,
  },
  {
    id: 'dzik',
    username: '@dzikkkksd2',
    roleBadge: 'KETUA RT',
    x: 688,
    y: 1200,
    scale: 0.46,
    shirt: '#D97706',
    shirtShade: '#B45309',
    hairColor: '#18181B',
    hairStyle: 'cap',
    skin: '#D6986E',
    skinShadow: '#B5774F',
    exitDelay: 1.85,
  },
  {
    id: 'asep',
    username: '@asepbabayoo',
    x: 824,
    y: 1170,
    scale: 0.44,
    shirt: '#7C3AED',
    shirtShade: '#5B21B6',
    hairColor: '#27272A',
    hairStyle: 'swept',
    skin: '#DFAA83',
    skinShadow: '#BC845D',
    exitDelay: 2.3,
  },
  {
    id: 'ary',
    username: '@_26ary4stnn',
    x: 922,
    y: 1262,
    scale: 0.49,
    shirt: '#EA580C',
    shirtShade: '#C2410C',
    hairColor: '#18181B',
    hairStyle: 'fade',
    skin: '#E6B28B',
    skinShadow: '#C48B63',
    exitDelay: 2.8,
  },
];

export interface CrowdWargaConfig {
  x: number;
  y: number;
  scale: number;
  shirt: string;
  shirtShade: string;
  hairColor: string;
  hairStyle: 'spiky' | 'parted' | 'cap' | 'curly' | 'swept' | 'fade' | 'hijab';
  skin: string;
  exitDelay: number;
}

// 14 crowd villagers WITHOUT usernames — fulfills "belasan warga kerumunan lain (15-20 total), TANPA username"
export const CROWD_WARGA: CrowdWargaConfig[] = [
  { x: 102, y: 1086, scale: 0.37, shirt: '#0284C7', shirtShade: '#0369A1', hairColor: '#18181B', hairStyle: 'fade', skin: '#E2A87E', exitDelay: 0.6 },
  { x: 185, y: 1076, scale: 0.36, shirt: '#16A34A', shirtShade: '#15803D', hairColor: '#F472B6', hairStyle: 'hijab', skin: '#E6B38B', exitDelay: 0.9 },
  { x: 268, y: 1094, scale: 0.38, shirt: '#E11D48', shirtShade: '#BE123C', hairColor: '#27272A', hairStyle: 'spiky', skin: '#DA9D73', exitDelay: 1.1 },
  { x: 344, y: 1074, scale: 0.36, shirt: '#4F46E5', shirtShade: '#3730A3', hairColor: '#18181B', hairStyle: 'curly', skin: '#E5AE86', exitDelay: 1.4 },
  { x: 422, y: 1088, scale: 0.37, shirt: '#059669', shirtShade: '#047857', hairColor: '#38BDF8', hairStyle: 'hijab', skin: '#E8B894', exitDelay: 1.65 },
  { x: 484, y: 1070, scale: 0.35, shirt: '#9333EA', shirtShade: '#7E22CE', hairColor: '#18181B', hairStyle: 'parted', skin: '#DDA176', exitDelay: 1.9 },
  { x: 588, y: 1070, scale: 0.35, shirt: '#0891B2', shirtShade: '#0E7490', hairColor: '#27272A', hairStyle: 'cap', skin: '#D6986E', exitDelay: 2.1 },
  { x: 650, y: 1088, scale: 0.37, shirt: '#65A30D', shirtShade: '#4D7C0F', hairColor: '#FBBF24', hairStyle: 'hijab', skin: '#E5AE86', exitDelay: 2.35 },
  { x: 726, y: 1074, scale: 0.36, shirt: '#DB2777', shirtShade: '#BE185D', hairColor: '#18181B', hairStyle: 'swept', skin: '#DFAA83', exitDelay: 2.55 },
  { x: 800, y: 1092, scale: 0.38, shirt: '#2563EB', shirtShade: '#1D4ED8', hairColor: '#27272A', hairStyle: 'fade', skin: '#E2A87E', exitDelay: 2.75 },
  { x: 882, y: 1078, scale: 0.36, shirt: '#EA580C', shirtShade: '#C2410C', hairColor: '#A855F7', hairStyle: 'hijab', skin: '#E8B894', exitDelay: 2.95 },
  { x: 962, y: 1090, scale: 0.37, shirt: '#475569', shirtShade: '#334155', hairColor: '#18181B', hairStyle: 'curly', skin: '#D6986E', exitDelay: 3.15 },
  { x: 308, y: 1212, scale: 0.39, shirt: '#14B8A6', shirtShade: '#0F766E', hairColor: '#18181B', hairStyle: 'swept', skin: '#E2A87E', exitDelay: 3.35 },
  { x: 758, y: 1212, scale: 0.39, shirt: '#F59E0B', shirtShade: '#B45309', hairColor: '#27272A', hairStyle: 'spiky', skin: '#DDA176', exitDelay: 3.55 },
];

export const WargaCharacter: React.FC<{
  frame: number;
  x: number;
  y: number;
  scale: number;
  shirt: string;
  shirtShade: string;
  hairColor: string;
  hairStyle: 'spiky' | 'parted' | 'cap' | 'curly' | 'swept' | 'fade' | 'hijab';
  skin: string;
  skinShadow?: string;
  glasses?: boolean;
  username?: string;
  roleBadge?: string;
  pose?: 'idle' | 'raise_hand' | 'wave' | 'work_hammer' | 'cheer';
  mouthOpen?: number;
  mouthVowel?: string;
  highlighted?: boolean;
  showLabel?: boolean;
  seed?: number;
}> = ({
  frame,
  x,
  y,
  scale,
  shirt,
  shirtShade,
  hairColor,
  hairStyle,
  skin,
  skinShadow = '#C48A63',
  glasses = false,
  username,
  roleBadge,
  pose = 'idle',
  mouthOpen = 0,
  mouthVowel = 'closed',
  highlighted = false,
  showLabel = true,
  seed = 1,
}) => {
  const blinkMod = (frame + seed * 17) % 88;
  const isBlinking = blinkMod >= 84;
  const breathe = Math.sin(frame * 0.11 + seed) * 2.5;
  const talkNod = mouthOpen > 0.1 ? Math.sin(frame * 0.45) * 3.0 : Math.sin(frame * 0.08 + seed) * 1.0;
  const activeScale = highlighted ? scale * 1.09 : scale;

  // Dynamic arm angles
  const hammerSwing = pose === 'work_hammer' ? Math.sin(frame * 0.85 + seed) * 52 : 0;
  const waveAngle = pose === 'wave' || pose === 'cheer' ? Math.sin(frame * 0.35 + seed) * 22 : 0;

  const rArmAngle =
    pose === 'raise_hand'
      ? -136
      : pose === 'wave'
      ? -125 + waveAngle
      : pose === 'cheer'
      ? -142 + waveAngle
      : pose === 'work_hammer'
      ? -95 + hammerSwing
      : -12 + Math.sin(frame * 0.1 + seed) * 3;

  const lArmAngle =
    pose === 'cheer'
      ? 142 - waveAngle
      : pose === 'work_hammer'
      ? 42
      : 12 - Math.sin(frame * 0.1 + seed) * 3;

  return (
    <g transform={`translate(${x}, ${y}) scale(${activeScale})`}>
      {/* Ground contact shadow */}
      <ellipse cx={0} cy={305} rx={78} ry={15} fill="#15803D" opacity={0.34} />

      {/* Legs & sneakers */}
      <rect x={-48} y={135} width={40} height={152} rx={14} fill="#1E293B" stroke={OUTLINE} strokeWidth={4.5} />
      <rect x={8} y={135} width={40} height={152} rx={14} fill="#0F172A" stroke={OUTLINE} strokeWidth={4.5} />
      <path d="M -54 275 C -56 264, -6 264, -4 275 L 0 295 C 0 302, -62 302, -62 292 Z" fill="#FFFFFF" stroke={OUTLINE} strokeWidth={4} />
      <path d="M 4 275 C 6 264, 56 264, 54 275 L 62 292 C 62 302, 0 302, 0 295 Z" fill="#E2E8F0" stroke={OUTLINE} strokeWidth={4} />

      {/* Right Arm (screen-right) */}
      <g transform={`translate(62, -62) rotate(${rArmAngle})`}>
        <rect x={-13} y={0} width={26} height={106} rx={13} fill={skin} stroke={OUTLINE} strokeWidth={4} />
        <rect x={-16} y={-8} width={32} height={48} rx={12} fill={shirtShade} stroke={OUTLINE} strokeWidth={4} />
        <circle cx={0} cy={110} r={14} fill={skin} stroke={OUTLINE} strokeWidth={4} />
        {pose === 'work_hammer' && (
          <g transform="translate(0, 110) rotate(25)">
            <rect x={-5} y={-52} width={10} height={58} rx={4} fill="#92400E" stroke={OUTLINE} strokeWidth={3} />
            <rect x={-20} y={-68} width={42} height={20} rx={5} fill="#64748B" stroke={OUTLINE} strokeWidth={3.5} />
          </g>
        )}
      </g>

      {/* Left Arm (screen-left) */}
      <g transform={`translate(-62, -62) rotate(${lArmAngle})`}>
        <rect x={-13} y={0} width={26} height={106} rx={13} fill={skin} stroke={OUTLINE} strokeWidth={4} />
        <rect x={-16} y={-8} width={32} height={48} rx={12} fill={shirt} stroke={OUTLINE} strokeWidth={4} />
        <circle cx={0} cy={110} r={14} fill={skin} stroke={OUTLINE} strokeWidth={4} />
      </g>

      {/* Casual Shirt Torso */}
      <g transform={`translate(0, ${breathe * 0.45})`}>
        <path
          d="M -68 -80 C -68 -102, -38 -114, 0 -114 C 38 -114, 68 -102, 68 -80 L 72 138 C 72 152, 54 158, 0 158 C -54 158, -72 152, -72 138 Z"
          fill={shirt}
          stroke={OUTLINE}
          strokeWidth={4.5}
          strokeLinejoin="round"
        />
        <path
          d="M 28 -108 C 52 -100, 68 -88, 68 -74 L 72 138 C 66 150, 48 154, 24 154 C 40 74, 42 -28, 28 -108 Z"
          fill={shirtShade}
          opacity={0.75}
        />
        <path d="M -24 -112 Q 0 -92 24 -112" stroke={OUTLINE} strokeWidth={4} fill="none" />
      </g>

      {/* Neck */}
      <rect x={-20} y={-144 + breathe * 0.5} width={40} height={42} rx={14} fill={skinShadow} stroke={OUTLINE} strokeWidth={4} />

      {/* Head & Lip-sync Face */}
      <g transform={`translate(0, ${-216 + breathe * 0.65}) rotate(${talkNod})`}>
        {/* Ears */}
        <ellipse cx={-66} cy={8} rx={12} ry={18} fill={skinShadow} stroke={OUTLINE} strokeWidth={4} />
        <ellipse cx={66} cy={8} rx={12} ry={18} fill={skin} stroke={OUTLINE} strokeWidth={4} />

        {/* Hijab back wrap if hijab */}
        {hairStyle === 'hijab' && (
          <path
            d="M -72 -8 C -76 -76, 76 -76, 72 -8 L 78 72 C 74 98, 42 112, 0 112 C -42 112, -74 98, -78 72 Z"
            fill={hairColor}
            stroke={OUTLINE}
            strokeWidth={4.5}
          />
        )}

        {/* Face */}
        <path
          d="M -64 -24 C -66 -74, 66 -74, 64 -24 C 66 4, 62 30, 56 48 C 46 76, 22 88, 0 88 C -22 88, -46 76, -56 48 C -62 30, -66 4, -64 -24 Z"
          fill={skin}
          stroke={OUTLINE}
          strokeWidth={4.5}
          strokeLinejoin="round"
        />

        {/* Hair / Cap variations */}
        {hairStyle === 'spiky' && (
          <path
            d="M -66 -24 C -72 -62, -40 -92, -16 -76 L -2 -98 L 16 -78 L 42 -94 L 54 -68 C 72 -58, 70 -32, 64 -20 C 48 -46, -48 -46, -66 -24 Z"
            fill={hairColor}
            stroke={OUTLINE}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        )}
        {hairStyle === 'parted' && (
          <path
            d="M -66 -20 C -70 -76, 70 -76, 66 -20 C 46 -42, 10 -40, -6 -28 C -24 -44, -48 -40, -66 -20 Z"
            fill={hairColor}
            stroke={OUTLINE}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        )}
        {hairStyle === 'cap' && (
          <g>
            <path
              d="M -66 -26 C -68 -78, 68 -78, 66 -26 Z"
              fill="#EF4444"
              stroke={OUTLINE}
              strokeWidth={4.2}
              strokeLinejoin="round"
            />
            <path d="M -66 -26 L 86 -20 C 86 -8, 42 -10, -66 -20 Z" fill="#DC2626" stroke={OUTLINE} strokeWidth={4} />
          </g>
        )}
        {hairStyle === 'curly' && (
          <path
            d="M -68 -20 C -78 -44, -60 -70, -38 -66 C -30 -90, 6 -92, 16 -70 C 42 -82, 74 -58, 66 -20 C 42 -42, -42 -42, -68 -20 Z"
            fill={hairColor}
            stroke={OUTLINE}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        )}
        {hairStyle === 'swept' && (
          <path
            d="M -66 -22 C -68 -74, 58 -86, 68 -26 C 46 -44, 0 -46, -66 -22 Z"
            fill={hairColor}
            stroke={OUTLINE}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        )}
        {hairStyle === 'fade' && (
          <path
            d="M -64 -26 C -64 -76, 64 -76, 64 -26 C 46 -44, -46 -44, -64 -26 Z"
            fill={hairColor}
            stroke={OUTLINE}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        )}

        {/* Eyes */}
        {isBlinking ? (
          <>
            <path d="M -36 -8 Q -24 0 -12 -8" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
            <path d="M 12 -8 Q 24 0 36 -8" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx={-24} cy={-8} rx={12} ry={13} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={3.5} />
            <circle cx={-24} cy={-7} r={6.5} fill="#18181B" />
            <circle cx={-26} cy={-10} r={2.4} fill="#FFFFFF" />

            <ellipse cx={24} cy={-8} rx={12} ry={13} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={3.5} />
            <circle cx={24} cy={-7} r={6.5} fill="#18181B" />
            <circle cx={22} cy={-10} r={2.4} fill="#FFFFFF" />
          </>
        )}

        {/* Optional Glasses (for @3p4n.24) */}
        {glasses && (
          <g stroke={OUTLINE} strokeWidth={3.5} fill="none">
            <rect x={-40} y={-23} width={32} height={28} rx={7} />
            <rect x={8} y={-23} width={32} height={28} rx={7} />
            <line x1={-8} y1={-9} x2={8} y2={-9} />
          </g>
        )}

        {/* Eyebrows */}
        <path d="M -38 -28 Q -24 -36 -10 -28" stroke={OUTLINE} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M 10 -28 Q 24 -36 38 -28" stroke={OUTLINE} strokeWidth={5} fill="none" strokeLinecap="round" />

        {/* Nose */}
        <path d="M -3 0 Q 9 12 0 18" stroke={OUTLINE} strokeWidth={3.5} fill="none" strokeLinecap="round" />

        {/* Lip-Synced Warga Mouth */}
        {mouthOpen <= 0.08 ? (
          <path d="M -18 42 Q 0 56 18 42" stroke={OUTLINE} strokeWidth={4.2} fill="none" strokeLinecap="round" />
        ) : (
          <g transform="translate(0, 38)">
            <path
              d={`M ${-16 - mouthOpen * 8} 0 Q 0 -4 ${16 + mouthOpen * 8} 0 Q ${18 + mouthOpen * 8} ${8 + mouthOpen * 22} 0 ${11 + mouthOpen * 22} Q ${-18 - mouthOpen * 8} ${8 + mouthOpen * 22} ${-16 - mouthOpen * 8} 0 Z`}
              fill="#7F1D1D"
              stroke={OUTLINE}
              strokeWidth={3.8}
            />
            <ellipse
              cx={0}
              cy={1 + mouthOpen * 3}
              rx={10 + mouthOpen * 4}
              ry={3.5}
              fill="#FFFFFF"
            />
            <ellipse
              cx={0}
              cy={6 + mouthOpen * 16}
              rx={10 + mouthOpen * 3}
              ry={3 + mouthOpen * 4}
              fill="#FB7185"
            />
          </g>
        )}
      </g>

      {/* IG USERNAME & REQUESTED ROLE BADGE ABOVE HEAD (ONLY for the 6 Main Named Warga!) */}
      {showLabel && username && (
        <g transform="translate(0, -342)">
          {roleBadge && (
            <g transform="translate(0, 38)">
              <rect
                x={-118}
                y={-22}
                width={236}
                height={38}
                rx={10}
                fill={highlighted ? '#FACC15' : '#FEF08A'}
                stroke={OUTLINE}
                strokeWidth={5}
              />
              <text
                x={0}
                y={5}
                textAnchor="middle"
                fontFamily="Bricolage Grotesque, Poppins, sans-serif"
                fontWeight={900}
                fontSize={23}
                fill="#18181B"
              >
                {roleBadge}
              </text>
            </g>
          )}

          <text
            x={0}
            y={0}
            textAnchor="middle"
            fontFamily="Bricolage Grotesque, Poppins, sans-serif"
            fontWeight={900}
            fontSize={38}
            fill={highlighted ? '#FACC15' : '#FFFFFF'}
            stroke={OUTLINE}
            strokeWidth={12}
            style={{ paintOrder: 'stroke fill' }}
          >
            {username}
          </text>
        </g>
      )}
    </g>
  );
};

export const WargaNameTag: React.FC<{
  x: number;
  y: number;
  scale: number;
  username: string;
  roleBadge?: string;
  highlighted?: boolean;
}> = ({ x, y, scale, username, roleBadge, highlighted = false }) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <g transform="translate(0, -335)">
        {roleBadge && (
          <g transform="translate(0, 38)">
            <rect
              x={-118}
              y={-22}
              width={236}
              height={38}
              rx={10}
              fill={highlighted ? '#FACC15' : '#FEF08A'}
              stroke={OUTLINE}
              strokeWidth={5}
            />
            <text
              x={0}
              y={5}
              textAnchor="middle"
              fontFamily="Bricolage Grotesque, Poppins, sans-serif"
              fontWeight={900}
              fontSize={23}
              fill="#18181B"
            >
              {roleBadge}
            </text>
          </g>
        )}

        <text
          x={0}
          y={0}
          textAnchor="middle"
          fontFamily="Bricolage Grotesque, Poppins, sans-serif"
          fontWeight={900}
          fontSize={38}
          fill={highlighted ? '#FACC15' : '#FFFFFF'}
          stroke={OUTLINE}
          strokeWidth={12}
          style={{ paintOrder: 'stroke fill' }}
        >
          {username}
        </text>
      </g>
    </g>
  );
};
