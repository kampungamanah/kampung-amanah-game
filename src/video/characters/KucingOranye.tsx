import React from 'react';

const OUTLINE = '#18181B';
const FUR = '#FB923C';
const FUR_DARK = '#EA580C';
const STRIPE = '#C2410C';
const CREAM = '#FEF3C7';

export const KucingOranye: React.FC<{
  frame: number;
  excited?: boolean;
  lookAtKades?: boolean;
  x?: number;
  y?: number;
  scale?: number;
}> = ({ frame, excited = false, lookAtKades = false, x = 835, y = 1218, scale = 0.92 }) => {
  // Periodic natural blink (~4 frames every ~78 frames)
  const blinkCycle = (frame + 18) % 78;
  const isBlinking = blinkCycle >= 74;

  // Tail wag speed increases when Pak Kades talks about the cat
  const tailSpeed = excited ? 0.28 : 0.13;
  const tailWag = Math.sin(frame * tailSpeed) * (excited ? 24 : 14);
  const breathe = 1 + 0.024 * Math.sin(frame * 0.12);
  const earTwitch = frame % 110 > 103 ? Math.sin(frame * 1.8) * 8 : 0;
  const headTilt = lookAtKades ? -7 + Math.sin(frame * 0.1) * 2 : Math.sin(frame * 0.06) * 2;
  const gazeX = lookAtKades ? -3 : 0;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Grass contact shadow */}
      <ellipse cx={6} cy={72} rx={64} ry={15} fill="#15803D" opacity={0.42} />

      {/* Fluffy Wagging Striped Tail */}
      <g>
        <path
          d={`M 32 48 C ${78 + tailWag * 0.4} 38, ${98 + tailWag * 0.7} ${8 - Math.abs(tailWag) * 0.2}, ${80 + tailWag} ${-40 + Math.abs(tailWag) * 0.2}`}
          fill="none"
          stroke={OUTLINE}
          strokeWidth={22}
          strokeLinecap="round"
        />
        <path
          d={`M 32 48 C ${78 + tailWag * 0.4} 38, ${98 + tailWag * 0.7} ${8 - Math.abs(tailWag) * 0.2}, ${80 + tailWag} ${-40 + Math.abs(tailWag) * 0.2}`}
          fill="none"
          stroke={FUR}
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Tabby ring & fluffy cream tail tip */}
        <circle
          cx={66 + tailWag * 0.65}
          cy={12 - Math.abs(tailWag) * 0.12}
          r={6}
          fill={STRIPE}
        />
        <circle
          cx={80 + tailWag}
          cy={-40 + Math.abs(tailWag) * 0.2}
          r={9}
          fill={CREAM}
          stroke={OUTLINE}
          strokeWidth={3.5}
        />
      </g>

      {/* Sitting Body with tucked haunch & breathing squash-stretch */}
      <g transform={`translate(0, 68) scale(${2 - breathe}, ${breathe}) translate(0, -68)`}>
        {/* Back haunch */}
        <ellipse cx={26} cy={44} rx={24} ry={26} fill={FUR_DARK} stroke={OUTLINE} strokeWidth={4} />
        {/* Main torso */}
        <path
          d="M -38 64 C -44 14, -26 -22, 0 -22 C 28 -22, 42 14, 38 64 C 36 74, -36 74, -38 64 Z"
          fill={FUR}
          stroke={OUTLINE}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        {/* Fluffy cream chest bib */}
        <path
          d="M -18 4 C -14 -4, 14 -4, 18 4 C 22 36, 12 62, 0 64 C -12 62, -22 36, -18 4 Z"
          fill={CREAM}
        />
        {/* Cute chest fur tuft */}
        <path d="M -8 6 L 0 14 L 8 6" fill="none" stroke="#FDE68A" strokeWidth={3} strokeLinecap="round" />

        {/* Front legs & cute rounded paws */}
        <rect x={-23} y={24} width={16} height={44} rx={8} fill={FUR} stroke={OUTLINE} strokeWidth={3.5} />
        <rect x={7} y={24} width={16} height={44} rx={8} fill={FUR} stroke={OUTLINE} strokeWidth={3.5} />
        <ellipse cx={-15} cy={67} rx={11} ry={6.5} fill={CREAM} stroke={OUTLINE} strokeWidth={3.5} />
        <ellipse cx={15} cy={67} rx={11} ry={6.5} fill={CREAM} stroke={OUTLINE} strokeWidth={3.5} />
        {/* Paw toe lines */}
        <path d="M -18 66 L -18 71 M -12 66 L -12 71 M 12 66 L 12 71 M 18 66 L 18 71" stroke={OUTLINE} strokeWidth={2} strokeLinecap="round" />
      </g>

      {/* Cute Cat Head */}
      <g transform={`translate(0, -34) rotate(${headTilt})`}>
        {/* Left Ear */}
        <g transform={`translate(-31, -26) rotate(${-12 + earTwitch})`}>
          <path
            d="M -17 16 C -18 -2, -12 -22, -4 -28 C 6 -22, 16 -4, 17 12 Z"
            fill={FUR}
            stroke={OUTLINE}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <path d="M -9 10 C -9 -2, -5 -14, -2 -18 C 4 -12, 8 -2, 9 8 Z" fill="#FDA4AF" />
        </g>
        {/* Right Ear */}
        <g transform={`translate(31, -26) rotate(${12 - earTwitch * 0.5})`}>
          <path
            d="M -17 12 C -16 -4, -6 -22, 4 -28 C 12 -22, 18 -2, 17 16 Z"
            fill={FUR_DARK}
            stroke={OUTLINE}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <path d="M -9 8 C -8 -2, -4 -12, 2 -18 C 5 -14, 9 -2, 9 10 Z" fill="#FDA4AF" />
        </g>

        {/* Rounded fluffy cheeks head silhouette */}
        <path
          d="M -46 4 C -48 -24, -28 -40, 0 -40 C 28 -40, 48 -24, 46 4 C 50 22, 34 38, 0 38 C -34 38, -50 22, -46 4 Z"
          fill={FUR}
          stroke={OUTLINE}
          strokeWidth={4}
          strokeLinejoin="round"
        />

        {/* Subtle cel shadow under chin/cheek */}
        <path
          d="M 28 -28 C 44 -14, 46 12, 30 30 C 16 36, 4 36, -6 36 C 22 30, 36 10, 28 -28 Z"
          fill={FUR_DARK}
          opacity={0.45}
        />

        {/* Tabby M-mark & cheek stripes */}
        <path d="M 0 -38 L 0 -22 M -13 -35 L -9 -23 M 13 -35 L 9 -23" stroke={STRIPE} strokeWidth={4.5} strokeLinecap="round" />
        <path d="M -44 0 L -32 2 M -42 10 L -31 10 M 44 0 L 32 2 M 42 10 L 31 10" stroke={STRIPE} strokeWidth={3.8} strokeLinecap="round" />

        {/* Cream muzzle & rosy cheeks */}
        <ellipse cx={-27} cy={10} rx={8} ry={4.5} fill="#FB7185" opacity={0.35} />
        <ellipse cx={27} cy={10} rx={8} ry={4.5} fill="#FB7185" opacity={0.35} />
        <ellipse cx={-8.5} cy={13} rx={12} ry={9.5} fill={CREAM} />
        <ellipse cx={8.5} cy={13} rx={12} ry={9.5} fill={CREAM} />

        {/* Big glossy cartoon eyes with blink */}
        {isBlinking ? (
          <>
            <path d="M -26 -5 Q -18 1 -10 -5" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d="M 10 -5 Q 18 1 26 -5" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx={-18} cy={-5} rx={9.5} ry={10.5} fill="#18181B" />
            <circle cx={-18 + gazeX} cy={-5} r={6} fill="#3F2712" />
            <circle cx={-18 + gazeX} cy={-5} r={4} fill="#18181B" />
            <circle cx={-21 + gazeX * 0.5} cy={-9} r={3.5} fill="#FFFFFF" />
            <circle cx={-15 + gazeX * 0.5} cy={-2} r={1.6} fill="#FFFFFF" />

            <ellipse cx={18} cy={-5} rx={9.5} ry={10.5} fill="#18181B" />
            <circle cx={18 + gazeX} cy={-5} r={6} fill="#3F2712" />
            <circle cx={18 + gazeX} cy={-5} r={4} fill="#18181B" />
            <circle cx={15 + gazeX * 0.5} cy={-9} r={3.5} fill="#FFFFFF" />
            <circle cx={21 + gazeX * 0.5} cy={-2} r={1.6} fill="#FFFFFF" />
          </>
        )}

        {/* Cute pink triangle nose & ":3" smile */}
        <polygon points="-5,6 5,6 0,12" fill="#F472B6" stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
        <path
          d={excited ? 'M -10 16 Q -5 22 0 15 Q 5 22 10 16' : 'M -9 16 Q -4 20 0 14 Q 4 20 9 16'}
          stroke={OUTLINE}
          strokeWidth={3.2}
          fill="none"
          strokeLinecap="round"
        />

        {/* Whiskers */}
        <path
          d="M -31 9 L -55 5 M -31 16 L -56 18 M 31 9 L 55 5 M 31 16 L 56 18"
          stroke={OUTLINE}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
};
