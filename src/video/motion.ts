export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

export const easeInCubic = (t: number) => Math.pow(clamp(t), 3);

export const easeInOutCubic = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const lin = (
  frame: number,
  a: number,
  b: number,
  from = 0,
  to = 1,
  easing: (t: number) => number = easeInOutCubic
) => {
  if (b <= a) return to;
  const u = clamp((frame - a) / (b - a));
  return lerp(from, to, easing(u));
};

// Analytical underdamped spring matching Motion/Remotion spring behavior cleanly
export const spring = (
  frame: number,
  delay = 0,
  damping = 12,
  stiffness = 180,
  mass = 0.75
): number => {
  const f = Math.max(0, frame - delay);
  if (f === 0) return 0;
  const t = f / FPS;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const val =
      1 -
      Math.exp(-zeta * w0 * t) *
        (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
    return clamp(val, -0.3, 1.35);
  }
  const val = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  return clamp(val, 0, 1);
};

export const squash = (f: number) => {
  if (f < 0 || f > 14) return { sx: 1, sy: 1 };
  const k = Math.max(0, 1 - f / 12) * Math.cos(f * 0.85);
  return { sx: 1 + 0.16 * k, sy: 1 - 0.16 * k };
};

export const shake = (f: number, amp = 10) => {
  if (f < 0 || f >= 14) return 0;
  return Math.sin(f * 2.5) * ((14 - f) / 14) * amp;
};

export const fr = (seconds: number) => Math.round(seconds * FPS);
