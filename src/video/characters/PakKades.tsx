import React from 'react';

const OUTLINE = '#18181B';
const SKIN = '#E2A87E';
const SKIN_SHADOW = '#C6855A';

export type PakKadesPose =
  | 'walk'
  | 'present'
  | 'self'
  | 'point_flag'
  | 'point_cat'
  | 'chest'
  | 'point_cam'
  | 'count_1'
  | 'count_2'
  | 'thumbs_up'
  | 'lookout'
  | 'shrug_cat'
  | 'invite';

interface PakKadesProps {
  frame: number;
  x: number;
  y: number;
  pose: PakKadesPose;
  mouthOpen: number; // 0 = closed smile, 0.1..1.0 = open talking
  mouthVowel: string; // 'closed' | 'eh' | 'ah' | 'oh'
  lookX?: number; // -1..1 eye gaze horizontal
  lookY?: number; // -1..1 eye gaze vertical
  eyebrowMood?: 'cheerful' | 'amused' | 'warm' | 'excited' | 'playful';
  squashX?: number;
  squashY?: number;
  scale?: number;
}

export const PakKades: React.FC<PakKadesProps> = ({
  frame,
  x,
  y,
  pose,
  mouthOpen,
  mouthVowel,
  lookX = 0,
  lookY = 0,
  eyebrowMood = 'cheerful',
  squashX = 1,
  squashY = 1,
  scale = 0.86,
}) => {
  // Periodic natural blink (~4 frames every ~85 frames)
  const blinkMod = frame % 85;
  const isBlinking = blinkMod >= 81;

  // Continuous living idle motion (breathing + subtle head nod while speaking)
  const breathe = Math.sin(frame * 0.1) * 3.2;
  const talkNod = mouthOpen > 0.1 ? Math.sin(frame * 0.42) * 2.8 : Math.sin(frame * 0.08) * 1.1;
  const bodyLean =
    pose === 'walk'
      ? 3.5
      : pose === 'point_flag'
      ? -2.8
      : pose === 'point_cat' || pose === 'shrug_cat'
      ? 3.5
      : pose === 'self'
      ? -1.8
      : 0;

  const armState = getArmPose(pose, frame);

  // Expressive eyebrows synced with speech & beat emotion
  const browTalkLift = mouthOpen > 0.2 ? -mouthOpen * 4.5 : 0;
  const leftBrowY =
    (eyebrowMood === 'amused' ? -6 : eyebrowMood === 'excited' ? -7 : eyebrowMood === 'warm' ? -2 : -3) +
    browTalkLift;
  const rightBrowY =
    (eyebrowMood === 'amused' ? 1.5 : eyebrowMood === 'excited' ? -7 : eyebrowMood === 'warm' ? -2 : -3) +
    browTalkLift;

  const headTilt =
    pose === 'point_flag'
      ? -6
      : pose === 'point_cat' || pose === 'shrug_cat'
      ? 7
      : pose === 'self'
      ? -3.5
      : pose === 'lookout'
      ? 4.5
      : 0;

  const scaleBase = scale;

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${squashX * scaleBase}, ${squashY * scaleBase}) rotate(${bodyLean})`}
    >
      {/* Ground contact shadow under shoes */}
      <ellipse cx={0} cy={442} rx={104} ry={19} fill="#334155" opacity={0.35} />

      {/* Tapered Trousers & Pantofel Loafers planted on road */}
      <g transform={`translate(0, ${breathe * 0.16})`}>
        {pose === 'walk' ? (
          <>
            <g transform={`rotate(${Math.sin(frame * 0.5) * 16}, -34, 175)`}>
              <path
                d="M -66 170 L -8 170 L -14 412 L -56 412 Z"
                fill="#1E293B"
                stroke={OUTLINE}
                strokeWidth={4.2}
                strokeLinejoin="round"
              />
              <path d="M -58 402 L -12 402 L -14 414 L -57 414 Z" fill="#0F172A" stroke={OUTLINE} strokeWidth={3} />
              <path
                d="M -64 414 C -66 404, -10 404, -8 414 L -4 434 C -4 442, -74 442, -74 432 Z"
                fill="#18181B"
                stroke={OUTLINE}
                strokeWidth={4}
              />
              <path d="M -70 432 L -6 432" stroke="#52525B" strokeWidth={2.5} />
            </g>
            <g transform={`rotate(${-Math.sin(frame * 0.5) * 16}, 34, 175)`}>
              <path
                d="M 8 170 L 66 170 L 56 412 L 14 412 Z"
                fill="#0F172A"
                stroke={OUTLINE}
                strokeWidth={4.2}
                strokeLinejoin="round"
              />
              <path d="M 12 402 L 58 402 L 57 414 L 14 414 Z" fill="#09090B" stroke={OUTLINE} strokeWidth={3} />
              <path
                d="M 8 414 C 10 404, 66 404, 64 414 L 74 432 C 74 442, 4 442, 4 434 Z"
                fill="#18181B"
                stroke={OUTLINE}
                strokeWidth={4}
              />
              <path d="M 6 432 L 70 432" stroke="#52525B" strokeWidth={2.5} />
            </g>
          </>
        ) : (
          <>
            {/* Left leg */}
            <path
              d="M -68 170 L -8 170 L -14 412 L -56 412 Z"
              fill="#1E293B"
              stroke={OUTLINE}
              strokeWidth={4.2}
              strokeLinejoin="round"
            />
            <path d="M -52 245 Q -36 254 -22 248" stroke="#334155" strokeWidth={3} fill="none" strokeLinecap="round" />
            <path d="M -58 402 L -12 402 L -14 414 L -57 414 Z" fill="#0F172A" stroke={OUTLINE} strokeWidth={3} />
            <path
              d="M -64 414 C -66 404, -10 404, -8 414 L -4 434 C -4 442, -74 442, -74 432 Z"
              fill="#18181B"
              stroke={OUTLINE}
              strokeWidth={4}
            />
            <path d="M -68 432 L -7 432" stroke="#52525B" strokeWidth={2.5} />

            {/* Right leg */}
            <path
              d="M 8 170 L 68 170 L 56 412 L 14 412 Z"
              fill="#0F172A"
              stroke={OUTLINE}
              strokeWidth={4.2}
              strokeLinejoin="round"
            />
            <path d="M 22 248 Q 36 254 52 245" stroke="#1E293B" strokeWidth={3} fill="none" strokeLinecap="round" />
            <path d="M 12 402 L 58 402 L 57 414 L 14 414 Z" fill="#09090B" stroke={OUTLINE} strokeWidth={3} />
            <path
              d="M 8 414 C 10 404, 66 404, 64 414 L 74 432 C 74 442, 4 442, 4 434 Z"
              fill="#18181B"
              stroke={OUTLINE}
              strokeWidth={4}
            />
            <path d="M 7 432 L 68 432" stroke="#52525B" strokeWidth={2.5} />
          </>
        )}
      </g>

      {/* Back Arm (screen-right / character's left arm) */}
      <ArticulatedArm
        sx={78}
        sy={-112 + breathe * 0.5}
        upperAngle={armState.rUpper}
        lowerAngle={armState.rLower}
        handType={armState.rHand}
        sleeveColor="#7C2D12"
        flip={false}
      />

      {/* Torso — Refined Kemeja Batik Soga/Emas */}
      <g transform={`translate(0, ${breathe * 0.45})`}>
        <defs>
          <clipPath id="kadesShirtClip">
            <path d="M -86 -134 C -86 -156, -50 -170, 0 -170 C 50 -170, 86 -156, 86 -134 L 90 174 C 90 190, 72 198, 0 198 C -72 198, -90 190, -90 174 Z" />
          </clipPath>
        </defs>

        {/* Shirt silhouette */}
        <path
          d="M -86 -134 C -86 -156, -50 -170, 0 -170 C 50 -170, 86 -156, 86 -134 L 90 174 C 90 190, 72 198, 0 198 C -72 198, -90 190, -90 174 Z"
          fill="#9A3412"
          stroke={OUTLINE}
          strokeWidth={4.2}
          strokeLinejoin="round"
        />

        {/* Clipped Batik Kawung + Parang accents & cel shading */}
        <g clipPath="url(#kadesShirtClip)">
          {/* Right-side cel shadow */}
          <path
            d="M 42 -166 C 68 -156, 86 -142, 86 -128 L 90 178 C 84 192, 62 196, 36 196 C 54 98, 56 -48, 42 -166 Z"
            fill="#7C2D12"
          />

          {/* Refined Kawung Batik pattern */}
          <g opacity={0.9}>
            {[
              [-48, -92],
              [48, -92],
              [-52, -8],
              [52, -8],
              [-48, 76],
              [48, 76],
              [0, -48],
              [0, 36],
              [0, 120],
            ].map(([bx, by], idx) => (
              <g key={idx} transform={`translate(${bx}, ${by}) scale(0.84)`}>
                <ellipse cx={0} cy={-15} rx={8} ry={13} fill="#FBBF24" stroke="#451A03" strokeWidth={2} />
                <ellipse cx={0} cy={15} rx={8} ry={13} fill="#FBBF24" stroke="#451A03" strokeWidth={2} />
                <ellipse cx={-15} cy={0} rx={13} ry={8} fill="#FEF3C7" stroke="#451A03" strokeWidth={2} />
                <ellipse cx={15} cy={0} rx={13} ry={8} fill="#FEF3C7" stroke="#451A03" strokeWidth={2} />
                <circle cx={0} cy={0} r={4.5} fill="#DC2626" stroke="#451A03" strokeWidth={2} />
              </g>
            ))}
          </g>

          {/* Subtle golden diagonal batik accent dots */}
          {[-68, 68].map((dx, i) => (
            <path
              key={i}
              d={`M ${dx} -130 L ${dx} 165`}
              stroke="#FDE68A"
              strokeWidth={3}
              strokeDasharray="4 18"
              strokeLinecap="round"
              opacity={0.45}
            />
          ))}
        </g>

        {/* Left chest pocket & gold Kades pin */}
        <path
          d="M 24 -76 L 64 -76 L 64 -34 Q 44 -24 24 -34 Z"
          fill="#7C2D12"
          stroke={OUTLINE}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <circle cx={44} cy={-56} r={7.5} fill="#FACC15" stroke={OUTLINE} strokeWidth={2.5} />
        <circle cx={44} cy={-56} r={3} fill="#FEF9C3" />

        {/* Center button placket */}
        <rect x={-10} y={-156} width={20} height={352} fill="#7C2D12" stroke={OUTLINE} strokeWidth={3} />
        {[-95, -35, 25, 85, 145].map((by, i) => (
          <circle key={i} cx={0} cy={by} r={4.5} fill="#FEF3C7" stroke={OUTLINE} strokeWidth={2.2} />
        ))}

        {/* Crisp Shirt Collar */}
        <path
          d="M -42 -168 L -10 -124 L -40 -110 Z"
          fill="#B45309"
          stroke={OUTLINE}
          strokeWidth={3.6}
          strokeLinejoin="round"
        />
        <path
          d="M 42 -168 L 10 -124 L 40 -110 Z"
          fill="#B45309"
          stroke={OUTLINE}
          strokeWidth={3.6}
          strokeLinejoin="round"
        />

        {/* Belt & Gold Buckle */}
        <rect x={-88} y={164} width={176} height={24} rx={5} fill="#18181B" stroke={OUTLINE} strokeWidth={3.5} />
        <rect x={-19} y={160} width={38} height={32} rx={6} fill="#FACC15" stroke={OUTLINE} strokeWidth={3.5} />
        <rect x={-10} y={168} width={20} height={16} rx={3} fill="#CA8A04" />
      </g>

      {/* Front Arm (screen-left / character's right arm) */}
      <ArticulatedArm
        sx={-78}
        sy={-112 + breathe * 0.45}
        upperAngle={armState.lUpper}
        lowerAngle={armState.lLower}
        handType={armState.lHand}
        sleeveColor="#9A3412"
        flip={true}
      />

      {/* Neck with chin shadow */}
      <g transform={`translate(0, ${breathe * 0.55})`}>
        <rect
          x={-26}
          y={-212}
          width={52}
          height={54}
          rx={18}
          fill={SKIN}
          stroke={OUTLINE}
          strokeWidth={4}
        />
        <path d="M -24 -198 Q 0 -176 24 -198 L 24 -212 L -24 -212 Z" fill={SKIN_SHADOW} opacity={0.75} />
      </g>

      {/* HEAD & EXPRESSIVE FACE (with Lip-Sync Mouth!) */}
      <g transform={`translate(0, ${-308 + breathe * 0.65}) rotate(${headTilt + talkNod})`}>
        {/* Sculpted Ears */}
        <g transform="translate(-84, 12)">
          <ellipse cx={0} cy={0} rx={15} ry={24} fill={SKIN_SHADOW} stroke={OUTLINE} strokeWidth={4} />
          <path d="M -4 -9 Q 4 -4 0 8" stroke={OUTLINE} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(84, 12)">
          <ellipse cx={0} cy={0} rx={15} ry={24} fill={SKIN} stroke={OUTLINE} strokeWidth={4} />
          <path d="M 4 -9 Q -4 -4 0 8" stroke={OUTLINE} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>

        {/* Refined Sculpted Face Contour (gentle cheeks & tapered chin) */}
        <path
          d="M -80 -36 C -82 -98, 82 -98, 80 -36 C 82 2, 78 36, 70 60 C 58 96, 28 112, 0 112 C -28 112, -58 96, -70 60 C -78 36, -82 2, -80 -36 Z"
          fill={SKIN}
          stroke={OUTLINE}
          strokeWidth={4.2}
          strokeLinejoin="round"
        />
        {/* Soft cel jaw/cheek shadow */}
        <path
          d="M 48 -68 C 72 -50, 78 -16, 74 34 C 66 84, 34 106, 0 108 C 32 94, 54 62, 58 18 C 60 -20, 56 -48, 48 -68 Z"
          fill={SKIN_SHADOW}
          opacity={0.62}
        />

        {/* Hair / Neat Sideburns with subtle silver touch */}
        <path d="M -79 -44 C -84 -16, -74 0, -67 3 L -67 -34 Z" fill="#27272A" />
        <path d="M 79 -44 C 84 -16, 74 0, 67 3 L 67 -34 Z" fill="#27272A" />
        <path d="M -76 -12 L -68 -12" stroke="#D4D4D8" strokeWidth={3.5} strokeLinecap="round" />
        <path d="M 76 -12 L 68 -12" stroke="#D4D4D8" strokeWidth={3.5} strokeLinecap="round" />

        {/* Classic Indonesian Peci Hitam (with subtle character tilt & velvet highlight) */}
        <g transform="translate(0, -72) rotate(-1.5)">
          <path
            d="M -84 20 C -86 -26, -74 -72, 0 -75 C 74 -72, 86 -26, 84 20 C 56 30, -56 30, -84 20 Z"
            fill="#18181B"
            stroke="#09090B"
            strokeWidth={4.2}
            strokeLinejoin="round"
          />
          {/* Velvet sheen highlight */}
          <path
            d="M -62 -44 C -36 -58, 18 -60, 48 -48 C 18 -44, -30 -40, -62 -44 Z"
            fill="#3F3F46"
          />
          <path d="M -76 12 Q 0 22 76 12" stroke="#3F3F46" strokeWidth={3} fill="none" />
        </g>

        {/* Warm smile cheek blush & gentle laugh lines */}
        <ellipse cx={-46} cy={26} rx={15} ry={8} fill="#FB7185" opacity={0.25} />
        <ellipse cx={46} cy={26} rx={15} ry={8} fill="#FB7185" opacity={0.25} />

        {/* Expressive Warm Eyes (almond upper eyelid so he looks charismatic & friendly) */}
        {isBlinking ? (
          <>
            <path d="M -46 -12 Q -30 -2 -14 -12" stroke={OUTLINE} strokeWidth={4.8} fill="none" strokeLinecap="round" />
            <path d="M 14 -12 Q 30 -2 46 -12" stroke={OUTLINE} strokeWidth={4.8} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Left Eye */}
            <ellipse cx={-30} cy={-14} rx={15} ry={16} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={3.5} />
            <circle cx={-30 + lookX * 4.5} cy={-13 + lookY * 3.5} r={8.5} fill="#3E2723" />
            <circle cx={-30 + lookX * 4.5} cy={-13 + lookY * 3.5} r={4.8} fill="#18181B" />
            <circle cx={-33 + lookX * 4.5} cy={-17 + lookY * 3.5} r={3.2} fill="#FFFFFF" />
            <circle cx={-27 + lookX * 4.5} cy={-10 + lookY * 3.5} r={1.4} fill="#FFFFFF" />
            {/* Crisp friendly upper eyelid */}
            <path d="M -46 -17 Q -30 -32 -14 -17" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />

            {/* Right Eye */}
            <ellipse cx={30} cy={-14} rx={15} ry={16} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={3.5} />
            <circle cx={30 + lookX * 4.5} cy={-13 + lookY * 3.5} r={8.5} fill="#3E2723" />
            <circle cx={30 + lookX * 4.5} cy={-13 + lookY * 3.5} r={4.8} fill="#18181B" />
            <circle cx={27 + lookX * 4.5} cy={-17 + lookY * 3.5} r={3.2} fill="#FFFFFF" />
            <circle cx={33 + lookX * 4.5} cy={-10 + lookY * 3.5} r={1.4} fill="#FFFFFF" />
            <path d="M 14 -17 Q 30 -32 46 -17" stroke={OUTLINE} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Tapered Expressive Eyebrows */}
        <path
          d={`M -48 ${-40 + leftBrowY} Q -30 ${-50 + leftBrowY} -13 ${-40 + leftBrowY}`}
          stroke="#18181B"
          strokeWidth={6.5}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M 13 ${-40 + rightBrowY} Q 30 ${-50 + rightBrowY} 48 ${-40 + rightBrowY}`}
          stroke="#18181B"
          strokeWidth={6.5}
          fill="none"
          strokeLinecap="round"
        />

        {/* Friendly Rounded Nose */}
        <path
          d="M -4 -5 Q 14 12 2 22 Q -9 24 -13 18"
          fill={SKIN_SHADOW}
          stroke={OUTLINE}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Neat Indonesian Gentleman Mustache */}
        <g transform={`translate(0, ${34 - mouthOpen * 3})`}>
          <path
            d="M -36 7 C -24 -7, -6 -5, 0 2 C 6 -5, 24 -7, 36 7 C 21 13, 8 9, 0 6 C -8 9, -21 13, -36 7 Z"
            fill="#27272A"
            stroke={OUTLINE}
            strokeWidth={2.8}
            strokeLinejoin="round"
          />
        </g>

        {/* SYNCHRONIZED LIP-SYNC MOUTH */}
        <PakKadesMouth open={mouthOpen} vowel={mouthVowel} />
      </g>
    </g>
  );
};

const PakKadesMouth: React.FC<{ open: number; vowel: string }> = ({ open, vowel }) => {
  // Paused / silent -> friendly warm closed smile
  if (open <= 0.08) {
    return (
      <g transform="translate(0, 56)">
        <path
          d="M -24 0 Q 0 17 24 0"
          stroke={OUTLINE}
          strokeWidth={4.5}
          fill="none"
          strokeLinecap="round"
        />
        <path d="M -27 -3 Q -25 2 -21 4" stroke={OUTLINE} strokeWidth={2.8} fill="none" strokeLinecap="round" />
        <path d="M 27 -3 Q 25 2 21 4" stroke={OUTLINE} strokeWidth={2.8} fill="none" strokeLinecap="round" />
      </g>
    );
  }

  // Talking mouth: dynamic height & vowel width
  const h = 10 + open * 30;
  const w = vowel === 'oh' ? 16 + open * 9 : vowel === 'eh' ? 27 + open * 9 : 23 + open * 12;

  return (
    <g transform="translate(0, 54)">
      <defs>
        <clipPath id="kadesMouthClip">
          <path d={`M ${-w} 0 Q 0 -5 ${w} 0 Q ${w + 2} ${h} 0 ${h + 4} Q ${-w - 2} ${h} ${-w} 0 Z`} />
        </clipPath>
      </defs>

      <path d={`M ${-w} 0 Q 0 -5 ${w} 0 Q ${w + 2} ${h} 0 ${h + 4} Q ${-w - 2} ${h} ${-w} 0 Z`} fill="#7F1D1D" />

      <g clipPath="url(#kadesMouthClip)">
        <rect x={-w} y={-5} width={w * 2} height={Math.min(12, h * 0.36)} rx={4} fill="#FFFFFF" />
        <ellipse cx={0} cy={h + 2} rx={w * 0.68} ry={Math.max(7, h * 0.42)} fill="#FB7185" />
      </g>

      <path
        d={`M ${-w} 0 Q 0 -5 ${w} 0 Q ${w + 2} ${h} 0 ${h + 4} Q ${-w - 2} ${h} ${-w} 0 Z`}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={4}
        strokeLinejoin="round"
      />
    </g>
  );
};

type HandType = 'relaxed' | 'open' | 'point' | 'thumb_self' | 'count_1' | 'count_2' | 'thumbs_up';

const ArticulatedArm: React.FC<{
  sx: number;
  sy: number;
  upperAngle: number;
  lowerAngle: number;
  handType: HandType;
  sleeveColor: string;
  flip: boolean;
}> = ({ sx, sy, upperAngle, lowerAngle, handType, sleeveColor, flip }) => {
  return (
    <g transform={`translate(${sx}, ${sy}) rotate(${upperAngle})`}>
      {/* Upper arm skin overlap at elbow */}
      <circle cx={0} cy={72} r={14} fill={SKIN} stroke={OUTLINE} strokeWidth={3.5} />
      {/* Short Tapered Batik Sleeve with Cuff */}
      <path
        d="M -21 -12 C -23 20, -21 54, -19 70 L 19 70 C 21 54, 23 20, 21 -12 Z"
        fill={sleeveColor}
        stroke={OUTLINE}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <rect x={-21} y={62} width={42} height={11} rx={4} fill="#B45309" stroke={OUTLINE} strokeWidth={3.2} />

      {/* Tapered Forearm */}
      <g transform={`translate(0, 72) rotate(${lowerAngle})`}>
        <path
          d="M -14 0 L 14 0 L 11 82 L -11 82 Z"
          fill={SKIN}
          stroke={OUTLINE}
          strokeWidth={3.8}
          strokeLinejoin="round"
        />
        {/* Detailed Cartoon Hand */}
        <g transform={`translate(0, 82) scale(${flip ? -1 : 1}, 1)`}>
          <CartoonHand type={handType} />
        </g>
      </g>
    </g>
  );
};

const CartoonHand: React.FC<{ type: HandType }> = ({ type }) => {
  if (type === 'point' || type === 'count_1') {
    return (
      <g>
        <path
          d="M -15 0 C -17 16, -12 26, 0 26 C 12 26, 17 16, 15 0 Z"
          fill={SKIN}
          stroke={OUTLINE}
          strokeWidth={3.8}
          strokeLinejoin="round"
        />
        {/* Index finger */}
        <rect x={-6} y={18} width={12} height={36} rx={6} fill={SKIN} stroke={OUTLINE} strokeWidth={3.6} />
        {/* Curled thumb */}
        <ellipse cx={-13} cy={12} rx={7} ry={10} fill={SKIN} stroke={OUTLINE} strokeWidth={3.4} />
        {/* Subtle curled fingers */}
        <ellipse cx={9} cy={18} rx={5.5} ry={7} fill={SKIN_SHADOW} stroke={OUTLINE} strokeWidth={2.8} />
      </g>
    );
  }
  if (type === 'count_2') {
    return (
      <g>
        <path
          d="M -16 0 C -17 16, -12 26, 0 26 C 12 26, 17 16, 16 0 Z"
          fill={SKIN}
          stroke={OUTLINE}
          strokeWidth={3.8}
          strokeLinejoin="round"
        />
        <rect x={-12} y={18} width={11} height={36} rx={5.5} fill={SKIN} stroke={OUTLINE} strokeWidth={3.5} transform="rotate(8, -7, 18)" />
        <rect x={1} y={18} width={11} height={36} rx={5.5} fill={SKIN} stroke={OUTLINE} strokeWidth={3.5} transform="rotate(-8, 7, 18)" />
        <ellipse cx={-13} cy={12} rx={6.5} ry={9} fill={SKIN} stroke={OUTLINE} strokeWidth={3.2} />
      </g>
    );
  }
  if (type === 'thumbs_up' || type === 'thumb_self') {
    return (
      <g>
        <rect x={-16} y={-2} width={32} height={28} rx={11} fill={SKIN} stroke={OUTLINE} strokeWidth={3.8} />
        <line x1={-4} y1={8} x2={14} y2={8} stroke={OUTLINE} strokeWidth={2.4} />
        <line x1={-4} y1={16} x2={14} y2={16} stroke={OUTLINE} strokeWidth={2.4} />
        <rect
          x={-25}
          y={-20}
          width={13}
          height={32}
          rx={6.5}
          fill={SKIN}
          stroke={OUTLINE}
          strokeWidth={3.6}
          transform="rotate(-20, -18, 4)"
        />
      </g>
    );
  }
  if (type === 'open') {
    return (
      <g>
        <ellipse cx={0} cy={14} rx={17} ry={17} fill={SKIN} stroke={OUTLINE} strokeWidth={3.8} />
        <rect x={-22} y={6} width={11} height={22} rx={5.5} fill={SKIN} stroke={OUTLINE} strokeWidth={3.2} transform="rotate(28, -16, 10)" />
        <rect x={-10} y={24} width={8.5} height={17} rx={4.2} fill={SKIN} stroke={OUTLINE} strokeWidth={3} />
        <rect x={-1} y={25} width={8.5} height={19} rx={4.2} fill={SKIN} stroke={OUTLINE} strokeWidth={3} />
        <rect x={8} y={23} width={8.5} height={16} rx={4.2} fill={SKIN} stroke={OUTLINE} strokeWidth={3} />
      </g>
    );
  }
  // Relaxed fist
  return (
    <g>
      <ellipse cx={0} cy={13} rx={16} ry={18} fill={SKIN} stroke={OUTLINE} strokeWidth={3.8} />
      <path d="M -8 18 Q 0 22 8 18" stroke={OUTLINE} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </g>
  );
};

function getArmPose(
  pose: PakKadesPose,
  frame: number
): {
  lUpper: number;
  lLower: number;
  lHand: HandType;
  rUpper: number;
  rLower: number;
  rHand: HandType;
} {
  const wave = Math.sin(frame * 0.16) * 5.5;
  switch (pose) {
    case 'walk':
      return {
        lUpper: Math.sin(frame * 0.5) * 26,
        lLower: -24,
        lHand: 'relaxed',
        rUpper: -Math.sin(frame * 0.5) * 26,
        rLower: -24,
        rHand: 'relaxed',
      };
    case 'present':
      return {
        lUpper: 44 + wave * 0.5,
        lLower: 26,
        lHand: 'open',
        rUpper: -38 - wave * 0.4,
        rLower: -34,
        rHand: 'open',
      };
    case 'self':
      return {
        lUpper: 28,
        lLower: -112,
        lHand: 'thumb_self',
        rUpper: -42 + wave * 0.6,
        rLower: -48,
        rHand: 'open',
      };
    case 'point_flag':
      return {
        lUpper: 72 + wave * 0.4,
        lLower: 34,
        lHand: 'point',
        rUpper: -20,
        rLower: -26,
        rHand: 'open',
      };
    case 'point_cat':
      return {
        lUpper: 18,
        lLower: -24,
        lHand: 'relaxed',
        rUpper: -56 + wave * 0.4,
        rLower: -16,
        rHand: 'point',
      };
    case 'chest':
      return {
        lUpper: 24,
        lLower: -114,
        lHand: 'open',
        rUpper: -18,
        rLower: -22,
        rHand: 'relaxed',
      };
    case 'point_cam':
      return {
        lUpper: 40,
        lLower: 112 + wave * 0.4,
        lHand: 'point',
        rUpper: -26,
        rLower: -34,
        rHand: 'open',
      };
    case 'count_1':
      return {
        lUpper: 44,
        lLower: 130 + wave * 0.4,
        lHand: 'count_1',
        rUpper: -16,
        rLower: -22,
        rHand: 'relaxed',
      };
    case 'count_2':
      return {
        lUpper: 50,
        lLower: 124 + wave * 0.5,
        lHand: 'count_2',
        rUpper: -22,
        rLower: -32,
        rHand: 'open',
      };
    case 'thumbs_up':
      return {
        lUpper: 46,
        lLower: 126 + wave * 0.6,
        lHand: 'thumbs_up',
        rUpper: -30,
        rLower: -44,
        rHand: 'open',
      };
    case 'lookout':
      return {
        lUpper: 108,
        lLower: 106,
        lHand: 'open',
        rUpper: -18,
        rLower: -22,
        rHand: 'relaxed',
      };
    case 'shrug_cat':
      return {
        lUpper: 48 + wave * 0.4,
        lLower: 58,
        lHand: 'open',
        rUpper: -50 - wave * 0.4,
        rLower: -60,
        rHand: 'open',
      };
    case 'invite':
    default:
      return {
        lUpper: 52 + wave,
        lLower: 92,
        lHand: 'open',
        rUpper: -44 - wave * 0.6,
        rLower: -64,
        rHand: 'open',
      };
  }
}
