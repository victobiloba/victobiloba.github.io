# Victor Oluwatobiloba Ogundipe — Software Engineering Portfolio & CV

Interactive **Full-Stack & AI Systems Software Engineering Portfolio** and **ATS-ready Curriculum Vitae**, built with zero dependencies on modern web standards: `light-dark()`, native top-layer `<dialog>` and popovers, View Transitions, scroll-driven animations, container queries and headless Chromium PDF compilation.

## Design

- **Type:** Geist (UI and body), Geist Mono (labels and code), Instrument Serif italic for headline accents.
- **Theme:** graphite dark mode and warm-paper light mode with a single signal-orange accent, film grain and a soft top glow. Follows the OS setting, with a manual toggle.
- **Motion:** every animation has a `prefers-reduced-motion` fallback.

## Interactive features

| Feature | How to try it |
| :--- | :--- |
| Playable terminal | Type in the hero terminal or tap a suggestion. Try `help`, `projects`, `open 3`, `neofetch`, `contact`. ↑/↓ history, Tab completion, "did you mean". |
| Hidden commands | `sudo hire victor`, `matrix`, `coffee`, `ls`, `cat about.txt`, `hint`, `achievements`, `reset` |
| Command palette | `Ctrl K` / `⌘K` or `/`. Search projects by name or technology (e.g. "fastapi", "payments"), jump to sections, run actions. |
| Case studies | Click any card. Browse with ← / →, press **Simulate flow** to step through the pipeline. |
| Exploration progress | Floating ring shows case studies explored and jumps to the next one. Finishing all seven triggers confetti. |
| Achievements | Eight unlockable toasts for exploring the site. Progress is stored per visitor in `localStorage`. |
| Hero dot field | Dots swell toward the cursor and ripple on click. |
| Konami code | ↑↑↓↓←→←→BA toggles a layout-debug overlay. |

## What's inside

| Path | Purpose |
| :--- | :--- |
| `index.html` | Portfolio page: hero terminal, projects, stack, experience, contact, embedded CV view, case-study dialog and command palette |
| `cv.html` | Standalone print-first, single-column ATS CV (2-page full / 1-page concise toggle) |
| `Victor_Ogundipe_SWE_CV.pdf` | Compiled 2-page A4 vector-text PDF built from `cv.html` |
| `Victor_Ogundipe_SWE_CV.md` | Plain-text / Markdown version of the CV |
| `styles.css` | Design tokens, `light-dark()` colour system, layout, dialogs, palette, toasts and responsive rules |
| `js/data.js` | Single source of truth for profile, 7 featured systems, skills, experience and credentials |
| `js/app.js` | Rendering, theme, dialogs, view switcher, case-study browsing and pipeline simulation, palette items, explorer pill |
| `js/terminal.js` | Interactive hero terminal (commands, history, completion, easter eggs) |
| `js/palette.js` | Command palette (combobox + listbox pattern on a native `<dialog>`) |
| `js/achievements.js` | Achievements, exploration progress and toast notifications |
| `js/fx.js` | Confetti, count-up, text decode, hero dot field, matrix rain, card tilt |
| `scripts/generate-pdf.js` | Rebuilds the PDF from `cv.html` using headless Chrome or Edge |
| `server.js` | Zero-dependency Node.js HTTP server for local preview |
| `test/portfolio.test.js` | `node:test` suite for data, routes, PDF integrity and accessibility contracts |

## Quick start

```bash
# Run automated verification tests
npm test

# Start the local portfolio & CV server at http://localhost:4173
npm start

# Regenerate Victor_Ogundipe_SWE_CV.pdf after editing cv.html
npm run build:pdf
```

## Deployment

**Live:** https://victobiloba.github.io

The site is served by **GitHub Pages** straight from the `main` branch root, with no build step. Every push to `main` redeploys it within a minute or two. `.nojekyll` tells Pages to serve files as-is, so the Markdown CV and every asset are delivered unchanged.

After editing `cv.html`, run `npm run build:pdf` and commit the regenerated PDF so the download link stays current.

It also works unchanged on **Vercel**, **Cloudflare Pages** or **Netlify**:
- **Vercel:** run `npx vercel` inside this directory (`vercel.json` adds clean URLs and security headers).
