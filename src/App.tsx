import React, { useEffect, useRef, useState } from 'react';
import { Download, Film, Gamepad2, Mic, Pause, Play, RefreshCw, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import defaultEp1Cues from './video/cues.json';
import defaultEp2Cues from './video/cues_ep2.json';
import defaultEp3Cues from './video/cues_ep3.json';
import { VideoCues } from './video/KampungAmanahVideo';
import { Ep2VideoCues } from './video/KampungAmanahEp2Video';
import { Ep3VideoCues } from './video/KampungAmanahEp3Video';
import { PlayerCanvas } from './video/PlayerCanvas';
import { FPS, fr } from './video/motion';
import { KampungGame } from './game/KampungGame';

interface StudioStatus {
  episode: 1 | 2 | 3;
  geminiKeyConfigured: boolean;
  ttsActive: boolean;
  mp4Exists: boolean;
  mp4Size: number;
  mp4Mtime?: number;
  qaSheetExists: boolean;
  cues: VideoCues | Ep2VideoCues | Ep3VideoCues;
}

const QA_ITEMS_EP1 = [
  {
    id: 1,
    title: 'Mulut Pak Kades Bergerak Sinkron',
    detail: 'Buka-tutup dinamis per suku kata di semua 6 beat narasi; menutup jadi senyum kecil saat jeda.',
  },
  {
    id: 2,
    title: 'Subtitle Kinetik Kata-per-Kata',
    detail: 'Teks muncul kata demi kata dengan font tebal, outline hitam solid, dan kata kunci kuning (#FACC15).',
  },
  {
    id: 3,
    title: 'Desa Kosong (Bendera + Kucing Oranye)',
    detail: 'Rumput hijau & jalan desa kosong, pohon di belakang, tiang bendera merah-putih berkibar, papan PENDUDUK: 0, dan kucing oranye.',
  },
  {
    id: 4,
    title: 'Kamera Dekat (Medium Shot + Push-In)',
    detail: 'Framing dekat menjaga Pak Kades tetap jelas dengan slow push-in dan parallax 3 layer.',
  },
];

const QA_ITEMS_EP2 = [
  {
    id: 1,
    title: 'Lip-Sync Dua Suara (Kades & Warga)',
    detail: 'Suara Pak Kades & suara warga berbeda (Charon vs Puck); mulut setiap pembicara gerak sinkron per kata.',
  },
  {
    id: 2,
    title: 'Subtitle Kinetik Kata-per-Kata',
    detail: 'Muncul kata demi kata mengikuti dialog dengan label pembicara, outline hitam tebal, dan kata kunci kuning.',
  },
  {
    id: 3,
    title: 'Framing Lebar + 6 Username IG Utama',
    detail: 'Semua 20 warga muat di layar; hanya 6 warga utama punya username IG (+ jabatan PRESIDEN/WAPRES/KETUA RT), kerumunan tanpa username.',
  },
  {
    id: 4,
    title: 'Bus Oranye + Papan PENDUDUK 0 → 100',
    detail: 'Bus oranye ala SpongeBob datang menurunkan warga, papan PENDUDUK naik otomatis dari 0 ke 100.',
  },
  {
    id: 5,
    title: 'Layar HP Profil IG (100) + FB Page',
    detail: 'IG @kampung.amanah menampilkan 100 pengikut besar & terbaca, lalu geser ke FB Page Kampung Amanah tanpa angka followers.',
  },
  {
    id: 6,
    title: 'Timelapse Bangun 3 Gedung Sebelum End Card',
    detail: 'Setelah dialog, seluruh warga gotong royong membangun sekolah, masjid, dan gereja berdampingan sebelum kartu penutup.',
  },
];

const QA_ITEMS_EP3 = [
  {
    id: 1,
    title: 'Lip-Sync Multi-Suara (Pak Kades & 4 Warga)',
    detail: 'Pak Kades (Charon), @virgod29 (Puck), @isqi_sani2316 (Kore), @lida_aja_gin / Flora (Aoede), dan @rehannoperwan411 (Fenrir) bergerak sinkron per suku kata.',
  },
  {
    id: 2,
    title: 'Kamera Dinamis Penuh Pergantian',
    detail: 'Fly-over pembuka & penutup, push-in, tracking pan, whip-pan bola ke atap sekolah, follow-cam ke lahan samping, dan 3-cut timelapse tanpa wide statis.',
  },
  {
    id: 3,
    title: 'Warga 100 → 245 & Kerumunan 36+ Warga',
    detail: 'Pembuka tepat "Hari ke 3 di Kampung Amanah, warga dari 100 udah bertambah menjadi 245" dengan kerumunan 36 warga tanpa username.',
  },
  {
    id: 4,
    title: 'Hanya 6 Username Baru (Tanpa Presiden/Striker)',
    detail: 'Username di atas kepala hanya untuk @virgod29, @singgel_boyys11, @isqi_sani2316, @nadia._single_era00, @lida_aja_gin, dan @rehannoperwan411.',
  },
  {
    id: 5,
    title: 'Lapangan di Lahan Samping (Bukan di Jalan)',
    detail: 'Lapangan bola duduk 100% di tanah rumput samping bagian tengah/bawah frame, dipisahkan pagar kayu dari jalan desa.',
  },
  {
    id: 6,
    title: 'Peran Masuk + Kepala Kuli Langsung Bangun 9 Rumah',
    detail: 'Guru (@isqi_sani2316 & @nadia._single_era00) masuk Sekolah, Flora (@lida_aja_gin) masuk Masjid, lalu @rehannoperwan411 langsung bangun 9 rumah warga sekaligus.',
  },
  {
    id: 7,
    title: 'End Card & Subtitle Kinetik',
    detail: 'Subtitle kata-per-kata dengan outline hitam & kata kunci kuning, ditutup Kucing Oranye + "Besok bangun apa lagi? Komen, yang like-nya paling banyak duluan."',
  },
];

interface QaSample {
  sec: number;
  label: string;
  src: string;
}

const DEFAULT_QA_EP1: QaSample[] = [
  { sec: 0.2, label: '0.2s · Masuk + HARI 1', src: '/qa/qa_01.png' },
  { sec: 1.8, label: 'Kampung Amanah', src: '/qa/qa_02.png' },
  { sec: 4.1, label: 'Saya Doang', src: '/qa/qa_03.png' },
  { sec: 6.4, label: 'Tunjuk Bendera', src: '/qa/qa_04.png' },
  { sec: 8.9, label: 'Kucing Oranye', src: '/qa/qa_05.png' },
  { sec: 14.5, label: 'Punya Kalian', src: '/qa/qa_06.png' },
  { sec: 18.2, label: 'Hitung Jari', src: '/qa/qa_07.png' },
  { sec: 23.0, label: 'Cek Papan 0', src: '/qa/qa_08.png' },
  { sec: 27.6, label: 'Ngobrol Kucing', src: '/qa/qa_09.png' },
  { sec: 30.2, label: 'Kartu Penutup', src: '/qa/qa_10.png' },
];

const DEFAULT_QA_EP2: QaSample[] = [
  { sec: 1.4, label: '1.4s · HARI 2 + Jalan Sepi', src: '/qa_ep2/qa_01.png' },
  { sec: 6.8, label: '6.8s · Bus Oranye Datang', src: '/qa_ep2/qa_02.png' },
  { sec: 13.0, label: '13.0s · Warga Turun · 100', src: '/qa_ep2/qa_03.png' },
  { sec: 15.6, label: '15.6s · Profil IG 100 Pengikut', src: '/qa_ep2/qa_04.png' },
  { sec: 19.7, label: '19.7s · Profil FB Tanpa Angka', src: '/qa_ep2/qa_05.png' },
  { sec: 21.7, label: '21.7s · @vinzz4726 Presiden', src: '/qa_ep2/qa_06.png' },
  { sec: 28.6, label: '28.6s · @3p4n.24 Wapres', src: '/qa_ep2/qa_07.png' },
  { sec: 40.4, label: '40.4s · @_26ary4stnn Usul', src: '/qa_ep2/qa_08.png' },
  { sec: 48.1, label: '48.1s · Timelapse Bangun 3 Gedung', src: '/qa_ep2/qa_09.png' },
  { sec: 54.0, label: '54.0s · Kucing + End Card', src: '/qa_ep2/qa_10.png' },
];

const DEFAULT_QA_EP3: QaSample[] = [
  { sec: 1.2, label: '1.2s · HARI 3 Fly-Over 245', src: '/qa_ep3/qa_01.png' },
  { sec: 6.2, label: '6.2s · Close-Up Komen + 245', src: '/qa_ep3/qa_02.png' },
  { sec: 9.8, label: '9.8s · Dialog @virgod29', src: '/qa_ep3/qa_03.png' },
  { sec: 16.5, label: '16.5s · Lahan Becek Semak', src: '/qa_ep3/qa_04.png' },
  { sec: 20.1, label: '20.1s · Bola Nyangkut Sekolah', src: '/qa_ep3/qa_05.png' },
  { sec: 24.5, label: '24.5s · Follow Cam Lahan Samping', src: '/qa_ep3/qa_06.png' },
  { sec: 33.0, label: '33.0s · Lapangan Bola Jadi', src: '/qa_ep3/qa_07.png' },
  { sec: 35.0, label: '35.0s · Dialog @isqi_sani2316', src: '/qa_ep3/qa_08.png' },
  { sec: 39.2, label: '39.2s · Guru Masuk Sekolah', src: '/qa_ep3/qa_09.png' },
  { sec: 41.2, label: '41.2s · Dialog @lida_aja_gin', src: '/qa_ep3/qa_10.png' },
  { sec: 45.4, label: '45.4s · Guru Ngaji ke Masjid', src: '/qa_ep3/qa_11.png' },
  { sec: 47.0, label: '47.0s · Dialog @rehannoperwan411', src: '/qa_ep3/qa_12.png' },
  { sec: 55.5, label: '55.5s · Bangun 9 Rumah Warga', src: '/qa_ep3/qa_13.png' },
  { sec: 58.2, label: '58.2s · Deretan Rumah Jadi', src: '/qa_ep3/qa_14.png' },
  { sec: 65.5, label: '65.5s · Kucing + End Card', src: '/qa_ep3/qa_15.png' },
];

function getDefaultCues(ep: 1 | 2 | 3): VideoCues | Ep2VideoCues | Ep3VideoCues {
  if (ep === 3) return defaultEp3Cues as Ep3VideoCues;
  if (ep === 2) return defaultEp2Cues as Ep2VideoCues;
  return defaultEp1Cues as VideoCues;
}

function getDefaultQa(ep: 1 | 2 | 3): QaSample[] {
  if (ep === 3) return DEFAULT_QA_EP3;
  if (ep === 2) return DEFAULT_QA_EP2;
  return DEFAULT_QA_EP1;
}

export default function App() {
  const [appSection, setAppSection] = useState<'game' | 'studio'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('view') === 'studio') return 'studio';
    }
    return 'game';
  });

  if (appSection === 'game') {
    return <KampungGame onOpenVideos={() => setAppSection('studio')} />;
  }

  return <VideoStudioView onOpenGame={() => setAppSection('game')} />;
}

function VideoStudioView({ onOpenGame }: { onOpenGame: () => void }) {
  const [episode, setEpisode] = useState<1 | 2 | 3>(3);
  const [rawCues, setRawCues] = useState<VideoCues | Ep2VideoCues | Ep3VideoCues>(defaultEp3Cues as Ep3VideoCues);
  const cues = rawCues.episode === episode ? rawCues : getDefaultCues(episode);
  const [status, setStatus] = useState<StudioStatus | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'mp4'>('mp4');
  const [frame, setFrame] = useState<number>(680); // Preview Ep 3 newly built football pitch
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [audioVersion, setAudioVersion] = useState<number>(1);
  const [mp4Version, setMp4Version] = useState<number>(1);
  const [mp4Error, setMp4Error] = useState<boolean>(false);
  const [ttsLoading, setTtsLoading] = useState<boolean>(false);
  const [renderLoading, setRenderLoading] = useState<boolean>(false);
  const [downloadingMp4, setDownloadingMp4] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [qaSamples, setQaSamples] = useState<QaSample[]>(DEFAULT_QA_EP3);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const activeEpisodeRef = useRef<1 | 2 | 3>(episode);
  activeEpisodeRef.current = episode;

  const fetchStatus = async (ep: 1 | 2 | 3 = episode) => {
    try {
      const res = await fetch(`/api/status?ep=${ep}&t=${Date.now()}`, { cache: 'no-store' });
      if (activeEpisodeRef.current !== ep) return;
      if (res.ok) {
        const data: StudioStatus = await res.json();
        if (activeEpisodeRef.current !== ep) return;
        setStatus(data);
        if (data.cues) setRawCues(data.cues);
        if (!data.mp4Exists) {
          setViewMode('canvas');
        }
      }
      const manifestUrl =
        ep === 3
          ? `/qa_ep3/manifest.json?v=${Date.now()}`
          : ep === 2
          ? `/qa_ep2/manifest.json?v=${Date.now()}`
          : `/qa/manifest.json?v=${Date.now()}`;
      const mRes = await fetch(manifestUrl);
      if (activeEpisodeRef.current !== ep) return;
      if (mRes.ok) {
        const manifest = await mRes.json();
        if (activeEpisodeRef.current !== ep) return;
        if (Array.isArray(manifest) && manifest.length > 0) setQaSamples(manifest);
      } else {
        setQaSamples(getDefaultQa(ep));
      }
    } catch {
      if (activeEpisodeRef.current === ep) {
        setQaSamples(getDefaultQa(ep));
      }
    }
  };

  useEffect(() => {
    setIsPlaying(false);
    setMp4Error(false);
    setActionMessage(null);
    setActionError(null);
    setRawCues(getDefaultCues(episode));
    setQaSamples(getDefaultQa(episode));
    setFrame(episode === 3 ? 680 : episode === 2 ? 396 : 48);
    fetchStatus(episode);
  }, [episode]);

  // Deterministic playback loop synchronized with <audio>
  useEffect(() => {
    if (!isPlaying || viewMode !== 'canvas') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      return;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.muted = muted;
      const targetSec = frame / FPS;
      if (Math.abs(audio.currentTime - targetSec) > 0.12) {
        audio.currentTime = targetSec;
      }
      audio.play().catch(() => {});
    }

    const tick = (now: number) => {
      if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended) {
        const nextFrame = Math.min(cues.totalFrames - 1, Math.round(audioRef.current.currentTime * FPS));
        setFrame(nextFrame);
        if (nextFrame >= cues.totalFrames - 1) {
          setIsPlaying(false);
          return;
        }
      } else {
        if (lastTimeRef.current !== null) {
          const dt = (now - lastTimeRef.current) / 1000;
          setFrame((prev) => {
            const next = prev + dt * FPS;
            if (next >= cues.totalFrames - 1) {
              setIsPlaying(false);
              return cues.totalFrames - 1;
            }
            return next;
          });
        }
        lastTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, viewMode, cues.totalFrames, muted, episode]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  const jumpToTime = (sec: number, autoPlay = false) => {
    const targetFrame = Math.min(cues.totalFrames - 1, Math.max(0, fr(sec)));
    setFrame(targetFrame);
    if (viewMode === 'mp4' && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(cues.dur - 0.1, sec));
      if (autoPlay) {
        videoRef.current.play().catch(() => {});
      }
      return;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = targetFrame / FPS;
    }
    if (autoPlay) {
      setViewMode('canvas');
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (frame >= cues.totalFrames - 2) {
      setFrame(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
    setIsPlaying((p) => !p);
  };

  const handleGenerateTts = async () => {
    setTtsLoading(true);
    setActionError(null);
    setActionMessage(
      episode >= 2
        ? `Menghubungkan Gemini TTS untuk suara Pak Kades & Warga Episode ${episode}...`
        : 'Menghubungkan Gemini TTS untuk suara Pak Kades Episode 1...'
    );
    try {
      const res = await fetch(`/api/tts/generate?ep=${episode}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal membuat voice-over Gemini TTS.');
      }
      setRawCues(data.cues);
      setAudioVersion((v) => v + 1);
      await fetchStatus(episode);
      setActionMessage(
        'Voice-over berhasil dibuat dan disinkronkan ke gerak mulut. Klik Render Ulang MP4 untuk memperbarui file video.'
      );
    } catch (err: any) {
      setActionError(err?.message || 'Gagal menghasilkan voice-over.');
      setActionMessage(null);
    } finally {
      setTtsLoading(false);
    }
  };

  const handleRenderMp4 = async () => {
    setRenderLoading(true);
    setActionError(null);
    setActionMessage(`Merender ${cues.totalFrames} frame 1080×1920 ke MP4 (butuh sekitar 1–3 menit)...`);
    try {
      const res = await fetch(`/api/render?ep=${episode}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal merender MP4.');
      }
      setMp4Version((v) => v + 1);
      setMp4Error(false);
      await fetchStatus(episode);
      setViewMode('mp4');
      setActionMessage(`File MP4 Episode ${episode} berhasil diperbarui dan siap diputar atau diunduh.`);
    } catch (err: any) {
      setActionError(err?.message || 'Gagal merender MP4.');
      setActionMessage(null);
    } finally {
      setRenderLoading(false);
    }
  };

  const mp4Filename =
    episode === 3
      ? 'kampung-amanah-ep3.mp4'
      : episode === 2
      ? 'kampung-amanah-ep2.mp4'
      : 'kampung-amanah-ep1.mp4';
  const mp4PublicSrc =
    episode === 3
      ? '/kampung-amanah-ep3.mp4'
      : episode === 2
      ? '/kampung-amanah-ep2.mp4'
      : '/kampung-amanah-ep1.mp4';
  const mp4Poster =
    episode === 3
      ? '/qa_ep3/qa_01.png'
      : episode === 2
      ? '/qa_ep2/qa_01.png'
      : '/qa/qa_01.png';
  const mp4CacheKey = `${status?.mp4Mtime || 0}-${mp4Version}`;
  const mp4Available = status ? status.mp4Exists : true;
  const audioSrc =
    episode === 3
      ? `/audio/mix_ep3.mp3?v=${audioVersion}`
      : episode === 2
      ? `/audio/mix_ep2.mp3?v=${audioVersion}`
      : `/audio/mix.mp3?v=${audioVersion}`;

  const handleDownloadMp4 = async () => {
    setDownloadingMp4(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/download/mp4?ep=${episode}&v=${mp4CacheKey}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`File MP4 Episode ${episode} belum tersedia untuk diunduh.`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = mp4Filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      setActionMessage(`Download MP4 dimulai (${mp4Filename}).`);
    } catch (err: any) {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `/api/download/mp4?ep=${episode}&v=${mp4Version}`;
        document.body.appendChild(iframe);
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 15000);
      } catch {
        setActionError(err?.message || 'Gagal mengunduh file MP4.');
      }
    } finally {
      setDownloadingMp4(false);
    }
  };

  const currentSec = frame / FPS;
  const activeBeat =
    cues.beats.find((b) => currentSec >= b.start && currentSec < b.end) ||
    cues.beats[cues.beats.length - 1];
  const mouthNow: any = cues.mouthFrames[Math.round(frame)] || { open: 0, v: 'closed' };
  const qaList = episode === 3 ? QA_ITEMS_EP3 : episode === 2 ? QA_ITEMS_EP2 : QA_ITEMS_EP1;

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-zinc-900">
      <audio key={episode} ref={audioRef} src={audioSrc} preload="auto" />

      {/* Top Bar Contract: Brand — Episode Switcher & Nav Links — 1 Primary Action */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-5">
            <a
              href="#player"
              className="shrink-0 whitespace-nowrap text-lg font-bold tracking-tight text-zinc-900"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Kampung Amanah
            </a>

            <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setEpisode(1)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                  episode === 1 ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Episode 1
              </button>
              <button
                type="button"
                onClick={() => setEpisode(2)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                  episode === 2 ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Episode 2
              </button>
              <button
                type="button"
                onClick={() => setEpisode(3)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                  episode === 3 ? 'bg-[#FACC15] text-zinc-950 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Episode 3
              </button>
              <button
                type="button"
                onClick={onOpenGame}
                className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap"
              >
                <Gamepad2 className="h-3.5 w-3.5" />
                Main Game
              </button>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 lg:flex">
            <a href="#player" className="shrink-0 whitespace-nowrap transition-colors hover:text-zinc-900">
              Player
            </a>
            <a href="#naskah" className="shrink-0 whitespace-nowrap transition-colors hover:text-zinc-900">
              Naskah & Beat
            </a>
            <a href="#qa" className="shrink-0 whitespace-nowrap transition-colors hover:text-zinc-900">
              Checklist QA
            </a>
            <a href="#frame-qa" className="shrink-0 whitespace-nowrap transition-colors hover:text-zinc-900">
              Hasil Frame MP4
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {status?.mp4Exists ? (
              <button
                type="button"
                onClick={handleDownloadMp4}
                disabled={downloadingMp4}
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
              >
                <Download className="h-3.5 w-3.5" />
                {downloadingMp4 ? 'Mengunduh...' : `Download MP4 (Ep ${episode})`}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRenderMp4}
                disabled={renderLoading}
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                <Film className="h-3.5 w-3.5" />
                {renderLoading ? 'Merender...' : `Render MP4 (Ep ${episode})`}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Split Stage */}
      <main id="player" className="mx-auto max-w-[1360px] px-6 py-10">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          {/* Left Column: Editorial Details, Audio/TTS Controls & Timeline */}
          <div className="space-y-8 lg:col-span-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-500">
                <span>Episode {episode}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {episode === 3
                    ? 'Lapangan Bola & Rumah Warga'
                    : episode === 2
                    ? 'Kampungnya Udah Rame'
                    : 'Hari Pertama'}
                </span>
                <span aria-hidden="true">·</span>
                <span>1080×1920 (9:16)</span>
                <span aria-hidden="true">·</span>
                <span>30 fps</span>
                <span aria-hidden="true">·</span>
                <span>{cues.dur.toFixed(1)} detik</span>
              </div>

              <h1
                className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", textWrap: 'balance' }}
              >
                {episode === 3
                  ? 'Kampung Amanah Ep. 3 — Lapangan Bola & Rumah Warga'
                  : episode === 2
                  ? 'Kampung Amanah Ep. 2 — Kampungnya Udah Rame'
                  : 'Kampung Amanah Ep. 1 — Hari Pertama'}
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-zinc-600">
                {episode === 3
                  ? 'Hari ke-3 dengan 245 warga dan kerumunan lebih ramai: Pak Kades membaca komen, dialog permintaan lapangan bola bersama @virgod29, komedi lahan becek dan bola nyangkut atap sekolah, pindah ke lahan rumput samping (jauh dari jalan), gotong royong bangun lapangan bola, peran guru (@isqi_sani2316 & @nadia._single_era00) masuk sekolah, Flora (@lida_aja_gin) masuk masjid, lalu kepala kuli (@rehannoperwan411) langsung bangun 9 rumah warga sekaligus.'
                  : episode === 2
                  ? 'Pak Kades yang sama seperti Episode 1 menyambut bus oranye dan 20 warga (6 warga utama ber-username IG + belasan kerumunan), papan penduduk naik 0 → 100, pamer profil IG @kampung.amanah & FB Page, 4 dialog warga dua suara, lalu gotong royong timelapse bangun sekolah, masjid, dan gereja berdampingan.'
                  : 'Animasi kartun flat 2D cel-shaded dengan Pak Kades (peci hitam, kemeja batik), kucing oranye, tiang bendera merah-putih berkibar, dan papan penduduk nol di atas rumput hijau & jalan desa yang benar-benar kosong dengan pepohonan di belakang.'}
              </p>
            </div>

            {/* Voice-Over & MP4 Render Action Bar */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Audio & Voice-Over (Episode {episode})
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {status?.ttsActive
                      ? episode >= 2
                        ? 'Voice-over dua suara Gemini TTS (Pak Kades & Warga) aktif & tersinkron ke gerak mulut + musik (-14 LUFS).'
                        : 'Voice-over Gemini TTS aktif dan tersinkron ke gerak mulut + musik (-14 LUFS).'
                      : 'Audio saat ini berisi musik & SFX tersintesis. Buat voice-over Indonesia via Gemini TTS atau putar pratinjau langsung.'}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleGenerateTts}
                    disabled={ttsLoading}
                    className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-[#FACC15] px-4 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-[#EAB308] disabled:opacity-50"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    {ttsLoading ? 'Membuat Voice-Over...' : 'Buat Voice-Over TTS'}
                  </button>

                  <button
                    type="button"
                    onClick={handleRenderMp4}
                    disabled={renderLoading}
                    className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${renderLoading ? 'animate-spin' : ''}`} />
                    {renderLoading ? 'Merender MP4...' : 'Render Ulang MP4'}
                  </button>
                </div>
              </div>

              {actionMessage && (
                <p className="mt-3 border-t border-zinc-100 pt-3 text-xs font-medium text-zinc-700">
                  {actionMessage}
                </p>
              )}
              {actionError && (
                <p className="mt-3 border-t border-red-100 pt-3 text-xs font-medium text-red-700">
                  {actionError}
                </p>
              )}
            </div>

            {/* Interactive Script & Beat Timeline */}
            <section id="naskah" className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2
                  className="text-xl font-bold tracking-tight text-zinc-900"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Naskah & Beat Narasi ({cues.beats.length} Beat)
                </h2>
                <span className="font-mono text-xs tabular-nums text-zinc-500">
                  Frame {Math.round(frame)} / {cues.totalFrames} · Mulut{' '}
                  {mouthNow.open > 0.08
                    ? `${mouthNow.speaker ? `${mouthNow.speaker} ` : ''}terbuka (${Math.round(mouthNow.open * 100)}%)`
                    : 'senyum jeda'}
                </span>
              </div>

              <div className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white">
                {cues.beats.map((beat) => {
                  const isActive = activeBeat.id === beat.id;
                  return (
                    <button
                      key={beat.id}
                      type="button"
                      onClick={() => jumpToTime(beat.start + 0.25, true)}
                      className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors ${
                        isActive ? 'bg-amber-50/70' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 font-mono text-xs font-bold tabular-nums ${
                          isActive ? 'text-amber-700' : 'text-zinc-400'
                        }`}
                      >
                        {String(beat.id).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-medium tabular-nums text-zinc-500">
                            {beat.start.toFixed(1)}s – {beat.end.toFixed(1)}s
                          </span>
                          <span className="text-xs text-zinc-400">
                            {isActive ? 'Sedang Diputar' : 'Klik untuk lompat'}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-snug text-zinc-900">
                          “{beat.text}”
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: 9:16 Reel Player Viewport */}
          <div className="lg:col-span-5 lg:sticky lg:top-8">
            <div className="mx-auto max-w-[400px] space-y-3">
              {/* Mode Switcher */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-zinc-200/80 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setMp4Error(false);
                      setViewMode('mp4');
                    }}
                    disabled={!mp4Available}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-40 ${
                      viewMode === 'mp4'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    MP4 Final
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('canvas')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      viewMode === 'canvas'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Live Engine (30 fps)
                  </button>
                </div>

                {status?.mp4Exists && (
                  <span className="font-mono text-xs tabular-nums text-zinc-500">
                    {(status.mp4Size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                )}
              </div>

              {/* 9:16 Viewport Frame */}
              <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-950 shadow-sm">
                {viewMode === 'mp4' && mp4Available ? (
                  mp4Error ? (
                    <div className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 bg-zinc-900 px-6 text-center text-white">
                      <p className="text-sm font-semibold">Gagal memuat pratinjau MP4 di browser.</p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMp4Error(false);
                            setMp4Version((v) => v + 1);
                          }}
                          className="rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                        >
                          Muat Ulang MP4
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadMp4}
                          className="rounded-lg bg-[#FACC15] px-3.5 py-2 text-xs font-bold text-zinc-950 hover:bg-[#EAB308]"
                        >
                          Download MP4
                        </button>
                      </div>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      key={`${episode}-${mp4CacheKey}`}
                      src={`${mp4PublicSrc}?v=${mp4CacheKey}`}
                      poster={mp4Poster}
                      preload="metadata"
                      controls
                      playsInline
                      onError={() => setMp4Error(true)}
                      onTimeUpdate={(e) => {
                        const sec = e.currentTarget.currentTime;
                        setFrame(Math.min(cues.totalFrames - 1, Math.round(sec * FPS)));
                      }}
                      className="aspect-[9/16] w-full bg-black object-contain"
                    />
                  )
                ) : (
                  <PlayerCanvas episode={episode} frame={frame} cues={cues} />
                )}
              </div>

              {viewMode === 'mp4' && mp4Available && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-zinc-900">{mp4Filename}</p>
                    <p className="font-mono text-[11px] tabular-nums text-zinc-500">
                      1080×1920 · 30 fps · {cues.dur.toFixed(1)}s
                      {status?.mp4Size ? ` · ${(status.mp4Size / (1024 * 1024)).toFixed(1)} MB` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadMp4}
                    disabled={downloadingMp4}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloadingMp4 ? 'Mengunduh...' : 'Unduh MP4'}
                  </button>
                </div>
              )}

              {/* Scrubber & Transport Controls for Live Engine */}
              {viewMode === 'canvas' && (
                <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white transition-colors hover:bg-zinc-800"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => jumpToTime(0, false)}
                      aria-label="Restart"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <input
                        type="range"
                        min={0}
                        max={cues.totalFrames - 1}
                        value={Math.round(frame)}
                        onChange={(e) => {
                          setIsPlaying(false);
                          const f = Number(e.target.value);
                          setFrame(f);
                          if (audioRef.current) audioRef.current.currentTime = f / FPS;
                        }}
                        className="w-full accent-zinc-900"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? 'Unmute' : 'Mute'}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs tabular-nums text-zinc-500">
                    <span>{currentSec.toFixed(2)}s</span>
                    <span>
                      Beat {activeBeat.id} / {cues.beats.length}
                    </span>
                    <span>{cues.dur.toFixed(2)}s</span>
                  </div>
                </div>
              )}

              {viewMode === 'mp4' && status?.mp4Exists && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <button
                    type="button"
                    onClick={handleDownloadMp4}
                    disabled={downloadingMp4}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloadingMp4 ? 'Mengunduh...' : 'Download MP4'}
                  </button>

                  <a
                    href={`/api/download/mp4?ep=${episode}&v=${mp4Version}`}
                    download={mp4Filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
                  >
                    Unduh di Tab Baru
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mandatory QA Verification */}
        <section id="qa" className="mt-16 border-t border-zinc-200 pt-12">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2
                className="text-2xl font-bold tracking-tight text-zinc-900"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Checklist QA Wajib Series (Episode {episode})
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Syarat utama Episode {episode} yang diverifikasi langsung pada frame hasil render MP4.
              </p>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
              episode >= 2 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
            }`}
          >
            {qaList.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5"
              >
                <div className="space-y-2">
                  <span className="font-mono text-xs font-semibold text-zinc-400">
                    0{item.id}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-zinc-600">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Extracted MP4 Keyframes Inspector */}
        <section id="frame-qa" className="mt-14 border-t border-zinc-200 pt-12 pb-16">
          <div className="mb-6">
            <h2
              className="text-2xl font-bold tracking-tight text-zinc-900"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Inspeksi Frame Hasil Render MP4 (Episode {episode})
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Cuplikan langsung dari file video final 1080×1920 (klik frame untuk melompat ke titik waktu tersebut).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {qaSamples.map((sample) => (
              <button
                key={sample.src}
                type="button"
                onClick={() => jumpToTime(sample.sec, false)}
                className="group overflow-hidden rounded-xl border border-zinc-200 bg-white text-left transition-colors hover:border-zinc-400"
              >
                <div className="aspect-[9/16] w-full overflow-hidden bg-zinc-100">
                  <img
                    src={`${sample.src}?v=${mp4Version}`}
                    alt={sample.label}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="px-3 py-2 text-xs font-medium text-zinc-700">
                  {sample.label}
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
