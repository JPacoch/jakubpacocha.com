# jakubpacocha.com

Live site: [jakubpacocha.com](https://jakubpacocha.com)

---

## Overview

A zero-build static personal portfolio and curriculum vitae featuring self-hosted Geist typography, canvas click-spark & tactile audio/haptic feedback, a live GitHub contribution calendar, collapsible CV exploration, and headless Chrome PDF export.

- **Portfolio (`index.html`)**: Identity header with live animated clock, audio/theme toggles, real-time GitHub contribution strip, filterable project gallery, writing index, focus summary, and GSAP curtain-reveal footer.
- **Curriculum Vitae (`cv.html`)**: Collapsible work history, technical capabilities, and education entries with live tag filtering and print-ready layout.
- **Resume Export (`assets/resume.pdf`)**: A4 PDF rendered directly from `cv.html`.

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
│   └── generate-pdf.js         # Puppeteer script compiling cv.html -> assets/resume.pdf
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

To recompile `assets/resume.pdf` from `cv.html`:

```bash
bun install
bun run generate-pdf
```

## License

MIT
