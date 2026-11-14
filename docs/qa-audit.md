# Studio audit and QA — 14 Nov 2026

Checked at 360 × 780 and 1440 × 900, dark and light themes, in the dev server and the production build.

## Fixed in this pass
1. Phone hero: the globe sat behind the headline. It now sits above it, smaller, with a theme-safe scrim; hero text is more compact on phones.
2. Light theme: scrims were hard-coded dark. Space scenes (orbit, valley) now stay at night in both themes; the landing header matches; terrain fog no longer turns white.
3. Results "Your plan" card faded in from opacity 0; now visible immediately. Reveal animations start at 30% opacity, 300 ms.
4. Plan comparison: 4 cards in one row were cramped at 1440 (crop names ran together). Now a 2 × 2 grid.
5. Stepper: active label was truncated on 360 px ("F…"). Active step now takes the free space.
6. Field panel: coordinates overlapped "My location" on phones and were cut off on desktop. Button is icon-only on phones, full width on desktop.
7. Hidden scroll-story panels were still focusable by keyboard. They are now `inert` while hidden.
8. SEO: title, description and Open Graph tags updated to the new message.
9. 3D was skipped on any connection that was not "4g". Now only 2G and save-data skip it.
10. A scroll animation crashed the landing (offset 1.01 outside 0–1). Fixed.

## Open issues, ranked
1. **First 3D frame on a phone takes ~3 s** (three.js chunk is 243 kB gzip). The headline is readable at once, so this is cosmetic. Possible fix: preload the chunk after first paint.
2. **Lighthouse not run** in this environment. Tool pages do not load three.js; main bundle is 136 kB gzip. Run Lighthouse mobile on /field and /results after deploy (target ≥ 80).
3. **Safari and Firefox not tested** (only Chromium here). Check `backdrop-filter`, `color-mix()` and `inert` on Safari 16+ and Firefox.
4. **All 3 demo points share one NASA POWER grid cell**, so their charts are identical. Say this in the pitch or pick points in different cells.
5. **Crop traits are preliminary general guidance** (`src/data/rotations.json`). Nurlan should confirm or replace them; income levels especially.
6. Coach-mark dialog has no focus trap (Escape and buttons work).
7. Light theme: the dark valley section meets the light "How it works" section with a hard edge.

## Launch checklist
- [ ] Merge `design/visual-system` into `main`.
- [ ] Vercel: import the GitHub repo (framework Vite, build `npm run build`, output `dist`). `vercel.json` already rewrites routes to `index.html`.
- [ ] Open the deployed URL on a phone: landing, field search, questions, results, print.
- [ ] Lighthouse mobile on /field and /results.
- [ ] Quick check in Safari.
- [ ] Make the repo public before submission (user's call).
- [ ] Submission page: link the Vercel URL, name the data: NASA POWER (T2M, PRECTOTCORR, GWETROOT, monthly, 1986–2025).
