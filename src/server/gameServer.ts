import fs from 'fs';
import path from 'path';
import type { IncomingMessage, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {
  BallState,
  BuiltHouse,
  ClientBackupProfile,
  HairStyle,
  HOUSE_DOWN_PAYMENT,
  HOUSE_MONTHLY_INSTALLMENT,
  HOUSE_PLOTS,
  HOUSE_TIERS,
  HouseTierId,
  IgFollowerSyncState,
  INTERIOR_EXIT_X,
  INTERIOR_EXIT_Y,
  INTERIOR_MAX_X,
  INTERIOR_MAX_Y,
  INTERIOR_MIN_X,
  INTERIOR_MIN_Y,
  JOBS,
  JobId,
  LANDMARKS,
  normalizeIgUsername,
  OJEK_STOPS,
  OjekOrderState,
  PlayerState,
  ROOF_PRESETS,
  RoomId,
  SHIRT_PRESETS,
  VEHICLES,
  VehicleId,
  WALK_MAX_Y,
  WALK_MIN_Y,
  WORLD_WIDTH,
} from '../game/types';

interface SavedProfile {
  username: string;
  shirtColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  job: JobId | null;
  money: number;
  ownedVehicles: VehicleId[];
  activeVehicle: VehicleId | null;
  lastX: number;
  lastY: number;
}

interface PersistedWorldData {
  profiles: Record<string, SavedProfile>;
  houses: BuiltHouse[];
  igSync: IgFollowerSyncState;
}

const DATA_DIR = path.resolve('data');
const STATE_FILE = path.join(DATA_DIR, 'kampung-game-state.json');

const HAIR_STYLES: HairStyle[] = ['fade', 'spiky', 'swept', 'curly', 'hijab'];
const VALID_SHIRTS = new Set(SHIRT_PRESETS.map((s) => s.hex));
const VALID_ROOFS = new Set(ROOF_PRESETS.map((r) => r.hex));

const PASSENGER_NAMES = ['Bu Siti', 'Pak Budi', 'Mbak Rina', 'Mas Andi', 'Dek Dani', 'Bu Wati', 'Kang Dedi'];
const PASSENGER_SHIRTS = ['#EC4899', '#0EA5E9', '#8B5CF6', '#F59E0B', '#14B8A6', '#EF4444'];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function generateOjekOrder(nearX?: number): OjekOrderState {
  // Pick a pickup stop reasonably close or random, and a distinct dropoff stop at least 700px away
  const pickupIdx = Math.floor(Math.random() * OJEK_STOPS.length);
  const pickup = OJEK_STOPS[pickupIdx];
  const farStops = OJEK_STOPS.filter((s) => Math.abs(s.x - pickup.x) >= 750);
  const dropoff = farStops[Math.floor(Math.random() * farStops.length)] || OJEK_STOPS[(pickupIdx + 3) % OJEK_STOPS.length];

  // If player is far from pickup and we want initial order close to Pangkalan, keep it fun & reachable
  const actualPickup =
    typeof nearX === 'number' && Math.random() < 0.45
      ? OJEK_STOPS.reduce((best, s) => (Math.abs(s.x - nearX) < Math.abs(best.x - nearX) ? s : best), pickup)
      : pickup;
  const actualDropoff =
    actualPickup.name === dropoff.name
      ? OJEK_STOPS.find((s) => Math.abs(s.x - actualPickup.x) >= 900) || dropoff
      : dropoff;

  return {
    id: `oj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    stage: 'pickup',
    passengerName: PASSENGER_NAMES[Math.floor(Math.random() * PASSENGER_NAMES.length)],
    passengerShirt: PASSENGER_SHIRTS[Math.floor(Math.random() * PASSENGER_SHIRTS.length)],
    pickupName: actualPickup.name,
    pickupX: actualPickup.x,
    pickupY: actualPickup.y,
    dropoffName: actualDropoff.name,
    dropoffX: actualDropoff.x,
    dropoffY: actualDropoff.y,
  };
}

function parseCompactNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, '').replace(/\s+/g, '');
  const m = cleaned.match(/^(\d+(?:\.\d+)?)([KkMmBb])?$/);
  if (!m) return null;
  let val = Number(m[1]);
  if (!Number.isFinite(val)) return null;
  const suffix = (m[2] || '').toUpperCase();
  if (suffix === 'K') val *= 1_000;
  else if (suffix === 'M') val *= 1_000_000;
  else if (suffix === 'B') val *= 1_000_000_000;
  return Math.round(val);
}

async function fetchLiveInstagramFollowers(rawHandle: string): Promise<{
  ok: boolean;
  followers?: number;
  username?: string;
  source?: 'instagram_live' | 'instagram_api';
  reason?: string;
}> {
  const clean = rawHandle.trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '');
  if (!clean) return { ok: false, reason: 'Username Instagram tidak valid.' };

  // 1. Official Meta Instagram Graph API if env credentials are configured
  const igToken = process.env.IG_ACCESS_TOKEN?.trim();
  const igUserId = process.env.IG_USER_ID?.trim();
  if (igToken && igUserId) {
    try {
      const apiUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(igUserId)}?fields=username,followers_count&access_token=${encodeURIComponent(igToken)}`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const json: any = await res.json();
        if (typeof json?.followers_count === 'number') {
          return {
            ok: true,
            followers: Math.max(0, Math.round(json.followers_count)),
            username: json.username ? `@${json.username}` : `@${clean}`,
            source: 'instagram_api',
          };
        }
      }
    } catch {
      // Fall through to public web lookup
    }
  }

  // 2. Public Instagram web_profile_info endpoint
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(clean)}`,
      {
        headers: {
          'x-ig-app-id': '936619743392459',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(7000),
      }
    );
    if (res.ok) {
      const data: any = await res.json();
      const count = data?.data?.user?.edge_followed_by?.count;
      if (typeof count === 'number' && Number.isFinite(count)) {
        return {
          ok: true,
          followers: Math.max(0, Math.round(count)),
          username: `@${data?.data?.user?.username || clean}`,
          source: 'instagram_live',
        };
      }
    }
  } catch {
    // Fall through to public HTML meta parsing
  }

  // 3. Public Instagram profile HTML og:description / embedded JSON fallback
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(clean)}/`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(7000),
    });
    if (res.ok) {
      const html = await res.text();
      const jsonMatch = html.match(/"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
      if (jsonMatch) {
        return {
          ok: true,
          followers: Number(jsonMatch[1]),
          username: `@${clean}`,
          source: 'instagram_live',
        };
      }
      const metaMatch = html.match(/([\d.,]+[KkMmBb]?)\s+Followers/i);
      if (metaMatch) {
        const parsed = parseCompactNumber(metaMatch[1]);
        if (parsed !== null) {
          return {
            ok: true,
            followers: parsed,
            username: `@${clean}`,
            source: 'instagram_live',
          };
        }
      }
    }
  } catch {
    // Blocked or timed out
  }

  return {
    ok: false,
    reason:
      'Instagram membatasi akses otomatis dari server tanpa login. Kamu bisa masukkan jumlah followers IG saat ini secara manual di bawah agar papan penduduk langsung update live!',
  };
}

const OFFICIAL_IG_HANDLE = (process.env.KAMPUNG_IG_USERNAME || 'kampung.amanah')
  .trim()
  .replace(/^@+/, '');

function getEnvFallbackFollowers(): number {
  const raw = Number(process.env.KAMPUNG_IG_FOLLOWERS);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 259;
}

const DEFAULT_IG_SYNC: IgFollowerSyncState = {
  username: `@${OFFICIAL_IG_HANDLE}`,
  followers: getEnvFallbackFollowers(),
  source: 'default',
  lastSyncedAt: 0,
};

function loadPersistedData(): PersistedWorldData {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      const rawHouses: any[] = Array.isArray(parsed.houses) ? parsed.houses : [];
      const migratedHouses: BuiltHouse[] = rawHouses.map((h) => {
        const tier: HouseTierId = HOUSE_TIERS[h.tier as HouseTierId] ? h.tier : 'sederhana';
        const def = HOUSE_TIERS[tier];
        return {
          plotId: Number(h.plotId) || 1,
          ownerUsername: String(h.ownerUsername || '@warga'),
          tier,
          roofColor: VALID_ROOFS.has(h.roofColor) ? h.roofColor : '#DC2626',
          builtAt: Number(h.builtAt) || Date.now(),
          downPayment: Number(h.downPayment) || HOUSE_DOWN_PAYMENT,
          monthlyInstallment: Number(h.monthlyInstallment) || HOUSE_MONTHLY_INSTALLMENT,
          monthsPaid: typeof h.monthsPaid === 'number' ? h.monthsPaid : 0,
          totalMonths: typeof h.totalMonths === 'number' ? h.totalMonths : def.totalMonths,
        };
      });
      const rawIg = parsed.igSync;
      const igSync: IgFollowerSyncState =
        rawIg && typeof rawIg === 'object'
          ? {
              username: String(rawIg.username || ''),
              followers: Math.max(0, Number(rawIg.followers) || 245),
              source:
                rawIg.source === 'instagram_live' ||
                rawIg.source === 'instagram_api' ||
                rawIg.source === 'manual'
                  ? rawIg.source
                  : 'default',
              lastSyncedAt: Number(rawIg.lastSyncedAt) || 0,
            }
          : { ...DEFAULT_IG_SYNC };
      return {
        profiles: parsed.profiles && typeof parsed.profiles === 'object' ? parsed.profiles : {},
        houses: migratedHouses,
        igSync,
      };
    }
  } catch {
    // fallback to clean state
  }
  return { profiles: {}, houses: [], igSync: { ...DEFAULT_IG_SYNC } };
}

class KampungGameServer {
  private wss: WebSocketServer;
  private persisted: PersistedWorldData;
  private activePlayers = new Map<string, PlayerState>();
  private sockets = new Map<string, WebSocket>();
  private workCooldowns = new Map<string, number>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private ball: BallState = { x: 3740, y: 455, vx: 0, vy: 0 };
  private physicsInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.persisted = loadPersistedData();

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    // Server-side soccer ball physics at 20 Hz when moving inside Lapangan Bola (x=3450..4030)
    this.physicsInterval = setInterval(() => {
      if (Math.abs(this.ball.vx) > 0.2 || Math.abs(this.ball.vy) > 0.2) {
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        this.ball.vx *= 0.88;
        this.ball.vy *= 0.88;

        if (this.ball.x < 3455) {
          this.ball.x = 3455;
          this.ball.vx = Math.abs(this.ball.vx) * 0.7;
        } else if (this.ball.x > 4025) {
          this.ball.x = 4025;
          this.ball.vx = -Math.abs(this.ball.vx) * 0.7;
        }
        if (this.ball.y < 395) {
          this.ball.y = 395;
          this.ball.vy = Math.abs(this.ball.vy) * 0.7;
        } else if (this.ball.y > 505) {
          this.ball.y = 505;
          this.ball.vy = -Math.abs(this.ball.vy) * 0.7;
        }

        if (Math.abs(this.ball.vx) <= 0.25 && Math.abs(this.ball.vy) <= 0.25) {
          this.ball.vx = 0;
          this.ball.vy = 0;
        }

        this.broadcast({ type: 'ball:moved', ball: this.ball });
      }
    }, 50);

    // Auto-sync official @kampungamanah IG followers on server start & every 10 minutes
    void this.syncOfficialKampungIg();
    setInterval(() => {
      void this.syncOfficialKampungIg();
    }, 10 * 60 * 1000);

    // Ensure disk flush on graceful shutdown
    const flushOnExit = () => {
      this.saveNow();
    };
    process.once('SIGINT', flushOnExit);
    process.once('SIGTERM', flushOnExit);
  }

  private async syncOfficialKampungIg() {
    const live = await fetchLiveInstagramFollowers(OFFICIAL_IG_HANDLE);
    if (live.ok && typeof live.followers === 'number' && live.followers > 0) {
      this.persisted.igSync = {
        username: `@${OFFICIAL_IG_HANDLE}`,
        followers: live.followers,
        source: live.source || 'instagram_live',
        lastSyncedAt: Date.now(),
      };
      this.saveNow();
      this.broadcast({
        type: 'population:updated',
        totalRegistered: this.getTotalPopulation(),
        igSync: this.persisted.igSync,
      });
    }
  }

  public handleUpgrade(req: IncomingMessage, socket: any, head: Buffer) {
    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss.emit('connection', ws, req);
    });
  }

  public getTotalPopulation(): number {
    const ig = this.persisted.igSync;
    if (ig && ig.source !== 'default' && ig.followers > 0) {
      return ig.followers;
    }
    return getEnvFallbackFollowers();
  }

  public getSummary() {
    return {
      onlineCount: this.activePlayers.size,
      onlineUsernames: Array.from(this.activePlayers.values()).map((p) => p.username),
      housesCount: this.persisted.houses.length,
      totalPlots: HOUSE_PLOTS.length,
      totalRegistered: this.getTotalPopulation(),
      igSync: this.persisted.igSync,
    };
  }

  public getProfilePreview(rawUsername: string) {
    const normalized = normalizeIgUsername(rawUsername);
    if (!normalized) return { found: false };
    const saved = this.persisted.profiles[normalized.toLowerCase()];
    if (!saved) return { found: false };
    return {
      found: true,
      username: saved.username,
      money: saved.money,
      job: saved.job && JOBS[saved.job] ? saved.job : null,
      ownedVehiclesCount: Array.isArray(saved.ownedVehicles) ? saved.ownedVehicles.length : 0,
    };
  }

  public async syncInstagramFollowers(rawUsername: string, manualFollowers?: number) {
    const normalized = normalizeIgUsername(rawUsername);
    if (!normalized) {
      return { ok: false, message: 'Masukkan username Instagram yang valid.' };
    }

    if (typeof manualFollowers === 'number' && Number.isFinite(manualFollowers) && manualFollowers >= 0) {
      this.persisted.igSync = {
        username: normalized,
        followers: Math.min(500_000_000, Math.round(manualFollowers)),
        source: 'manual',
        lastSyncedAt: Date.now(),
      };
      this.saveNow();
      const totalRegistered = this.getTotalPopulation();
      this.broadcast({
        type: 'population:updated',
        totalRegistered,
        igSync: this.persisted.igSync,
      });
      return {
        ok: true,
        source: 'manual' as const,
        totalRegistered,
        igSync: this.persisted.igSync,
        message: `Papan penduduk terhubung ke ${normalized} (${totalRegistered.toLocaleString('id-ID')} followers).`,
      };
    }

    const live = await fetchLiveInstagramFollowers(normalized);
    if (live.ok && typeof live.followers === 'number') {
      this.persisted.igSync = {
        username: live.username || normalized,
        followers: live.followers,
        source: live.source || 'instagram_live',
        lastSyncedAt: Date.now(),
      };
      this.saveNow();
      const totalRegistered = this.getTotalPopulation();
      this.broadcast({
        type: 'population:updated',
        totalRegistered,
        igSync: this.persisted.igSync,
      });
      return {
        ok: true,
        source: this.persisted.igSync.source,
        totalRegistered,
        igSync: this.persisted.igSync,
        message: `Berhasil sinkron otomatis dari Instagram ${this.persisted.igSync.username}: ${totalRegistered.toLocaleString('id-ID')} followers!`,
      };
    }

    return {
      ok: false,
      blocked: true,
      totalRegistered: this.getTotalPopulation(),
      igSync: this.persisted.igSync,
      message: live.reason || 'Gagal mengambil followers otomatis dari Instagram.',
    };
  }

  private saveNow() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = `${STATE_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.persisted, null, 2));
      fs.renameSync(tmp, STATE_FILE);
    } catch (err) {
      console.error('[KampungGame] Failed saving state:', err);
    }
  }

  private scheduleSave() {
    // Immediate atomic write so players NEVER lose progress on logout or server restart
    this.saveNow();
  }

  private savePlayerToProfile(player: PlayerState) {
    const key = player.username.toLowerCase();
    const existing = this.persisted.profiles[key];
    this.persisted.profiles[key] = {
      username: player.username,
      shirtColor: player.shirtColor,
      hairStyle: player.hairStyle,
      hairColor: player.hairColor,
      job: player.job,
      money: player.money,
      ownedVehicles: player.ownedVehicles,
      activeVehicle: player.room === 'outdoor' ? player.activeVehicle : null,
      lastX: player.room === 'outdoor' ? Math.round(player.x) : existing?.lastX || LANDMARKS.pakKades.x,
      lastY: player.room === 'outdoor' ? Math.round(player.y) : existing?.lastY || 555,
    };
    this.saveNow();
  }

  private send(ws: WebSocket, payload: object) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  private broadcast(payload: object, excludeId?: string) {
    const raw = JSON.stringify(payload);
    for (const [id, sock] of this.sockets.entries()) {
      if (id === excludeId) continue;
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(raw);
      }
    }
  }

  private getOutdoorDoorForRoom(room: RoomId): { x: number; y: number } {
    if (room === 'sekolah') return { x: LANDMARKS.sekolah.x, y: 495 };
    if (room === 'masjid') return { x: LANDMARKS.masjid.x, y: 495 };
    if (room === 'gereja') return { x: LANDMARKS.gereja.x, y: 495 };
    if (room.startsWith('house_')) {
      const plotId = Number(room.replace('house_', ''));
      const plot = HOUSE_PLOTS.find((p) => p.plotId === plotId);
      if (plot) return { x: plot.x, y: Math.min(WALK_MAX_Y, plot.y + 42) };
    }
    return { x: LANDMARKS.pakKades.x, y: 550 };
  }

  private handleConnection(ws: WebSocket) {
    let playerId: string | null = null;

    ws.on('message', (data) => {
      let msg: any;
      try {
        msg = JSON.parse(String(data));
      } catch {
        return;
      }

      if (msg.type === 'player:join') {
        const normalized = normalizeIgUsername(String(msg.username || ''));
        if (!normalized) {
          this.send(ws, { type: 'error', message: 'Username IG tidak valid.' });
          return;
        }

        // Remove any previous session with same IG username
        for (const [existingId, existingPlayer] of this.activePlayers.entries()) {
          if (existingPlayer.username.toLowerCase() === normalized.toLowerCase()) {
            const oldSock = this.sockets.get(existingId);
            this.activePlayers.delete(existingId);
            this.sockets.delete(existingId);
            this.broadcast({ type: 'player:left', id: existingId });
            if (oldSock && oldSock !== ws && oldSock.readyState === WebSocket.OPEN) {
              oldSock.close();
            }
          }
        }

        const key = normalized.toLowerCase();
        const serverSaved = this.persisted.profiles[key];

        // Double-layer zero-reset persistence: if container restarted and server disk has no record yet,
        // safely restore from client browser backup for the matching @username!
        const rawBackup = msg.clientBackup as ClientBackupProfile | undefined;
        const validBackup =
          rawBackup &&
          typeof rawBackup === 'object' &&
          normalizeIgUsername(String(rawBackup.username || '')).toLowerCase() === key
            ? rawBackup
            : null;

        const useBackup =
          Boolean(validBackup) &&
          (!serverSaved ||
            (serverSaved.money === 0 &&
              !serverSaved.job &&
              serverSaved.ownedVehicles.length === 0 &&
              (Number(validBackup!.money) > 0 || Boolean(validBackup!.job) || (validBackup!.ownedVehicles?.length ?? 0) > 0)));

        const saved = useBackup
          ? {
              username: normalized,
              shirtColor: serverSaved?.shirtColor || '#2563EB',
              hairStyle: serverSaved?.hairStyle || ('fade' as HairStyle),
              hairColor: serverSaved?.hairColor || '#18181B',
              job: validBackup!.job && JOBS[validBackup!.job] ? validBackup!.job : null,
              money: clamp(Math.floor(Number(validBackup!.money) || 0), 0, 50_000_000),
              ownedVehicles: Array.isArray(validBackup!.ownedVehicles)
                ? validBackup!.ownedVehicles.filter((v): v is VehicleId => Boolean(VEHICLES[v] && !VEHICLES[v].jobOnly))
                : [],
              activeVehicle:
                validBackup!.activeVehicle && VEHICLES[validBackup!.activeVehicle]
                  ? validBackup!.activeVehicle
                  : null,
              lastX: Number(validBackup!.lastX) || LANDMARKS.pakKades.x,
              lastY: Number(validBackup!.lastY) || 555,
            }
          : serverSaved;

        const shirtColor = VALID_SHIRTS.has(msg.shirtColor)
          ? msg.shirtColor
          : saved?.shirtColor || '#2563EB';
        const hairStyle: HairStyle = HAIR_STYLES.includes(msg.hairStyle)
          ? msg.hairStyle
          : saved?.hairStyle || 'fade';
        const hairColor =
          typeof msg.hairColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(msg.hairColor)
            ? msg.hairColor
            : saved?.hairColor || '#18181B';

        // Sanitize deprecated jobs if returning from old save
        const savedJob = saved?.job && JOBS[saved.job] ? saved.job : null;

        playerId = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

        const spawnX = saved?.lastX
          ? clamp(saved.lastX, 120, WORLD_WIDTH - 120)
          : LANDMARKS.pakKades.x - 40 + Math.round((Math.random() - 0.5) * 140);
        const spawnY = saved?.lastY
          ? clamp(saved.lastY, WALK_MIN_Y, WALK_MAX_Y)
          : 555 + Math.round((Math.random() - 0.5) * 35);

        const player: PlayerState = {
          id: playerId,
          username: normalized,
          room: 'outdoor',
          x: spawnX,
          y: spawnY,
          z: 0,
          dir: 'right',
          moving: false,
          shirtColor,
          hairStyle,
          hairColor,
          job: savedJob,
          money: typeof saved?.money === 'number' ? saved.money : 0,
          ownedVehicles: Array.isArray(saved?.ownedVehicles) ? saved.ownedVehicles : [],
          activeVehicle: saved?.activeVehicle || null,
          workingUntil: 0,
          ojekOrder: savedJob === 'ojek' ? generateOjekOrder(spawnX) : null,
        };

        this.activePlayers.set(playerId, player);
        this.sockets.set(playerId, ws);
        this.savePlayerToProfile(player);

        this.send(ws, {
          type: 'world:init',
          snapshot: {
            selfId: playerId,
            players: Array.from(this.activePlayers.values()),
            houses: this.persisted.houses,
            ball: this.ball,
            totalRegistered: this.getTotalPopulation(),
            igSync: this.persisted.igSync,
          },
        });

        if (saved && (saved.money > 0 || savedJob || (saved.ownedVehicles?.length ?? 0) > 0)) {
          this.send(ws, {
            type: 'toast',
            message: `Selamat datang kembali ${normalized}! Saldo Rp ${player.money.toLocaleString('id-ID')} aman tersimpan.`,
          });
        }

        this.broadcast({ type: 'player:joined', player }, playerId);
        return;
      }

      if (!playerId) return;
      const player = this.activePlayers.get(playerId);
      if (!player) return;

      switch (msg.type) {
        case 'player:move': {
          const isOutdoor = player.room === 'outdoor';
          const nextX = isOutdoor
            ? clamp(Number(msg.x) || player.x, 70, WORLD_WIDTH - 70)
            : clamp(Number(msg.x) || player.x, INTERIOR_MIN_X, INTERIOR_MAX_X);
          const nextY = isOutdoor
            ? clamp(Number(msg.y) || player.y, WALK_MIN_Y, WALK_MAX_Y)
            : clamp(Number(msg.y) || player.y, INTERIOR_MIN_Y, INTERIOR_MAX_Y);
          const nextZ = clamp(Number(msg.z) || 0, 0, 140);
          const dir = msg.dir === 'left' ? 'left' : 'right';
          const moving = Boolean(msg.moving);

          player.x = nextX;
          player.y = nextY;
          player.z = nextZ;
          player.dir = dir;
          player.moving = moving;

          // Soccer ball collision only outdoors
          if (isOutdoor && nextZ < 20) {
            const dx = this.ball.x - player.x;
            const dy = this.ball.y - player.y;
            const dist = Math.hypot(dx, dy);
            if (moving && dist < 34 && dist > 0.1) {
              this.ball.vx = (dx / dist) * 14;
              this.ball.vy = (dy / dist) * 8;
              this.broadcast({ type: 'ball:moved', ball: this.ball, kickedBy: player.username });
            }
          }

          this.broadcast(
            {
              type: 'player:moved',
              id: player.id,
              room: player.room,
              x: player.x,
              y: player.y,
              z: player.z,
              dir: player.dir,
              moving: player.moving,
            },
            player.id
          );
          break;
        }

        case 'room:enter': {
          const targetRoom = String(msg.room || '') as RoomId;
          const validStatic = targetRoom === 'sekolah' || targetRoom === 'masjid' || targetRoom === 'gereja';
          const validHouse =
            targetRoom.startsWith('house_') &&
            this.persisted.houses.some((h) => `house_${h.plotId}` === targetRoom);

          if (!validStatic && !validHouse) {
            this.send(ws, { type: 'error', message: 'Bangunan ini belum bisa dimasuki.' });
            return;
          }

          player.room = targetRoom;
          player.activeVehicle = null; // park vehicle outside when entering building
          player.x = INTERIOR_EXIT_X;
          player.y = INTERIOR_EXIT_Y - 35;
          player.z = 0;
          player.moving = false;
          this.broadcast({ type: 'player:updated', player });
          break;
        }

        case 'room:exit': {
          if (player.room === 'outdoor') return;
          const exitPos = this.getOutdoorDoorForRoom(player.room);
          player.room = 'outdoor';
          player.x = exitPos.x;
          player.y = exitPos.y;
          player.z = 0;
          player.moving = false;
          this.savePlayerToProfile(player);
          this.broadcast({ type: 'player:updated', player });
          break;
        }

        case 'job:select': {
          const jobId = msg.jobId as JobId;
          if (!JOBS[jobId]) return;
          player.job = jobId;
          if (jobId === 'ojek') {
            player.ojekOrder = generateOjekOrder(player.x);
            if (player.room === 'outdoor') {
              player.activeVehicle = 'ojek_motor';
            }
          } else {
            player.ojekOrder = null;
            if (player.activeVehicle === 'ojek_motor') {
              player.activeVehicle = null;
            }
          }
          this.savePlayerToProfile(player);
          this.broadcast({ type: 'player:updated', player });
          this.send(ws, {
            type: 'toast',
            message: `Pak Kades: "${JOBS[jobId].kadesQuote}"`,
          });
          break;
        }

        case 'work:start': {
          if (!player.job || player.job === 'ojek') return;
          player.workingUntil = Date.now() + 2600;
          this.broadcast({ type: 'player:updated', player });
          break;
        }

        case 'work:complete': {
          if (!player.job || !JOBS[player.job] || player.job === 'ojek') {
            this.send(ws, {
              type: 'error',
              message: 'Pilih pekerjaan dulu ke Pak Kades!',
            });
            return;
          }

          const now = Date.now();
          const lastWork = this.workCooldowns.get(player.id) || 0;
          if (now - lastWork < 2000) return;

          const jobDef = JOBS[player.job];
          if (player.room !== jobDef.workRoom) {
            this.send(ws, {
              type: 'error',
              message: `Masuk ke ${jobDef.workplaceName} dulu untuk bekerja!`,
            });
            return;
          }

          const dist = Math.hypot(player.x - jobDef.workX, player.y - jobDef.workY);
          if (dist > 280) {
            this.send(ws, {
              type: 'error',
              message: `Mendekat ke area kerja (${jobDef.workplaceName}) dulu ya!`,
            });
            return;
          }

          this.workCooldowns.set(player.id, now);
          player.money += jobDef.salary;
          player.workingUntil = now + 800;

          this.savePlayerToProfile(player);
          this.broadcast({ type: 'player:updated', player });
          this.send(ws, {
            type: 'work:rewarded',
            amount: jobDef.salary,
            money: player.money,
          });
          break;
        }

        case 'ojek:action': {
          if (player.job !== 'ojek' || player.room !== 'outdoor') return;
          if (!player.ojekOrder) {
            player.ojekOrder = generateOjekOrder(player.x);
            this.broadcast({ type: 'player:updated', player });
            return;
          }

          // Auto-mount ojek motor if not riding
          if (!player.activeVehicle) {
            player.activeVehicle = 'ojek_motor';
          }

          const order = player.ojekOrder;
          if (order.stage === 'pickup') {
            const dist = Math.hypot(player.x - order.pickupX, player.y - order.pickupY);
            if (dist > 170) {
              this.send(ws, {
                type: 'error',
                message: `Dekati ${order.passengerName} di ${order.pickupName} untuk menjemput!`,
              });
              return;
            }
            player.ojekOrder = { ...order, stage: 'dropoff' };
            this.broadcast({ type: 'player:updated', player });
            this.send(ws, {
              type: 'toast',
              message: `${order.passengerName} sudah naik! Antar ke ${order.dropoffName} (Rp 7.000).`,
            });
          } else {
            const dist = Math.hypot(player.x - order.dropoffX, player.y - order.dropoffY);
            if (dist > 170) {
              this.send(ws, {
                type: 'error',
                message: `Antar ${order.passengerName} sampai ke ${order.dropoffName}!`,
              });
              return;
            }
            const reward = JOBS.ojek.salary; // Rp 7.000 per orderan!
            player.money += reward;
            const prevDropX = order.dropoffX;
            const finishedName = order.passengerName;
            player.ojekOrder = generateOjekOrder(prevDropX);
            this.savePlayerToProfile(player);
            this.broadcast({ type: 'player:updated', player });
            this.send(ws, {
              type: 'work:rewarded',
              amount: reward,
              money: player.money,
              note: `${finishedName}: "Makasih Bang!"`,
            });
          }
          break;
        }

        case 'vehicle:buy': {
          const vehicleId = msg.vehicleId as VehicleId;
          const vDef = VEHICLES[vehicleId];
          if (!vDef || vDef.jobOnly) return;
          if (player.ownedVehicles.includes(vehicleId)) {
            if (player.room === 'outdoor') player.activeVehicle = vehicleId;
            this.savePlayerToProfile(player);
            this.broadcast({ type: 'player:updated', player });
            return;
          }
          if (player.money < vDef.price) {
            this.send(ws, {
              type: 'error',
              message: `Uang belum cukup untuk ${vDef.name}. Kerja dulu ya!`,
            });
            return;
          }
          player.money -= vDef.price;
          player.ownedVehicles = [...player.ownedVehicles, vehicleId];
          if (player.room === 'outdoor') player.activeVehicle = vehicleId;
          this.savePlayerToProfile(player);
          this.broadcast({ type: 'player:updated', player });
          this.send(ws, {
            type: 'toast',
            message: `Berhasil membeli ${vDef.name}! Tekan V untuk naik/turun kendaraan.`,
          });
          break;
        }

        case 'vehicle:toggle': {
          if (player.room !== 'outdoor') {
            this.send(ws, { type: 'error', message: 'Keluar ke jalan dulu untuk naik kendaraan.' });
            return;
          }
          const requested = msg.vehicleId as VehicleId | null | undefined;
          const canUseOjek = player.job === 'ojek';
          const available: VehicleId[] = [
            ...(canUseOjek ? (['ojek_motor'] as VehicleId[]) : []),
            ...player.ownedVehicles,
          ];

          if (requested === null) {
            player.activeVehicle = null;
          } else if (requested && available.includes(requested)) {
            player.activeVehicle = requested;
          } else if (player.activeVehicle) {
            player.activeVehicle = null;
          } else if (available.length > 0) {
            player.activeVehicle = available[available.length - 1];
          } else {
            this.send(ws, {
              type: 'error',
              message: 'Belum punya kendaraan. Beli di Garasi atau ambil kerja Tukang Ojek!',
            });
            return;
          }
          this.savePlayerToProfile(player);
          this.broadcast({ type: 'player:updated', player });
          break;
        }

        case 'house:build': {
          const plotId = Number(msg.plotId);
          const tier = msg.tier as HouseTierId;
          const roofColor = VALID_ROOFS.has(msg.roofColor) ? msg.roofColor : '#DC2626';
          const plot = HOUSE_PLOTS.find((p) => p.plotId === plotId);
          const tierDef = HOUSE_TIERS[tier];
          if (!plot || !tierDef) return;

          const existingIdx = this.persisted.houses.findIndex((h) => h.plotId === plotId);
          if (existingIdx !== -1) {
            const existing = this.persisted.houses[existingIdx];
            if (existing.ownerUsername.toLowerCase() !== player.username.toLowerCase()) {
              this.send(ws, {
                type: 'error',
                message: `Kavling ${plotId} sudah dimiliki ${existing.ownerUsername}.`,
              });
              return;
            }
            // Allow roof repainting / tier upgrade by adding remaining months
            const newTotalMonths = Math.max(existing.totalMonths, tierDef.totalMonths);
            const updatedHouse: BuiltHouse = {
              ...existing,
              tier,
              roofColor,
              totalMonths: newTotalMonths,
            };
            this.persisted.houses[existingIdx] = updatedHouse;
            this.scheduleSave();
            this.broadcast({ type: 'house:built', house: updatedHouse });
            this.send(ws, {
              type: 'toast',
              message: `Rumah Kavling ${plotId} diperbarui ke ${tierDef.name}!`,
            });
            return;
          }

          // New house requires DP / Biaya Awal Rp 100.000!
          if (player.money < HOUSE_DOWN_PAYMENT) {
            this.send(ws, {
              type: 'error',
              message: `Butuh biaya awal Rp 100.000 untuk mulai bangun rumah. Kerja dulu ya!`,
            });
            return;
          }

          player.money -= HOUSE_DOWN_PAYMENT;
          const newHouse: BuiltHouse = {
            plotId,
            ownerUsername: player.username,
            tier,
            roofColor,
            builtAt: Date.now(),
            downPayment: HOUSE_DOWN_PAYMENT,
            monthlyInstallment: HOUSE_MONTHLY_INSTALLMENT,
            monthsPaid: 0,
            totalMonths: tierDef.totalMonths,
          };
          this.persisted.houses.push(newHouse);
          this.savePlayerToProfile(player);
          this.broadcast({ type: 'house:built', house: newHouse });
          this.broadcast({ type: 'player:updated', player });
          this.send(ws, {
            type: 'toast',
            message: `${tierDef.name} berdiri di Kavling ${plotId}! DP Rp 100.000 lunas, cicilan Rp 150.000/bulan (${tierDef.totalMonths}x).`,
          });
          break;
        }

        case 'house:pay_installment': {
          const plotId = Number(msg.plotId);
          const idx = this.persisted.houses.findIndex((h) => h.plotId === plotId);
          if (idx === -1) return;
          const house = this.persisted.houses[idx];
          if (house.ownerUsername.toLowerCase() !== player.username.toLowerCase()) {
            this.send(ws, { type: 'error', message: 'Hanya pemilik rumah yang bisa bayar cicilan ini.' });
            return;
          }
          if (house.monthsPaid >= house.totalMonths) {
            this.send(ws, { type: 'toast', message: `Rumah Kavling ${plotId} sudah LUNAS!` });
            return;
          }
          const amount = house.monthlyInstallment || HOUSE_MONTHLY_INSTALLMENT;
          if (player.money < amount) {
            this.send(ws, {
              type: 'error',
              message: `Saldo belum cukup untuk cicilan bulan ini (Rp ${amount.toLocaleString('id-ID')}).`,
            });
            return;
          }
          player.money -= amount;
          const updatedHouse: BuiltHouse = {
            ...house,
            monthsPaid: house.monthsPaid + 1,
          };
          this.persisted.houses[idx] = updatedHouse;
          this.savePlayerToProfile(player);
          this.broadcast({ type: 'house:built', house: updatedHouse });
          this.broadcast({ type: 'player:updated', player });
          const isLunas = updatedHouse.monthsPaid >= updatedHouse.totalMonths;
          this.send(ws, {
            type: 'toast',
            message: isLunas
              ? `SELAMAT! Cicilan rumah Kavling ${plotId} sudah LUNAS 100%!`
              : `Cicilan bulan ke-${updatedHouse.monthsPaid}/${updatedHouse.totalMonths} (Rp 150.000) berhasil dibayar!`,
          });
          break;
        }

        case 'chat:send': {
          const text = String(msg.text || '').trim().slice(0, 72);
          if (!text) return;
          const until = Date.now() + 5500;
          player.chatText = text;
          player.chatUntil = until;
          this.broadcast({
            type: 'chat:message',
            id: player.id,
            username: player.username,
            text,
            until,
          });
          break;
        }
      }
    });

    ws.on('close', () => {
      if (playerId) {
        const p = this.activePlayers.get(playerId);
        if (p) this.savePlayerToProfile(p);
        this.activePlayers.delete(playerId);
        this.sockets.delete(playerId);
        this.workCooldowns.delete(playerId);
        this.broadcast({ type: 'player:left', id: playerId });
      }
    });
  }
}

export function attachGameWebSocketServer(httpServer: HttpServer) {
  const gameServer = new KampungGameServer();
  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url && req.url.startsWith('/ws/game')) {
      gameServer.handleUpgrade(req, socket, head);
    }
  });
  return gameServer;
}
