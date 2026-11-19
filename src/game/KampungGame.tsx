import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Briefcase,
  Car,
  DoorOpen,
  Download,
  Film,
  Home,
  LogOut,
  Send,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  BallState,
  BuiltHouse,
  CAMERA_VIEW_HEIGHT,
  ClientBackupProfile,
  formatRupiah,
  HairStyle,
  HOUSE_DOWN_PAYMENT,
  HOUSE_MONTHLY_INSTALLMENT,
  HOUSE_PLOTS,
  HOUSE_TIER_LIST,
  HouseTierId,
  IgFollowerSyncState,
  INTERIOR_EXIT_X,
  INTERIOR_EXIT_Y,
  INTERIOR_HEIGHT,
  INTERIOR_MAX_X,
  INTERIOR_MAX_Y,
  INTERIOR_MIN_X,
  INTERIOR_MIN_Y,
  INTERIOR_WIDTH,
  JOB_LIST,
  JOBS,
  LANDMARKS,
  normalizeIgUsername,
  PlayerState,
  PURCHASABLE_VEHICLES,
  ROOF_PRESETS,
  RoomId,
  SHIRT_PRESETS,
  VEHICLES,
  WALK_MAX_Y,
  WALK_MIN_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './types';
import { FloatingText, renderKampungWorld, RenderInteractionHint } from './renderer';
import { gameSound } from './sound';
import { PakKades } from '../video/characters/PakKades';

interface KampungGameProps {
  onOpenVideos: () => void;
}

type ActiveModal =
  | null
  | { type: 'kades' }
  | { type: 'showroom' }
  | { type: 'build'; plotId: number }
  | { type: 'players' };

interface NearbyAction {
  kind: 'kades' | 'showroom' | 'work' | 'ojek' | 'plot' | 'enter_room' | 'exit_room' | 'cat';
  x: number;
  y: number;
  label: string;
  plotId?: number;
  targetRoom?: RoomId;
}

const PROFILE_BACKUP_PREFIX = 'kampung_amanah_save_v2:';

function readClientBackup(username: string): ClientBackupProfile | null {
  try {
    const key = `${PROFILE_BACKUP_PREFIX}${username.toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as ClientBackupProfile;
  } catch {
    return null;
  }
}

function writeClientBackup(player: PlayerState) {
  try {
    const key = `${PROFILE_BACKUP_PREFIX}${player.username.toLowerCase()}`;
    const payload: ClientBackupProfile = {
      username: player.username,
      money: player.money,
      job: player.job,
      ownedVehicles: player.ownedVehicles,
      activeVehicle: player.activeVehicle,
      lastX: Math.round(player.x),
      lastY: Math.round(player.y),
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
}

const HAIR_OPTIONS: { id: HairStyle; label: string; defaultColor: string }[] = [
  { id: 'fade', label: 'Rapi', defaultColor: '#18181B' },
  { id: 'spiky', label: 'Spiky', defaultColor: '#18181B' },
  { id: 'swept', label: 'Belah', defaultColor: '#27272A' },
  { id: 'curly', label: 'Ikal', defaultColor: '#18181B' },
  { id: 'hijab', label: 'Hijab', defaultColor: '#EC4899' },
];

const HIJAB_COLORS = ['#EC4899', '#0EA5E9', '#16A34A', '#F59E0B', '#7C3AED', '#FEF08A'];
const QUICK_CHATS = ['Halo warga!', 'Ayo kerja!', 'Mampir rumahku!', 'Main yuk!'];

function getRoomDisplayName(room: RoomId, houses: BuiltHouse[]): string {
  if (room === 'sekolah') return 'Di dalam Sekolah';
  if (room === 'masjid') return 'Di dalam Masjid Amanah';
  if (room === 'gereja') return 'Di dalam Gereja Amanah';
  if (room.startsWith('house_')) {
    const plotId = Number(room.replace('house_', ''));
    const h = houses.find((item) => item.plotId === plotId);
    return h ? `Di dalam Rumah ${h.ownerUsername}` : `Di dalam Rumah Kavling ${plotId}`;
  }
  return 'Kampung Amanah';
}

export const KampungGame: React.FC<KampungGameProps> = ({ onOpenVideos }) => {
  const [phase, setPhase] = useState<'TITLE' | 'PLAYING'>('TITLE');
  const [usernameInput, setUsernameInput] = useState<string>(() => {
    try {
      return localStorage.getItem('kampung_amanah_ig') || '';
    } catch {
      return '';
    }
  });
  const [shirtColor, setShirtColor] = useState<string>(SHIRT_PRESETS[1].hex);
  const [hairStyle, setHairStyle] = useState<HairStyle>('fade');
  const [hairColor, setHairColor] = useState<string>('#18181B');
  const [entryError, setEntryError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    onlineCount: number;
    housesCount: number;
    totalPlots: number;
    totalRegistered: number;
    igSync?: IgFollowerSyncState;
  }>({ onlineCount: 0, housesCount: 0, totalPlots: HOUSE_PLOTS.length, totalRegistered: 245 });

  // Returning player preview on Title Screen (shows saved progress so players know it won't reset!)
  const [savedPreview, setSavedPreview] = useState<{ money: number; job: string | null } | null>(null);

  // Live HUD state
  const [selfPlayer, setSelfPlayer] = useState<PlayerState | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<PlayerState[]>([]);
  const [houses, setHouses] = useState<BuiltHouse[]>([]);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [nearbyAction, setNearbyAction] = useState<NearbyAction | null>(null);
  const [workProgress, setWorkProgress] = useState<number>(0);
  const [isWorkingNow, setIsWorkingNow] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; kind: 'info' | 'error' } | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [muted, setMuted] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [selectedRoofColor, setSelectedRoofColor] = useState<string>(ROOF_PRESETS[0].hex);

  // Virtual Analog Joystick knob state (for crisp visual feedback)
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const analogVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const analogPointerIdRef = useRef<number | null>(null);
  const analogBaseRef = useRef<HTMLDivElement | null>(null);

  // Real-time game loop refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinConfigRef = useRef<{
    username: string;
    shirtColor: string;
    hairStyle: HairStyle;
    hairColor: string;
  } | null>(null);

  const selfIdRef = useRef<string>('');
  const playersRef = useRef<Map<string, PlayerState>>(new Map());
  const remoteTargetsRef = useRef<Map<string, { x: number; y: number; z: number }>>(new Map());
  const housesRef = useRef<BuiltHouse[]>([]);
  const ballRef = useRef<BallState>({ x: 3740, y: 455, vx: 0, vy: 0 });
  const totalRegisteredRef = useRef<number>(245);
  const cameraXRef = useRef<number>(1300);
  const cameraYRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const clickTargetRef = useRef<{ x: number; y: number } | null>(null);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const floatingIdRef = useRef<number>(1);
  const lastMoveSentRef = useRef<number>(0);
  const catPetUntilRef = useRef<number>(0);
  const nearbyActionRef = useRef<NearbyAction | null>(null);
  const activeModalRef = useRef<ActiveModal>(null);
  const workIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jumpVelRef = useRef<number>(0);

  activeModalRef.current = activeModal;

  const showToast = useCallback((text: string, kind: 'info' | 'error' = 'info') => {
    setToast({ text, kind });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  // Fetch world summary on Title Screen
  useEffect(() => {
    if (phase !== 'TITLE') return;
    let active = true;
    const load = async () => {
      try {
        const r = await fetch('/api/game/summary', { cache: 'no-store' });
        if (r.ok && active) {
          const data = await r.json();
          setSummary(data);
        }
      } catch {
        // silent
      }
    };
    load();
    const timer = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [phase]);

  // Check if typed IG username already has saved progress (server OR local browser backup)
  useEffect(() => {
    if (phase !== 'TITLE') return;
    const normalized = normalizeIgUsername(usernameInput);
    if (!normalized || normalized.length < 3) {
      setSavedPreview(null);
      return;
    }
    let active = true;
    const local = readClientBackup(normalized);
    if (local && (local.money > 0 || local.job)) {
      setSavedPreview({
        money: local.money,
        job: local.job && JOBS[local.job] ? JOBS[local.job].title : null,
      });
    } else {
      setSavedPreview(null);
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/game/profile/${encodeURIComponent(normalized)}`, { cache: 'no-store' });
        if (!r.ok || !active) return;
        const data = await r.json();
        if (data?.found && (data.money > 0 || data.job)) {
          setSavedPreview({
            money: data.money,
            job: data.job && JOBS[data.job as keyof typeof JOBS] ? JOBS[data.job as keyof typeof JOBS].title : null,
          });
        }
      } catch {
        // ignore
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [phase, usernameInput]);

  const addFloatingText = useCallback((x: number, y: number, text: string, color = '#FACC15') => {
    floatingTextsRef.current.push({
      id: floatingIdRef.current++,
      x,
      y,
      text,
      color,
      createdAt: performance.now(),
      duration: 1600,
    });
  }, []);

  const syncHudFromRef = useCallback(() => {
    const list = Array.from(playersRef.current.values());
    setOnlinePlayers(list);
    const me = playersRef.current.get(selfIdRef.current) || null;
    if (me) {
      setSelfPlayer({ ...me });
      writeClientBackup(me);
    }
  }, []);

  const sendWs = useCallback((payload: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  // Connect & maintain WebSocket session
  const connectWebSocket = useCallback(() => {
    const cfg = joinConfigRef.current;
    if (!cfg) return;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/game`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      const clientBackup = readClientBackup(cfg.username);
      ws.send(
        JSON.stringify({
          type: 'player:join',
          username: cfg.username,
          shirtColor: cfg.shirtColor,
          hairStyle: cfg.hairStyle,
          hairColor: cfg.hairColor,
          clientBackup,
        })
      );
    };

    ws.onmessage = (event) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'world:init': {
          const snap = msg.snapshot;
          selfIdRef.current = snap.selfId;
          const map = new Map<string, PlayerState>();
          remoteTargetsRef.current.clear();
          for (const p of snap.players as PlayerState[]) {
            map.set(p.id, { ...p, room: p.room || 'outdoor', z: p.z || 0 });
            if (p.id !== snap.selfId) {
              remoteTargetsRef.current.set(p.id, { x: p.x, y: p.y, z: p.z || 0 });
            }
          }
          playersRef.current = map;
          housesRef.current = snap.houses || [];
          ballRef.current = snap.ball || { x: 3740, y: 455, vx: 0, vy: 0 };
          totalRegisteredRef.current = snap.totalRegistered || 245;
          setHouses([...housesRef.current]);
          syncHudFromRef();
          break;
        }

        case 'population:updated': {
          if (typeof msg.totalRegistered === 'number') {
            totalRegisteredRef.current = msg.totalRegistered;
          }
          break;
        }

        case 'player:joined': {
          const p: PlayerState = msg.player;
          if (!p?.id) return;
          playersRef.current.set(p.id, { ...p, room: p.room || 'outdoor', z: p.z || 0 });
          if (p.id !== selfIdRef.current) {
            remoteTargetsRef.current.set(p.id, { x: p.x, y: p.y, z: p.z || 0 });
            showToast(`${p.username} baru masuk Kampung Amanah!`);
          }
          syncHudFromRef();
          break;
        }

        case 'player:left': {
          const id = String(msg.id);
          if (playersRef.current.delete(id)) {
            remoteTargetsRef.current.delete(id);
            syncHudFromRef();
          }
          break;
        }

        case 'player:moved': {
          if (msg.id === selfIdRef.current) return;
          const p = playersRef.current.get(msg.id);
          if (p) {
            p.room = msg.room || p.room;
            remoteTargetsRef.current.set(msg.id, { x: msg.x, y: msg.y, z: msg.z || 0 });
            p.dir = msg.dir;
            p.moving = msg.moving;
          }
          break;
        }

        case 'player:updated': {
          const updated: PlayerState = msg.player;
          const existing = playersRef.current.get(updated.id);
          if (updated.id === selfIdRef.current && existing) {
            const roomChanged = existing.room !== updated.room;
            if (roomChanged) {
              clickTargetRef.current = null;
              jumpVelRef.current = 0;
            }
            playersRef.current.set(updated.id, {
              ...updated,
              x: roomChanged ? updated.x : existing.x,
              y: roomChanged ? updated.y : existing.y,
              z: roomChanged ? 0 : existing.z,
              dir: existing.dir,
              moving: roomChanged ? false : existing.moving,
            });
          } else {
            playersRef.current.set(updated.id, { ...updated, room: updated.room || 'outdoor', z: updated.z || 0 });
            remoteTargetsRef.current.set(updated.id, { x: updated.x, y: updated.y, z: updated.z || 0 });
          }
          syncHudFromRef();
          break;
        }

        case 'house:built': {
          const house: BuiltHouse = msg.house;
          const idx = housesRef.current.findIndex((h) => h.plotId === house.plotId);
          if (idx >= 0) housesRef.current[idx] = house;
          else housesRef.current.push(house);
          setHouses([...housesRef.current]);
          gameSound.playBuild();
          const plot = HOUSE_PLOTS.find((pl) => pl.plotId === house.plotId);
          if (plot) {
            addFloatingText(plot.x, plot.y - 80, `Rumah ${house.ownerUsername}!`, '#4ADE80');
          }
          break;
        }

        case 'ball:moved': {
          ballRef.current = msg.ball;
          if (msg.kickedBy) gameSound.playKick();
          break;
        }

        case 'chat:message': {
          const p = playersRef.current.get(msg.id);
          if (p) {
            p.chatText = msg.text;
            p.chatUntil = Date.now() + 5500;
            gameSound.playPop();
          }
          break;
        }

        case 'work:rewarded': {
          const me = playersRef.current.get(selfIdRef.current);
          if (me) {
            me.money = msg.money;
            me.workingUntil = 0;
            addFloatingText(me.x, me.y - 115, `+${formatRupiah(msg.amount)}`, '#FACC15');
            if (msg.note) showToast(msg.note, 'info');
            syncHudFromRef();
          }
          gameSound.playCoin();
          break;
        }

        case 'toast': {
          showToast(msg.message, 'info');
          break;
        }

        case 'error': {
          showToast(msg.message, 'error');
          break;
        }
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      if (joinConfigRef.current) {
        reconnectTimerRef.current = setTimeout(() => connectWebSocket(), 1800);
      }
    };
  }, [addFloatingText, showToast, syncHudFromRef]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeIgUsername(usernameInput);
    if (!normalized || normalized.length < 3) {
      setEntryError('Masukkan username IG minimal 2 karakter (huruf, angka, titik, atau garis bawah).');
      return;
    }
    setEntryError(null);
    try {
      localStorage.setItem('kampung_amanah_ig', normalized.replace(/^@/, ''));
    } catch {
      // ignore
    }
    joinConfigRef.current = {
      username: normalized,
      shirtColor,
      hairStyle,
      hairColor,
    };
    setPhase('PLAYING');
    connectWebSocket();
  };

  const handleLeaveGame = () => {
    const me = playersRef.current.get(selfIdRef.current);
    if (me) writeClientBackup(me);
    joinConfigRef.current = null;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (workIntervalRef.current) clearInterval(workIntervalRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    playersRef.current.clear();
    setSelfPlayer(null);
    setActiveModal(null);
    setIsWorkingNow(false);
    setPhase('TITLE');
  };

  useEffect(() => {
    return () => {
      joinConfigRef.current = null;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (workIntervalRef.current) clearInterval(workIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  // Trigger Jump (Space key or Jump button)
  const triggerJump = useCallback(() => {
    const me = playersRef.current.get(selfIdRef.current);
    if (!me || activeModalRef.current || isWorkingNow) return;
    if (me.z <= 2) {
      jumpVelRef.current = 420;
      gameSound.playJump();
    }
  }, [isWorkingNow]);

  // Compute active work waypoint beacon for the current room!
  const getWorkTargetForPlayer = useCallback((me: PlayerState | null) => {
    if (!me || !me.job) return null;
    const job = JOBS[me.job];

    if (me.job === 'ojek') {
      if (me.room !== 'outdoor') {
        return { x: INTERIOR_EXIT_X, y: INTERIOR_EXIT_Y - 10, label: 'KELUAR NARIK OJEK', color: '#4ADE80' };
      }
      const order = me.ojekOrder;
      if (!order) return null;
      if (order.stage === 'pickup') {
        return {
          x: order.pickupX,
          y: order.pickupY,
          label: `JEMPUT ${order.passengerName.toUpperCase()}`,
          color: '#4ADE80',
        };
      }
      return {
        x: order.dropoffX,
        y: order.dropoffY,
        label: `ANTAR KE ${order.dropoffName.toUpperCase()}`,
        color: '#FACC15',
      };
    }

    // If player intentionally visits Gereja or a House interior, keep the room peaceful (no work beacon)
    if (me.room === 'gereja' || me.room.startsWith('house_')) {
      return null;
    }

    // If job is inside Sekolah or Masjid while player is still outdoors -> guide to door!
    if (job.workRoom !== me.room) {
      if (me.room === 'outdoor') {
        if (job.workRoom === 'sekolah') {
          return { x: LANDMARKS.sekolah.x, y: 450, label: 'MASUK SEKOLAH (KERJA)', color: '#FACC15' };
        }
        if (job.workRoom === 'masjid') {
          return { x: LANDMARKS.masjid.x, y: 450, label: 'MASUK MASJID (KERJA)', color: '#4ADE80' };
        }
      } else {
        return { x: INTERIOR_EXIT_X, y: INTERIOR_EXIT_Y - 10, label: 'KELUAR KE LOKASI KERJA', color: '#FACC15' };
      }
    }

    return {
      x: job.workX,
      y: job.workY,
      label: `KERJA: ${job.workplaceName.toUpperCase()}`,
      color: '#FACC15',
    };
  }, []);

  // Start a 2.3-second interactive work shift with live animation!
  const startWorkShift = useCallback(() => {
    if (isWorkingNow) return;
    const me = playersRef.current.get(selfIdRef.current);
    if (!me || !me.job) {
      setActiveModal({ type: 'kades' });
      return;
    }
    setIsWorkingNow(true);
    setWorkProgress(0);
    me.workingUntil = Date.now() + 2400;
    sendWs({ type: 'work:start' });
    gameSound.playWorkTap();

    const startTs = performance.now();
    const duration = 2300;
    if (workIntervalRef.current) clearInterval(workIntervalRef.current);
    workIntervalRef.current = setInterval(() => {
      const elapsed = performance.now() - startTs;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setWorkProgress(pct);
      if (pct >= 100) {
        if (workIntervalRef.current) clearInterval(workIntervalRef.current);
        workIntervalRef.current = null;
        setIsWorkingNow(false);
        setWorkProgress(0);
        sendWs({ type: 'work:complete' });
      }
    }, 60);
  }, [isWorkingNow, sendWs]);

  // Execute contextual interaction (E key or bottom-right Action Button)
  const triggerInteraction = useCallback(() => {
    const action = nearbyActionRef.current;
    if (!action) return;
    if (action.kind === 'kades') {
      setActiveModal({ type: 'kades' });
    } else if (action.kind === 'showroom') {
      setActiveModal({ type: 'showroom' });
    } else if (action.kind === 'plot' && action.plotId) {
      setActiveModal({ type: 'build', plotId: action.plotId });
    } else if (action.kind === 'enter_room' && action.targetRoom) {
      gameSound.playPop();
      sendWs({ type: 'room:enter', room: action.targetRoom });
    } else if (action.kind === 'exit_room') {
      gameSound.playPop();
      sendWs({ type: 'room:exit' });
    } else if (action.kind === 'work') {
      startWorkShift();
    } else if (action.kind === 'ojek') {
      gameSound.playHorn(false);
      sendWs({ type: 'ojek:action' });
    } else if (action.kind === 'cat') {
      catPetUntilRef.current = performance.now() + 2200;
      gameSound.playMeow();
      addFloatingText(LANDMARKS.kucing.x, LANDMARKS.kucing.y - 45, 'Meong~', '#FACC15');
    }
  }, [addFloatingText, sendWs, startWorkShift]);

  // Keyboard Listeners (WASD / Arrows / Space Jump / E Interact / V Vehicle / H Horn)
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') target.blur();
        return;
      }

      if (e.key === 'Escape') {
        setActiveModal(null);
        return;
      }

      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        clickTargetRef.current = null;
        keysRef.current.add(key);
      } else if (e.code === 'Space') {
        e.preventDefault();
        triggerJump();
      } else if (key === 'e') {
        if (!activeModalRef.current) {
          e.preventDefault();
          triggerInteraction();
        }
      } else if (key === 'v') {
        if (!activeModalRef.current) {
          sendWs({ type: 'vehicle:toggle' });
        }
      } else if (key === 'h') {
        const me = playersRef.current.get(selfIdRef.current);
        if (me?.activeVehicle) {
          gameSound.playHorn(me.activeVehicle === 'bus_oranye');
          addFloatingText(
            me.x,
            me.y - 115,
            me.activeVehicle === 'bus_oranye' ? 'TELOLET!' : 'TIN TIN!',
            '#38BDF8'
          );
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [addFloatingText, phase, sendWs, triggerInteraction, triggerJump]);

  // Virtual Analog Joystick Handlers (works for both Touch & Mouse!)
  const updateAnalogFromClientPoint = (clientX: number, clientY: number) => {
    const base = analogBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(maxR, dist);
    const angle = Math.atan2(dy, dx);
    const nx = dist > 5 ? (clampedDist / maxR) * Math.cos(angle) : 0;
    const ny = dist > 5 ? (clampedDist / maxR) * Math.sin(angle) : 0;
    analogVecRef.current = { x: nx, y: ny };
    setKnobOffset({ x: nx * maxR, y: ny * maxR });
    if (dist > 5) clickTargetRef.current = null;
  };

  const handleAnalogPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    analogPointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateAnalogFromClientPoint(e.clientX, e.clientY);
  };

  const handleAnalogPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (analogPointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    updateAnalogFromClientPoint(e.clientX, e.clientY);
  };

  const handleAnalogPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (analogPointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    analogPointerIdRef.current = null;
    analogVecRef.current = { x: 0, y: 0 };
    setKnobOffset({ x: 0, y: 0 });
  };

  // Main 60 fps Canvas Game Loop
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const targetW = Math.max(320, Math.floor(rect.width * dpr));
      const targetH = Math.max(240, Math.floor(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      const me = playersRef.current.get(selfIdRef.current) || null;
      const room: RoomId = me?.room || 'outdoor';
      const scale = rect.height / CAMERA_VIEW_HEIGHT;
      const visibleWorldW = rect.width / scale;

      // 1. Update local player movement & jump physics
      if (me && !activeModalRef.current && !isWorkingNow) {
        const keys = keysRef.current;
        let dx = analogVecRef.current.x;
        let dy = analogVecRef.current.y;

        if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
        if (keys.has('d') || keys.has('arrowright')) dx += 1;
        if (keys.has('w') || keys.has('arrowup')) dy -= 1;
        if (keys.has('s') || keys.has('arrowdown')) dy += 1;

        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && clickTargetRef.current) {
          const tdx = clickTargetRef.current.x - me.x;
          const tdy = clickTargetRef.current.y - me.y;
          const dist = Math.hypot(tdx, tdy);
          if (dist > 10) {
            dx = tdx / dist;
            dy = tdy / dist;
          } else {
            clickTargetRef.current = null;
          }
        }

        // Vertical jump physics (gravity = 1280 px/s^2)
        const prevZ = me.z || 0;
        if (me.z > 0 || jumpVelRef.current > 0) {
          me.z = Math.max(0, me.z + jumpVelRef.current * dt);
          jumpVelRef.current -= 1280 * dt;
          if (me.z <= 0) {
            me.z = 0;
            jumpVelRef.current = 0;
          }
        }

        const speedMult =
          room === 'outdoor' && me.activeVehicle ? VEHICLES[me.activeVehicle].speedMultiplier : 1;
        const speed = 225 * speedMult;
        const mag = Math.hypot(dx, dy);
        const moving = mag > 0.05;

        if (moving) {
          const norm = mag > 1 ? 1 / mag : 1;
          const vx = dx * norm;
          const vy = dy * norm;
          if (room === 'outdoor') {
            me.x = Math.max(70, Math.min(WORLD_WIDTH - 70, me.x + vx * speed * dt));
            me.y = Math.max(WALK_MIN_Y, Math.min(WALK_MAX_Y, me.y + vy * speed * 0.72 * dt));
          } else {
            me.x = Math.max(INTERIOR_MIN_X, Math.min(INTERIOR_MAX_X, me.x + vx * speed * dt));
            me.y = Math.max(INTERIOR_MIN_Y, Math.min(INTERIOR_MAX_Y, me.y + vy * speed * 0.78 * dt));
          }
          if (Math.abs(vx) > 0.05) {
            me.dir = vx < 0 ? 'left' : 'right';
          }
        }

        const wasMoving = me.moving;
        me.moving = moving;
        const airborneChanged = Math.abs(me.z - prevZ) > 0.5 || (prevZ > 0 && me.z === 0);

        if (((moving || airborneChanged) && now - lastMoveSentRef.current > 50) || (!moving && wasMoving)) {
          lastMoveSentRef.current = now;
          sendWs({
            type: 'player:move',
            x: Math.round(me.x),
            y: Math.round(me.y),
            z: Math.round(me.z),
            dir: me.dir,
            moving: me.moving,
          });
        }
      }

      // 2. Smoothly interpolate remote players
      for (const [id, target] of remoteTargetsRef.current.entries()) {
        const rp = playersRef.current.get(id);
        if (!rp) continue;
        rp.x += (target.x - rp.x) * Math.min(1, dt * 12);
        rp.y += (target.y - rp.y) * Math.min(1, dt * 12);
        rp.z += (target.z - rp.z) * Math.min(1, dt * 14);
      }

      // 3. Smooth 2D camera follow outdoors (X across 6200px, Y pans south down to Pantai Selatan!)
      if (me && room === 'outdoor') {
        const desiredCamX = Math.max(
          0,
          Math.min(Math.max(0, WORLD_WIDTH - visibleWorldW), me.x - visibleWorldW * 0.5)
        );
        cameraXRef.current += (desiredCamX - cameraXRef.current) * Math.min(1, dt * 7);

        const maxCamY = Math.max(0, WORLD_HEIGHT - CAMERA_VIEW_HEIGHT);
        const desiredCamY =
          me.y <= 645 ? 0 : Math.max(0, Math.min(maxCamY, (me.y - 645) * 1.35));
        cameraYRef.current += (desiredCamY - cameraYRef.current) * Math.min(1, dt * 7);
      }

      // 4. Detect nearest contextual interaction (outdoor OR interior!)
      let nextNearby: NearbyAction | null = null;
      if (me) {
        const candidates: { dist: number; action: NearbyAction }[] = [];

        if (room !== 'outdoor') {
          // Inside a building: check Exit Door + Indoor Workplace!
          const dExit = Math.hypot(me.x - INTERIOR_EXIT_X, me.y - INTERIOR_EXIT_Y);
          if (dExit < 120) {
            candidates.push({
              dist: dExit,
              action: {
                kind: 'exit_room',
                x: INTERIOR_EXIT_X,
                y: INTERIOR_EXIT_Y - 52,
                label: '[E] Keluar ke Kampung',
              },
            });
          }

          if (me.job && JOBS[me.job].workRoom === room) {
            const jobDef = JOBS[me.job];
            const dWork = Math.hypot(me.x - jobDef.workX, me.y - jobDef.workY);
            if (dWork < 165) {
              candidates.push({
                dist: dWork - 30,
                action: {
                  kind: 'work',
                  x: jobDef.workX,
                  y: jobDef.workY - 128,
                  label: `[E] ${jobDef.actionLabel} (+${formatRupiah(jobDef.salary)})`,
                },
              });
            }
          }
        } else {
          // OUTDOOR INTERACTIONS
          // Ojek Pickup / Dropoff (highest priority when riding ojek near target!)
          if (me.job === 'ojek' && me.ojekOrder) {
            const ord = me.ojekOrder;
            if (ord.stage === 'pickup') {
              const dPick = Math.hypot(me.x - ord.pickupX, me.y - ord.pickupY);
              if (dPick < 135) {
                candidates.push({
                  dist: dPick - 45,
                  action: {
                    kind: 'ojek',
                    x: ord.pickupX,
                    y: ord.pickupY - 130,
                    label: `[E] Jemput ${ord.passengerName}`,
                  },
                });
              }
            } else {
              const dDrop = Math.hypot(me.x - ord.dropoffX, me.y - ord.dropoffY);
              if (dDrop < 135) {
                candidates.push({
                  dist: dDrop - 45,
                  action: {
                    kind: 'ojek',
                    x: ord.dropoffX,
                    y: ord.dropoffY - 130,
                    label: `[E] Turunkan ${ord.passengerName} (+Rp 7.000)`,
                  },
                });
              }
            }
          }

          // Pak Kades NPC
          const dKades = Math.hypot(me.x - LANDMARKS.pakKades.x, me.y - LANDMARKS.pakKades.y);
          if (dKades < 115) {
            candidates.push({
              dist: dKades,
              action: {
                kind: 'kades',
                x: LANDMARKS.pakKades.x,
                y: LANDMARKS.pakKades.y - 156,
                label: me.job ? '[E] Ganti Pekerjaan (Pak Kades)' : '[E] Minta Pekerjaan ke Pak Kades',
              },
            });
          }

          // Outdoor Workplace (Kuli or Pedagang)
          if (me.job && me.job !== 'ojek' && JOBS[me.job].workRoom === 'outdoor') {
            const jobDef = JOBS[me.job];
            const dWork = Math.hypot(me.x - jobDef.workX, me.y - jobDef.workY);
            if (dWork < 140) {
              candidates.push({
                dist: dWork - 18,
                action: {
                  kind: 'work',
                  x: jobDef.workX,
                  y: jobDef.workY - 132,
                  label: `[E] ${jobDef.actionLabel} (+${formatRupiah(jobDef.salary)})`,
                },
              });
            }
          }

          // Enterable Public Buildings: Sekolah, Masjid, Gereja!
          const doors: { room: RoomId; x: number; y: number; label: string }[] = [
            { room: 'sekolah', x: LANDMARKS.sekolah.x, y: 445, label: '[E] Masuk ke Dalam Sekolah' },
            { room: 'masjid', x: LANDMARKS.masjid.x, y: 445, label: '[E] Masuk ke Dalam Masjid' },
            { room: 'gereja', x: LANDMARKS.gereja.x, y: 445, label: '[E] Masuk ke Dalam Gereja' },
          ];
          for (const d of doors) {
            const dist = Math.hypot(me.x - d.x, me.y - d.y);
            if (dist < 110) {
              candidates.push({
                dist,
                action: {
                  kind: 'enter_room',
                  targetRoom: d.room,
                  x: d.x,
                  y: 262,
                  label: d.label,
                },
              });
            }
          }

          // Garasi Kendaraan
          const dShow = Math.hypot(me.x - LANDMARKS.showroom.x, me.y - 460);
          if (dShow < 120) {
            candidates.push({
              dist: dShow,
              action: {
                kind: 'showroom',
                x: LANDMARKS.showroom.x,
                y: 266,
                label: '[E] Buka Garasi Kendaraan',
              },
            });
          }

          // Kucing Oranye
          const dCat = Math.hypot(me.x - LANDMARKS.kucing.x, me.y - LANDMARKS.kucing.y);
          if (dCat < 72) {
            candidates.push({
              dist: dCat + 22,
              action: {
                kind: 'cat',
                x: LANDMARKS.kucing.x,
                y: LANDMARKS.kucing.y - 54,
                label: '[E] Elus Kucing Oranye',
              },
            });
          }

          // 14 Housing Plots (empty -> build DP 100k; own built -> manage/enter; other's built -> enter!)
          for (const plot of HOUSE_PLOTS) {
            const dPlot = Math.hypot(me.x - plot.x, me.y - (plot.y + 18));
            if (dPlot < 95) {
              const existing = housesRef.current.find((h) => h.plotId === plot.plotId);
              if (!existing) {
                candidates.push({
                  dist: dPlot,
                  action: {
                    kind: 'plot',
                    plotId: plot.plotId,
                    x: plot.x,
                    y: plot.y - 80,
                    label: `[E] Bangun Rumah · DP Rp 100.000 (Kavling ${plot.plotId})`,
                  },
                });
              } else if (existing.ownerUsername.toLowerCase() === me.username.toLowerCase()) {
                candidates.push({
                  dist: dPlot,
                  action: {
                    kind: 'plot',
                    plotId: plot.plotId,
                    x: plot.x,
                    y: plot.y - 120,
                    label: `[E] Kelola / Masuk Rumahmu (Kavling ${plot.plotId})`,
                  },
                });
              } else {
                candidates.push({
                  dist: dPlot,
                  action: {
                    kind: 'enter_room',
                    targetRoom: `house_${plot.plotId}`,
                    x: plot.x,
                    y: plot.y - 120,
                    label: `[E] Masuk Rumah ${existing.ownerUsername}`,
                  },
                });
              }
            }
          }
        }

        candidates.sort((a, b) => a.dist - b.dist);
        if (candidates.length > 0) nextNearby = candidates[0].action;
      }

      if (
        nextNearby?.kind !== nearbyActionRef.current?.kind ||
        nextNearby?.plotId !== nearbyActionRef.current?.plotId ||
        nextNearby?.targetRoom !== nearbyActionRef.current?.targetRoom ||
        nextNearby?.label !== nearbyActionRef.current?.label
      ) {
        nearbyActionRef.current = nextNearby;
        setNearbyAction(nextNearby);
      }

      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => now - ft.createdAt < ft.duration);

      // 5. Render world or interior
      ctx.save();
      ctx.scale(dpr, dpr);
      const hint: RenderInteractionHint | null =
        nextNearby && !isWorkingNow
          ? { x: nextNearby.x, y: nextNearby.y, label: nextNearby.label }
          : null;

      renderKampungWorld(ctx, {
        now,
        room,
        cameraX: cameraXRef.current,
        cameraY: cameraYRef.current,
        viewportW: rect.width,
        viewportH: rect.height,
        players: Array.from(playersRef.current.values()),
        selfId: selfIdRef.current,
        houses: housesRef.current,
        ball: ballRef.current,
        totalRegistered: totalRegisteredRef.current,
        floatingTexts: floatingTextsRef.current,
        interactionHint: hint,
        workTarget: getWorkTargetForPlayer(me),
        catPetUntil: catPetUntilRef.current,
      });
      ctx.restore();

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [getWorkTargetForPlayer, isWorkingNow, phase, sendWs]);

  // Click / Tap on Canvas to walk (supports both Outdoor with cameraX+cameraY & Interior!)
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const me = playersRef.current.get(selfIdRef.current);
    if (!canvas || !me) return;

    const rect = canvas.getBoundingClientRect();
    const room = me.room || 'outdoor';

    if (room !== 'outdoor') {
      const scale = Math.min(rect.width / INTERIOR_WIDTH, rect.height / INTERIOR_HEIGHT);
      const offsetX = (rect.width - INTERIOR_WIDTH * scale) / 2;
      const offsetY = (rect.height - INTERIOR_HEIGHT * scale) / 2;
      const ix = (e.clientX - rect.left - offsetX) / scale;
      const iy = (e.clientY - rect.top - offsetY) / scale;
      clickTargetRef.current = {
        x: Math.max(INTERIOR_MIN_X, Math.min(INTERIOR_MAX_X, ix)),
        y: Math.max(INTERIOR_MIN_Y, Math.min(INTERIOR_MAX_Y, iy)),
      };
      return;
    }

    const scale = rect.height / CAMERA_VIEW_HEIGHT;
    const worldX = (e.clientX - rect.left) / scale + cameraXRef.current;
    const worldY = (e.clientY - rect.top) / scale + cameraYRef.current;

    if (
      Math.hypot(worldX - LANDMARKS.pakKades.x, worldY - (LANDMARKS.pakKades.y - 45)) < 60 &&
      Math.hypot(me.x - LANDMARKS.pakKades.x, me.y - LANDMARKS.pakKades.y) < 160
    ) {
      setActiveModal({ type: 'kades' });
      return;
    }

    if (
      Math.hypot(worldX - LANDMARKS.showroom.x, worldY - 375) < 90 &&
      Math.hypot(me.x - LANDMARKS.showroom.x, me.y - 460) < 180
    ) {
      setActiveModal({ type: 'showroom' });
      return;
    }

    clickTargetRef.current = {
      x: Math.max(70, Math.min(WORLD_WIDTH - 70, worldX)),
      y: Math.max(WALK_MIN_Y, Math.min(WALK_MAX_Y, worldY)),
    };
  };

  const handleSendChat = (e?: React.FormEvent, preset?: string) => {
    if (e) e.preventDefault();
    const text = (preset ?? chatInput).trim();
    if (!text) return;
    sendWs({ type: 'chat:send', text });
    if (!preset) setChatInput('');
  };

  const walkToLandmark = (x: number, y: number) => {
    const me = playersRef.current.get(selfIdRef.current);
    if (me && me.room !== 'outdoor') {
      sendWs({ type: 'room:exit' });
      setTimeout(() => {
        clickTargetRef.current = { x, y };
      }, 150);
    } else {
      clickTargetRef.current = { x, y };
    }
    setActiveModal(null);
  };

  // =========================================================================
  // TITLE / IG USERNAME ENTRY SCREEN
  // =========================================================================
  if (phase === 'TITLE') {
    const previewTag = normalizeIgUsername(usernameInput) || '@warga_baru';

    return (
      <div className="min-h-screen bg-[#0EA5E9] bg-gradient-to-b from-[#0EA5E9] via-[#38BDF8] to-[#22C55E] text-zinc-900">
        <header className="border-b-2 border-zinc-900/15 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-3.5">
            <span
              className="shrink-0 whitespace-nowrap text-lg font-extrabold tracking-tight text-zinc-900"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Kampung Amanah
            </span>

            <div className="hidden items-center gap-4 text-xs font-medium text-zinc-600 sm:flex">
              <span className="tabular-nums">{summary.onlineCount} Warga Online</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {summary.housesCount} / {summary.totalPlots} Rumah Berdiri
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{summary.totalRegistered} Penduduk</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/download/source-zip"
                download="kampung-amanah-game.zip"
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:bg-amber-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download Kode (.zip)
              </a>

              <button
                type="button"
                onClick={onOpenVideos}
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
              >
                <Film className="h-3.5 w-3.5" />
                Studio Video (Ep 1–3)
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto flex max-w-[1120px] flex-col items-center px-6 py-10 lg:py-14">
          <div className="grid w-full grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-2xl border-2 border-zinc-900 bg-white p-7 shadow-[6px_6px_0px_#18181B] lg:col-span-6">
              <div className="space-y-4">
                <p className="text-xs font-bold text-amber-700">Game Multiplayer 2D · Dunia Luas & Bisa Masuk Gedung</p>
                <h1
                  className="text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-4xl"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif", textWrap: 'balance' }}
                >
                  Minta Kerja ke Pak Kades, Masuk Kelas, Narik Ojek & Cicil Rumahmu
                </h1>
                <p className="text-sm leading-relaxed text-zinc-600">
                  Semua warga baru mulai dari <strong className="font-bold text-zinc-900">Rp 0</strong>. Minta
                  pekerjaan ke Pak Kades (Guru, Guru Ngaji, Kuli, Ojek, Penjaga Warung), masuk ke dalam Sekolah,
                  Masjid, Gereja, dan Rumah, kumpulkan uang, beli kendaraan, dan ketemu player lain secara live!
                </p>
              </div>

              <div className="my-6 flex items-end justify-center gap-8 rounded-xl border-2 border-zinc-900 bg-gradient-to-b from-[#38BDF8] via-[#BAE6FD] to-[#22C55E] px-6 pb-4 pt-6">
                <div className="flex flex-col items-center">
                  <span className="mb-1 rounded-md border-2 border-zinc-900 bg-[#FACC15] px-2.5 py-0.5 text-[11px] font-extrabold text-zinc-900">
                    PAK KADES
                  </span>
                  <svg viewBox="-120 -420 240 880" className="h-44 w-28">
                    <PakKades frame={12} x={0} y={0} pose="invite" mouthOpen={0} mouthVowel="closed" scale={0.95} />
                  </svg>
                </div>

                <div className="flex flex-col items-center">
                  <span className="mb-2 rounded-md border-2 border-zinc-900 bg-[#FEF08A] px-2.5 py-0.5 text-xs font-extrabold text-zinc-900">
                    {previewTag}
                  </span>
                  <svg viewBox="-50 -105 100 120" className="h-36 w-28">
                    <ellipse cx={0} cy={8} rx={22} ry={6} fill="#18181B" opacity={0.25} />
                    <rect x={-12} y={-24} width={10} height={28} rx={3} fill="#1E293B" stroke="#18181B" strokeWidth={2.6} />
                    <rect x={2} y={-24} width={10} height={28} rx={3} fill="#1E293B" stroke="#18181B" strokeWidth={2.6} />
                    <rect x={-16} y={-58} width={32} height={36} rx={7} fill={shirtColor} stroke="#18181B" strokeWidth={2.8} />
                    {hairStyle === 'hijab' && (
                      <ellipse cx={0} cy={-74} rx={19} ry={21} fill={hairColor} stroke="#18181B" strokeWidth={2.8} />
                    )}
                    <ellipse cx={0} cy={-76} rx={15} ry={16.5} fill="#E5AE86" stroke="#18181B" strokeWidth={2.8} />
                    {hairStyle !== 'hijab' && (
                      <path d="M -15 -80 A 15 15 0 0 1 15 -80 Z" fill={hairColor} stroke="#18181B" strokeWidth={2.6} />
                    )}
                    <circle cx={-5} cy={-77} r={2.4} fill="#18181B" />
                    <circle cx={5} cy={-77} r={2.4} fill="#18181B" />
                    <path d="M -5 -70 Q 0 -65 5 -70" stroke="#18181B" strokeWidth={2.2} fill="none" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-700 sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-100 p-2.5">
                  <p className="font-bold text-zinc-900">5 Pekerjaan</p>
                  <p className="mt-0.5 text-zinc-600">Guru, Ngaji, Kuli, Ojek, Warung</p>
                </div>
                <div className="rounded-lg bg-zinc-100 p-2.5">
                  <p className="font-bold text-zinc-900">Masuk Gedung</p>
                  <p className="mt-0.5 text-zinc-600">Sekolah, Masjid, Gereja & Rumah</p>
                </div>
                <div className="rounded-lg bg-zinc-100 p-2.5">
                  <p className="font-bold text-zinc-900">Cicil Rumah</p>
                  <p className="mt-0.5 text-zinc-600">DP 100rb + 150rb/bulan</p>
                </div>
                <div className="rounded-lg bg-zinc-100 p-2.5">
                  <p className="font-bold text-zinc-900">Analog & Lompat</p>
                  <p className="mt-0.5 text-zinc-600">Joystick, Space & Klik Tanah</p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleJoinSubmit}
              className="flex flex-col justify-between rounded-2xl border-2 border-zinc-900 bg-white p-7 shadow-[6px_6px_0px_#18181B] lg:col-span-6"
            >
              <div className="space-y-6">
                <div>
                  <h2
                    className="text-xl font-extrabold text-zinc-900"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Daftar Warga Baru
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Username IG akan tampil di atas kepala karaktermu dan terlihat oleh semua warga online.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="ig-username" className="block text-xs font-bold text-zinc-800">
                    Username Instagram
                  </label>
                  <div className="flex items-center overflow-hidden rounded-xl border-2 border-zinc-900 bg-zinc-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-400">
                    <span className="select-none pl-4 text-base font-extrabold text-zinc-500">@</span>
                    <input
                      id="ig-username"
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value.replace(/^@+/, ''))}
                      placeholder="contoh: virgod29"
                      maxLength={22}
                      autoFocus
                      className="w-full bg-transparent px-2 py-3 text-base font-bold text-zinc-900 outline-none placeholder:font-normal placeholder:text-zinc-400"
                    />
                  </div>
                  {entryError && <p className="text-xs font-semibold text-red-600">{entryError}</p>}
                  {savedPreview && (
                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
                      Data tersimpan ditemukan: <strong className="font-mono">{formatRupiah(savedPreview.money)}</strong>
                      {savedPreview.job ? ` · ${savedPreview.job}` : ''} — lanjut main tanpa reset dari 0!
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-bold text-zinc-800">Warna Baju</span>
                  <div className="flex flex-wrap gap-2">
                    {SHIRT_PRESETS.map((s) => (
                      <button
                        key={s.hex}
                        type="button"
                        onClick={() => setShirtColor(s.hex)}
                        aria-label={s.name}
                        className={`h-9 w-9 rounded-lg border-2 transition-transform ${
                          shirtColor === s.hex
                            ? 'scale-110 border-zinc-900 ring-2 ring-amber-400'
                            : 'border-zinc-900/40 hover:scale-105'
                        }`}
                        style={{ backgroundColor: s.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-bold text-zinc-800">Gaya Rambut / Hijab</span>
                  <div className="grid grid-cols-5 gap-2">
                    {HAIR_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setHairStyle(opt.id);
                          setHairColor(opt.defaultColor);
                        }}
                        className={`rounded-lg border-2 px-2 py-2 text-xs font-bold transition-colors ${
                          hairStyle === opt.id
                            ? 'border-zinc-900 bg-[#FACC15] text-zinc-950'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {hairStyle === 'hijab' && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-zinc-500">Warna hijab:</span>
                      {HIJAB_COLORS.map((hc) => (
                        <button
                          key={hc}
                          type="button"
                          onClick={() => setHairColor(hc)}
                          className={`h-6 w-6 rounded-md border-2 ${
                            hairColor === hc ? 'border-zinc-900 scale-110' : 'border-zinc-300'
                          }`}
                          style={{ backgroundColor: hc }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  type="submit"
                  className="w-full rounded-xl border-2 border-zinc-900 bg-[#FACC15] px-5 py-3.5 text-base font-extrabold text-zinc-950 shadow-[3px_3px_0px_#18181B] transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Masuk Kampung Amanah
                </button>
                <p className="text-center text-xs text-zinc-500">
                  Kontrol: Analog / WASD / Panah · Space = Lompat · E = Interaksi · V = Kendaraan
                </p>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // ACTIVE MULTIPLAYER GAME VIEWPORT
  // =========================================================================
  const activeRoom: RoomId = selfPlayer?.room || 'outdoor';
  const activeJobDef = selfPlayer?.job && JOBS[selfPlayer.job] ? JOBS[selfPlayer.job] : null;
  const activeVehicleDef = selfPlayer?.activeVehicle ? VEHICLES[selfPlayer.activeVehicle] : null;
  const currentPlotHouse =
    activeModal?.type === 'build'
      ? houses.find((h) => h.plotId === activeModal.plotId) || null
      : null;
  const hasAnyVehicle =
    (selfPlayer?.ownedVehicles.length || 0) > 0 || selfPlayer?.job === 'ojek';

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#0EA5E9] select-none">
      {/* Compact Unobtrusive Top HUD */}
      <header className="z-20 flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-900 bg-white px-4 py-2.5">
        <div className="flex items-center gap-4">
          <span
            className="shrink-0 whitespace-nowrap text-base font-extrabold tracking-tight text-zinc-900"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Kampung Amanah
          </span>

          <div className="flex items-center gap-3 text-xs font-semibold text-zinc-700">
            <span className="font-extrabold text-zinc-950">{selfPlayer?.username || '...'}</span>
            <span aria-hidden="true" className="text-zinc-300">·</span>
            <span className="font-mono text-sm font-extrabold tabular-nums text-emerald-700">
              {formatRupiah(selfPlayer?.money ?? 0)}
            </span>
            <span aria-hidden="true" className="hidden text-zinc-300 sm:inline">·</span>
            <span className="hidden text-zinc-600 sm:inline">
              {activeJobDef ? `${activeJobDef.title}` : 'Belum bekerja (Temui Pak Kades)'}
            </span>
            {activeRoom !== 'outdoor' && (
              <>
                <span aria-hidden="true" className="hidden text-zinc-300 md:inline">·</span>
                <span className="hidden font-bold text-amber-700 md:inline">
                  {getRoomDisplayName(activeRoom, houses)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveModal({ type: 'players' })}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="tabular-nums">{onlinePlayers.length} Online</span>
          </button>

          {activeRoom === 'outdoor' ? (
            <button
              type="button"
              onClick={() => {
                if (!hasAnyVehicle) {
                  walkToLandmark(LANDMARKS.showroom.x, 480);
                  showToast('Menuju Garasi Kendaraan untuk membeli kendaraan.');
                } else {
                  sendWs({ type: 'vehicle:toggle' });
                }
              }}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                activeVehicleDef
                  ? 'border-zinc-900 bg-[#FACC15] text-zinc-950'
                  : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50'
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              <span>
                {activeVehicleDef
                  ? `Turun ${activeVehicleDef.name}`
                  : hasAnyVehicle
                  ? 'Naik Kendaraan (V)'
                  : 'Garasi'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendWs({ type: 'room:exit' })}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border-2 border-zinc-900 bg-[#FACC15] px-3 py-1.5 text-xs font-extrabold text-zinc-950 hover:bg-[#EAB308]"
            >
              <DoorOpen className="h-3.5 w-3.5" />
              Keluar ke Kampung
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              gameSound.muted = next;
            }}
            aria-label={muted ? 'Aktifkan Suara' : 'Matikan Suara'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenVideos}
            className="hidden items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 md:inline-flex"
          >
            <Film className="h-3.5 w-3.5" />
            Video
          </button>

          <button
            type="button"
            onClick={handleLeaveGame}
            aria-label="Keluar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Live Canvas Stage */}
      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          className="h-full w-full cursor-pointer touch-none"
        />

        {/* Quick Destination Shortcut Strip (Top Left) */}
        <div className="pointer-events-auto absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          {[
            { label: 'Warung', x: LANDMARKS.warung.x, y: 500 },
            { label: 'Ojek', x: LANDMARKS.pangkalanOjek.x, y: 520 },
            { label: 'Garasi', x: LANDMARKS.showroom.x, y: 505 },
            { label: 'Pak Kades', x: LANDMARKS.pakKades.x, y: 505 },
            { label: 'Sekolah', x: LANDMARKS.sekolah.x, y: 470 },
            { label: 'Masjid', x: LANDMARKS.masjid.x, y: 470 },
            { label: 'Gereja', x: LANDMARKS.gereja.x, y: 470 },
            { label: 'Lapangan', x: LANDMARKS.lapangan.x, y: 495 },
            { label: 'Proyek Kuli', x: LANDMARKS.proyekKuli.x, y: 495 },
            { label: 'Perumahan', x: 5050, y: 525 },
            { label: 'Pantai', x: LANDMARKS.pantai.x, y: LANDMARKS.pantai.y },
          ].map((dest) => (
            <button
              key={dest.label}
              type="button"
              onClick={() => walkToLandmark(dest.x, dest.y)}
              className="rounded-lg border-2 border-zinc-900 bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-zinc-900 shadow-sm transition-colors hover:bg-[#FEF08A]"
            >
              {dest.label}
            </button>
          ))}
        </div>

        {/* Active Ojek Order Guidance Card (Top Right) */}
        {selfPlayer?.job === 'ojek' && selfPlayer.ojekOrder && (
          <div className="pointer-events-auto absolute right-3 top-3 w-64 rounded-xl border-2 border-zinc-900 bg-white/95 p-3 shadow-[4px_4px_0px_#18181B]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold text-emerald-700">
                {selfPlayer.ojekOrder.stage === 'pickup' ? 'ORDER OJEK · JEMPUT' : 'ANTAR PENUMPANG'}
              </span>
              <span className="font-mono text-[11px] font-extrabold tabular-nums text-zinc-900">
                Rp 7.000
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-zinc-900">
              {selfPlayer.ojekOrder.stage === 'pickup'
                ? `Jemput ${selfPlayer.ojekOrder.passengerName} di ${selfPlayer.ojekOrder.pickupName}`
                : `Antar ${selfPlayer.ojekOrder.passengerName} ke ${selfPlayer.ojekOrder.dropoffName}`}
            </p>
            <button
              type="button"
              onClick={() => {
                const ord = selfPlayer.ojekOrder!;
                if (ord.stage === 'pickup') walkToLandmark(ord.pickupX, ord.pickupY);
                else walkToLandmark(ord.dropoffX, ord.dropoffY);
              }}
              className="mt-2 w-full rounded-lg border-2 border-zinc-900 bg-[#4ADE80] py-1 text-[11px] font-extrabold text-zinc-950 hover:bg-[#22C55E]"
            >
              Arahkan Motor ke Lokasi
            </button>
          </div>
        )}

        {!wsConnected && (
          <div className="absolute right-3 top-3 rounded-lg border-2 border-zinc-900 bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-950">
            Menghubungkan ulang...
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div
            className={`absolute left-1/2 top-14 z-20 max-w-md -translate-x-1/2 rounded-xl border-2 border-zinc-900 px-4 py-2 text-center text-xs font-bold shadow-[3px_3px_0px_#18181B] ${
              toast.kind === 'error' ? 'bg-red-100 text-red-950' : 'bg-[#FEF08A] text-zinc-950'
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* Live Work Progress Banner (Top-right so chalkboard, mihrab & teaching visuals stay 100% unobstructed!) */}
        {isWorkingNow && activeJobDef && (
          <div className="absolute right-3 top-3 z-20 w-64 rounded-xl border-2 border-zinc-900 bg-white/95 px-3.5 py-2.5 text-center shadow-[4px_4px_0px_#18181B]">
            <p className="text-xs font-extrabold text-zinc-900">{activeJobDef.actionLabel}...</p>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-100">
              <div
                className="h-full bg-[#22C55E] transition-all duration-75"
                style={{ width: `${workProgress}%` }}
              />
            </div>
            <p className="mt-1 font-mono text-xs font-extrabold tabular-nums text-emerald-700">
              +{formatRupiah(activeJobDef.salary)}
            </p>
          </div>
        )}

        {/* ================================================================= */}
        {/* BOTTOM CONTROLS: ANALOG JOYSTICK (LEFT) + CHAT (CENTER) + JUMP/ACT (RIGHT) */}
        {/* ================================================================= */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-end justify-between gap-3 px-4">
          {/* Left: Virtual Analog Joystick */}
          <div className="pointer-events-auto flex items-end gap-3">
            <div
              ref={analogBaseRef}
              onPointerDown={handleAnalogPointerDown}
              onPointerMove={handleAnalogPointerMove}
              onPointerUp={handleAnalogPointerUp}
              onPointerCancel={handleAnalogPointerUp}
              aria-label="Analog Gerak"
              className="relative flex h-24 w-24 shrink-0 cursor-grab touch-none items-center justify-center rounded-full border-2 border-zinc-900 bg-white/75 shadow-[4px_4px_0px_#18181B] backdrop-blur-sm active:cursor-grabbing"
            >
              <div className="pointer-events-none absolute inset-2.5 rounded-full border border-dashed border-zinc-900/25" />
              <div
                className="pointer-events-none flex h-11 w-11 items-center justify-center rounded-full border-2 border-zinc-900 bg-[#FACC15] shadow-sm"
                style={{
                  transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
                }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-900/40" />
              </div>
            </div>
          </div>

          {/* Center: Compact Chat Bar (Desktop/Tablet) */}
          <div className="pointer-events-auto hidden w-full max-w-sm flex-col gap-1 md:flex">
            <div className="flex flex-wrap justify-center gap-1">
              {QUICK_CHATS.map((qc) => (
                <button
                  key={qc}
                  type="button"
                  onClick={() => handleSendChat(undefined, qc)}
                  className="rounded-md border border-zinc-900/40 bg-white/90 px-2 py-0.5 text-[11px] font-bold text-zinc-800 hover:bg-[#FEF08A]"
                >
                  {qc}
                </button>
              ))}
            </div>
            <form
              onSubmit={handleSendChat}
              className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-900 bg-white p-1 shadow-[3px_3px_0px_#18181B]"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Sapa warga lain..."
                maxLength={72}
                className="min-w-0 flex-1 bg-transparent px-2.5 py-1 text-xs font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
              />
              <button
                type="submit"
                aria-label="Kirim Pesan"
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white hover:bg-zinc-800"
              >
                <Send className="h-3.5 w-3.5" />
                Kirim
              </button>
            </form>
          </div>

          {/* Right: Contextual Action Button + Horn + JUMP BUTTON! */}
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            {nearbyAction && !isWorkingNow && (
              <button
                type="button"
                onClick={triggerInteraction}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border-2 border-zinc-900 bg-[#FACC15] px-4 py-2.5 text-xs font-extrabold text-zinc-950 shadow-[4px_4px_0px_#18181B] transition-transform hover:-translate-y-0.5"
              >
                {nearbyAction.kind === 'kades' && <Briefcase className="h-4 w-4" />}
                {nearbyAction.kind === 'showroom' && <Car className="h-4 w-4" />}
                {nearbyAction.kind === 'plot' && <Home className="h-4 w-4" />}
                {(nearbyAction.kind === 'enter_room' || nearbyAction.kind === 'exit_room') && (
                  <DoorOpen className="h-4 w-4" />
                )}
                <span>{nearbyAction.label.replace(/^\[E\]\s*/, '')}</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              {activeVehicleDef && activeRoom === 'outdoor' && (
                <button
                  type="button"
                  onClick={() => {
                    const me = playersRef.current.get(selfIdRef.current);
                    if (me) {
                      gameSound.playHorn(activeVehicleDef.id === 'bus_oranye');
                      addFloatingText(
                        me.x,
                        me.y - 115,
                        activeVehicleDef.id === 'bus_oranye' ? 'TELOLET!' : 'TIN TIN!',
                        '#38BDF8'
                      );
                    }
                  }}
                  className="h-12 rounded-xl border-2 border-zinc-900 bg-white px-3.5 text-xs font-extrabold text-zinc-900 shadow-[3px_3px_0px_#18181B] hover:bg-zinc-50"
                >
                  Klakson
                </button>
              )}

              {/* Dedicated Jump Button (Tombol Lompat!) */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  triggerJump();
                }}
                aria-label="Lompat"
                className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-zinc-900 bg-white text-zinc-950 shadow-[4px_4px_0px_#18181B] transition-transform active:translate-y-0.5 active:bg-[#FEF08A]"
              >
                <ArrowUp className="h-5 w-5 stroke-[2.8]" />
                <span className="text-[10px] font-extrabold leading-none">Lompat</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: DIALOG PAK KADES (5 PEKERJAAN & GAJI BARU)                 */}
      {/* =================================================================== */}
      {activeModal?.type === 'kades' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-zinc-900 bg-white p-6 shadow-[8px_8px_0px_#18181B]">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-zinc-900 bg-[#BAE6FD]">
                  <svg viewBox="-105 -420 210 340" className="h-16 w-16">
                    <PakKades frame={10} x={0} y={0} pose="present" mouthOpen={0.45} mouthVowel="ah" scale={1.0} />
                  </svg>
                </div>
                <div>
                  <h2
                    className="text-xl font-extrabold text-zinc-900"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Pak Kades — Balai Kerja Kampung
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    “Halo {selfPlayer?.username}! Pilih pekerjaan yang cocok buat kamu. Gaji langsung cair biar
                    bisa cicil rumah (DP Rp 100.000) & beli kendaraan!”
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Tutup"
                className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {JOB_LIST.map((job) => {
                const isCurrent = selfPlayer?.job === job.id;
                return (
                  <div
                    key={job.id}
                    className={`flex flex-col justify-between rounded-xl border-2 p-4 ${
                      isCurrent ? 'border-zinc-900 bg-amber-50' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-extrabold text-zinc-900">{job.title}</h3>
                        <span className="shrink-0 whitespace-nowrap font-mono text-xs font-extrabold tabular-nums text-emerald-700">
                          {formatRupiah(job.salary)}/{job.salaryUnit.replace('per ', '')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-zinc-500">Lokasi: {job.workplaceName}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{job.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sendWs({ type: 'job:select', jobId: job.id });
                        gameSound.playPop();
                        setActiveModal(null);
                      }}
                      className={`mt-4 w-full rounded-lg border-2 border-zinc-900 px-3 py-2 text-xs font-extrabold transition-colors ${
                        isCurrent ? 'bg-zinc-900 text-white' : 'bg-[#FACC15] text-zinc-950 hover:bg-[#EAB308]'
                      }`}
                    >
                      {isCurrent ? 'Pekerjaan Aktif' : 'Pilih Pekerjaan Ini'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: GARASI / SHOWROOM KENDARAAN                                */}
      {/* =================================================================== */}
      {activeModal?.type === 'showroom' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border-2 border-zinc-900 bg-white p-6 shadow-[8px_8px_0px_#18181B]">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <h2
                  className="text-xl font-extrabold text-zinc-900"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Garasi Kendaraan Kampung
                </h2>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Saldo kamu:{' '}
                  <strong className="font-mono font-extrabold tabular-nums text-emerald-700">
                    {formatRupiah(selfPlayer?.money ?? 0)}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Tutup"
                className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {PURCHASABLE_VEHICLES.map((veh) => {
                const owned = selfPlayer?.ownedVehicles.includes(veh.id) ?? false;
                const active = selfPlayer?.activeVehicle === veh.id;
                const canAfford = (selfPlayer?.money ?? 0) >= veh.price;
                return (
                  <div
                    key={veh.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border-2 border-zinc-200 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3.5 w-3.5 rounded-sm border border-zinc-900"
                          style={{ backgroundColor: veh.color }}
                        />
                        <h3 className="text-sm font-extrabold text-zinc-900">{veh.name}</h3>
                        <span className="font-mono text-xs text-zinc-500">
                          {veh.speedMultiplier.toFixed(1)}x cepat
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600">{veh.description}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {!owned && (
                        <span className="font-mono text-xs font-extrabold tabular-nums text-zinc-900">
                          {formatRupiah(veh.price)}
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={!owned && !canAfford}
                        onClick={() => {
                          if (owned) {
                            sendWs({
                              type: 'vehicle:toggle',
                              vehicleId: active ? null : veh.id,
                            });
                          } else {
                            sendWs({ type: 'vehicle:buy', vehicleId: veh.id });
                            gameSound.playCoin();
                          }
                          setActiveModal(null);
                        }}
                        className={`rounded-lg border-2 border-zinc-900 px-3.5 py-2 text-xs font-extrabold disabled:opacity-40 ${
                          active
                            ? 'bg-zinc-900 text-white'
                            : owned
                            ? 'bg-emerald-400 text-zinc-950'
                            : 'bg-[#FACC15] text-zinc-950'
                        }`}
                      >
                        {active ? 'Turun' : owned ? 'Pakai' : 'Beli'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: BANGUN RUMAH (DP Rp 100.000 + CICILAN Rp 150.000/BULAN)    */}
      {/* =================================================================== */}
      {activeModal?.type === 'build' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border-2 border-zinc-900 bg-white p-6 shadow-[8px_8px_0px_#18181B]">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <h2
                  className="text-xl font-extrabold text-zinc-900"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {currentPlotHouse
                    ? `Rumahmu · Kavling ${activeModal.plotId}`
                    : `Bangun Rumah · Kavling ${activeModal.plotId}`}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Saldo kamu:{' '}
                  <strong className="font-mono font-extrabold tabular-nums text-emerald-700">
                    {formatRupiah(selfPlayer?.money ?? 0)}
                  </strong>
                  {' · '}DP awal <strong>{formatRupiah(HOUSE_DOWN_PAYMENT)}</strong> + cicilan{' '}
                  <strong>{formatRupiah(HOUSE_MONTHLY_INSTALLMENT)}/bulan</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Tutup"
                className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* If house is already built & owned by self: Enter House + Pay Monthly Installment! */}
            {currentPlotHouse && (
              <div className="mt-4 space-y-3 rounded-xl border-2 border-zinc-900 bg-amber-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-zinc-900">
                      Status Cicilan Rumah ({currentPlotHouse.monthsPaid} / {currentPlotHouse.totalMonths} bulan)
                    </p>
                    <p className="text-xs text-zinc-600">
                      {currentPlotHouse.monthsPaid >= currentPlotHouse.totalMonths
                        ? 'Selamat! Rumah ini sudah LUNAS 100%.'
                        : `Sisa ${currentPlotHouse.totalMonths - currentPlotHouse.monthsPaid} bulan × ${formatRupiah(
                            currentPlotHouse.monthlyInstallment
                          )}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sendWs({ type: 'room:enter', room: `house_${currentPlotHouse.plotId}` });
                        setActiveModal(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-zinc-900 bg-white px-3.5 py-2 text-xs font-extrabold text-zinc-900 hover:bg-zinc-100"
                    >
                      <DoorOpen className="h-3.5 w-3.5" />
                      Masuk ke Dalam Rumah
                    </button>

                    {currentPlotHouse.monthsPaid < currentPlotHouse.totalMonths && (
                      <button
                        type="button"
                        disabled={(selfPlayer?.money ?? 0) < currentPlotHouse.monthlyInstallment}
                        onClick={() => {
                          sendWs({ type: 'house:pay_installment', plotId: currentPlotHouse.plotId });
                        }}
                        className="rounded-lg border-2 border-zinc-900 bg-[#22C55E] px-3.5 py-2 text-xs font-extrabold text-zinc-950 disabled:opacity-40"
                      >
                        Bayar Cicilan ({formatRupiah(currentPlotHouse.monthlyInstallment)})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <span className="block text-xs font-bold text-zinc-800">Pilih Warna Atap Rumah</span>
              <div className="flex flex-wrap gap-2">
                {ROOF_PRESETS.map((r) => (
                  <button
                    key={r.hex}
                    type="button"
                    onClick={() => setSelectedRoofColor(r.hex)}
                    className={`inline-flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-xs font-bold ${
                      selectedRoofColor === r.hex
                        ? 'border-zinc-900 bg-amber-50 text-zinc-900'
                        : 'border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-sm border border-zinc-900"
                      style={{ backgroundColor: r.hex }}
                    />
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {HOUSE_TIER_LIST.map((tier) => {
                const canAffordDp = currentPlotHouse ? true : (selfPlayer?.money ?? 0) >= tier.downPayment;
                return (
                  <div
                    key={tier.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border-2 border-zinc-200 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-900">{tier.name}</h3>
                      <p className="mt-0.5 text-xs text-zinc-600">{tier.description}</p>
                      <p className="mt-1 font-mono text-[11px] font-bold text-emerald-700">
                        DP {formatRupiah(tier.downPayment)} · Cicilan {formatRupiah(tier.monthlyInstallment)}/bln ×{' '}
                        {tier.totalMonths} bln
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canAffordDp}
                      onClick={() => {
                        sendWs({
                          type: 'house:build',
                          plotId: activeModal.plotId,
                          tier: tier.id as HouseTierId,
                          roofColor: selectedRoofColor,
                        });
                        setActiveModal(null);
                      }}
                      className="shrink-0 whitespace-nowrap rounded-lg border-2 border-zinc-900 bg-[#FACC15] px-4 py-2 text-xs font-extrabold text-zinc-950 disabled:opacity-40"
                    >
                      {currentPlotHouse ? 'Ubah Model / Atap' : 'Bangun (DP 100rb)'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: DAFTAR WARGA ONLINE                                        */}
      {/* =================================================================== */}
      {activeModal?.type === 'players' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-zinc-900 bg-white p-6 shadow-[8px_8px_0px_#18181B]">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h2
                  className="text-lg font-extrabold text-zinc-900"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Warga Online Sekarang ({onlinePlayers.length})
                </h2>
                <p className="text-xs text-zinc-500">
                  Buka tab lain atau bagikan link agar temanmu bisa bertemu langsung di kampung atau dalam gedung.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Tutup"
                className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-zinc-100">
              {onlinePlayers.map((p) => {
                const isMe = p.id === selfPlayer?.id;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-4 w-4 rounded-sm border border-zinc-900"
                        style={{ backgroundColor: p.shirtColor }}
                      />
                      <div>
                        <p className="text-xs font-extrabold text-zinc-900">
                          {p.username} {isMe ? '(Kamu)' : ''}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {p.job && JOBS[p.job] ? JOBS[p.job].title : 'Belum bekerja'} · {formatRupiah(p.money)} ·{' '}
                          {p.room === 'outdoor' ? 'Di Kampung' : getRoomDisplayName(p.room, houses)}
                        </p>
                      </div>
                    </div>
                    {!isMe && p.room === 'outdoor' && (
                      <button
                        type="button"
                        onClick={() => walkToLandmark(p.x, p.y)}
                        className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-bold text-zinc-800 hover:bg-amber-50"
                      >
                        Samperin
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
