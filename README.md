# jakubpacocha.com

Live site: [jakubpacocha.com](https://jakubpacocha.com)

---

## Overview

A zero-build static personal portfolio and curriculum vitae featuring self-hosted Geist typography, canvas click-spark & tactile audio/haptic feedback, a live GitHub contribution calendar, collapsible CV exploration and headless Chrome PDF export.

- **Portfolio (`index.html`)**: Identity header with live animated clock, audio/theme toggles, real-time GitHub contribution strip, filterable project gallery, writing index, focus summary and GSAP curtain-reveal footer.
- **Curriculum Vitae (`cv.html`)**: Collapsible work history, technical capabilities and education entries with live tag filtering and print-ready layout.
- **Resume Export (`assets/resume.pdf`)**: Purpose-designed, ATS-friendly A4 PDF generated directly from the structured data in `cv.html`.

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18 (UMD), Tailwind CSS (CDN), SVG / Canvas 2D, Web Audio API |
| **Animation & Motion** | Framer Motion, GSAP (`ScrollTrigger`), CSS transitions & keyframes |
| **Typography** | Self-hosted `Geist` variable font (`assets/fonts/Geist-Variable.woff2`) |
| **Tooling** | Bun / Node, Puppeteer (`scripts/generate-pdf.js`) |

*No build step is required - serve the repository statically (e.g. `bunx serve .` or `python3 -m http.server`) or open `index.html` / `cv.html` directly.*

## Project Structure

```
.
├── index.html                  # Main portfolio
├── cv.html                     # Curriculum vitae
├── assets/
│   ├── favicon.png             # Site & manifest icon
│   ├── og-image.jpg            # Open Graph / Twitter preview card
│   ├── resume.pdf              # Generated A4 resume
│   └── fonts/
│       └── Geist-Variable.woff2
├── scripts/
│   ├── generate-pdf.js         # CLI orchestrator compiling cv.html -> assets/resume.pdf
│   ├── extract-cv.js           # Extracts & validates structured CV data from cv.html
│   ├── resume-template.js      # Dedicated ATS-friendly A4 HTML/CSS resume template
│   └── pdf-metadata.js         # Appends standard PDF /Info metadata (Title, Author, etc.)
├── robots.txt                  # Crawler directives
├── sitemap.xml                 # XML sitemap
├── site.webmanifest            # Web app manifest
├── humans.txt                  # Author & stack metadata
├── llms.txt                    # Structured summary for AI crawlers
├── _headers                    # Static hosting security & cache headers
├── package.json                # PDF export script dependencies
└── .gitignore
```

## PDF Generation

`assets/resume.pdf` is generated from `cv.html` as the single source of truth using a dedicated, ATS-friendly A4 resume template (completely separate from the website's visual UI and rendered offline using the bundled `Geist` font).

### Workflow

1. Edit your content in `cv.html` (`EXPERIENCE_DATA`, `EDUCATION_DATA`, `SKILL_MATRIX`, header summary/contact links, or JSON-LD metadata).
2. Regenerate the PDF:

```bash
bun install
bun run generate-pdf
```

*(Works with `npm run generate-pdf` as well; requires Node.js and Puppeteer's bundled Chromium, or set `PUPPETEER_EXECUTABLE_PATH` to a local Chrome/Chromium binary.)*

### Optional CLI Flags

- Inspect the extracted JSON data without rendering a PDF: `node scripts/generate-pdf.js --dump-json`
- Write to a custom output path: `node scripts/generate-pdf.js --out /path/to/resume.pdf`
- Save the intermediate resume HTML for inspection: `node scripts/generate-pdf.js --debug-html /tmp/resume.html`

## License

MIT
