import {
  BallState,
  BEACH_SAND_Y,
  BuiltHouse,
  CAMERA_VIEW_HEIGHT,
  HOUSE_PLOTS,
  INTERIOR_EXIT_X,
  INTERIOR_EXIT_Y,
  INTERIOR_HEIGHT,
  INTERIOR_WIDTH,
  JOBS,
  LANDMARKS,
  OCEAN_SHORE_Y,
  OjekOrderState,
  PlayerState,
  ROAD_BOTTOM_Y,
  ROAD_TOP_Y,
  RoomId,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './types';

const OUTLINE = '#18181B';

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
  duration: number;
}

export interface RenderInteractionHint {
  x: number;
  y: number;
  label: string;
}

export interface RenderContextState {
  now: number;
  room: RoomId;
  cameraX: number;
  cameraY: number;
  viewportW: number;
  viewportH: number;
  players: PlayerState[];
  selfId: string;
  houses: BuiltHouse[];
  ball: BallState;
  totalRegistered: number;
  igUsername?: string;
  floatingTexts: FloatingText[];
  interactionHint: RenderInteractionHint | null;
  workTarget: { x: number; y: number; label: string; color?: string } | null;
  catPetUntil: number;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawSignLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bg = '#FACC15',
  fg = '#18181B'
) {
  if (!text) return;
  ctx.save();
  ctx.font = '800 12px "Plus Jakarta Sans", sans-serif';
  const tw = ctx.measureText(text).width;
  const pw = tw + 18;
  const ph = 22;
  roundRectPath(ctx, x - pw / 2, y - ph / 2, pw, ph, 6);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.save();
  ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
  const bw = Math.min(230, ctx.measureText(text).width + 20);
  roundRectPath(ctx, x - bw / 2, y - 13, bw, 26, 8);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = '#18181B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5, bw - 14);
  ctx.restore();
}

// ============================================================================
// OUTDOOR WORLD SKY, HILLS, TREES, GROUND & LANDMARKS (6200px WIDE!)
// ============================================================================

function drawSkyAndHills(ctx: CanvasRenderingContext2D, cameraX: number, viewW: number, now: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, 390);
  grad.addColorStop(0, '#0EA5E9');
  grad.addColorStop(0.62, '#38BDF8');
  grad.addColorStop(1, '#BAE6FD');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, viewW, 405);

  // Sun
  const sunX = 180 + (viewW - 320) * 0.82 - cameraX * 0.025;
  const sunY = 92;
  const pulse = 1 + Math.sin(now * 0.0022) * 0.03;
  ctx.save();
  ctx.translate(sunX, sunY);
  ctx.scale(pulse, pulse);
  ctx.beginPath();
  ctx.arc(0, 0, 62, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(253, 224, 71, 0.28)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.fillStyle = '#FACC15';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-11, -11, 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
  ctx.fill();
  ctx.restore();

  // Parallax clouds across full 6200px sky
  const cloudDrift = Math.sin(now * 0.0005) * 16;
  for (let i = 0; i < 12; i++) {
    const cx = 140 + i * 440;
    const cy = 78 + (i % 3) * 20;
    const s = 0.72 + (i % 2) * 0.12;
    const sx = cx - cameraX * 0.22 + cloudDrift * (i % 2 === 0 ? 1 : -0.7);
    if (sx < -160 || sx > viewW + 160) continue;
    ctx.save();
    ctx.translate(sx, cy);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-70, 18);
    ctx.bezierCurveTo(-94, 18, -100, -14, -72, -22);
    ctx.bezierCurveTo(-68, -52, -24, -58, -6, -34);
    ctx.bezierCurveTo(14, -54, 56, -44, 58, -15);
    ctx.bezierCurveTo(90, -10, 86, 18, 58, 18);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.restore();
  }

  // Rolling distant green hills
  ctx.save();
  ctx.translate(-cameraX * 0.42, 0);
  ctx.beginPath();
  ctx.moveTo(-200, 390);
  for (let hx = -200; hx <= 4200; hx += 420) {
    ctx.quadraticCurveTo(hx + 210, 302 + ((hx / 420) % 2 === 0 ? 0 : 24), hx + 420, 378);
  }
  ctx.lineTo(4400, 420);
  ctx.lineTo(-200, 420);
  ctx.closePath();
  ctx.fillStyle = '#86EFAC';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
}

function drawTrees(ctx: CanvasRenderingContext2D, now: number, cameraX: number, viewW: number) {
  const minX = Math.max(80, Math.floor((cameraX - 180) / 160) * 160);
  const maxX = Math.min(WORLD_WIDTH - 60, cameraX + viewW + 180);
  for (let tx = minX; tx <= maxX; tx += 160) {
    const sway = Math.sin(now * 0.0018 + tx * 0.01) * 0.03;
    const sc = 0.78 + ((tx % 3) * 0.09);
    const ty = 342 + ((tx % 2) * 8);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(sc, sc);
    ctx.rotate(sway);

    roundRectPath(ctx, -9, -8, 18, 66, 5);
    ctx.fillStyle = '#92400E';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    const drawLeaf = (cx: number, cy: number, r: number, color: string, stroke = true) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (stroke) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
      }
    };
    drawLeaf(-24, -24, 30, '#22C55E');
    drawLeaf(26, -22, 30, '#15803D');
    drawLeaf(0, -48, 38, '#16A34A');
    drawLeaf(-8, -56, 22, '#4ADE80', false);
    ctx.restore();
  }
}

function drawGroundAndRoad(ctx: CanvasRenderingContext2D, now: number) {
  // Main grass meadow
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(0, 368, WORLD_WIDTH, WORLD_HEIGHT - 368);

  // Sunlit upper meadow strip
  ctx.fillStyle = '#4ADE80';
  ctx.fillRect(0, 368, WORLD_WIDTH, 52);

  // Western rice paddy (Sawah Kampung x = 60..340) for spacious village vibe
  roundRectPath(ctx, 60, 396, 260, 108, 10);
  ctx.fillStyle = '#84CC16';
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#3F6212';
  ctx.stroke();
  for (let rx = 85; rx <= 295; rx += 32) {
    ctx.beginPath();
    ctx.moveTo(rx, 405);
    ctx.lineTo(rx, 495);
    ctx.strokeStyle = 'rgba(63, 98, 18, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  drawSignLabel(ctx, 190, 388, 'SAWAH BARAT', '#BEF264', '#1A2E05');

  // Top grass horizon outline
  ctx.beginPath();
  ctx.moveTo(0, 368);
  ctx.lineTo(WORLD_WIDTH, 368);
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Wooden fence separating Lapangan Bola & Komplek Perumahan from the paved road
  for (let fx = 3420; fx <= 6120; fx += 85) {
    roundRectPath(ctx, fx - 4, 508, 8, 22, 2);
    ctx.fillStyle = '#92400E';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
  const railSegments: [number, number][] = [
    [3418, 3685],
    [3795, 4345],
    [4530, 4880],
    [5010, 5490],
    [5620, 6125],
  ];
  for (const [x1, x2] of railSegments) {
    roundRectPath(ctx, x1, 513, x2 - x1, 6, 3);
    ctx.fillStyle = '#B45309';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }

  // Asphalt Village Road
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(0, ROAD_TOP_Y, WORLD_WIDTH, ROAD_BOTTOM_Y - ROAD_TOP_Y);
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(0, ROAD_BOTTOM_Y - 12, WORLD_WIDTH, 12);

  ctx.lineWidth = 3.5;
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(0, ROAD_TOP_Y);
  ctx.lineTo(WORLD_WIDTH, ROAD_TOP_Y);
  ctx.moveTo(0, ROAD_BOTTOM_Y);
  ctx.lineTo(WORLD_WIDTH, ROAD_BOTTOM_Y);
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 5;
  ctx.setLineDash([34, 26]);
  ctx.beginPath();
  ctx.moveTo(0, (ROAD_TOP_Y + ROAD_BOTTOM_Y) / 2);
  ctx.lineTo(WORLD_WIDTH, (ROAD_TOP_Y + ROAD_BOTTOM_Y) / 2);
  ctx.stroke();
  ctx.restore();

  // Grass tufts & southern wildflowers across the lush southern meadow (y = 650..1160)
  ctx.strokeStyle = '#15803D';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let gx = 90; gx < WORLD_WIDTH; gx += 180) {
    const gy = 665 + ((gx % 3) * 14);
    const sway = Math.sin(now * 0.002 + gx) * 2;
    ctx.beginPath();
    ctx.moveTo(gx - 9, gy);
    ctx.lineTo(gx - 4 + sway, gy - 12);
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + sway, gy - 15);
    ctx.moveTo(gx + 9, gy);
    ctx.lineTo(gx + 6 + sway, gy - 11);
    ctx.stroke();
  }

  // Natural dirt footpaths leading south toward Pantai Selatan (no buildings, strictly nature!)
  const drawBeachTrail = (trailX: number) => {
    ctx.save();
    ctx.fillStyle = '#E7C896';
    ctx.beginPath();
    ctx.moveTo(trailX - 42, ROAD_BOTTOM_Y + 2);
    ctx.bezierCurveTo(trailX - 65, 840, trailX + 18, 980, trailX - 48, BEACH_SAND_Y + 24);
    ctx.lineTo(trailX + 52, BEACH_SAND_Y + 24);
    ctx.bezierCurveTo(trailX + 102, 980, trailX + 20, 840, trailX + 42, ROAD_BOTTOM_Y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
    ctx.stroke();
    ctx.restore();
  };
  drawBeachTrail(1760);
  drawBeachTrail(3740);
  drawBeachTrail(5150);

  // Subtle sunny grass glades & wildflowers in the southern woods
  for (let fx = 140; fx < WORLD_WIDTH - 80; fx += 240) {
    const fy = 780 + ((fx * 37) % 340);
    ctx.fillStyle = 'rgba(74, 222, 128, 0.45)';
    ctx.beginPath();
    ctx.ellipse(fx, fy, 46, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute tiny cartoon flowers
    const flowerColor = fx % 480 === 0 ? '#FEF08A' : fx % 720 === 0 ? '#FFFFFF' : '#FBCFE8';
    ctx.fillStyle = flowerColor;
    ctx.beginPath();
    ctx.arc(fx - 12, fy - 2, 4, 0, Math.PI * 2);
    ctx.arc(fx + 14, fy + 4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(fx - 12, fy - 2, 1.6, 0, Math.PI * 2);
    ctx.arc(fx + 14, fy + 4, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wooden signpost pointing south to the beach near Alun-Alun Pak Kades
  {
    const sx = 1855;
    const sy = 696;
    ctx.fillStyle = '#78350F';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.fillRect(sx - 4, sy - 38, 8, 40);
    ctx.strokeRect(sx - 4, sy - 38, 8, 40);
    drawSignLabel(ctx, sx, sy - 44, 'PANTAI SELATAN ↓', '#FEF08A', '#18181B');
  }

  // =========================================================================
  // PANTAI KAMPUNG AMANAH: GOLDEN SANDY BEACH + ANIMATED TURQUOISE OCEAN!
  // =========================================================================
  // Smooth wavy grass-to-sand coastline
  ctx.beginPath();
  ctx.moveTo(0, BEACH_SAND_Y);
  for (let x = 0; x <= WORLD_WIDTH; x += 180) {
    const waveY = BEACH_SAND_Y + Math.sin(x * 0.0045) * 26;
    ctx.lineTo(x, waveY);
  }
  ctx.lineTo(WORLD_WIDTH, WORLD_HEIGHT);
  ctx.lineTo(0, WORLD_HEIGHT);
  ctx.closePath();
  ctx.fillStyle = '#FDE68A';
  ctx.fill();
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = '#92400E';
  ctx.stroke();

  // Warm sunlit upper sand dune band
  ctx.fillStyle = 'rgba(254, 249, 195, 0.65)';
  ctx.fillRect(0, BEACH_SAND_Y + 34, WORLD_WIDTH, 92);

  // Damp golden wet sand band near the water
  ctx.fillStyle = '#FCD34D';
  ctx.fillRect(0, OCEAN_SHORE_Y - 46, WORLD_WIDTH, 60);

  // Scattered starfish, seashells, and pebbles along the beach (zero buildings!)
  for (let bx = 130; bx < WORLD_WIDTH - 100; bx += 290) {
    const by = 1315 + ((bx * 29) % 155);
    if (bx % 580 === 0) {
      // Cute orange cartoon starfish
      ctx.save();
      ctx.translate(bx, by);
      ctx.fillStyle = '#F97316';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 11 : 5;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else {
      // Tiny white seashell & pebble
      ctx.fillStyle = '#FFFBEB';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(bx, by, 6, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Animated turquoise ocean waves lapping the shore!
  const tideShift = Math.sin(now * 0.0022) * 10;

  // Shallow surf foam lip
  ctx.beginPath();
  ctx.moveTo(0, OCEAN_SHORE_Y + tideShift);
  for (let x = 0; x <= WORLD_WIDTH; x += 90) {
    const wy = OCEAN_SHORE_Y + tideShift + Math.sin(x * 0.014 + now * 0.0028) * 9;
    ctx.lineTo(x, wy);
  }
  ctx.lineTo(WORLD_WIDTH, WORLD_HEIGHT);
  ctx.lineTo(0, WORLD_HEIGHT);
  ctx.closePath();
  ctx.fillStyle = '#E0F2FE';
  ctx.fill();

  // Turquoise shallow sea
  ctx.beginPath();
  ctx.moveTo(0, OCEAN_SHORE_Y + 14 + tideShift);
  for (let x = 0; x <= WORLD_WIDTH; x += 90) {
    const wy = OCEAN_SHORE_Y + 14 + tideShift + Math.sin(x * 0.014 + now * 0.0028 + 0.6) * 8;
    ctx.lineTo(x, wy);
  }
  ctx.lineTo(WORLD_WIDTH, WORLD_HEIGHT);
  ctx.lineTo(0, WORLD_HEIGHT);
  ctx.closePath();
  ctx.fillStyle = '#38BDF8';
  ctx.fill();
  ctx.lineWidth = 2.8;
  ctx.strokeStyle = '#0369A1';
  ctx.stroke();

  // Mid-depth tropical blue sea
  ctx.beginPath();
  ctx.moveTo(0, OCEAN_SHORE_Y + 86);
  for (let x = 0; x <= WORLD_WIDTH; x += 120) {
    const wy = OCEAN_SHORE_Y + 86 + Math.sin(x * 0.01 - now * 0.002) * 7;
    ctx.lineTo(x, wy);
  }
  ctx.lineTo(WORLD_WIDTH, WORLD_HEIGHT);
  ctx.lineTo(0, WORLD_HEIGHT);
  ctx.closePath();
  ctx.fillStyle = '#0EA5E9';
  ctx.fill();

  // Deeper blue ocean horizon
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(0, OCEAN_SHORE_Y + 158, WORLD_WIDTH, WORLD_HEIGHT - (OCEAN_SHORE_Y + 158));

  // Crisp animated white ocean wave glints
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let wx = 80; wx < WORLD_WIDTH - 80; wx += 220) {
    const drift = Math.sin(now * 0.002 + wx * 0.01) * 14;
    const wy1 = OCEAN_SHORE_Y + 52 + ((wx % 3) * 12);
    const wy2 = OCEAN_SHORE_Y + 125 + ((wx % 2) * 14);
    ctx.beginPath();
    ctx.moveTo(wx + drift, wy1);
    ctx.lineTo(wx + 48 + drift, wy1);
    ctx.moveTo(wx + 60 - drift * 0.7, wy2);
    ctx.lineTo(wx + 115 - drift * 0.7, wy2);
    ctx.stroke();
  }
}

function drawSouthernShadeTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sc: number,
  now: number
) {
  const sway = Math.sin(now * 0.0018 + x * 0.013) * 0.03;
  ctx.save();
  ctx.translate(x, y);

  // Soft ground shadow
  ctx.fillStyle = 'rgba(21, 128, 61, 0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 34 * sc, 10 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(sc, sc);
  ctx.rotate(sway);

  // Trunk
  roundRectPath(ctx, -9, -62, 18, 66, 5);
  ctx.fillStyle = '#92400E';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  const drawLeaf = (cx: number, cy: number, r: number, color: string, stroke = true) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    }
  };
  drawLeaf(-24, -76, 30, '#22C55E');
  drawLeaf(26, -74, 30, '#15803D');
  drawLeaf(0, -100, 38, '#16A34A');
  drawLeaf(-8, -108, 22, '#4ADE80', false);
  ctx.restore();
}

function drawCoconutPalmTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  lean: number,
  sc: number,
  now: number
) {
  const sway = Math.sin(now * 0.002 + x * 0.015) * 0.045;
  ctx.save();
  ctx.translate(x, y);

  // Ground shadow on sand/grass
  ctx.fillStyle = 'rgba(120, 53, 15, 0.18)';
  ctx.beginPath();
  ctx.ellipse(lean * 18 * sc, 4, 38 * sc, 10 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(sc, sc);

  // Curving palm trunk
  const tipX = lean * 32;
  const tipY = -126;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(tipX * 0.45 - 6, -64, tipX - 5, tipY);
  ctx.lineTo(tipX + 5, tipY);
  ctx.quadraticCurveTo(tipX * 0.45 + 6, -64, 8, 0);
  ctx.closePath();
  ctx.fillStyle = '#B45309';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Swaying palm crown
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(sway);

  const fronds = [
    { a: -2.65, len: 64, c: '#15803D' },
    { a: -2.0, len: 58, c: '#16A34A' },
    { a: -0.95, len: 56, c: '#22C55E' },
    { a: -0.35, len: 64, c: '#16A34A' },
    { a: 0.25, len: 56, c: '#15803D' },
    { a: 2.75, len: 54, c: '#22C55E' },
  ];
  for (const f of fronds) {
    ctx.save();
    ctx.rotate(f.a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(f.len * 0.55, -18, f.len, 8);
    ctx.quadraticCurveTo(f.len * 0.5, -2, 0, 6);
    ctx.closePath();
    ctx.fillStyle = f.c;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.restore();
  }

  // Coconuts tucked under the crown
  const nuts = [
    [-7, 6],
    [6, 8],
    [0, 12],
  ];
  for (const [nx, ny] of nuts) {
    ctx.beginPath();
    ctx.arc(nx, ny, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#78350F';
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

function drawMiniNpc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  shirt: string,
  hair: string,
  now: number,
  wave = false,
  bubble?: string
) {
  const bob = Math.sin(now * 0.005 + x) * 1.2;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(24,24,27,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 3, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.fillRect(-8, -22, 7, 21);
  ctx.strokeRect(-8, -22, 7, 21);
  ctx.fillRect(1, -22, 7, 21);
  ctx.strokeRect(1, -22, 7, 21);

  // Waving arm
  if (wave) {
    ctx.save();
    ctx.translate(12, -44 + bob);
    ctx.rotate(-1.0 + Math.sin(now * 0.012) * 0.35);
    roundRectPath(ctx, -3, -16, 6, 18, 3);
    ctx.fillStyle = '#E5AE86';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Shirt
  roundRectPath(ctx, -11, -48 + bob, 22, 28, 5);
  ctx.fillStyle = shirt;
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(0, -61 + bob, 11.5, 0, Math.PI * 2);
  ctx.fillStyle = '#E5AE86';
  ctx.fill();
  ctx.stroke();

  // Hair
  ctx.beginPath();
  ctx.arc(0, -64 + bob, 11.5, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = hair;
  ctx.fill();
  ctx.stroke();

  // Eyes & smile
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(-3.5, -61 + bob, 1.7, 0, Math.PI * 2);
  ctx.arc(3.5, -61 + bob, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -57 + bob, 3.5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  if (bubble) {
    drawSpeechBubble(ctx, 0, -90 + bob, bubble);
  }
  ctx.restore();
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  now: number,
  totalRegistered: number,
  onlineCount: number,
  pedagangWorking: boolean,
  kuliWorking: boolean,
  igUsername?: string
) {
  // 1. WARUNG KAMPUNG (x = 480) + 2 queuing customers!
  {
    const x = LANDMARKS.warung.x;
    const y = 415;
    ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 96, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    roundRectPath(ctx, x - 78, y - 92, 156, 98, 6);
    ctx.fillStyle = '#FEF3C7';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    roundRectPath(ctx, x - 62, y - 34, 124, 34, 4);
    ctx.fillStyle = '#B45309';
    ctx.fill();
    ctx.stroke();

    ['#EF4444', '#FACC15', '#22C55E', '#F97316'].forEach((jc, idx) => {
      roundRectPath(ctx, x - 48 + idx * 28, y - 50, 18, 16, 4);
      ctx.fillStyle = jc;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    const sw = 176 / 6;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#DB2777' : '#FFFFFF';
      ctx.fillRect(x - 88 + i * sw, y - 114, sw, 26);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = OUTLINE;
      ctx.strokeRect(x - 88 + i * sw, y - 114, sw, 26);
    }

    drawSignLabel(ctx, x, y - 128, 'WARUNG KAMPUNG', '#FACC15');

    // Waiting customer NPCs in front of Warung
    drawMiniNpc(
      ctx,
      x - 102,
      460,
      '#EC4899',
      '#18181B',
      now,
      pedagangWorking,
      pedagangWorking ? 'Es teh & gorengan!' : undefined
    );
    drawMiniNpc(
      ctx,
      x + 104,
      462,
      '#0EA5E9',
      '#27272A',
      now,
      pedagangWorking,
      pedagangWorking ? 'Enak banget!' : undefined
    );
  }

  // 2. PANGKALAN OJEK DESA (x = 890)
  {
    const x = LANDMARKS.pangkalanOjek.x;
    const y = 415;
    ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 88, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shelter pillars
    ctx.fillStyle = '#15803D';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.fillRect(x - 66, y - 78, 10, 82);
    ctx.strokeRect(x - 66, y - 78, 10, 82);
    ctx.fillRect(x + 56, y - 78, 10, 82);
    ctx.strokeRect(x + 56, y - 78, 10, 82);

    // Wooden bench
    roundRectPath(ctx, x - 52, y - 24, 104, 14, 4);
    ctx.fillStyle = '#B45309';
    ctx.fill();
    ctx.stroke();

    // Green-yellow ojek shelter roof
    roundRectPath(ctx, x - 80, y - 98, 160, 24, 6);
    ctx.fillStyle = '#16A34A';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(x - 76, y - 80, 152, 6);

    drawSignLabel(ctx, x, y - 112, 'PANGKALAN OJEK', '#4ADE80', '#052E16');
  }

  // 3. GARASI / DEALER KENDARAAN (x = 1280)
  {
    const x = LANDMARKS.showroom.x;
    const y = 415;
    ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 102, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    roundRectPath(ctx, x - 88, y - 98, 176, 104, 6);
    ctx.fillStyle = '#F1F5F9';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    roundRectPath(ctx, x - 64, y - 72, 128, 76, 4);
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.stroke();
    for (let gy = y - 58; gy < y; gy += 14) {
      ctx.beginPath();
      ctx.moveTo(x - 62, gy);
      ctx.lineTo(x + 62, gy);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    roundRectPath(ctx, x - 96, y - 116, 192, 22, 6);
    ctx.fillStyle = '#2563EB';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    drawSignLabel(ctx, x, y - 130, 'GARASI KENDARAAN', '#38BDF8', '#0F172A');
  }

  // 4. TIANG BENDERA MERAH-PUTIH & PAPAN PENDUDUK
  {
    const fx = LANDMARKS.flag.x;
    const fy = LANDMARKS.flag.y;
    roundRectPath(ctx, fx - 14, fy - 12, 28, 18, 4);
    ctx.fillStyle = '#94A3B8';
    ctx.fill();
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(fx - 4, fy - 220, 8, 210);
    ctx.strokeRect(fx - 4, fy - 220, 8, 210);
    ctx.beginPath();
    ctx.arc(fx, fy - 224, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
    ctx.stroke();

    const wave1 = Math.sin(now * 0.006) * 5;
    const wave2 = Math.cos(now * 0.006) * 6;
    ctx.beginPath();
    ctx.moveTo(fx + 4, fy - 214);
    ctx.quadraticCurveTo(fx + 38, fy - 220 + wave1, fx + 74, fy - 212 + wave2);
    ctx.lineTo(fx + 74, fy - 191 + wave2);
    ctx.quadraticCurveTo(fx + 38, fy - 199 + wave1, fx + 4, fy - 193);
    ctx.closePath();
    ctx.fillStyle = '#DC2626';
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(fx + 4, fy - 193);
    ctx.quadraticCurveTo(fx + 38, fy - 199 + wave1, fx + 74, fy - 191 + wave2);
    ctx.lineTo(fx + 74, fy - 170 + wave2);
    ctx.quadraticCurveTo(fx + 38, fy - 178 + wave1, fx + 4, fy - 172);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.stroke();

    // Papan Penduduk (menampilkan jumlah followers resmi @kampungamanah)
    const bx = LANDMARKS.papan.x;
    const by = LANDMARKS.papan.y;
    ctx.fillStyle = '#78350F';
    ctx.fillRect(bx - 38, by - 46, 8, 52);
    ctx.strokeRect(bx - 38, by - 46, 8, 52);
    ctx.fillRect(bx + 30, by - 46, 8, 52);
    ctx.strokeRect(bx + 30, by - 46, 8, 52);

    roundRectPath(ctx, bx - 56, by - 98, 112, 58, 7);
    ctx.fillStyle = '#FEF3C7';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    ctx.fillStyle = '#78350F';
    ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PENDUDUK', bx, by - 80);
    ctx.fillStyle = '#18181B';
    ctx.font = '900 18px "Bricolage Grotesque", sans-serif';
    ctx.fillText(totalRegistered.toLocaleString('id-ID'), bx, by - 60);
    ctx.fillStyle = '#15803D';
    ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${onlineCount} online`, bx, by - 46);
  }

  // 5. SEKOLAH KAMPUNG (x = 2280 — ENTERABLE!)
  {
    const x = LANDMARKS.sekolah.x;
    const y = 415;
    ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 112, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    roundRectPath(ctx, x - 94, y - 96, 188, 102, 5);
    ctx.fillStyle = '#FEF9C3';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Openable entrance door with doormat
    roundRectPath(ctx, x - 24, y - 54, 48, 60, 5);
    ctx.fillStyle = '#92400E';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(x + 14, y - 24, 3.5, 0, Math.PI * 2);
    ctx.fill();

    [x - 70, x + 36].forEach((wx) => {
      roundRectPath(ctx, wx, y - 64, 34, 32, 4);
      ctx.fillStyle = '#7DD3FC';
      ctx.fill();
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.moveTo(x - 106, y - 94);
    ctx.lineTo(x, y - 152);
    ctx.lineTo(x + 106, y - 94);
    ctx.closePath();
    ctx.fillStyle = '#DC2626';
    ctx.fill();
    ctx.stroke();

    drawSignLabel(ctx, x, y - 90, 'SEKOLAH · BISA MASUK', '#FACC15');
  }

  // 6. MASJID AMANAH (x = 2700 — ENTERABLE!)
  {
    const x = LANDMARKS.masjid.x;
    const y = 415;
    ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 112, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    roundRectPath(ctx, x + 66, y - 146, 26, 152, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 79, y - 146, 14, Math.PI, 0);
    ctx.fillStyle = '#16A34A';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - 6, y - 96, 58, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = '#16A34A';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - 6, y - 164, 8, 0.4, Math.PI * 1.7);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    roundRectPath(ctx, x - 90, y - 96, 168, 102, 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 26, y + 6);
    ctx.lineTo(x - 26, y - 36);
    ctx.arc(x - 6, y - 36, 20, Math.PI, 0);
    ctx.lineTo(x + 14, y + 6);
    ctx.closePath();
    ctx.fillStyle = '#15803D';
    ctx.fill();
    ctx.stroke();

    drawSignLabel(ctx, x - 6, y - 80, 'MASJID · BISA MASUK', '#BBF7D0', '#14532D');
  }

  // 7. GEREJA AMANAH (x = 3110 — ENTERABLE!)
  {
    const x = LANDMARKS.gereja.x;
    const y = 415;
    ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 96, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    roundRectPath(ctx, x - 20, y - 156, 40, 48, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y - 186);
    ctx.lineTo(x, y - 156);
    ctx.moveTo(x - 11, y - 175);
    ctx.lineTo(x + 11, y - 175);
    ctx.stroke();

    roundRectPath(ctx, x - 80, y - 92, 160, 98, 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 90, y - 90);
    ctx.lineTo(x, y - 138);
    ctx.lineTo(x + 90, y - 90);
    ctx.closePath();
    ctx.fillStyle = '#2563EB';
    ctx.fill();
    ctx.stroke();

    roundRectPath(ctx, x - 20, y - 50, 40, 56, 16);
    ctx.fillStyle = '#92400E';
    ctx.fill();
    ctx.stroke();

    drawSignLabel(ctx, x, y - 78, 'GEREJA · BISA MASUK', '#DBEAFE', '#1E3A8A');
  }

  // 8. LAPANGAN BOLA AMANAH (x = 3450..4030 — for hanging out & kicking ball!)
  {
    const fx = 3450;
    const fy = 392;
    const fw = 580;
    const fh = 114;

    ctx.save();
    roundRectPath(ctx, fx, fy, fw, fh, 10);
    ctx.clip();
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#16A34A' : '#22C55E';
      ctx.fillRect(fx + i * (fw / 10), fy, fw / 10 + 1, fh);
    }
    ctx.restore();

    roundRectPath(ctx, fx, fy, fw, fh, 10);
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(fx + fw / 2, fy);
    ctx.lineTo(fx + fw / 2, fy + fh);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(fx + fw / 2, fy + fh / 2, 36, 25, 0, 0, Math.PI * 2);
    ctx.stroke();

    const drawGoal = (gx: number, isRight: boolean) => {
      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.2;
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      const gw = 22;
      const gh = 54;
      const gy = fy + fh / 2 - gh / 2;
      ctx.fillRect(isRight ? gx : gx - gw, gy, gw, gh);
      ctx.strokeRect(isRight ? gx : gx - gw, gy, gw, gh);
      ctx.restore();
    };
    drawGoal(fx + 2, false);
    drawGoal(fx + fw - 2, true);

    drawSignLabel(ctx, fx + fw / 2, fy - 14, 'LAPANGAN BOLA AMANAH', '#FACC15');
  }

  // 9. AREA PROYEK KULI BANGUNAN (x = 4440)
  {
    const x = LANDMARKS.proyekKuli.x;
    const y = 445;

    // Sandy construction pad
    roundRectPath(ctx, x - 118, y - 34, 236, 86, 10);
    ctx.fillStyle = '#FDE68A';
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#92400E';
    ctx.stroke();

    // Brick wall under construction
    const extraRows = kuliWorking ? 1 : 0;
    for (let row = 0; row < 4 + extraRows; row++) {
      for (let col = 0; col < 5; col++) {
        const bx = x - 88 + col * 24 + (row % 2) * 8;
        const by = y - 16 - row * 12;
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(bx, by, 21, 10);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = OUTLINE;
        ctx.strokeRect(bx, by, 21, 10);
      }
    }

    // Cement bags & wheelbarrow on right
    roundRectPath(ctx, x + 42, y - 16, 48, 28, 6);
    ctx.fillStyle = '#94A3B8';
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = '#1E293B';
    ctx.font = '800 9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SEMEN', x + 66, y + 1);

    // Animated hammer sparks when kuli is working
    if (kuliWorking) {
      for (let i = 0; i < 4; i++) {
        const ang = now * 0.012 + i * 1.57;
        const sx = x - 35 + Math.cos(ang) * 26;
        const sy = y - 48 + Math.sin(ang) * 18;
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawSignLabel(ctx, x, y - 92, 'AREA PROYEK KULI', '#FB923C', '#18181B');
  }

  // 10. KOMPLEK PERUMAHAN ARCH
  {
    const sx = 4635;
    const sy = 426;
    ctx.fillStyle = '#78350F';
    ctx.fillRect(sx - 4, sy - 64, 8, 68);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(sx - 4, sy - 64, 8, 68);
    drawSignLabel(ctx, sx, sy - 74, 'KOMPLEK PERUMAHAN →', '#FEF08A', '#18181B');
  }
}

function drawHousingPlots(ctx: CanvasRenderingContext2D, houses: BuiltHouse[]) {
  const houseByPlot = new Map<number, BuiltHouse>();
  for (const h of houses) houseByPlot.set(h.plotId, h);

  for (const plot of HOUSE_PLOTS) {
    const built = houseByPlot.get(plot.plotId);
    const { x, y } = plot;

    if (!built) {
      roundRectPath(ctx, x - 74, y - 24, 148, 52, 8);
      ctx.fillStyle = 'rgba(22, 163, 74, 0.45)';
      ctx.fill();
      ctx.setLineDash([7, 6]);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = '#DCFCE7';
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#78350F';
      ctx.fillRect(x - 3, y - 38, 6, 36);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 3, y - 38, 6, 36);

      roundRectPath(ctx, x - 52, y - 58, 104, 24, 5);
      ctx.fillStyle = '#FEF3C7';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#78350F';
      ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`KAVLING ${plot.plotId} · DP 100K`, x, y - 46);
      continue;
    }

    ctx.save();
    ctx.translate(x, y + 12);

    ctx.fillStyle = 'rgba(21, 128, 61, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 6, built.tier === 'juragan' ? 84 : 70, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    if (built.tier === 'juragan') {
      for (let fx = -74; fx <= 74; fx += 18) {
        if (Math.abs(fx) < 18) continue;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(fx - 3, -18, 6, 22);
        ctx.lineWidth = 2;
        ctx.strokeStyle = OUTLINE;
        ctx.strokeRect(fx - 3, -18, 6, 22);
      }
      roundRectPath(ctx, -68, -94, 136, 96, 5);
      ctx.fillStyle = '#FFFBEB';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();

      roundRectPath(ctx, -38, -62, 76, 12, 3);
      ctx.fillStyle = '#92400E';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-78, -92);
      ctx.lineTo(-42, -134);
      ctx.lineTo(42, -134);
      ctx.lineTo(78, -92);
      ctx.closePath();
      ctx.fillStyle = built.roofColor;
      ctx.fill();
      ctx.stroke();

      roundRectPath(ctx, -16, -38, 32, 40, 4);
      ctx.fillStyle = '#78350F';
      ctx.fill();
      ctx.stroke();
      [
        [-52, -36],
        [28, -36],
        [-52, -82],
        [28, -82],
      ].forEach(([wx, wy]) => {
        roundRectPath(ctx, wx, wy, 24, 22, 3);
        ctx.fillStyle = '#7DD3FC';
        ctx.fill();
        ctx.lineWidth = 2.4;
        ctx.stroke();
      });
    } else if (built.tier === 'tingkat') {
      roundRectPath(ctx, -58, -88, 116, 90, 5);
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-66, -86);
      ctx.lineTo(-44, -118);
      ctx.lineTo(44, -118);
      ctx.lineTo(66, -86);
      ctx.closePath();
      ctx.fillStyle = built.roofColor;
      ctx.fill();
      ctx.stroke();

      roundRectPath(ctx, -13, -36, 26, 38, 3);
      ctx.fillStyle = '#92400E';
      ctx.fill();
      ctx.stroke();
      [
        [-45, -34],
        [23, -34],
        [-45, -74],
        [23, -74],
      ].forEach(([wx, wy]) => {
        roundRectPath(ctx, wx, wy, 22, 20, 3);
        ctx.fillStyle = '#7DD3FC';
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.stroke();
      });
    } else {
      roundRectPath(ctx, -54, -56, 108, 58, 5);
      ctx.fillStyle = '#FEF9C3';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-62, -54);
      ctx.lineTo(-42, -84);
      ctx.lineTo(42, -84);
      ctx.lineTo(62, -54);
      ctx.closePath();
      ctx.fillStyle = built.roofColor;
      ctx.fill();
      ctx.stroke();

      roundRectPath(ctx, -12, -34, 24, 36, 3);
      ctx.fillStyle = '#92400E';
      ctx.fill();
      ctx.stroke();

      [-42, 20].forEach((wx) => {
        roundRectPath(ctx, wx, -36, 22, 20, 3);
        ctx.fillStyle = '#7DD3FC';
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.stroke();
      });
    }

    const labelY = built.tier === 'juragan' ? -148 : built.tier === 'tingkat' ? -132 : -98;
    const isLunas = built.monthsPaid >= built.totalMonths;
    drawSignLabel(
      ctx,
      0,
      labelY,
      `${built.ownerUsername} · ${isLunas ? 'LUNAS' : `Cicil ${built.monthsPaid}/${built.totalMonths}`}`,
      isLunas ? '#DCFCE7' : '#FFFFFF',
      '#18181B'
    );
    ctx.restore();
  }
}

// ============================================================================
// ENTERABLE BUILDING INTERIORS (SEKOLAH, MASJID, GEREJA, RUMAH WARGA!)
// ============================================================================

function drawExitMat(ctx: CanvasRenderingContext2D) {
  roundRectPath(ctx, INTERIOR_EXIT_X - 78, INTERIOR_EXIT_Y - 14, 156, 44, 8);
  ctx.fillStyle = '#FACC15';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = '#18181B';
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('↓ PINTU KELUAR [E]', INTERIOR_EXIT_X, INTERIOR_EXIT_Y + 8);
}

function drawSekolahInterior(ctx: CanvasRenderingContext2D, now: number, teacherWorking: boolean) {
  // Classroom cream wall & warm wooden floor
  ctx.fillStyle = '#FEF9C3';
  ctx.fillRect(0, 0, INTERIOR_WIDTH, 415);
  ctx.fillStyle = '#FDE68A';
  ctx.fillRect(0, 335, INTERIOR_WIDTH, 80);
  ctx.fillStyle = '#D97706';
  ctx.fillRect(0, 415, INTERIOR_WIDTH, INTERIOR_HEIGHT - 415);
  // Floor planks
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.25)';
  ctx.lineWidth = 2;
  for (let fy = 455; fy < INTERIOR_HEIGHT; fy += 42) {
    ctx.beginPath();
    ctx.moveTo(0, fy);
    ctx.lineTo(INTERIOR_WIDTH, fy);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 415);
  ctx.lineTo(INTERIOR_WIDTH, 415);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Classroom windows on left & right
  [115, 865].forEach((wx) => {
    roundRectPath(ctx, wx, 115, 140, 155, 8);
    ctx.fillStyle = '#7DD3FC';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wx + 70, 115);
    ctx.lineTo(wx + 70, 270);
    ctx.moveTo(wx, 192);
    ctx.lineTo(wx + 140, 192);
    ctx.stroke();
  });

  // Big green Chalkboard in center
  roundRectPath(ctx, 320, 105, 480, 200, 10);
  ctx.fillStyle = '#14532D';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#92400E';
  ctx.stroke();
  roundRectPath(ctx, 320, 105, 480, 200, 10);
  ctx.lineWidth = 2.8;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Chalk writing on board
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SD KAMPUNG AMANAH', 560, 152);
  ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#FEF08A';
  ctx.fillText(teacherWorking ? '2 + 2 = 4   ·   A B C D' : 'Pelajaran Hari Ini: Matematika', 560, 205);
  ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#BBF7D0';
  ctx.fillText(teacherWorking ? 'Bagus anak-anak! Semangat belajar!' : 'Berdiri di depan papan tulis & tekan [E] untuk mengajar', 560, 255);

  // Small Red-White flag & Garuda emblem above board
  roundRectPath(ctx, 534, 34, 52, 52, 6);
  ctx.fillStyle = '#FEF3C7';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(560, 60, 14, 0, Math.PI * 2);
  ctx.fill();

  // Teacher's podium / desk on left of chalkboard
  roundRectPath(ctx, 310, 380, 120, 56, 6);
  ctx.fillStyle = '#B45309';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  // Chalk & book on teacher desk
  roundRectPath(ctx, 330, 368, 36, 14, 3);
  ctx.fillStyle = '#2563EB';
  ctx.fill();
  ctx.stroke();

  // 6 CUTE LITTLE SCHOOLKIDS IN RED-WHITE SD UNIFORMS AT WOODEN DESKS!
  const studentCoords = [
    { x: 250, y: 545, hair: '#18181B', hijab: false, reply: '4 Pak/Bu!' },
    { x: 430, y: 545, hair: '#EC4899', hijab: true, reply: 'Saya bisa!' },
    { x: 690, y: 545, hair: '#27272A', hijab: false, reply: 'Paham!' },
    { x: 870, y: 545, hair: '#F59E0B', hijab: true, reply: 'Asyik!' },
    { x: 340, y: 615, hair: '#18181B', hijab: false, reply: '4!' },
    { x: 780, y: 615, hair: '#0EA5E9', hijab: true, reply: 'Hore!' },
  ];

  studentCoords.forEach((st, idx) => {
    const bounce = teacherWorking ? Math.abs(Math.sin(now * 0.012 + idx)) * 6 : Math.sin(now * 0.004 + idx) * 1.2;
    ctx.save();
    ctx.translate(st.x, st.y);

    // Kid sitting behind desk
    ctx.save();
    ctx.translate(0, -bounce);
    // Raised hand when teacher is teaching!
    if (teacherWorking && (idx + Math.floor(now / 600)) % 2 === 0) {
      ctx.save();
      ctx.translate(14, -46);
      ctx.rotate(-0.4);
      roundRectPath(ctx, -3, -24, 7, 26, 3);
      ctx.fillStyle = '#E5AE86';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.restore();
    }

    // White SD shirt + red collar tie
    roundRectPath(ctx, -15, -52, 30, 30, 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-3, -46, 6, 16);

    // Hijab or hair
    if (st.hijab) {
      ctx.beginPath();
      ctx.ellipse(0, -64, 15, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, -66, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#E5AE86';
    ctx.fill();
    ctx.stroke();

    if (!st.hijab) {
      ctx.beginPath();
      ctx.arc(0, -69, 12, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = st.hair;
      ctx.fill();
      ctx.stroke();
    }

    // Eyes & happy mouth
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(-4, -66, 1.8, 0, Math.PI * 2);
    ctx.arc(4, -66, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -62, 3.5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // Wooden school desk in front of student
    roundRectPath(ctx, -40, -32, 80, 34, 5);
    ctx.fillStyle = '#D97706';
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    // Open notebook on desk
    roundRectPath(ctx, -18, -36, 36, 10, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Kids answer speech bubbles while teacher works!
    if (teacherWorking && idx < 4) {
      drawSpeechBubble(ctx, 0, -98 - bounce, st.reply);
    }
    ctx.restore();
  });

  drawExitMat(ctx);
}

function drawMasjidInterior(ctx: CanvasRenderingContext2D, now: number, ngajiWorking: boolean) {
  // Calm cream mosque wall & lush green prayer carpet floor
  ctx.fillStyle = '#F0FDF4';
  ctx.fillRect(0, 0, INTERIOR_WIDTH, 410);
  ctx.fillStyle = '#15803D';
  ctx.fillRect(0, 410, INTERIOR_WIDTH, INTERIOR_HEIGHT - 410);

  // Prayer carpet horizontal saff lines
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 3;
  for (let sy = 455; sy < INTERIOR_HEIGHT; sy += 64) {
    ctx.beginPath();
    ctx.moveTo(40, sy);
    ctx.lineTo(INTERIOR_WIDTH - 40, sy);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 410);
  ctx.lineTo(INTERIOR_WIDTH, 410);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Arched green-gold Mihrab in center
  ctx.beginPath();
  ctx.moveTo(430, 410);
  ctx.lineTo(430, 210);
  ctx.arc(560, 210, 130, Math.PI, 0);
  ctx.lineTo(690, 410);
  ctx.closePath();
  ctx.fillStyle = '#16A34A';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#FACC15';
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Inner arch
  ctx.beginPath();
  ctx.moveTo(465, 410);
  ctx.lineTo(465, 225);
  ctx.arc(560, 225, 95, Math.PI, 0);
  ctx.lineTo(655, 410);
  ctx.closePath();
  ctx.fillStyle = '#DCFCE7';
  ctx.fill();
  ctx.stroke();

  // Decorative wall plaques
  drawSignLabel(ctx, 560, 168, 'MASJID AMANAH', '#FACC15', '#14532D');
  [210, 910].forEach((ax) => {
    ctx.beginPath();
    ctx.moveTo(ax - 55, 315);
    ctx.lineTo(ax - 55, 195);
    ctx.arc(ax, 195, 55, Math.PI, 0);
    ctx.lineTo(ax + 55, 315);
    ctx.closePath();
    ctx.fillStyle = '#BBF7D0';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  });

  // 5 CUTE LITTLE SANTRI SEATED WITH WOODEN REKAL & AL-QUR'AN!
  const santri = [
    { x: 245, y: 550, peci: true, color: '#FFFFFF', reply: 'Alif Ba Ta...' },
    { x: 405, y: 550, peci: false, color: '#F472B6', reply: 'Bismillah...' },
    { x: 715, y: 550, peci: true, color: '#38BDF8', reply: 'Aamiin!' },
    { x: 875, y: 550, peci: false, color: '#FACC15', reply: 'Alhamdulillah' },
    { x: 560, y: 585, peci: true, color: '#A7F3D0', reply: 'Lancar!' },
  ];

  santri.forEach((s, idx) => {
    const nod = ngajiWorking ? Math.sin(now * 0.01 + idx) * 3.5 : Math.sin(now * 0.004 + idx) * 1;
    ctx.save();
    ctx.translate(s.x, s.y);

    // Seated body (baju koko / gamis)
    roundRectPath(ctx, -16, -42 + nod * 0.5, 32, 32, 8);
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Head
    if (!s.peci) {
      ctx.beginPath();
      ctx.ellipse(0, -54 + nod, 15, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, -55 + nod, 11.5, 0, Math.PI * 2);
    ctx.fillStyle = '#E5AE86';
    ctx.fill();
    ctx.stroke();

    if (s.peci) {
      roundRectPath(ctx, -11, -69 + nod, 22, 10, 3);
      ctx.fillStyle = '#18181B';
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(-4, -55 + nod, 1.7, 0, Math.PI * 2);
    ctx.arc(4, -55 + nod, 1.7, 0, Math.PI * 2);
    ctx.fill();

    // Wooden rekal & open kitab in front
    roundRectPath(ctx, -22, -16, 44, 14, 3);
    ctx.fillStyle = '#92400E';
    ctx.fill();
    ctx.stroke();
    roundRectPath(ctx, -16, -22, 32, 9, 2);
    ctx.fillStyle = '#FEF9C3';
    ctx.fill();
    ctx.stroke();

    if (ngajiWorking && idx < 4) {
      drawSpeechBubble(ctx, 0, -84 + nod, s.reply);
    }
    ctx.restore();
  });

  drawExitMat(ctx);
}

function drawGerejaInterior(ctx: CanvasRenderingContext2D) {
  // Bright serene sanctuary
  ctx.fillStyle = '#EFF6FF';
  ctx.fillRect(0, 0, INTERIOR_WIDTH, 415);
  ctx.fillStyle = '#B45309';
  ctx.fillRect(0, 415, INTERIOR_WIDTH, INTERIOR_HEIGHT - 415);

  // Red center aisle carpet
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(495, 415, 130, INTERIOR_HEIGHT - 415);
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 3;
  ctx.strokeRect(495, 415, 130, INTERIOR_HEIGHT - 415);

  ctx.beginPath();
  ctx.moveTo(0, 415);
  ctx.lineTo(INTERIOR_WIDTH, 415);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Stained glass windows
  [185, 365, 755, 935].forEach((wx, idx) => {
    ctx.beginPath();
    ctx.moveTo(wx - 42, 315);
    ctx.lineTo(wx - 42, 165);
    ctx.arc(wx, 165, 42, Math.PI, 0);
    ctx.lineTo(wx + 42, 315);
    ctx.closePath();
    ctx.fillStyle = idx % 2 === 0 ? '#60A5FA' : '#FDE047';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(wx, 195, 18, 0, Math.PI * 2);
    ctx.fillStyle = idx % 2 === 0 ? '#F472B6' : '#38BDF8';
    ctx.fill();
    ctx.stroke();
  });

  // Altar & Golden Cross
  roundRectPath(ctx, 465, 345, 190, 70, 6);
  ctx.fillStyle = '#78350F';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(475, 345, 170, 18);

  // Tall Golden Cross
  ctx.fillStyle = '#FACC15';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.fillRect(548, 120, 24, 175);
  ctx.strokeRect(548, 120, 24, 175);
  ctx.fillRect(508, 160, 104, 24);
  ctx.strokeRect(508, 160, 104, 24);

  // Wooden pews left & right
  [485, 565].forEach((py) => {
    [150, 680].forEach((px) => {
      roundRectPath(ctx, px, py, 290, 34, 6);
      ctx.fillStyle = '#92400E';
      ctx.fill();
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    });
  });

  drawSignLabel(ctx, 560, 92, 'GEREJA KAMPUNG AMANAH', '#DBEAFE', '#1E3A8A');
  drawExitMat(ctx);
}

function drawHouseInterior(ctx: CanvasRenderingContext2D, house: BuiltHouse | undefined) {
  const accent = house?.roofColor || '#DC2626';
  const tier = house?.tier || 'sederhana';
  const owner = house?.ownerUsername || '@warga';

  // Cozy painted wall & hardwood floor
  ctx.fillStyle = tier === 'juragan' ? '#FFFBEB' : tier === 'tingkat' ? '#F8FAFC' : '#FEF9C3';
  ctx.fillRect(0, 0, INTERIOR_WIDTH, 415);
  ctx.fillStyle = '#D97706';
  ctx.fillRect(0, 415, INTERIOR_WIDTH, INTERIOR_HEIGHT - 415);

  ctx.beginPath();
  ctx.moveTo(0, 415);
  ctx.lineTo(INTERIOR_WIDTH, 415);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Living room carpet
  roundRectPath(ctx, 290, 465, 540, 145, 16);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  roundRectPath(ctx, 315, 483, 490, 109, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fill();

  // Wall window showing Kampung Amanah blue sky
  roundRectPath(ctx, 130, 130, 170, 145, 8);
  ctx.fillStyle = '#38BDF8';
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(132, 232, 166, 41);
  ctx.beginPath();
  ctx.moveTo(215, 130);
  ctx.lineTo(215, 275);
  ctx.stroke();

  // Flat-2D Cartoon TV & Cabinet
  roundRectPath(ctx, 445, 315, 230, 96, 8);
  ctx.fillStyle = '#78350F';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  roundRectPath(ctx, 475, 180, 170, 120, 10);
  ctx.fillStyle = '#18181B';
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, 488, 193, 144, 94, 5);
  ctx.fillStyle = '#38BDF8';
  ctx.fill();
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(488, 255, 144, 32);
  ctx.fillStyle = '#FACC15';
  ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TV KAMPUNG', 560, 238);

  // Sofa on right side
  roundRectPath(ctx, 760, 325, 230, 90, 12);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  roundRectPath(ctx, 780, 365, 190, 48, 8);
  ctx.fillStyle = '#FEF3C7';
  ctx.fill();
  ctx.stroke();

  // Stairs for Tingkat 2 / Juragan
  if (tier === 'tingkat' || tier === 'juragan') {
    for (let i = 0; i < 6; i++) {
      roundRectPath(ctx, 70 + i * 24, 392 - i * 18, 95, 18, 3);
      ctx.fillStyle = '#92400E';
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    }
  }

  // Framed Kampung Amanah poster & owner sign
  const isLunas = house ? house.monthsPaid >= house.totalMonths : true;
  drawSignLabel(
    ctx,
    560,
    112,
    `RUMAH ${owner} · ${tier.toUpperCase()} (${isLunas ? 'LUNAS' : `Cicilan ${house?.monthsPaid}/${house?.totalMonths}`})`,
    '#FEF08A',
    '#18181B'
  );

  drawExitMat(ctx);
}

// ============================================================================
// NPCs, VEHICLES (INCLUDING OJEK MOTOR + PASSENGER), & PLAYERS WITH JUMP (z)
// ============================================================================

function drawPakKadesNpc(ctx: CanvasRenderingContext2D, now: number) {
  const x = LANDMARKS.pakKades.x;
  const y = LANDMARKS.pakKades.y;
  const breathe = Math.sin(now * 0.004) * 1.4;
  const wave = Math.sin(now * 0.006) * 0.25;
  const blink = (Math.floor(now / 120) % 28) === 0;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(24, 24, 27, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.fillRect(-13, -32, 11, 30);
  ctx.strokeRect(-13, -32, 11, 30);
  ctx.fillRect(2, -32, 11, 30);
  ctx.strokeRect(2, -32, 11, 30);
  roundRectPath(ctx, -16, -4, 15, 7, 3);
  ctx.fillStyle = '#18181B';
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, 1, -4, 15, 7, 3);
  ctx.fill();
  ctx.stroke();

  // Waving arm
  ctx.save();
  ctx.translate(18, -62 + breathe);
  ctx.rotate(-0.85 + wave);
  roundRectPath(ctx, -4, -22, 9, 24, 4);
  ctx.fillStyle = '#E2A87E';
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, -6, -8, 12, 12, 3);
  ctx.fillStyle = '#9A3412';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Left arm
  ctx.save();
  ctx.translate(-18, -62 + breathe);
  ctx.rotate(0.2);
  roundRectPath(ctx, -4, 0, 9, 24, 4);
  ctx.fillStyle = '#E2A87E';
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, -6, -2, 12, 12, 3);
  ctx.fillStyle = '#9A3412';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Batik shirt
  roundRectPath(ctx, -18, -70 + breathe, 36, 42, 7);
  ctx.fillStyle = '#9A3412';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FBBF24';
  [
    [-8, -58],
    [8, -58],
    [0, -48],
    [-8, -39],
    [8, -39],
  ].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx, dy + breathe, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#18181B';
  ctx.fillRect(-18, -34 + breathe, 36, 6);
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(-5, -35 + breathe, 10, 8);
  ctx.strokeRect(-5, -35 + breathe, 10, 8);

  // Head + Peci Hitam
  ctx.save();
  ctx.translate(0, -90 + breathe);
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 19, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#E2A87E';
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-18, -8);
  ctx.bezierCurveTo(-18, -22, -14, -27, 0, -27);
  ctx.bezierCurveTo(14, -27, 18, -22, 18, -8);
  ctx.quadraticCurveTo(0, -4, -18, -8);
  ctx.closePath();
  ctx.fillStyle = '#18181B';
  ctx.fill();
  ctx.stroke();

  if (blink) {
    ctx.beginPath();
    ctx.moveTo(-9, -2);
    ctx.lineTo(-3, -2);
    ctx.moveTo(3, -2);
    ctx.lineTo(9, -2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-6, -2, 3.6, 0, Math.PI * 2);
    ctx.arc(6, -2, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.arc(-6, -2, 1.9, 0, Math.PI * 2);
    ctx.arc(6, -2, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#27272A';
  ctx.beginPath();
  ctx.ellipse(0, 6, 8, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 8, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();

  drawSignLabel(ctx, 0, -132, 'PAK KADES · KERJA', '#FACC15', '#18181B');
  ctx.restore();
}

function drawOrangeCat(ctx: CanvasRenderingContext2D, now: number, petUntil: number) {
  const x = LANDMARKS.kucing.x;
  const y = LANDMARKS.kucing.y;
  const tailWag = Math.sin(now * 0.008) * 7;
  const isHappy = now < petUntil;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(24, 24, 27, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 3, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(10, -4);
  ctx.quadraticCurveTo(24, -12 + tailWag, 21, -24 + tailWag * 0.6);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#F97316';
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, -9, 12, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#FB923C';
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -23, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#FB923C';
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-9, -29);
  ctx.lineTo(-11, -38);
  ctx.lineTo(-2, -32);
  ctx.moveTo(9, -29);
  ctx.lineTo(11, -38);
  ctx.lineTo(2, -32);
  ctx.fillStyle = '#F97316';
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#18181B';
  if (isHappy) {
    ctx.beginPath();
    ctx.arc(-4, -23, 2.5, Math.PI, 0);
    ctx.arc(4, -23, 2.5, Math.PI, 0);
    ctx.stroke();
    drawSignLabel(ctx, 0, -52, 'Meong~', '#FEF08A', '#18181B');
  } else {
    ctx.beginPath();
    ctx.arc(-4, -23, 1.8, 0, Math.PI * 2);
    ctx.arc(4, -23, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSoccerBall(ctx: CanvasRenderingContext2D, ball: BallState) {
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.fillStyle = 'rgba(24,24,27,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -4, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -4, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = '#18181B';
  ctx.fill();
  ctx.restore();
}

function drawOjekWaitingPassenger(ctx: CanvasRenderingContext2D, order: OjekOrderState, now: number) {
  if (order.stage !== 'pickup') return;
  drawMiniNpc(
    ctx,
    order.pickupX,
    order.pickupY - 12,
    order.passengerShirt,
    '#18181B',
    now,
    true,
    `Bang ojek! Ke ${order.dropoffName}`
  );
}

function drawVehicleBack(ctx: CanvasRenderingContext2D, player: PlayerState, now: number) {
  const v = player.activeVehicle;
  if (!v) return;
  const flip = player.dir === 'left' ? -1 : 1;
  const bounce = player.moving ? Math.sin(now * 0.025) * 1.6 : 0;

  ctx.save();
  ctx.scale(flip, 1);
  ctx.translate(0, bounce);

  // Exhaust smoke puffs when riding motor/pikap/bus
  if (player.moving && v !== 'sepeda') {
    const puffPhase = (now * 0.008) % 1;
    ctx.fillStyle = `rgba(226, 232, 240, ${0.7 - puffPhase * 0.6})`;
    ctx.beginPath();
    ctx.arc(-38 - puffPhase * 22, -16 - puffPhase * 8, 5 + puffPhase * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (v === 'bus_oranye') {
    roundRectPath(ctx, -64, -76, 128, 62, 10);
    ctx.fillStyle = '#F97316';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(-62, -38, 124, 10);
    for (let wx = -52; wx <= 36; wx += 28) {
      roundRectPath(ctx, wx, -66, 22, 22, 4);
      ctx.fillStyle = '#BAE6FD';
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(58, -32, 6, 10);
    ctx.strokeRect(58, -32, 6, 10);
  } else if (v === 'pikap') {
    roundRectPath(ctx, -50, -44, 54, 28, 4);
    ctx.fillStyle = '#1D4ED8';
    ctx.fill();
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    roundRectPath(ctx, 2, -62, 42, 46, 7);
    ctx.fillStyle = '#2563EB';
    ctx.fill();
    ctx.stroke();
    roundRectPath(ctx, 10, -56, 28, 20, 4);
    ctx.fillStyle = '#BAE6FD';
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.stroke();
  } else if (v === 'motor' || v === 'ojek_motor') {
    // Ojek motor is green-yellow livery, personal motor is red!
    const bodyColor = v === 'ojek_motor' ? '#16A34A' : '#EF4444';
    // Seat for driver + passenger pillion
    roundRectPath(ctx, -32, -38, 44, 10, 5);
    ctx.fillStyle = '#18181B';
    ctx.fill();
    // Main scooter body
    roundRectPath(ctx, -34, -30, 62, 18, 8);
    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    if (v === 'ojek_motor') {
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-24, -24, 38, 6);
    }
    // Front shield & handlebar
    ctx.beginPath();
    ctx.moveTo(18, -28);
    ctx.lineTo(26, -54);
    ctx.lineTo(15, -56);
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    // Headlight
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(28, -46, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    // PASSENGER SITTING PILLION BEHIND DRIVER WHEN OJEK ORDER IS IN DROPOFF STAGE!
    if (player.ojekOrder && player.ojekOrder.stage === 'dropoff') {
      ctx.save();
      ctx.translate(-19, -36);
      roundRectPath(ctx, -9, -26, 18, 26, 5);
      ctx.fillStyle = player.ojekOrder.passengerShirt;
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -37, 10.5, 0, Math.PI * 2);
      ctx.fillStyle = '#E5AE86';
      ctx.fill();
      ctx.stroke();
      // Passenger helmet!
      ctx.beginPath();
      ctx.arc(0, -40, 11, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = '#FACC15';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.arc(4, -36, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (v === 'sepeda') {
    ctx.strokeStyle = '#0EA5E9';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-22, -14);
    ctx.lineTo(0, -34);
    ctx.lineTo(22, -14);
    ctx.moveTo(0, -34);
    ctx.lineTo(14, -48);
    ctx.stroke();
  }

  // Spinning wheels
  const wheelAngle = player.moving ? now * 0.024 : 0;
  const wheelXs = v === 'bus_oranye' ? [-40, 40] : v === 'pikap' ? [-32, 28] : [-23, 23];
  const wr = v === 'bus_oranye' ? 14 : v === 'pikap' ? 12 : 11;
  for (const wx of wheelXs) {
    ctx.save();
    ctx.translate(wx, -wr + 3);
    ctx.rotate(wheelAngle);
    ctx.beginPath();
    ctx.arc(0, 0, wr, 0, Math.PI * 2);
    ctx.fillStyle = '#18181B';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, wr * 0.48, 0, Math.PI * 2);
    ctx.fillStyle = '#CBD5E1';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-wr * 0.45, 0);
    ctx.lineTo(wr * 0.45, 0);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, isSelf: boolean, now: number) {
  const { x, y, z = 0, dir, moving, activeVehicle } = player;
  const flip = dir === 'left' ? -1 : 1;
  const walkSwing = moving && z < 4 ? Math.sin(now * 0.018) : 0;
  const bob = moving && !activeVehicle && z < 4 ? Math.abs(Math.sin(now * 0.018)) * 3.5 : Math.sin(now * 0.004 + x) * 1.1;
  const isWorking = Date.now() < player.workingUntil;

  ctx.save();
  ctx.translate(x, y);

  // Ground shadow stays planted on floor & shrinks cleanly during jump!
  const jumpShadowScale = Math.max(0.55, 1 - z / 160);
  const shadowRx =
    (activeVehicle === 'bus_oranye' ? 60 : activeVehicle === 'pikap' ? 46 : activeVehicle ? 32 : 18) *
    jumpShadowScale;
  ctx.fillStyle = isSelf ? 'rgba(250, 204, 21, 0.45)' : 'rgba(24, 24, 27, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 4, shadowRx, 7 * jumpShadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Apply vertical jump lift (-z) to entire character/vehicle
  ctx.save();
  ctx.translate(0, -z);

  const insideEnclosed = activeVehicle === 'bus_oranye' || activeVehicle === 'pikap';

  if (!insideEnclosed) {
    if (activeVehicle) {
      drawVehicleBack(ctx, player, now);
    }

    const seatLift = activeVehicle ? -18 : 0;
    const driverShiftX = activeVehicle === 'motor' || activeVehicle === 'ojek_motor' ? flip * 8 : 0;
    ctx.save();
    ctx.translate(driverShiftX, seatLift - bob);

    if (!activeVehicle) {
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.save();
      ctx.translate(-5, -26);
      ctx.rotate(z > 4 ? -0.35 : walkSwing * 0.45);
      roundRectPath(ctx, -4, 0, 9, 24, 3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(5, -26);
      ctx.rotate(z > 4 ? 0.35 : -walkSwing * 0.45);
      roundRectPath(ctx, -4, 0, 9, 24, 3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Arms + Work Tool Visuals!
    const workWave = isWorking ? Math.sin(now * 0.025) * 0.75 : walkSwing * 0.45;
    ctx.fillStyle = '#E5AE86';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.save();
    ctx.translate(-14, -52);
    ctx.rotate(isWorking ? -0.9 + workWave * 0.5 : -workWave + 0.15);
    roundRectPath(ctx, -3, 0, 7, 20, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(14, -52);
    ctx.rotate(isWorking ? -1.1 - workWave * 0.6 : activeVehicle ? -0.65 * flip : workWave - 0.15);
    roundRectPath(ctx, -3, 0, 7, 20, 3);
    ctx.fill();
    ctx.stroke();

    // Job-specific visual prop when actively working!
    if (isWorking && player.job === 'guru') {
      // Teacher holding wooden chalkboard pointer
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(18, 36);
      ctx.stroke();
    } else if (isWorking && player.job === 'guru_ngaji') {
      // Guru ngaji holding open kitab
      roundRectPath(ctx, -6, 15, 16, 12, 2);
      ctx.fillStyle = '#FEF08A';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    } else if (isWorking && player.job === 'kuli') {
      // Kuli swinging hammer / trowel!
      ctx.fillStyle = '#64748B';
      ctx.fillRect(-4, 18, 16, 8);
      ctx.strokeRect(-4, 18, 16, 8);
    }
    ctx.restore();

    // Torso shirt (green ojek jacket when driving ojek_motor!)
    roundRectPath(ctx, -14, -58, 28, 34, 6);
    ctx.fillStyle = activeVehicle === 'ojek_motor' ? '#16A34A' : player.shirtColor;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    if (activeVehicle === 'ojek_motor') {
      // Yellow ojek stripe on jacket
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-13, -44, 26, 5);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(4, -56, 8, 30);
    }

    // Head
    ctx.save();
    ctx.translate(0, -75);

    if (player.hairStyle === 'hijab') {
      ctx.beginPath();
      ctx.ellipse(0, 3, 18, 20, 0, 0, Math.PI * 2);
      ctx.fillStyle = player.hairColor;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 15.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E5AE86';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (player.hairStyle !== 'hijab') {
      ctx.fillStyle = player.hairColor;
      ctx.beginPath();
      if (player.hairStyle === 'spiky') {
        ctx.moveTo(-14, -4);
        ctx.lineTo(-12, -18);
        ctx.lineTo(-4, -14);
        ctx.lineTo(0, -21);
        ctx.lineTo(6, -14);
        ctx.lineTo(13, -18);
        ctx.lineTo(14, -4);
      } else if (player.hairStyle === 'curly') {
        ctx.arc(-8, -12, 7, 0, Math.PI * 2);
        ctx.arc(0, -15, 8, 0, Math.PI * 2);
        ctx.arc(8, -12, 7, 0, Math.PI * 2);
      } else {
        ctx.arc(0, -4, 14.5, Math.PI, 0);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Hard hat for Kuli or green helmet for Ojek driver!
    if (activeVehicle === 'ojek_motor') {
      ctx.beginPath();
      ctx.arc(0, -8, 15, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = '#16A34A';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-15, -10, 30, 4);
    } else if (player.job === 'kuli') {
      ctx.beginPath();
      ctx.arc(0, -10, 14, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = '#FACC15';
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(-17, -11, 34, 4);
      ctx.strokeRect(-17, -11, 34, 4);
    }

    const eyeShift = flip * 2.5;
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.arc(-4.5 + eyeShift, -1, 2.2, 0, Math.PI * 2);
    ctx.arc(4.5 + eyeShift, -1, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(eyeShift * 0.6, 4.5, 4.5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = 1.9;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  } else {
    drawVehicleBack(ctx, player, now);
  }

  // IG Username Tag + Job Role above head
  const tagBaseY = insideEnclosed ? -94 : activeVehicle ? -122 : -106;
  const jobTitle = player.job && JOBS[player.job] ? JOBS[player.job].title : null;

  if (jobTitle) {
    ctx.save();
    ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
    const jw = ctx.measureText(jobTitle).width + 12;
    roundRectPath(ctx, -jw / 2, tagBaseY - 2, jw, 15, 4);
    ctx.fillStyle = JOBS[player.job!].badgeColor;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(jobTitle, 0, tagBaseY + 5.5);
    ctx.restore();
  }

  ctx.save();
  ctx.font = '800 12px "Plus Jakarta Sans", sans-serif';
  const nameY = jobTitle ? tagBaseY - 14 : tagBaseY;
  const nw = ctx.measureText(player.username).width + 16;
  roundRectPath(ctx, -nw / 2, nameY - 10, nw, 20, 6);
  ctx.fillStyle = isSelf ? '#FEF08A' : '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = '#18181B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.username, 0, nameY + 0.5);
  ctx.restore();

  // Live Working speech bubble OR Player Chat Bubble
  if (player.chatText && player.chatUntil && Date.now() < player.chatUntil) {
    drawSpeechBubble(ctx, 0, nameY - 34, player.chatText);
  } else if (isWorking && player.job) {
    const workMsg =
      player.job === 'guru'
        ? 'Ayo anak-anak, 2 + 2 = ?'
        : player.job === 'guru_ngaji'
        ? 'Yuk ikutin: Alif, Ba, Ta...'
        : player.job === 'kuli'
        ? 'Susun bata & aduk semen!'
        : player.job === 'pedagang'
        ? 'Gorengan & es teh siap!'
        : '';
    if (workMsg) drawSpeechBubble(ctx, 0, nameY - 34, workMsg);
  }

  ctx.restore(); // undo jump lift
  ctx.restore(); // undo translate(x,y)
}

function drawWorkBeacon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  now: number,
  color = '#FACC15'
) {
  const pulse = Math.sin(now * 0.008) * 5;
  ctx.save();
  ctx.translate(x, y);

  ctx.beginPath();
  ctx.ellipse(0, 4, 28 + pulse * 0.8, 10 + pulse * 0.3, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  const arrowY = -58 + pulse;
  ctx.beginPath();
  ctx.moveTo(0, arrowY + 14);
  ctx.lineTo(-10, arrowY);
  ctx.lineTo(10, arrowY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  if (label) {
    drawSignLabel(ctx, 0, arrowY - 14, label, color, '#18181B');
  }
  ctx.restore();
}

export function renderKampungWorld(ctx: CanvasRenderingContext2D, state: RenderContextState) {
  const { viewportW, viewportH, cameraX, now, room, players, selfId, houses, ball, totalRegistered } = state;

  // Filter players in the same room (outdoor OR inside Sekolah / Masjid / Gereja / House!)
  const roomPlayers = players.filter((p) => (p.room || 'outdoor') === room);
  const selfPlayer = players.find((p) => p.id === selfId) || null;

  if (room !== 'outdoor') {
    // =========================================================================
    // INTERIOR ROOM RENDERING (full-bleed wall tone + centered room stage!)
    // =========================================================================
    const wallBg =
      room === 'masjid' ? '#F0FDF4' : room === 'gereja' ? '#F0F9FF' : '#FEF9C3';
    const floorBg =
      room === 'masjid' ? '#15803D' : room === 'gereja' ? '#B45309' : '#D97706';
    const scale = Math.min(viewportW / INTERIOR_WIDTH, viewportH / INTERIOR_HEIGHT);
    const offsetX = (viewportW - INTERIOR_WIDTH * scale) / 2;
    const offsetY = (viewportH - INTERIOR_HEIGHT * scale) / 2;
    const splitY = offsetY + 410 * scale;
    ctx.fillStyle = wallBg;
    ctx.fillRect(0, 0, viewportW, Math.max(0, splitY));
    ctx.fillStyle = floorBg;
    ctx.fillRect(0, Math.max(0, splitY), viewportW, viewportH - Math.max(0, splitY));

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const wallNow = Date.now();
    const anyTeacherWorking = roomPlayers.some((p) => p.job === 'guru' && wallNow < p.workingUntil);
    const anyNgajiWorking = roomPlayers.some((p) => p.job === 'guru_ngaji' && wallNow < p.workingUntil);

    if (room === 'sekolah') {
      drawSekolahInterior(ctx, now, anyTeacherWorking);
    } else if (room === 'masjid') {
      drawMasjidInterior(ctx, now, anyNgajiWorking);
    } else if (room === 'gereja') {
      drawGerejaInterior(ctx);
    } else if (room.startsWith('house_')) {
      const plotId = Number(room.replace('house_', ''));
      const house = houses.find((h) => h.plotId === plotId);
      drawHouseInterior(ctx, house);
    }

    if (state.workTarget) {
      const showBeaconLabel =
        !state.interactionHint ||
        Math.hypot(state.interactionHint.x - state.workTarget.x, state.interactionHint.y - state.workTarget.y) > 160;
      drawWorkBeacon(
        ctx,
        state.workTarget.x,
        state.workTarget.y,
        showBeaconLabel ? state.workTarget.label : '',
        now,
        state.workTarget.color || '#FACC15'
      );
    }

    const sortedRoomPlayers = [...roomPlayers].sort((a, b) => a.y - b.y);
    for (const p of sortedRoomPlayers) {
      drawPlayer(ctx, p, p.id === selfId, now);
    }

    if (state.interactionHint) {
      const bounce = Math.sin(now * 0.008) * 3;
      drawSignLabel(ctx, state.interactionHint.x, state.interactionHint.y + bounce, state.interactionHint.label, '#18181B', '#FEF08A');
    }

    for (const ft of state.floatingTexts) {
      const progress = Math.min(1, (now - ft.createdAt) / ft.duration);
      const fy = ft.y - progress * 55;
      const alpha = 1 - Math.pow(progress, 2);
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = '900 18px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = OUTLINE;
      ctx.strokeText(ft.text, ft.x, fy);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, fy);
      ctx.restore();
    }

    ctx.restore();
    return;
  }

  // ===========================================================================
  // OUTDOOR 6200 x 1760 VILLAGE + SOUTHERN WOODS + PANTAI SELATAN RENDERING
  // ===========================================================================
  const { cameraY = 0, igUsername } = state;
  const scale = viewportH / CAMERA_VIEW_HEIGHT;
  const visibleWorldW = viewportW / scale;

  ctx.save();
  ctx.scale(scale, scale);

  if (cameraY < 420) {
    ctx.save();
    ctx.translate(0, -cameraY);
    drawSkyAndHills(ctx, cameraX, visibleWorldW, now);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  const wallNow = Date.now();
  const anyPedagangWorking = roomPlayers.some((p) => p.job === 'pedagang' && wallNow < p.workingUntil);
  const anyKuliWorking = roomPlayers.some((p) => p.job === 'kuli' && wallNow < p.workingUntil);

  if (cameraY < 460) {
    drawTrees(ctx, now, cameraX, visibleWorldW);
  }
  drawGroundAndRoad(ctx, now);
  if (cameraY < 620) {
    drawLandmarks(ctx, now, totalRegistered, players.length, anyPedagangWorking, anyKuliWorking, igUsername);
    drawHousingPlots(ctx, houses);
  }

  if (state.workTarget) {
    const showBeaconLabel =
      !state.interactionHint ||
      Math.hypot(state.interactionHint.x - state.workTarget.x, state.interactionHint.y - state.workTarget.y) > 160;
    drawWorkBeacon(
      ctx,
      state.workTarget.x,
      state.workTarget.y,
      showBeaconLabel ? state.workTarget.label : '',
      now,
      state.workTarget.color || '#FACC15'
    );
  }

  // Depth-sorted entities: NPCs, ball, southern forest trees, beach coconut palms, and live players!
  type Drawable = { y: number; draw: () => void };
  const entities: Drawable[] = [
    { y: LANDMARKS.pakKades.y, draw: () => drawPakKadesNpc(ctx, now) },
    { y: LANDMARKS.kucing.y, draw: () => drawOrangeCat(ctx, now, state.catPetUntil) },
    { y: ball.y, draw: () => drawSoccerBall(ctx, ball) },
  ];

  // Add lush shade trees in the southern meadow (y = 755..1145) — keeping footpaths clear!
  const treeMinX = Math.max(120, Math.floor((cameraX - 220) / 210) * 210);
  const treeMaxX = Math.min(WORLD_WIDTH - 120, cameraX + visibleWorldW + 220);
  for (let tx = treeMinX; tx <= treeMaxX; tx += 210) {
    const nearPath =
      Math.abs(tx - 1760) < 115 || Math.abs(tx - 3740) < 115 || Math.abs(tx - 5150) < 115;
    if (nearPath) continue;

    const row1Y = 775 + ((tx * 17) % 130);
    const sc1 = 0.85 + ((tx % 3) * 0.09);
    entities.push({
      y: row1Y,
      draw: () => drawSouthernShadeTree(ctx, tx, row1Y, sc1, now),
    });

    if ((tx / 210) % 2 === 0) {
      const row2X = tx + 88;
      const row2Y = 995 + ((tx * 23) % 135);
      const nearPath2 =
        Math.abs(row2X - 1760) < 115 || Math.abs(row2X - 3740) < 115 || Math.abs(row2X - 5150) < 115;
      if (!nearPath2) {
        const sc2 = 0.82 + ((tx % 2) * 0.14);
        entities.push({
          y: row2Y,
          draw: () => drawSouthernShadeTree(ctx, row2X, row2Y, sc2, now),
        });
      }
    }
  }

  // Add swaying tropical coconut palm trees along the beach edge (y = 1175..1310)
  const palmMinX = Math.max(130, Math.floor((cameraX - 220) / 260) * 260);
  const palmMaxX = Math.min(WORLD_WIDTH - 130, cameraX + visibleWorldW + 220);
  for (let px = palmMinX; px <= palmMaxX; px += 260) {
    const nearPath =
      Math.abs(px - 1760) < 105 || Math.abs(px - 3740) < 105 || Math.abs(px - 5150) < 105;
    if (nearPath) continue;
    const py = 1215 + ((px * 31) % 95);
    const lean = ((px / 260) % 2 === 0 ? 1 : -1) * (0.65 + ((px % 3) * 0.2));
    const psc = 0.88 + ((px % 3) * 0.08);
    entities.push({
      y: py,
      draw: () => drawCoconutPalmTree(ctx, px, py, lean, psc, now),
    });
  }

  if (selfPlayer?.job === 'ojek' && selfPlayer.ojekOrder && selfPlayer.ojekOrder.stage === 'pickup') {
    const ord = selfPlayer.ojekOrder;
    entities.push({
      y: ord.pickupY - 12,
      draw: () => drawOjekWaitingPassenger(ctx, ord, now),
    });
  }

  for (const p of roomPlayers) {
    entities.push({
      y: p.y,
      draw: () => drawPlayer(ctx, p, p.id === selfId, now),
    });
  }

  entities.sort((a, b) => a.y - b.y);
  for (const item of entities) item.draw();

  if (state.interactionHint) {
    const bounce = Math.sin(now * 0.008) * 3;
    drawSignLabel(ctx, state.interactionHint.x, state.interactionHint.y + bounce, state.interactionHint.label, '#18181B', '#FEF08A');
  }

  for (const ft of state.floatingTexts) {
    const progress = Math.min(1, (now - ft.createdAt) / ft.duration);
    const fy = ft.y - progress * 55;
    const alpha = 1 - Math.pow(progress, 2);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = '900 18px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = OUTLINE;
    ctx.strokeText(ft.text, ft.x, fy);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, fy);
    ctx.restore();
  }

  ctx.restore();
  ctx.restore();
}
