import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { chromium } from 'playwright-core';

const CHROME_PATH =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const cues = JSON.parse(fs.readFileSync(path.resolve('src/video/cues_ep2.json'), 'utf8'));
const TOTAL_FRAMES = cues.totalFrames;
const FPS = cues.fps;
const PORT = 3201;
const CONCURRENCY = 6;

async function main() {
  const distDir = path.resolve('dist');
  if (process.env.SKIP_BUILD !== '1') {
    console.log('Building production bundle for Episode 2...');
    execSync('npx vite build', { stdio: 'inherit' });
  }

  const http = await import('http');
  const mime = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };

  const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || '/').split('?')[0];
    let filePath = path.join(distDir, cleanUrl === '/' ? 'index.html' : cleanUrl);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Static render server listening on http://127.0.0.1:${PORT}/?render=1&ep=2`);

  const qaDir = path.resolve('public/qa_ep2');
  fs.mkdirSync(qaDir, { recursive: true });

  const finalMp4 = path.resolve('public/kampung-amanah-ep2.mp4');
  const mixWav = path.resolve('public/audio/mix_ep2.wav');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const pages = await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        const page = await browser.newPage({
          viewport: { width: 1080, height: 1920 },
          deviceScaleFactor: 1,
        });
        await page.goto(`http://127.0.0.1:${PORT}/?render=1&ep=2`, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.__RENDER_READY__ === true, { timeout: 15000 });
        await page.evaluate((c) => {
          window.__SET_EP__?.(2);
          window.__SET_CUES__?.(c);
        }, cues);
        return page;
      })
    );

    const ffmpegArgs = [
      '-y',
      '-loglevel',
      'error',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      '-r',
      String(FPS),
      '-i',
      '-',
      '-i',
      mixWav,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '20',
      '-preset',
      'fast',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-shortest',
      '-movflags',
      '+faststart',
      finalMp4,
    ];

    const ff = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
    const ffDone = new Promise((resolve, reject) => {
      ff.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
      ff.on('error', reject);
    });

    const tStart = Date.now();
    for (let base = 0; base < TOTAL_FRAMES; base += CONCURRENCY) {
      const batchCount = Math.min(CONCURRENCY, TOTAL_FRAMES - base);
      const buffers = await Promise.all(
        Array.from({ length: batchCount }, async (_, idx) => {
          const f = base + idx;
          const page = pages[idx];
          await page.evaluate(
            (frameIndex) =>
              new Promise((resolve) => {
                window.__SET_FRAME__?.(frameIndex);
                requestAnimationFrame(resolve);
              }),
            f
          );
          return page.screenshot({ type: 'jpeg', quality: 90 });
        })
      );

      for (const buf of buffers) {
        if (!ff.stdin.write(buf)) {
          await new Promise((r) => ff.stdin.once('drain', r));
        }
      }

      if (base % 180 === 0 || base + batchCount >= TOTAL_FRAMES) {
        const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
        console.log(`Rendered EP2 frame ${base + batchCount}/${TOTAL_FRAMES} (${elapsed}s)`);
      }
    }

    ff.stdin.end();
    await ffDone;
    console.log(`Encoded EP2 MP4 -> ${finalMp4}`);

    // Extract 10 QA keyframes covering every beat including IG 100 pengikut, FB Page, all 4 dialogs, and Timelapse Buildings BEFORE end card
    const b = cues.beats;
    const qaSpecs = [
      { ts: 1.4, label: 'HARI 2 + Jalan Sepi' },
      { ts: Number((b[1].start + 1.4).toFixed(1)), label: 'Bus Oranye Datang' },
      { ts: Number((b[2].start + 4.3).toFixed(1)), label: 'Warga Turun · 100' },
      { ts: Number((b[3].start + 1.5).toFixed(1)), label: 'Profil IG 100 Pengikut' },
      { ts: Number((b[3].end - 1.2).toFixed(1)), label: 'Profil FB Tanpa Angka' },
      { ts: Number((b[4].utterances[0]?.start + 0.6 || b[4].start + 0.8).toFixed(1)), label: '@vinzz4726 Presiden' },
      { ts: Number((b[5].utterances[0]?.start + 0.6 || b[5].start + 0.8).toFixed(1)), label: '@3p4n.24 Wapres' },
      { ts: Number((b[7].utterances[0]?.start + 1.1 || b[7].start + 1.2).toFixed(1)), label: '@_26ary4stnn Usul' },
      { ts: Number((b[8].start + 3.2).toFixed(1)), label: 'Timelapse Bangun 3 Gedung' },
      { ts: Number((cues.dur - 1.2).toFixed(1)), label: 'Kucing + End Card' },
    ];

    const manifest = [];
    for (let i = 0; i < qaSpecs.length; i++) {
      const { ts, label } = qaSpecs[i];
      const fname = `qa_${String(i + 1).padStart(2, '0')}.png`;
      const outPng = path.join(qaDir, fname);
      execSync(
        `ffmpeg -y -loglevel error -ss ${ts} -i "${finalMp4}" -frames:v 1 -vf scale=360:640 "${outPng}"`
      );
      manifest.push({
        sec: ts,
        label: `${ts.toFixed(1)}s · ${label}`,
        src: `/qa_ep2/${fname}`,
      });
    }
    fs.writeFileSync(path.join(qaDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    execSync(
      `ffmpeg -y -loglevel error -pattern_type glob -i "${qaDir}/qa_*.png" -filter_complex "tile=5x2:padding=8:color=0x18181b" "${path.join(qaDir, 'qa_sheet.jpg')}"`
    );
    console.log(`Generated EP2 QA contact sheet -> ${path.join(qaDir, 'qa_sheet.jpg')}`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
