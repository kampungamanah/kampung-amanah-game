import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { generateIndonesianVoiceOver, renderMp4OnServer } from './src/server/ttsAndRender';
import { attachGameWebSocketServer } from './src/server/gameServer';

function parseEpisode(raw: unknown): 1 | 2 | 3 {
  const s = String(raw);
  return s === '3' ? 3 : s === '2' ? 2 : 1;
}

function getEpisodeStatus(ep: 1 | 2 | 3) {
  if (ep === 3) {
    const mp4Path = path.resolve('public/kampung-amanah-ep3.mp4');
    const cuesPath = path.resolve('src/video/cues_ep3.json');
    const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
    const uttIds: string[] = cues.beats.flatMap((b: any) => b.utterances.map((u: any) => u.id));
    const hasTtsClips = uttIds.every((id) =>
      fs.existsSync(path.resolve(`public/tts_ep3/${id}.wav`))
    );
    const mp4Exists = fs.existsSync(mp4Path);
    const mp4Stat = mp4Exists ? fs.statSync(mp4Path) : null;
    const mp4Size = mp4Stat ? mp4Stat.size : 0;
    const mp4Mtime = mp4Stat ? Math.floor(mp4Stat.mtimeMs) : 0;
    const qaSheetExists = fs.existsSync(path.resolve('public/qa_ep3/qa_sheet.jpg'));
    return {
      episode: 3,
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      ttsActive: Boolean(cues.ttsActive && hasTtsClips),
      mp4Exists,
      mp4Size,
      mp4Mtime,
      qaSheetExists,
      cues,
    };
  }

  if (ep === 2) {
    const mp4Path = path.resolve('public/kampung-amanah-ep2.mp4');
    const cuesPath = path.resolve('src/video/cues_ep2.json');
    const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
    const uttIds: string[] = cues.beats.flatMap((b: any) => b.utterances.map((u: any) => u.id));
    const hasTtsClips = uttIds.every((id) =>
      fs.existsSync(path.resolve(`public/tts_ep2/${id}.wav`))
    );
    const mp4Exists = fs.existsSync(mp4Path);
    const mp4Stat = mp4Exists ? fs.statSync(mp4Path) : null;
    const mp4Size = mp4Stat ? mp4Stat.size : 0;
    const mp4Mtime = mp4Stat ? Math.floor(mp4Stat.mtimeMs) : 0;
    const qaSheetExists = fs.existsSync(path.resolve('public/qa_ep2/qa_sheet.jpg'));
    return {
      episode: 2,
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      ttsActive: Boolean(cues.ttsActive && hasTtsClips),
      mp4Exists,
      mp4Size,
      mp4Mtime,
      qaSheetExists,
      cues,
    };
  }

  const mp4Path = path.resolve('public/kampung-amanah-ep1.mp4');
  const cuesPath = path.resolve('src/video/cues.json');
  const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
  const hasTtsClips = [1, 2, 3, 4, 5, 6].every((id) =>
    fs.existsSync(path.resolve(`public/tts/beat_${id}.wav`))
  );
  const mp4Exists = fs.existsSync(mp4Path);
  const mp4Stat = mp4Exists ? fs.statSync(mp4Path) : null;
  const mp4Size = mp4Stat ? mp4Stat.size : 0;
  const mp4Mtime = mp4Stat ? Math.floor(mp4Stat.mtimeMs) : 0;
  const qaSheetExists = fs.existsSync(path.resolve('public/qa/qa_sheet.jpg'));
  return {
    episode: 1,
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    ttsActive: Boolean(cues.ttsActive && hasTtsClips),
    mp4Exists,
    mp4Size,
    mp4Mtime,
    qaSheetExists,
    cues,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = Number(process.env.PORT) || 3000;
  const httpServer = http.createServer(app);
  const gameServer = attachGameWebSocketServer(httpServer);

  app.get('/api/game/summary', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(gameServer.getSummary());
  });

  app.get('/api/game/profile/:username', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(gameServer.getProfilePreview(String(req.params.username || '')));
  });

  app.get('/api/game/ig-sync', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const summary = gameServer.getSummary();
    res.json({ totalRegistered: summary.totalRegistered, igSync: summary.igSync });
  });

  app.post('/api/game/ig-sync', async (req, res) => {
    try {
      const username = String(req.body?.username || '');
      const rawManual = req.body?.manualFollowers;
      const manualFollowers =
        rawManual !== undefined && rawManual !== null && String(rawManual).trim() !== ''
          ? Number(rawManual)
          : undefined;
      const result = await gameServer.syncInstagramFollowers(username, manualFollowers);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ ok: false, message: err?.message || 'Gagal sinkronisasi Instagram.' });
    }
  });

  app.get('/api/status', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const ep = parseEpisode(req.query.ep);
    res.json(getEpisodeStatus(ep));
  });

  app.post('/api/tts/generate', async (req, res) => {
    try {
      const ep = parseEpisode(req.query.ep || req.body?.ep);
      const updatedCues = await generateIndonesianVoiceOver(ep);
      res.json({ ok: true, episode: ep, cues: updatedCues });
    } catch (err: any) {
      const msg = err?.message || 'Gagal membuat voice-over Gemini TTS.';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post('/api/render', (req, res) => {
    try {
      const ep = parseEpisode(req.query.ep || req.body?.ep);
      const result = renderMp4OnServer(ep);
      res.json({ ok: true, episode: ep, ...result });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Render MP4 gagal.' });
    }
  });

  // Explicit static mounts for newly generated assets
  app.use('/audio', express.static(path.resolve('public/audio')));
  app.use('/tts', express.static(path.resolve('public/tts')));
  app.use('/tts_ep2', express.static(path.resolve('public/tts_ep2')));
  app.use('/tts_ep3', express.static(path.resolve('public/tts_ep3')));
  app.use('/qa', express.static(path.resolve('public/qa')));
  app.use('/qa_ep2', express.static(path.resolve('public/qa_ep2')));
  app.use('/qa_ep3', express.static(path.resolve('public/qa_ep3')));

  app.get('/api/download/source-zip', (_req, res) => {
    try {
      const zipOut = '/tmp/kampung-amanah-game.zip';
      const pyScript = `
import os, zipfile
root = os.getcwd()
out_path = ${JSON.stringify(zipOut)}
skip_dirs = {'node_modules', 'dist', '.git', 'data', 'workspace', 'audio', 'tts', 'tts_ep2', 'tts_ep2_raw', 'tts_ep3', 'tts_ep3_raw', 'qa', 'qa_ep2', 'qa_ep3'}
skip_exts = {'.mp4', '.wav', '.mp3', '.zip'}
with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for dirpath, dirnames, filenames in os.walk(root):
        rel_dir = os.path.relpath(dirpath, root)
        dirnames[:] = [d for d in dirnames if d not in skip_dirs and not d.startswith('.')]
        for fn in filenames:
            if fn.startswith('.') and fn != '.env.example':
                continue
            _, ext = os.path.splitext(fn.lower())
            if ext in skip_exts:
                continue
            full = os.path.join(dirpath, fn)
            arc = fn if rel_dir == '.' else os.path.join(rel_dir, fn)
            zf.write(full, arc)
`;
      execFileSync('python3', ['-c', pyScript], { cwd: process.cwd(), timeout: 15000 });
      res.setHeader('Cache-Control', 'no-store');
      res.download(zipOut, 'kampung-amanah-game.zip');
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Gagal membuat arsip ZIP source code.' });
    }
  });

  app.get('/api/download/mp4', (req, res) => {
    const ep = parseEpisode(req.query.ep);
    const fname =
      ep === 3
        ? 'kampung-amanah-ep3.mp4'
        : ep === 2
        ? 'kampung-amanah-ep2.mp4'
        : 'kampung-amanah-ep1.mp4';
    const mp4Path = path.resolve(`public/${fname}`);
    if (fs.existsSync(mp4Path)) {
      res.setHeader('Cache-Control', 'no-store');
      res.download(mp4Path, fname);
    } else {
      res.status(404).json({ error: 'Video belum dirender.' });
    }
  });

  app.get('/kampung-amanah-ep1.mp4', (req, res) => {
    const mp4Path = path.resolve('public/kampung-amanah-ep1.mp4');
    if (!fs.existsSync(mp4Path)) {
      res.status(404).json({ error: 'Video Episode 1 belum dirender.' });
      return;
    }
    if (req.query.download === '1') {
      res.setHeader('Cache-Control', 'no-store');
      res.download(mp4Path, 'kampung-amanah-ep1.mp4');
      return;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(mp4Path);
  });

  app.get('/kampung-amanah-ep2.mp4', (req, res) => {
    const mp4Path = path.resolve('public/kampung-amanah-ep2.mp4');
    if (!fs.existsSync(mp4Path)) {
      res.status(404).json({ error: 'Video Episode 2 belum dirender.' });
      return;
    }
    if (req.query.download === '1') {
      res.setHeader('Cache-Control', 'no-store');
      res.download(mp4Path, 'kampung-amanah-ep2.mp4');
      return;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(mp4Path);
  });

  app.get('/kampung-amanah-ep3.mp4', (req, res) => {
    const mp4Path = path.resolve('public/kampung-amanah-ep3.mp4');
    if (!fs.existsSync(mp4Path)) {
      res.status(404).json({ error: 'Video Episode 3 belum dirender.' });
      return;
    }
    if (req.query.download === '1') {
      res.setHeader('Cache-Control', 'no-store');
      res.download(mp4Path, 'kampung-amanah-ep3.mp4');
      return;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(mp4Path);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT} (WebSocket /ws/game ready)`);
  });
}

startServer();
