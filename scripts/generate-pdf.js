'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');
const { extractCvData } = require('./extract-cv');
const { renderResumeHtml } = require('./resume-template');
const { applyPdfMetadata } = require('./pdf-metadata');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE = path.join(REPO_ROOT, 'cv.html');
const DEFAULT_OUTPUT = path.join(REPO_ROOT, 'assets', 'resume.pdf');

function parseArgs(argv) {
  const opts = {
    source: DEFAULT_SOURCE,
    output: DEFAULT_OUTPUT,
    debugHtml: null,
    dumpJson: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--source' && argv[i + 1]) opts.source = path.resolve(argv[++i]);
    else if (arg === '--out' && argv[i + 1]) opts.output = path.resolve(argv[++i]);
    else if (arg === '--debug-html' && argv[i + 1]) opts.debugHtml = path.resolve(argv[++i]);
    else if (arg === '--dump-json') opts.dumpJson = true;
  }

  return opts;
}

function resolveChromeExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  try {
    const bundled = puppeteer.executablePath();
    if (bundled && fs.existsSync(bundled)) return bundled;
  } catch (_) {}

  const fallbacks = [
    '/home/pacocha/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome'
  ];
  for (const candidate of fallbacks) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

function resolveFontConfiguration() {
  // Prefer local bundled Geist variable font; fall back cleanly to system static TrueType fonts
  const geistWoff2 = path.join(REPO_ROOT, 'assets', 'fonts', 'Geist-Variable.woff2');
  const dejavuRegular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
  const dejavuBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

  const files = [];
  if (fs.existsSync(geistWoff2)) {
    files.push({ family: 'Geist', path: geistWoff2, format: 'woff2', weight: '100 900', style: 'normal' });
  }
  if (fs.existsSync(dejavuRegular)) {
    files.push({ family: 'DejaVu Sans', path: dejavuRegular, format: 'truetype', weight: '400', style: 'normal' });
  }
  if (fs.existsSync(dejavuBold)) {
    files.push({ family: 'DejaVu Sans', path: dejavuBold, format: 'truetype', weight: '700', style: 'normal' });
  }

  return {
    fontFamily: "'Geist', 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif",
    fontConfig: { files }
  };
}

async function generateResumePdf(options = {}) {
  const sourcePath = options.source || DEFAULT_SOURCE;
  const outputPath = options.output || DEFAULT_OUTPUT;

  const cvData = extractCvData(sourcePath);

  if (options.dumpJson) {
    console.log(JSON.stringify(cvData, null, 2));
    return { cvData };
  }

  const fontSetup = resolveFontConfiguration();
  const html = renderResumeHtml(cvData, fontSetup);

  if (options.debugHtml) {
    fs.mkdirSync(path.dirname(options.debugHtml), { recursive: true });
    fs.writeFileSync(options.debugHtml, html, 'utf8');
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-pdf-'));
  const chromeConfigDir = path.join(tmpDir, 'config');
  const chromeCacheDir = path.join(tmpDir, 'cache');
  const chromeProfileDir = path.join(tmpDir, 'profile');
  fs.mkdirSync(chromeConfigDir, { recursive: true });
  fs.mkdirSync(chromeCacheDir, { recursive: true });

  let browser = null;
  try {
    const executablePath = resolveChromeExecutable();
    browser = await puppeteer.launch({
      executablePath,
      userDataDir: chromeProfileDir,
      env: {
        ...process.env,
        XDG_CONFIG_HOME: chromeConfigDir,
        XDG_CACHE_HOME: chromeCacheDir
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-crash-reporter',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none'
      ]
    });

    const page = await browser.newPage();

    // Enforce 100% deterministic offline rendering - block any external network requests
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.startsWith('data:') || url.startsWith('about:') || url.startsWith('file:')) {
        req.continue();
      } else {
        req.abort('blockedbyclient');
      }
    });

    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });

    const rawPdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      outline: true
    });

    const finalPdf = applyPdfMetadata(Buffer.from(rawPdf), {
      title: `${cvData.name} - ${cvData.headline || 'Curriculum Vitae'}`,
      author: cvData.name,
      subject: cvData.meta.description || `${cvData.headline} Resume`,
      keywords: cvData.meta.keywords,
      creator: 'jakubpacocha.com resume generator (scripts/generate-pdf.js)',
      producer: 'Headless Chrome / Skia PDF'
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, finalPdf);

    return {
      cvData,
      outputPath,
      bytes: finalPdf.length
    };
  } finally {
    if (browser) {
      await browser.close();
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  generateResumePdf(opts)
    .then((res) => {
      if (opts.dumpJson) return;
      const kb = (res.bytes / 1024).toFixed(1);
      console.log(
        `Generated ${path.relative(REPO_ROOT, res.outputPath)} (${kb} KB) from ${path.relative(
          REPO_ROOT,
          opts.source
        )} - ${res.cvData.experience.length} roles, ${res.cvData.education.length} education entries, ${res.cvData.skills.length} skill groups.`
      );
    })
    .catch((err) => {
      console.error('[resume-pdf] Generation failed:', err);
      process.exitCode = 1;
    });
}

module.exports = { generateResumePdf };
