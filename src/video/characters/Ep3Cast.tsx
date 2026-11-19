import React from 'react';
import { WargaCharacter, WargaNameTag } from './WargaCast';

const OUTLINE = '#18181B';

// STRICTLY ONLY these 6 new villagers have IG usernames in Episode 3!
// NO vinzz4726, 3p4n.24, dzikkkksd2, m.rizki_p_haikal, asepbabayoo, _26ary4stnn!
export type Ep3MainId =
  | 'virgod'
  | 'singgel'
  | 'isqi'
  | 'nadia'
  | 'lida'
  | 'rehan';

export interface Ep3MainWargaConfig {
  id: Ep3MainId;
  username: string;
  roleBadge?: string;
  shirt: string;
  shirtShade: string;
  hairColor: string;
  hairStyle: 'spiky' | 'parted' | 'cap' | 'curly' | 'swept' | 'fade' | 'hijab';
  skin: string;
  skinShadow: string;
  glasses?: boolean;
  accessory?: 'helmet' | 'book' | 'kitab' | 'none';
}

export const EP3_MAIN_WARGA: Record<Ep3MainId, Ep3MainWargaConfig> = {
  virgod: {
    id: 'virgod',
    username: '@virgod29',
    shirt: '#EF4444',
    shirtShade: '#B91C1C',
    hairColor: '#18181B',
    hairStyle: 'swept',
    skin: '#E5AE86',
    skinShadow: '#C2875E',
    accessory: 'none',
  },
  singgel: {
    id: 'singgel',
    username: '@singgel_boyys11',
    shirt: '#18181B',
    shirtShade: '#09090B',
    hairColor: '#27272A',
    hairStyle: 'spiky',
    skin: '#DDA176',
    skinShadow: '#BA7E54',
    accessory: 'none',
  },
  isqi: {
    id: 'isqi',
    username: '@isqi_sani2316',
    roleBadge: 'GURU',
    shirt: '#0D9488',
    shirtShade: '#115E59',
    hairColor: '#EC4899',
    hairStyle: 'hijab',
    skin: '#E8B894',
    skinShadow: '#C7926A',
    glasses: true,
    accessory: 'book',
  },
  nadia: {
    id: 'nadia',
    username: '@nadia._single_era00',
    roleBadge: 'GURU',
    shirt: '#7C3AED',
    shirtShade: '#5B21B6',
    hairColor: '#F59E0B',
    hairStyle: 'hijab',
    skin: '#E6B28B',
    skinShadow: '#C48B63',
    accessory: 'book',
  },
  lida: {
    id: 'lida',
    username: '@lida_aja_gin',
    roleBadge: 'GURU NGAJI · FLORA',
    shirt: '#16A34A',
    shirtShade: '#15803D',
    hairColor: '#FEF3C7',
    hairStyle: 'hijab',
    skin: '#E5AE86',
    skinShadow: '#C2875E',
    accessory: 'kitab',
  },
  rehan: {
    id: 'rehan',
    username: '@rehannoperwan411',
    roleBadge: 'KEPALA KULI',
    shirt: '#EA580C',
    shirtShade: '#C2410C',
    hairColor: '#18181B',
    hairStyle: 'fade',
    skin: '#D6986E',
    skinShadow: '#B5774F',
    accessory: 'helmet',
  },
};

export interface Ep3CrowdConfig {
  id: string;
  row: 0 | 1 | 2;
  col: number;
  scale: number;
  shirt: string;
  shirtShade: string;
  hairColor: string;
  hairStyle: 'spiky' | 'parted' | 'cap' | 'curly' | 'swept' | 'fade' | 'hijab';
  skin: string;
  seed: number;
}

const CROWD_SHIRTS: [string, string][] = [
  ['#0284C7', '#0369A1'],
  ['#16A34A', '#15803D'],
  ['#E11D48', '#BE123C'],
  ['#4F46E5', '#3730A3'],
  ['#059669', '#047857'],
  ['#9333EA', '#7E22CE'],
  ['#0891B2', '#0E7490'],
  ['#65A30D', '#4D7C0F'],
  ['#DB2777', '#BE185D'],
  ['#2563EB', '#1D4ED8'],
  ['#EA580C', '#C2410C'],
  ['#475569', '#334155'],
  ['#14B8A6', '#0F766E'],
  ['#F59E0B', '#B45309'],
  ['#DC2626', '#991B1B'],
  ['#7C3AED', '#5B21B6'],
];

const CROWD_HAIR_STYLES: ('spiky' | 'parted' | 'cap' | 'curly' | 'swept' | 'fade' | 'hijab')[] = [
  'fade', 'hijab', 'spiky', 'curly', 'hijab', 'parted', 'cap', 'hijab', 'swept', 'fade',
];

const HIJAB_COLORS = ['#F472B6', '#38BDF8', '#FBBF24', '#A855F7', '#FB7185', '#34D399', '#FEF08A', '#F97316'];
const SKINS = ['#E2A87E', '#E6B38B', '#DA9D73', '#E5AE86', '#E8B894', '#DDA176', '#D6986E'];

// 36 bustling crowd villagers (3x denser than Episode 2 to reflect 245 residents!) — STRICTLY NO usernames!
export const EP3_CROWD_WARGA: Ep3CrowdConfig[] = Array.from({ length: 36 }, (_, idx) => {
  const row = (idx < 14 ? 0 : idx < 26 ? 1 : 2) as 0 | 1 | 2;
  const col = row === 0 ? idx : row === 1 ? idx - 14 : idx - 26;
  const [shirt, shirtShade] = CROWD_SHIRTS[idx % CROWD_SHIRTS.length];
  const hairStyle = CROWD_HAIR_STYLES[idx % CROWD_HAIR_STYLES.length];
  const hairColor =
    hairStyle === 'hijab'
      ? HIJAB_COLORS[idx % HIJAB_COLORS.length]
      : idx % 3 === 0
      ? '#27272A'
      : '#18181B';
  return {
    id: `c${idx + 1}`,
    row,
    col,
    scale: row === 0 ? 0.34 : row === 1 ? 0.37 : 0.4,
    shirt,
    shirtShade,
    hairColor,
    hairStyle,
    skin: SKINS[idx % SKINS.length],
    seed: 21 + idx * 3,
  };
});

export const Ep3MainVillager: React.FC<{
  cfg: Ep3MainWargaConfig;
  frame: number;
  x: number;
  y: number;
  scale: number;
  pose?: 'idle' | 'raise_hand' | 'wave' | 'work_hammer' | 'cheer';
  mouthOpen?: number;
  mouthVowel?: string;
  highlighted?: boolean;
  showRoleBadge?: boolean;
  walking?: boolean;
  labelOffsetY?: number;
  seed?: number;
}> = ({
  cfg,
  frame,
  x,
  y,
  scale,
  pose = 'idle',
  mouthOpen = 0,
  mouthVowel = 'closed',
  highlighted = false,
  showRoleBadge = false,
  walking = false,
  labelOffsetY = 0,
  seed = 1,
}) => {
  const walkBob = walking ? -Math.abs(Math.sin(frame * 0.48 + seed)) * 12 : 0;
  const activeScale = highlighted ? scale * 1.07 : scale;

  return (
    <g>
      <WargaCharacter
        frame={frame}
        x={x}
        y={y + walkBob}
        scale={scale}
        shirt={cfg.shirt}
        shirtShade={cfg.shirtShade}
        hairColor={cfg.hairColor}
        hairStyle={cfg.hairStyle}
        skin={cfg.skin}
        skinShadow={cfg.skinShadow}
        glasses={cfg.glasses}
        pose={pose}
        mouthOpen={mouthOpen}
        mouthVowel={mouthVowel}
        highlighted={highlighted}
        showLabel={false}
        seed={seed}
      />

      {/* Character-specific flat-2D props/accessories */}
      <g transform={`translate(${x}, ${y + walkBob}) scale(${activeScale})`}>
        {/* Builder yellow helmet & rolled blueprint for @rehannoperwan411 */}
        {cfg.accessory === 'helmet' && (
          <g>
            <path
              d="M -68 -248 C -72 -310, 72 -310, 68 -248 Z"
              fill="#FACC15"
              stroke={OUTLINE}
              strokeWidth={4.5}
            />
            <rect x={-76} y={-252} width={152} height={15} rx={7} fill="#EAB308" stroke={OUTLINE} strokeWidth={4} />
            <rect x={-16} y={-304} width={32} height={54} rx={8} fill="#FDE047" stroke={OUTLINE} strokeWidth={3.5} />
            {/* Rolled house blueprint in left hand */}
            <g transform="translate(-76, 32) rotate(-25)">
              <rect x={-12} y={-55} width={24} height={96} rx={6} fill="#38BDF8" stroke={OUTLINE} strokeWidth={3.8} />
              <ellipse cx={0} cy={-55} rx={12} ry={5} fill="#E0F2FE" stroke={OUTLINE} strokeWidth={3} />
            </g>
          </g>
        )}

        {/* Teacher book prop for @isqi_sani2316 & @nadia._single_era00 */}
        {cfg.accessory === 'book' && (
          <g transform="translate(-74, 28) rotate(-14)">
            <rect x={-26} y={-34} width={52} height={68} rx={7} fill="#2563EB" stroke={OUTLINE} strokeWidth={4} />
            <rect x={-18} y={-24} width={36} height={18} rx={4} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={2.5} />
            <line x1={-26} y1={-34} x2={-26} y2={34} stroke="#1E3A8A" strokeWidth={8} />
          </g>
        )}

        {/* Quran / Iqro kitab prop for @lida_aja_gin (Flora) */}
        {cfg.accessory === 'kitab' && (
          <g transform="translate(-74, 28) rotate(-12)">
            <rect x={-28} y={-36} width={56} height={72} rx={8} fill="#15803D" stroke={OUTLINE} strokeWidth={4} />
            <rect x={-18} y={-22} width={36} height={44} rx={5} fill="#FEF08A" stroke={OUTLINE} strokeWidth={2.8} />
          </g>
        )}
      </g>

      {/* Bold outlined IG username + optional role badge */}
      <WargaNameTag
        x={x}
        y={y + walkBob - (cfg.accessory === 'helmet' ? 16 : 0) + labelOffsetY}
        scale={activeScale}
        username={cfg.username}
        roleBadge={showRoleBadge ? cfg.roleBadge : undefined}
        highlighted={highlighted}
      />
    </g>
  );
};
