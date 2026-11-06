const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
    '/home/pacocha/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome';

  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--ignore-certificate-errors']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600 });
  
  const cvPath = path.resolve(__dirname, 'cv.html');
  await page.goto(`file://${cvPath}`, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    const sheet = document.querySelector('#experience').parentElement;
    document.body.innerHTML = '';
    document.body.appendChild(sheet);
    sheet.id = 'cv-sheet';

    // Remove buttons in header
    Array.from(sheet.querySelectorAll('a')).forEach(a => {
      if (a.innerText.includes('Contact Direct') || a.innerText.includes('Save PDF')) {
        a.parentElement?.remove();
      }
    });

    // Force clean page break before skills section
    const skillsSec = document.querySelector('#skills');
    if (skillsSec) {
      skillsSec.style.pageBreakBefore = 'always';
      skillsSec.style.breakBefore = 'page';
      skillsSec.style.paddingTop = '8px';
    }

    const style = document.createElement('style');
    style.innerHTML = `
      @page {
        size: A4 portrait;
        margin: 6mm 10mm 6mm 10mm;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
      }
      body {
        background: #ffffff !important;
        color: #111827 !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        zoom: 0.88;
      }
      #cv-sheet {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
      #cv-sheet > div:first-child {
        padding: 22px 26px !important;
        margin-bottom: 14px !important;
        border-radius: 16px !important;
      }
      #cv-sheet > div:first-child h1 {
        font-size: 38px !important;
        margin-bottom: 6px !important;
        line-height: 1.1 !important;
      }
      #cv-sheet > div:first-child p {
        font-size: 13.5px !important;
        line-height: 1.45 !important;
      }
      #cv-sheet > div:first-child .pb-8 {
        padding-bottom: 10px !important;
        margin-bottom: 12px !important;
      }
      section {
        margin-bottom: 14px !important;
      }
      section h2 {
        font-size: 20px !important;
      }
      section .mb-6 {
        margin-bottom: 10px !important;
      }
      #experience .bg-white {
        border-radius: 16px !important;
      }
      #experience .grid {
        display: grid !important;
        grid-template-columns: 210px 1fr !important;
        gap: 16px !important;
        padding: 13px 18px !important;
        break-inside: avoid !important;
      }
      #experience h3 {
        font-size: 17px !important;
        margin-bottom: 4px !important;
      }
      #experience ul {
        margin-bottom: 6px !important;
        gap: 4px !important;
      }
      #experience ul li {
        font-size: 12.5px !important;
        line-height: 1.35 !important;
      }
      #skills .grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 12px !important;
      }
      #skills .p-6 {
        padding: 13px 16px !important;
        border-radius: 14px !important;
        break-inside: avoid !important;
      }
      #skills ul {
        gap: 5px !important;
      }
      #skills li {
        font-size: 12px !important;
      }
      #education .bg-white {
        border-radius: 16px !important;
      }
      #education .grid {
        display: grid !important;
        grid-template-columns: 210px 1fr !important;
        gap: 16px !important;
        padding: 13px 18px !important;
        break-inside: avoid !important;
      }
      #education h3 {
        font-size: 16px !important;
        margin-bottom: 2px !important;
      }
      #education p {
        font-size: 12.5px !important;
        margin-bottom: 5px !important;
        line-height: 1.35 !important;
      }
    `;
    document.head.appendChild(style);
  });

  const outputPath = path.resolve(__dirname, 'assets/resume.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '6mm', right: '10mm', bottom: '6mm', left: '10mm' }
  });

  console.log(`Successfully generated PDF at: ${outputPath}`);
  await browser.close();
})();
