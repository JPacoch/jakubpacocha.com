'use strict';

const fs = require('fs');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSummary(segments) {
  if (!Array.isArray(segments) || !segments.length) return '';

  let html = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const prev = segments[i - 1];
    const needsSpace =
      i > 0 &&
      seg.text &&
      !/^[.,;:!?)]/.test(seg.text) &&
      !(prev && prev.text && /[([{"']$/.test(prev.text));

    if (needsSpace) html += ' ';

    if (seg.type === 'link') {
      html += `<a class="inline-link" href="${escapeHtml(seg.href)}">${escapeHtml(seg.text)}</a>`;
    } else {
      html += escapeHtml(seg.text);
    }
  }
  return html;
}

/**
 * Embeds local font files as base64 data URIs so PDF rendering is 100% offline and deterministic.
 */
function buildFontCss(fontConfig = {}) {
  const faces = [];

  if (Array.isArray(fontConfig.files)) {
    for (const f of fontConfig.files) {
      if (!f || !f.path || !fs.existsSync(f.path)) continue;
      const b64 = fs.readFileSync(f.path).toString('base64');
      const mime = f.format === 'woff2' ? 'font/woff2' : 'font/ttf';
      const fmt = f.format === 'woff2' ? 'woff2' : 'truetype';
      faces.push(`
        @font-face {
          font-family: '${f.family}';
          src: url(data:${mime};base64,${b64}) format('${fmt}');
          font-weight: ${f.weight || '400'};
          font-style: ${f.style || 'normal'};
        }
      `);
    }
  }

  return faces.join('\n');
}

/**
 * Renders a purpose-designed, ATS-friendly, single-column A4 resume HTML document
 * strictly separated from the portfolio website's visual design.
 */
function renderResumeHtml(cv, options = {}) {
  const title = `${cv.name} - ${cv.headline || 'Resume'}`;
  const fontFamily = options.fontFamily || "'Geist', 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif";
  const fontCss = buildFontCss(options.fontConfig);

  const contactsHtml = cv.contacts
    .map((c) => `<a class="contact-link" href="${escapeHtml(c.href)}">${escapeHtml(c.label)}</a>`)
    .join('<span class="sep" aria-hidden="true"> / </span>');

  const summaryHtml = renderSummary(cv.summarySegments);

  const experienceHtml = cv.experience
    .map((exp) => {
      const bulletsHtml = (exp.bullets || [])
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join('\n');

      const stackLine =
        Array.isArray(exp.tags) && exp.tags.length > 0
          ? `<p class="entry-stack"><span class="stack-label">Focus:</span> ${escapeHtml(exp.tags.join(', '))}</p>`
          : '';

      return `
        <article class="entry">
          <div class="entry-head">
            <h3 class="entry-title">
              <span class="role-name">${escapeHtml(exp.role)}</span><span class="sep" aria-hidden="true"> - </span><span class="org-name">${escapeHtml(exp.company)}</span>${
                exp.domain ? `<span class="sep" aria-hidden="true"> / </span><span class="org-domain">${escapeHtml(exp.domain)}</span>` : ''
              }
            </h3>
            <span class="entry-date">${escapeHtml(exp.period)}</span>
          </div>
          <ul class="bullet-list">
            ${bulletsHtml}
          </ul>
          ${stackLine}
        </article>
      `;
    })
    .join('\n');

  const educationHtml = cv.education
    .map((edu) => {
      return `
        <article class="entry edu-entry">
          <div class="entry-head">
            <h3 class="entry-title"><span class="role-name">${escapeHtml(edu.degree)}</span></h3>
            <span class="entry-date">${escapeHtml(edu.year)}</span>
          </div>
          <p class="edu-org">${escapeHtml(edu.institution)}</p>
          ${edu.thesis ? `<p class="edu-detail">${escapeHtml(edu.thesis)}</p>` : ''}
        </article>
      `;
    })
    .join('\n');

  const skillsHtml = cv.skills
    .map((group) => {
      return `
        <li class="skill-row">
          <strong class="skill-category">${escapeHtml(group.category)}:</strong>
          <span class="skill-items">${escapeHtml((group.items || []).join(', '))}</span>
        </li>
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="author" content="${escapeHtml(cv.name)}" />
  ${cv.meta && cv.meta.description ? `<meta name="description" content="${escapeHtml(cv.meta.description)}" />` : ''}
  <style>
    ${fontCss}

    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #18181b;
      font-family: ${fontFamily};
      font-size: 9pt;
      line-height: 1.38;
      -webkit-font-smoothing: antialiased;
      font-kerning: normal;
      font-variant-numeric: tabular-nums;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .resume {
      width: 100%;
    }

    /* --- HEADER --- */
    .doc-header {
      padding-bottom: 8pt;
      margin-bottom: 9pt;
      border-bottom: 1.25pt solid #18181b;
    }

    .candidate-name {
      margin: 0;
      font-size: 18.5pt;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.1;
      color: #111113;
    }

    .candidate-headline {
      margin: 2.5pt 0 0 0;
      font-size: 10pt;
      font-weight: 600;
      color: #3f3f46;
      line-height: 1.3;
    }

    .candidate-location {
      font-weight: 400;
      color: #52525b;
    }

    .contact-bar {
      margin: 5pt 0 0 0;
      font-size: 8.4pt;
      line-height: 1.4;
      color: #3f3f46;
    }

    .contact-link {
      color: #18181b;
      border-bottom: 0.5pt solid #d4d4d8;
      padding-bottom: 0.5pt;
    }

    .sep {
      color: #71717a;
      font-weight: 400;
    }

    /* --- SECTIONS --- */
    .section {
      margin-bottom: 9.5pt;
    }

    .section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      margin: 0 0 5.5pt 0;
      padding-bottom: 2pt;
      border-bottom: 0.75pt solid #d4d4d8;
      font-size: 8.1pt;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: #7a1c38;
      break-after: avoid;
      page-break-after: avoid;
    }

    /* --- SUMMARY --- */
    .summary-text {
      margin: 0;
      font-size: 9pt;
      line-height: 1.42;
      color: #27272a;
    }

    .inline-link {
      color: #18181b;
      font-weight: 600;
      border-bottom: 0.5pt solid #a1a1aa;
    }

    /* --- EXPERIENCE & EDUCATION ENTRIES --- */
    .entry {
      margin-bottom: 7.5pt;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .entry:last-child {
      margin-bottom: 0;
    }

    .edu-entry {
      margin-bottom: 5.5pt;
    }

    .entry-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 10pt;
    }

    .entry-title {
      margin: 0;
      font-size: 9.4pt;
      font-weight: 400;
      line-height: 1.3;
      color: #111113;
      min-width: 0;
    }

    .role-name {
      font-weight: 700;
      color: #111113;
    }

    .org-name {
      font-weight: 600;
      color: #27272a;
    }

    .org-domain {
      font-weight: 400;
      color: #52525b;
    }

    .entry-date {
      font-size: 8.4pt;
      font-weight: 500;
      color: #52525b;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .bullet-list {
      margin: 3pt 0 0 0;
      padding-left: 12.5pt;
      list-style-type: disc;
      color: #27272a;
    }

    .bullet-list li {
      margin-bottom: 1.75pt;
      padding-left: 1pt;
      line-height: 1.38;
    }

    .bullet-list li:last-child {
      margin-bottom: 0;
    }

    .bullet-list li::marker {
      color: #52525b;
      font-size: 7.5pt;
    }

    .entry-stack {
      margin: 2.5pt 0 0 0;
      font-size: 8.1pt;
      line-height: 1.35;
      color: #52525b;
    }

    .stack-label {
      font-weight: 600;
      color: #3f3f46;
    }

    .edu-org {
      margin: 1pt 0 0 0;
      font-size: 8.7pt;
      font-weight: 600;
      line-height: 1.3;
      color: #3f3f46;
    }

    .edu-detail {
      margin: 1.75pt 0 0 0;
      font-size: 8.7pt;
      line-height: 1.38;
      color: #27272a;
    }

    /* --- SKILLS --- */
    .skills-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .skill-row {
      margin-bottom: 3pt;
      font-size: 8.8pt;
      line-height: 1.38;
      color: #27272a;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .skill-row:last-child {
      margin-bottom: 0;
    }

    .skill-category {
      font-weight: 700;
      color: #18181b;
    }

    .skill-items {
      color: #27272a;
    }
  </style>
</head>
<body>
  <main class="resume">
    <header class="doc-header">
      <h1 class="candidate-name">${escapeHtml(cv.name)}</h1>
      <p class="candidate-headline">${escapeHtml(cv.headline)}${
        cv.location ? `<span class="sep" aria-hidden="true"> / </span><span class="candidate-location">${escapeHtml(cv.location)}</span>` : ''
      }</p>
      <p class="contact-bar">${contactsHtml}</p>
    </header>

    ${
      summaryHtml
        ? `<section class="section" aria-labelledby="sec-summary">
      <h2 id="sec-summary" class="section-title">Summary</h2>
      <p class="summary-text">${summaryHtml}</p>
    </section>`
        : ''
    }

    <section class="section" aria-labelledby="sec-experience">
      <h2 id="sec-experience" class="section-title">Experience</h2>
      ${experienceHtml}
    </section>

    <section class="section" aria-labelledby="sec-education">
      <h2 id="sec-education" class="section-title">Education</h2>
      ${educationHtml}
    </section>

    <section class="section" aria-labelledby="sec-skills">
      <h2 id="sec-skills" class="section-title">Technical Skills</h2>
      <ul class="skills-list">
        ${skillsHtml}
      </ul>
    </section>
  </main>
</body>
</html>
`;
}

module.exports = {
  renderResumeHtml
};
