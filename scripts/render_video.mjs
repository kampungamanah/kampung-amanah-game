import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { chromium } from 'playwright-core';

const CHROME_PATH =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const cues = JSON.parse(fs.readFileSync(path.resolve('src/video/cues.json'), 'utf8'));
const TOTAL_FRAMES = cues.totalFrames;
const FPS = cues.fps;
const PORT = 3199;
const CONCURRENCY = 4;

async function main() {
  const distDir = path.resolve('dist');
  if (process.env.SKIP_BUILD !== '1') {
    console.log('Building production bundle...');
    execSync('npx vite build', { stdio: 'inherit' });
  }

  // Start lightweight static file server on PORT for deterministic rendering
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
  console.log(`Static render server listening on http://127.0.0.1:${PORT}/?render=1`);

  const outDir = path.resolve('out');
  const qaDir = path.resolve('public/qa');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(qaDir, { recursive: true });

  const finalMp4 = path.resolve('public/kampung-amanah-ep1.mp4');
  const mixWav = path.resolve('public/audio/mix.wav');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    // Open CONCURRENCY pages in parallel so frame rendering is ~3x faster while preserving strict frame order
    const pages = await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        const page = await browser.newPage({
          viewport: { width: 1080, height: 1920 },
          deviceScaleFactor: 1,
        });
        await page.goto(`http://127.0.0.1:${PORT}/?render=1`, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.__RENDER_READY__ === true, { timeout: 15000 });
        await page.evaluate((c) => window.__SET_CUES__?.(c), cues);
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
      '19',
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
                requestAnimationFrame(() => requestAnimationFrame(resolve));
              }),
            f
          );
          return page.screenshot({ type: 'jpeg', quality: 93 });
        })
      );

      for (const buf of buffers) {
        if (!ff.stdin.write(buf)) {
          await new Promise((r) => ff.stdin.once('drain', r));
        }
      }

      if (base % 120 === 0 || base + batchCount >= TOTAL_FRAMES) {
        const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
        console.log(`Rendered frame ${base + batchCount}/${TOTAL_FRAMES} (${elapsed}s)`);
      }
    }

    ff.stdin.end();
    await ffDone;
    console.log(`Encoded final MP4 -> ${finalMp4}`);

    // Extract key QA frames directly from the final MP4 (for visual inspection!)
    const dur = cues.dur || 32;
    const qaTimes = [
      0.2,
      Number((cues.beats[0].clauses[0]?.words[1]?.s + 0.3 || 1.8).toFixed(1)),
      Number((cues.beats[0].clauses[1]?.words[1]?.s + 0.1 || 4.1).toFixed(1)),
      Number((cues.beats[1].clauses[0]?.words[1]?.s + 0.1 || 6.4).toFixed(1)),
      Number((cues.beats[1].clauses[1]?.words[1]?.s + 0.1 || 8.9).toFixed(1)),
      Number((cues.beats[2].clauses[1]?.words[2]?.s + 0.1 || 14.5).toFixed(1)),
      Number((cues.beats[3].clauses[1]?.words[1]?.s + 0.1 || 18.2).toFixed(1)),
      Number((cues.beats[4].clauses[0]?.words[2]?.s + 0.1 || 23.0).toFixed(1)),
      Number((cues.beats[4].clauses[1]?.words[3]?.s + 0.1 || 27.6).toFixed(1)),
      Number((dur - 1.4).toFixed(1)),
    ];
    const qaLabels = [
      'Masuk + HARI 1',
      'Kampung Amanah',
      'Saya Doang',
      'Tunjuk Bendera',
      'Kucing Oranye',
      'Punya Kalian',
      'Hitung Jari',
      'Cek Papan 0',
      'Ngobrol Kucing',
      'Kartu Penutup',
    ];
    const manifest = [];
    for (let i = 0; i < qaTimes.length; i++) {
      const ts = qaTimes[i];
      const fname = `qa_${String(i + 1).padStart(2, '0')}.png`;
      const outPng = path.join(qaDir, fname);
      execSync(
        `ffmpeg -y -loglevel error -ss ${ts} -i "${finalMp4}" -frames:v 1 -vf scale=360:640 "${outPng}"`
      );
      manifest.push({
        sec: ts,
        label: `${ts.toFixed(1)}s · ${qaLabels[i]}`,
        src: `/qa/${fname}`,
      });
    }
    fs.writeFileSync(path.join(qaDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // Build 5x2 contact sheet for fast visual QA
    execSync(
      `ffmpeg -y -loglevel error -pattern_type glob -i "${qaDir}/qa_*.png" -filter_complex "tile=5x2:padding=8:color=0x18181b" "${path.join(qaDir, 'qa_sheet.jpg')}"`
    );
    console.log(`Generated QA contact sheet -> ${path.join(qaDir, 'qa_sheet.jpg')}`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
