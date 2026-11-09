# jakubpacocha.com

Live site: [jakubpacocha.com](https://jakubpacocha.com)

---

## Overview

A client-side personal website featuring an interactive portfolio, a dedicated curriculum vitae view, and a headless Chrome script for generating print-accurate PDF resumes.

- **Portfolio (`index.html`)**: Interactive showcase, hero typography, project gallery, and GSAP scroll curtain-reveal footer.
- **Curriculum Vitae (`cv.html`)**: Complete work history, technical stack breakdown, and academic credentials.
- **Resume Export (`assets/resume.pdf`)**: A balanced 2-page A4 PDF rendered directly from the CV DOM.

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Tailwind CSS |
| **Animation & Motion** | Framer Motion, GSAP (ScrollTrigger), Lenis Smooth Scroll |
| **Typography** | Playfair Display, Inter, JetBrains Mono |
| **Tooling** | Bun, Puppeteer (Headless Chrome for PDF export) |

*No build step is required for the web pages — open `index.html` or `cv.html` directly in any modern browser.*

## Project Structure

```
.
├── index.html          # Main portfolio
├── cv.html             # Detailed curriculum vitae
├── generate-pdf.js     # Puppeteer script compiling cv.html -> resume.pdf
├── assets/
│   ├── favicon.png
│   └── resume.pdf      # Generated 2-page resume
├── package.json        # Dependencies for PDF tooling
└── .gitignore
```

## PDF Generation

To recompile the 2-page PDF snapshot from `cv.html`:

```bash
bun install
bun run generate-pdf
```

The script launches headless Chrome, isolates the CV document, applies print typography and layout constraints, and writes the output to `assets/resume.pdf`.

## License

MIT
