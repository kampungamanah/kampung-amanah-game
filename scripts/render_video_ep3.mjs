import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { chromium } from 'playwright-core';

const CHROME_PATH =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const cues = JSON.parse(fs.readFileSync(path.resolve('src/video/cues_ep3.json'), 'utf8'));
const TOTAL_FRAMES = cues.totalFrames;
const FPS = cues.fps;
const PORT = 3202;
const CONCURRENCY = Number(process.env.CONCURRENCY || 5);

const START_FRAME = Number(process.env.START_FRAME || 0);
const END_FRAME = Number(process.env.END_FRAME || TOTAL_FRAMES);
const OUT_VIDEO = process.env.OUT_VIDEO ? path.resolve(process.env.OUT_VIDEO) : null;
const FINALIZE_ONLY = process.env.FINALIZE_ONLY === '1';

function extractQaAssets(finalMp4, qaDir) {
  const b = cues.beats;
  const qaSpecs = [
    { ts: 1.2, label: 'HARI 3 Fly-Over 245' },
    { ts: Number((b[0].start + (b[0].end - b[0].start) * 0.72).toFixed(1)), label: 'Close-Up Komen + 245' },
    { ts: Number((b[1].utterances[0]?.start + 0.9 || b[1].start + 1.0).toFixed(1)), label: 'Dialog @virgod29' },
    { ts: Number((b[2].start + (b[2].end - b[2].start) * 0.25).toFixed(1)), label: 'Lahan Becek Semak' },
    { ts: Number((b[2].start + (b[2].end - b[2].start) * 0.80).toFixed(1)), label: 'Bola Nyangkut Sekolah' },
    { ts: Number((b[3].start + (b[3].end - b[3].start) * 0.55).toFixed(1)), label: 'Follow Cam Lahan Samping' },
    { ts: Number((b[4].start + (b[4].end - b[4].start) * 0.84).toFixed(1)), label: 'Lapangan Bola Jadi' },
    { ts: Number((b[5].utterances[0]?.start + 0.5 || b[5].start + 0.6).toFixed(1)), label: 'Dialog @isqi_sani2316' },
    { ts: Number((b[5].end - 0.7).toFixed(1)), label: 'Guru Masuk Sekolah' },
    { ts: Number((b[6].utterances[0]?.start + 0.9 || b[6].start + 1.0).toFixed(1)), label: 'Dialog @lida_aja_gin' },
    { ts: Number((b[6].end - 0.7).toFixed(1)), label: 'Guru Ngaji ke Masjid' },
    { ts: Number((b[7].utterances[0]?.start + 0.7 || b[7].start + 0.8).toFixed(1)), label: 'Dialog @rehannoperwan411' },
    { ts: Number((b[8].start + (b[8].end - b[8].start) * 0.50).toFixed(1)), label: 'Bangun 9 Rumah Warga' },
    { ts: Number((b[8].start + (b[8].end - b[8].start) * 0.88).toFixed(1)), label: 'Deretan Rumah Jadi' },
    { ts: Number((cues.dur - 1.0).toFixed(1)), label: 'Kucing + End Card' },
  ];

  // Clear old QA pngs
  for (const fn of fs.readdirSync(qaDir)) {
    if (fn.startsWith('qa_') && fn.endsWith('.png')) {
      fs.unlinkSync(path.join(qaDir, fn));
    }
  }

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
      src: `/qa_ep3/${fname}`,
    });
  }
  fs.writeFileSync(path.join(qaDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  execSync(
    `ffmpeg -y -loglevel error -pattern_type glob -i "${qaDir}/qa_*.png" -filter_complex "tile=5x3:padding=8:color=0x18181b" "${path.join(qaDir, 'qa_sheet.jpg')}"`
  );
  console.log(`Generated EP3 QA contact sheet -> ${path.join(qaDir, 'qa_sheet.jpg')}`);
}

async function main() {
  const qaDir = path.resolve('public/qa_ep3');
  fs.mkdirSync(qaDir, { recursive: true });
  const finalMp4 = path.resolve('public/kampung-amanah-ep3.mp4');
  const mixWav = path.resolve('public/audio/mix_ep3.wav');

  if (FINALIZE_ONLY) {
    const chunks = process.env.CHUNK_FILES
      ? process.env.CHUNK_FILES.split(',').map((p) => path.resolve(p.trim()))
      : [path.resolve('/tmp/ep3_part1.mp4'), path.resolve('/tmp/ep3_part2.mp4')];
    const concatTxt = '/tmp/ep3_concat.txt';
    fs.writeFileSync(concatTxt, chunks.map((p) => `file '${p}'`).join('\n') + '\n');
    execSync(
      `ffmpeg -y -loglevel error -f concat -safe 0 -i "${concatTxt}" -i "${mixWav}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${finalMp4}"`,
      { stdio: 'inherit' }
    );
    console.log(`Muxed chunked EP3 MP4 -> ${finalMp4}`);
    extractQaAssets(finalMp4, qaDir);
    return;
  }

  const distDir = path.resolve('dist');
  if (process.env.SKIP_BUILD !== '1') {
    console.log('Building production bundle for Episode 3...');
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
  console.log(`Static render server listening on http://127.0.0.1:${PORT}/?render=1&ep=3 [${START_FRAME}..${END_FRAME})`);

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
        await page.goto(`http://127.0.0.1:${PORT}/?render=1&ep=3`, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.__RENDER_READY__ === true, { timeout: 15000 });
        await page.evaluate((c) => {
          window.__SET_EP__?.(3);
          window.__SET_CUES__?.(c);
        }, cues);
        return page;
      })
    );

    const targetPath = OUT_VIDEO || finalMp4;
    const isChunk = Boolean(OUT_VIDEO);

    const ffmpegArgs = isChunk
      ? [
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
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          '-profile:v',
          'high',
          '-level',
          '4.1',
          '-tune',
          'animation',
          '-crf',
          '26',
          '-maxrate',
          '2400k',
          '-bufsize',
          '4800k',
          '-preset',
          'fast',
          '-an',
          targetPath,
        ]
      : [
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
          '-profile:v',
          'high',
          '-level',
          '4.1',
          '-tune',
          'animation',
          '-crf',
          '26',
          '-maxrate',
          '2400k',
          '-bufsize',
          '4800k',
          '-preset',
          'fast',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          '-shortest',
          '-movflags',
          '+faststart',
          targetPath,
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
    for (let base = START_FRAME; base < END_FRAME; base += CONCURRENCY) {
      const batchCount = Math.min(CONCURRENCY, END_FRAME - base);
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
          return page.screenshot({ type: 'jpeg', quality: 88 });
        })
      );

      for (const buf of buffers) {
        if (!ff.stdin.write(buf)) {
          await new Promise((r) => ff.stdin.once('drain', r));
        }
      }

      if ((base - START_FRAME) % 150 === 0 || base + batchCount >= END_FRAME) {
        const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
        console.log(`Rendered EP3 frame ${base + batchCount}/${END_FRAME} (${elapsed}s)`);
      }
    }

    ff.stdin.end();
    await ffDone;
    console.log(`Encoded EP3 -> ${targetPath}`);

    if (!isChunk) {
      extractQaAssets(finalMp4, qaDir);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
