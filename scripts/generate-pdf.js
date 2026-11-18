const path = require('path');
const puppeteer = require('puppeteer');

function createPdfPipelineMachine() {
  const transitions = {
    idle: { START: 'launchingBrowser' },
    launchingBrowser: { BROWSER_READY: 'loadingDocument', FAIL: 'failed' },
    loadingDocument: { DOCUMENT_LOADED: 'awaitingHydration', FAIL: 'failed' },
    awaitingHydration: { HYDRATED: 'applyingPrintLayout', FAIL: 'failed' },
    applyingPrintLayout: { LAYOUT_APPLIED: 'renderingPdf', FAIL: 'failed' },
    renderingPdf: { PDF_WRITTEN: 'closingBrowser', FAIL: 'failed' },
    closingBrowser: { CLOSED: 'completed' },
    completed: {},
    failed: {}
  };

  let state = 'idle';
  const history = [];

  return {
    get state() {
      return state;
    },
    get history() {
      return history.slice();
    },
    send(event, meta = {}) {
      const next = transitions[state] && transitions[state][event];
      if (!next) return state;
      const prev = state;
      state = next;
      history.push({ from: prev, event, to: next, timestamp: new Date().toISOString(), ...meta });
      return state;
    }
  };
}

(async () => {
  const pipeline = createPdfPipelineMachine();
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/home/pacocha/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome';

  let browser = null;

  try {
    pipeline.send('START');
    browser = await puppeteer.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--ignore-certificate-errors']
    });
    pipeline.send('BROWSER_READY');

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    const cvPath = path.resolve(__dirname, '../cv.html');
    await page.goto(`file://${cvPath}`, { waitUntil: 'networkidle0' });
    pipeline.send('DOCUMENT_LOADED');

    await page.waitForSelector('#experience', { timeout: 10000 });
    pipeline.send('HYDRATED');

    await page.evaluate(() => {
      // Force light print appearance and expand all CV sections
      document.documentElement.removeAttribute('data-theme');
      if (window.__APP_MACHINES__ && typeof window.__APP_MACHINES__.resetAll === 'function') {
        window.__APP_MACHINES__.resetAll();
      }
      if (window.__APP_MACHINES__ && window.__APP_MACHINES__.cvExplorer) {
        window.__APP_MACHINES__.cvExplorer.send('EXPAND_ALL');
      }

      const mainEl = document.getElementById('main-content');
      if (mainEl) {
        mainEl.style.boxShadow = 'none';
        mainEl.style.borderRadius = '0';
        mainEl.style.transform = 'none';
      }

      // Remove fixed curtain spacers, backdrop, footer, and UI-only chrome
      ['#footer-spacer', '#footer-container', '#footer-backdrop'].forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) el.remove();
      });
      document.querySelectorAll('.no-print').forEach((el) => el.remove());

      const style = document.createElement('style');
      style.textContent = `
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          animation: none !important;
          transition: none !important;
        }
        body {
          background: #ffffff !important;
          color: #26262a !important;
          zoom: 0.86;
        }
        [data-machine="cvExplorer"] {
          max-width: 100% !important;
          padding: 0 !important;
        }
        article, #skills > div > div {
          break-inside: avoid;
        }
      `;
      document.head.appendChild(style);
    });

    await new Promise((resolve) => setTimeout(resolve, 350));
    pipeline.send('LAYOUT_APPLIED');

    const outputPath = path.resolve(__dirname, '../assets/resume.pdf');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' }
    });
    pipeline.send('PDF_WRITTEN', { outputPath });

    console.log(`Successfully generated PDF at: ${outputPath} (pipeline state: ${pipeline.state})`);
  } catch (err) {
    pipeline.send('FAIL', { error: err.message });
    console.error(`[PDF Pipeline Failed in state=${pipeline.state}]:`, err);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
      pipeline.send('CLOSED');
    }
  }
})();
