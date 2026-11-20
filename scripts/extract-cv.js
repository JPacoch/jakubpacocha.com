'use strict';

const fs = require('fs');
const vm = require('vm');

/**
 * Extracts a balanced JS array literal for `const <varName> = [...]` from source text,
 * properly respecting string literals, template literals, and comments.
 */
function extractJsArrayLiteral(source, varName) {
  const declRe = new RegExp(`\\b(?:const|let|var)\\s+${varName}\\s*=\\s*\\[`);
  const match = declRe.exec(source);
  if (!match) {
    throw new Error(`Could not find declaration for "${varName}" in cv.html`);
  }

  const startIdx = match.index + match[0].length - 1; // points to '['
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let i = startIdx; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inSingle || inDouble || inTemplate) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (inSingle && ch === "'") inSingle = false;
      else if (inDouble && ch === '"') inDouble = false;
      else if (inTemplate && ch === '`') inTemplate = false;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      continue;
    }

    if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) {
        const literal = source.slice(startIdx, i + 1);
        const value = vm.runInNewContext(`(${literal})`, Object.create(null), {
          timeout: 500
        });
        if (!Array.isArray(value)) {
          throw new Error(`Extracted "${varName}" is not an array`);
        }
        return value;
      }
    }
  }

  throw new Error(`Unterminated array literal for "${varName}" in cv.html`);
}

function decodeHtmlEntities(text) {
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function cleanText(text) {
  return decodeHtmlEntities(String(text))
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

function extractJsonLdPerson(html) {
  const matches = [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of matches) {
    try {
      const parsed = JSON.parse(m[1]);
      const graph = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
      const person = graph.find((node) => node && node['@type'] === 'Person');
      if (person) return person;
    } catch (_) {
      // ignore non-matching JSON-LD blocks
    }
  }
  return null;
}

/**
 * Parses the summary paragraph from `<header>` in cv.html into structured text/link segments
 * so links (e.g., "From the Cabinet") remain clickable in the generated PDF.
 */
function extractHeaderDetails(babelScript) {
  const headerMatch = babelScript.match(/<header\b[^>]*>([\s\S]*?)<\/header>/);
  if (!headerMatch) {
    return { name: null, location: null, summarySegments: [], headerLinks: [] };
  }
  const header = headerMatch[1];

  const h1Match = header.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
  const name = h1Match ? cleanText(h1Match[1].replace(/<[^>]+>/g, '')) : null;

  // Locate subtitle (e.g. "Curriculum Vitae / Bydgoszcz, Poland") and summary paragraph
  const paragraphs = [...header.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
  let location = null;
  let summaryRaw = null;

  for (const p of paragraphs) {
    const plain = cleanText(p.replace(/\{[^}]*\}/g, ' ').replace(/<[^>]+>/g, ' '));
    if (!location && /curriculum vitae/i.test(plain) && plain.includes('/')) {
      const parts = plain.split('/');
      location = parts[parts.length - 1].trim();
    } else if (!summaryRaw && plain.length > 40) {
      summaryRaw = p;
    }
  }

  const summarySegments = [];
  if (summaryRaw) {
    // Remove icon-only reveal slots before tokenizing text & anchors
    const cleanedJsx = summaryRaw
      .replace(/<span\b[^>]*className="[^"]*reveal-slot[^"]*"[^>]*>[\s\S]*?<\/span>/g, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\{"\s*"\}/g, ' ');

    const anchorRe = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let lastIndex = 0;
    let m;
    while ((m = anchorRe.exec(cleanedJsx)) !== null) {
      const before = cleanText(cleanedJsx.slice(lastIndex, m.index).replace(/<[^>]+>/g, ' '));
      if (before) summarySegments.push({ type: 'text', text: before });

      const linkText = cleanText(m[2].replace(/<[^>]+>/g, ' '));
      if (linkText) {
        summarySegments.push({ type: 'link', text: linkText, href: m[1].trim() });
      }
      lastIndex = m.index + m[0].length;
    }

    const tail = cleanText(cleanedJsx.slice(lastIndex).replace(/<[^>]+>/g, ' '));
    if (tail) summarySegments.push({ type: 'text', text: tail });
  }

  // Extract email from header button/text if present
  const emailMatch = header.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;

  // Extract profile anchors inside header (excluding summary blog link)
  const summaryHrefs = new Set(summarySegments.filter((s) => s.type === 'link').map((s) => s.href));
  const headerLinks = [];
  const allAnchors = [...header.matchAll(/<a\b[^>]*href="(https?:\/\/[^"]+)"[^>]*>/g)];
  for (const a of allAnchors) {
    const href = a[1].trim();
    if (!summaryHrefs.has(href) && !headerLinks.includes(href)) {
      headerLinks.push(href);
    }
  }

  return { name, location, email, summarySegments, headerLinks };
}

function formatDisplayUrl(url) {
  return String(url)
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
}

/**
 * Extracts all structured CV data directly from `cv.html` (single source of truth).
 */
function extractCvData(cvHtmlPath) {
  const html = fs.readFileSync(cvHtmlPath, 'utf8');

  const babelMatch = html.match(/<script\s+type="text\/babel"[^>]*>([\s\S]*?)<\/script>/i);
  if (!babelMatch) {
    throw new Error(`Could not find <script type="text/babel"> in ${cvHtmlPath}`);
  }
  const babelScript = babelMatch[1];

  const person = extractJsonLdPerson(html);
  const header = extractHeaderDetails(babelScript);

  const experience = extractJsArrayLiteral(babelScript, 'EXPERIENCE_DATA');
  const skills = extractJsArrayLiteral(babelScript, 'SKILL_MATRIX');
  const education = extractJsArrayLiteral(babelScript, 'EDUCATION_DATA');

  const name = header.name || (person && person.name) || '';
  const headline = (person && person.jobTitle) || (experience[0] && experience[0].role) || '';
  const location =
    header.location ||
    (person && person.address
      ? [person.address.addressLocality, person.address.addressCountry].filter(Boolean).join(', ')
      : '');
  const email =
    header.email ||
    (person && person.email ? String(person.email).replace(/^mailto:/i, '').trim() : '');
  const website = (person && person.url) || '';

  // Build ordered contact links from cv.html (email, website, GitHub, LinkedIn; exclude X/Twitter for PDF)
  const contacts = [];
  if (email) {
    contacts.push({ id: 'email', label: email, href: `mailto:${email}` });
  }
  if (website) {
    contacts.push({ id: 'website', label: formatDisplayUrl(website), href: website });
  }

  const seenUrls = new Set(website ? [formatDisplayUrl(website).toLowerCase()] : []);
  const summaryHrefs = new Set(
    header.summarySegments.filter((s) => s.type === 'link').map((s) => formatDisplayUrl(s.href).toLowerCase())
  );

  const candidateUrls = [
    ...header.headerLinks,
    ...(person && Array.isArray(person.sameAs) ? person.sameAs : [])
  ];

  for (const href of candidateUrls) {
    const normalized = formatDisplayUrl(href);
    const key = normalized.toLowerCase();
    if (/^(?:x\.com|twitter\.com)(?:\/|$)/.test(key)) continue;
    if (seenUrls.has(key) || summaryHrefs.has(key)) continue;
    seenUrls.add(key);
    contacts.push({ id: key, label: normalized, href });
  }

  // Extract meta keywords/description for PDF metadata
  const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const metaKeywordsMatch = html.match(/<meta\s+name="keywords"\s+content="([^"]+)"/i);

  // Validation checks
  if (!name) throw new Error('Extracted CV data is missing candidate name');
  if (!experience.length) throw new Error('Extracted CV data has no experience entries');
  if (!education.length) throw new Error('Extracted CV data has no education entries');
  if (!skills.length) throw new Error('Extracted CV data has no skill categories');

  return {
    name,
    headline,
    location,
    email,
    website,
    contacts,
    summarySegments: header.summarySegments,
    experience,
    education,
    skills,
    meta: {
      description: metaDescMatch ? decodeHtmlEntities(metaDescMatch[1]) : '',
      keywords: metaKeywordsMatch ? decodeHtmlEntities(metaKeywordsMatch[1]) : ''
    }
  };
}

module.exports = {
  extractCvData,
  extractJsArrayLiteral,
  formatDisplayUrl
};
