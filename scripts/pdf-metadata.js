'use strict';

/**
 * Encodes a JavaScript string as a PDF string object:
 * - Pure printable ASCII uses literal string `(...)` with escaped parens/backslashes
 * - Any non-ASCII Unicode characters use UTF-16BE hex string `<FEFF...>` per PDF 1.4+ spec
 */
function encodePdfString(value) {
  const str = String(value || '');
  let isAscii = true;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) {
      isAscii = false;
      break;
    }
  }

  if (isAscii) {
    return '(' + str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)') + ')';
  }

  const hex = ['FEFF'];
  for (let i = 0; i < str.length; i++) {
    hex.push(str.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'));
  }
  return '<' + hex.join('') + '>';
}

function formatPdfDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const d = date instanceof Date ? date : new Date();
  return `D:${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/**
 * Appends a spec-compliant PDF 1.4 incremental update with a fresh `/Info` dictionary
 * containing Title, Author, Subject, Keywords, Creator, Producer, CreationDate, and ModDate.
 * Leaves all original PDF objects, tagged structure trees, fonts, and byte offsets untouched.
 */
function applyPdfMetadata(pdfBuffer, metadata = {}) {
  const buf = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  const tailSize = Math.min(buf.length, 4096);
  const tailText = buf.subarray(buf.length - tailSize).toString('latin1');

  const trailerMatch = tailText.match(/trailer\s*<<([\s\S]*?)>>\s*startxref\s+(\d+)\s+%%EOF\s*$/);
  if (!trailerMatch) {
    // Non-classic xref stream PDF; return unmodified rather than corrupting
    return buf;
  }

  const trailerBody = trailerMatch[1];
  const prevXrefOffset = Number(trailerMatch[2]);
  const sizeMatch = trailerBody.match(/\/Size\s+(\d+)/);
  const rootMatch = trailerBody.match(/\/Root\s+(\d+\s+\d+\s+R)/);
  if (!sizeMatch || !rootMatch) {
    return buf;
  }

  const prevSize = Number(sizeMatch[1]);
  const rootRef = rootMatch[1];
  const infoObjNum = prevSize;
  const newSize = prevSize + 1;

  const nowPdf = formatPdfDate(metadata.date || new Date());
  const entries = [];
  if (metadata.title) entries.push(`/Title ${encodePdfString(metadata.title)}`);
  if (metadata.author) entries.push(`/Author ${encodePdfString(metadata.author)}`);
  if (metadata.subject) entries.push(`/Subject ${encodePdfString(metadata.subject)}`);
  if (metadata.keywords) entries.push(`/Keywords ${encodePdfString(metadata.keywords)}`);
  if (metadata.creator) entries.push(`/Creator ${encodePdfString(metadata.creator)}`);
  if (metadata.producer) entries.push(`/Producer ${encodePdfString(metadata.producer)}`);
  entries.push(`/CreationDate ${encodePdfString(nowPdf)}`);
  entries.push(`/ModDate ${encodePdfString(nowPdf)}`);

  // Ensure incremental update begins on a clean newline
  const prefix = buf[buf.length - 1] === 0x0a ? '' : '\n';
  const prefixBuf = Buffer.from(prefix, 'latin1');
  const objOffset = buf.length + prefixBuf.length;

  const objContent = `${infoObjNum} 0 obj\n<<\n${entries.join('\n')}\n>>\nendobj\n`;
  const objBuf = Buffer.from(objContent, 'latin1');
  const xrefOffset = objOffset + objBuf.length;

  const paddedOffset = String(objOffset).padStart(10, '0');
  const xrefContent =
    `xref\n` +
    `${infoObjNum} 1\n` +
    `${paddedOffset} 00000 n \n` +
    `trailer\n` +
    `<< /Size ${newSize} /Root ${rootRef} /Info ${infoObjNum} 0 R /Prev ${prevXrefOffset} >>\n` +
    `startxref\n` +
    `${xrefOffset}\n` +
    `%%EOF\n`;

  return Buffer.concat([buf, prefixBuf, objBuf, Buffer.from(xrefContent, 'latin1')]);
}

module.exports = {
  applyPdfMetadata,
  encodePdfString
};
