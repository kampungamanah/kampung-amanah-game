export const WORLD_WIDTH = 6200;
export const CAMERA_VIEW_HEIGHT = 760;
export const WORLD_HEIGHT = 1760;

export const INTERIOR_WIDTH = 1120;
export const INTERIOR_HEIGHT = 760;

// Walkable vertical band outdoors (upper village meadow, road, lush southern woods, down to sandy beach!)
export const WALK_MIN_Y = 395;
export const WALK_MAX_Y = 1532;
export const ROAD_TOP_Y = 530;
export const ROAD_BOTTOM_Y = 635;
export const BEACH_SAND_Y = 1195;
export const OCEAN_SHORE_Y = 1530;

// Walkable band inside interiors
export const INTERIOR_MIN_X = 110;
export const INTERIOR_MAX_X = 1010;
export const INTERIOR_MIN_Y = 420;
export const INTERIOR_MAX_Y = 602;
export const INTERIOR_EXIT_X = 560;
export const INTERIOR_EXIT_Y = 588;

export type RoomId = 'outdoor' | 'sekolah' | 'masjid' | 'gereja' | `house_${number}`;

export type HairStyle = 'fade' | 'spiky' | 'swept' | 'curly' | 'hijab';

export type JobId = 'guru' | 'guru_ngaji' | 'kuli' | 'ojek' | 'pedagang';

export type VehicleId = 'ojek_motor' | 'sepeda' | 'motor' | 'pikap' | 'bus_oranye';

export type HouseTierId = 'sederhana' | 'tingkat' | 'juragan';

export interface JobDefinition {
  id: JobId;
  title: string;
  workplaceName: string;
  description: string;
  salary: number;
  salaryUnit: string;
  workRoom: RoomId;
  workX: number;
  workY: number;
  badgeColor: string;
  actionLabel: string;
  kadesQuote: string;
}

export interface VehicleDefinition {
  id: VehicleId;
  name: string;
  price: number;
  speedMultiplier: number;
  description: string;
  color: string;
  jobOnly?: boolean;
}

export interface HouseTierDefinition {
  id: HouseTierId;
  name: string;
  downPayment: number; // Biaya awal Rp 100.000
  monthlyInstallment: number; // Cicilan Rp 150.000 / bulan
  totalMonths: number;
  description: string;
}

export interface HousePlot {
  plotId: number;
  x: number;
  y: number;
  label: string;
}

export interface BuiltHouse {
  plotId: number;
  ownerUsername: string;
  tier: HouseTierId;
  roofColor: string;
  builtAt: number;
  downPayment: number;
  monthlyInstallment: number;
  monthsPaid: number;
  totalMonths: number;
}

export interface OjekOrderState {
  id: string;
  stage: 'pickup' | 'dropoff';
  passengerName: string;
  passengerShirt: string;
  pickupName: string;
  pickupX: number;
  pickupY: number;
  dropoffName: string;
  dropoffX: number;
  dropoffY: number;
}

export interface PlayerState {
  id: string;
  username: string; // always starts with @
  room: RoomId;
  x: number;
  y: number;
  z: number; // jump height in px >= 0
  dir: 'left' | 'right';
  moving: boolean;
  shirtColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  job: JobId | null;
  money: number;
  ownedVehicles: VehicleId[];
  activeVehicle: VehicleId | null;
  workingUntil: number;
  chatText?: string;
  chatUntil?: number;
  ojekOrder?: OjekOrderState | null;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface IgFollowerSyncState {
  username: string; // without @ or with @ normalized
  followers: number;
  source: 'instagram_live' | 'instagram_api' | 'manual' | 'default';
  lastSyncedAt: number;
}

export interface ClientBackupProfile {
  username: string;
  money: number;
  job: JobId | null;
  ownedVehicles: VehicleId[];
  activeVehicle: VehicleId | null;
  lastX: number;
  lastY: number;
  updatedAt: number;
}

export interface WorldSnapshot {
  selfId: string;
  players: PlayerState[];
  houses: BuiltHouse[];
  ball: BallState;
  totalRegistered: number;
  igSync: IgFollowerSyncState;
}

export const SHIRT_PRESETS = [
  { name: 'Merah', hex: '#EF4444' },
  { name: 'Biru', hex: '#2563EB' },
  { name: 'Hijau', hex: '#16A34A' },
  { name: 'Oranye', hex: '#EA580C' },
  { name: 'Ungu', hex: '#7C3AED' },
  { name: 'Toska', hex: '#0D9488' },
  { name: 'Kuning', hex: '#CA8A04' },
  { name: 'Hitam', hex: '#27272A' },
];

export const ROOF_PRESETS = [
  { name: 'Genteng Merah', hex: '#DC2626' },
  { name: 'Oranye Bata', hex: '#EA580C' },
  { name: 'Biru Langit', hex: '#2563EB' },
  { name: 'Hijau Daun', hex: '#16A34A' },
  { name: 'Ungu Manis', hex: '#7C3AED' },
];

export const LANDMARKS = {
  warung: { x: 480, y: 420, name: 'Warung Kampung' },
  pangkalanOjek: { x: 890, y: 460, name: 'Pangkalan Ojek' },
  showroom: { x: 1280, y: 420, name: 'Garasi Kendaraan' },
  flag: { x: 1620, y: 430, name: 'Tiang Bendera' },
  pakKades: { x: 1760, y: 465, name: 'Pak Kades' },
  kucing: { x: 1855, y: 492, name: 'Kucing Oranye' },
  papan: { x: 1935, y: 426, name: 'Papan Penduduk' },
  sekolah: { x: 2280, y: 415, name: 'Sekolah' },
  masjid: { x: 2700, y: 415, name: 'Masjid' },
  gereja: { x: 3110, y: 415, name: 'Gereja' },
  lapangan: { x: 3740, y: 430, name: 'Lapangan Bola' },
  proyekKuli: { x: 4440, y: 445, name: 'Area Proyek Kuli' },
  pantai: { x: 1760, y: 1410, name: 'Pantai Selatan' },
  perumahanStart: 4660,
};

export const OJEK_STOPS = [
  { name: 'Warung Kampung', x: 480, y: 548 },
  { name: 'Pangkalan Ojek', x: 890, y: 548 },
  { name: 'Garasi Kendaraan', x: 1280, y: 548 },
  { name: 'Alun-Alun Pak Kades', x: 1760, y: 548 },
  { name: 'Depan Sekolah', x: 2280, y: 548 },
  { name: 'Depan Masjid', x: 2700, y: 548 },
  { name: 'Depan Gereja', x: 3110, y: 548 },
  { name: 'Lapangan Bola', x: 3740, y: 548 },
  { name: 'Area Proyek', x: 4440, y: 548 },
  { name: 'Komplek Perumahan', x: 5220, y: 548 },
];

export const JOBS: Record<JobId, JobDefinition> = {
  guru: {
    id: 'guru',
    title: 'Guru Sekolah',
    workplaceName: 'Di dalam Sekolah',
    description: 'Masuk ke gedung Sekolah, lalu mengajar anak-anak di depan papan tulis.',
    salary: 10000,
    salaryUnit: 'per sesi',
    workRoom: 'sekolah',
    workX: 560,
    workY: 455,
    badgeColor: '#0D9488',
    actionLabel: 'Mengajar Murid di Kelas',
    kadesQuote: 'Mantap! Masuk ke dalam gedung Sekolah ya, anak-anak sudah nunggu di kelas!',
  },
  guru_ngaji: {
    id: 'guru_ngaji',
    title: 'Guru Ngaji',
    workplaceName: 'Di dalam Masjid',
    description: 'Masuk ke dalam Masjid Amanah untuk membimbing santri kecil mengaji.',
    salary: 10000,
    salaryUnit: 'per sesi',
    workRoom: 'masjid',
    workX: 560,
    workY: 455,
    badgeColor: '#16A34A',
    actionLabel: 'Mengajar Santri Mengaji',
    kadesQuote: 'Alhamdulillah, masuk ke dalam Masjid ya. Santri kecil sudah duduk rapi!',
  },
  kuli: {
    id: 'kuli',
    title: 'Kuli Bangunan',
    workplaceName: 'Area Proyek Perumahan',
    description: 'Susun batu bata, aduk semen, dan bangun proyek rumah warga di timur.',
    salary: 30000,
    salaryUnit: 'per proyek',
    workRoom: 'outdoor',
    workX: LANDMARKS.proyekKuli.x,
    workY: 485,
    badgeColor: '#EA580C',
    actionLabel: 'Pasang Bata & Aduk Semen',
    kadesQuote: 'Gas! Langsung ke Area Proyek di timur lapangan bola, semangat kerjanya ya!',
  },
  ojek: {
    id: 'ojek',
    title: 'Tukang Ojek',
    workplaceName: 'Keliling Kampung',
    description: 'Dapat motor ojek dinas! Jemput penumpang lalu antar ke tujuannya.',
    salary: 7000,
    salaryUnit: 'per orderan',
    workRoom: 'outdoor',
    workX: LANDMARKS.pangkalanOjek.x,
    workY: 545,
    badgeColor: '#15803D',
    actionLabel: 'Narik Ojek',
    kadesQuote: 'Siap! Motor ojek langsung saya pinjamkan. Jemput penumpang & antar sampai tujuan!',
  },
  pedagang: {
    id: 'pedagang',
    title: 'Penjaga Warung',
    workplaceName: 'Warung Kampung',
    description: 'Layani pembeli gorengan, es teh, dan sembako di Warung Kampung barat.',
    salary: 5000,
    salaryUnit: 'per melayani',
    workRoom: 'outdoor',
    workX: LANDMARKS.warung.x,
    workY: 470,
    badgeColor: '#DB2777',
    actionLabel: 'Layani Pembeli Warung',
    kadesQuote: 'Cocok! Jaga Warung Kampung di barat, warga sudah antre beli gorengan.',
  },
};

export const JOB_LIST: JobDefinition[] = Object.values(JOBS);

export const VEHICLES: Record<VehicleId, VehicleDefinition> = {
  ojek_motor: {
    id: 'ojek_motor',
    name: 'Motor Ojek Desa',
    price: 0,
    speedMultiplier: 2.25,
    description: 'Motor dinas khusus Tukang Ojek Kampung Amanah.',
    color: '#16A34A',
    jobOnly: true,
  },
  sepeda: {
    id: 'sepeda',
    name: 'Sepeda Onthel',
    price: 35000,
    speedMultiplier: 1.6,
    description: 'Gowes santai keliling kampung yang luas tanpa bensin.',
    color: '#0EA5E9',
  },
  motor: {
    id: 'motor',
    name: 'Motor Skutik',
    price: 90000,
    speedMultiplier: 2.25,
    description: 'Lincah buat keliling kampung & jalan-jalan ke perumahan.',
    color: '#EF4444',
  },
  pikap: {
    id: 'pikap',
    name: 'Pikap Desa',
    price: 200000,
    speedMultiplier: 2.65,
    description: 'Bak terbuka gagah buat angkut material & keliling kampung.',
    color: '#2563EB',
  },
  bus_oranye: {
    id: 'bus_oranye',
    name: 'Bus Oranye Amanah',
    price: 380000,
    speedMultiplier: 3.1,
    description: 'Bus oranye legendaris Kampung Amanah Episode 2!',
    color: '#F97316',
  },
};

export const PURCHASABLE_VEHICLES: VehicleDefinition[] = Object.values(VEHICLES).filter(
  (v) => !v.jobOnly
);

export const HOUSE_DOWN_PAYMENT = 100000;
export const HOUSE_MONTHLY_INSTALLMENT = 150000;

export const HOUSE_TIERS: Record<HouseTierId, HouseTierDefinition> = {
  sederhana: {
    id: 'sederhana',
    name: 'Rumah Sederhana',
    downPayment: HOUSE_DOWN_PAYMENT,
    monthlyInstallment: HOUSE_MONTHLY_INSTALLMENT,
    totalMonths: 3,
    description: 'Rumah 1 lantai nyaman dengan ruang tamu & bisa dimasuki.',
  },
  tingkat: {
    id: 'tingkat',
    name: 'Rumah Tingkat 2',
    downPayment: HOUSE_DOWN_PAYMENT,
    monthlyInstallment: HOUSE_MONTHLY_INSTALLMENT,
    totalMonths: 5,
    description: 'Rumah 2 lantai lega dengan balkon depan & interior modern.',
  },
  juragan: {
    id: 'juragan',
    name: 'Rumah Juragan',
    downPayment: HOUSE_DOWN_PAYMENT,
    monthlyInstallment: HOUSE_MONTHLY_INSTALLMENT,
    totalMonths: 8,
    description: 'Rumah megah beratap limasan, pagar halaman & ruang keluarga luas.',
  },
};

export const HOUSE_TIER_LIST: HouseTierDefinition[] = Object.values(HOUSE_TIERS);

// 14 spacious housing plots in Komplek Perumahan Timur (x = 4720..5980) cleanly above the road!
export const HOUSE_PLOTS: HousePlot[] = Array.from({ length: 14 }, (_, idx) => {
  const row = idx < 7 ? 0 : 1;
  const col = idx % 7;
  return {
    plotId: idx + 1,
    x: 4740 + col * 205,
    y: row === 0 ? 410 : 495,
    label: `Kavling ${idx + 1}`,
  };
});

export function formatRupiah(amount: number): string {
  return `Rp ${Math.max(0, Math.floor(amount)).toLocaleString('id-ID')}`;
}

export function normalizeIgUsername(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9._]/g, '')
    .slice(0, 22);
  if (!cleaned) return '';
  return `@${cleaned}`;
}
