# Jer Salamat

Web app for the NASA Space Apps Challenge 2026, challenge "Field Shift: Adapting
Farms with NASA Data". It helps farmers in the Chuy Valley, Kyrgyzstan compare
crop rotation plans using 40 years of NASA POWER climate data.

**Status: design and structure only.** The recommendation logic and the NASA
POWER calls are not connected yet. Every chart, score and crop sequence on the
results page is a labelled placeholder.

## Run

```bash
npm install
npm run dev        # local dev server
npm run build      # type check + production build
npm run build:globe  # redraw public/globe-fallback.svg
```

## Structure

```
src/
  core/        Framework-free domain types (no React). Logic goes here later.
  content/     UI copy: questions, sources, placeholder content.
  state/       Theme and session (field + answers) providers.
  hooks/       useTokens (CSS variables for canvas libraries), device checks.
  styles/      tokens.css — all design tokens, light and dark.
  components/
    ui/        Button, Card, Badge, StepProgress, InfoTooltip, Accordion,
               CropIcon, ScoreBar, Switch, LoadingSkeleton, EmptyState, ErrorState
    layout/    Header, Footer, page containers
    earth/     3D hero (lazy) and its static fallback
    map/       Leaflet field picker (lazy)
    results/   ChartCard, RotationCard
  pages/       Landing, Field, Questions, Results, About
video/         Note on a future Remotion demo video (not part of the site)
```

## Design system

- Tokens live in `src/styles/tokens.css` and are mapped to Tailwind in
  `tailwind.config.ts`. The default Tailwind palette is removed, so components
  can only use token colours.
- 60-30-10: warm neutral surfaces, field green for structure, wheat gold only
  for primary buttons and key highlights.
- Chart colours are a separate family. Each chart also has its own form
  (line, bars, area), so colour is never the only signal.
- Data labels (`Badge`): Historical NASA data, Your answers, Estimate,
  Hypothetical scenario, Placeholder.

## Data and credits

- Climate data: NASA POWER.
- Map: OpenStreetMap contributors.
- Globe outlines: Natural Earth, via the `world-atlas` package.
- No NASA logos or branding are used. No photos of people.

## Languages

English (default) and Russian. Dictionaries: `src/i18n/en.ts`, `src/i18n/ru.ts`
(`useT()` hook). The rotation engine returns message keys, so plans are
translated too. Check that both dictionaries match: `npm run i18n:check`.
To add Kyrgyz, add `ky.ts` and register it in `src/i18n/index.tsx`.

## Data sources and policy

- NASA POWER is the only source of environmental numbers.
- `src/data/sources.json`: every reference source with url, year, unit and limits.
- `src/data/rotations.json`: FAO general water-need ranges per crop (mm per
  growing period; reference only, not irrigation), FAO rotation guidance,
  current-rotation presets, and the published regional reference rotation
  (Volkov & Denisov). Crops follow Sokuluk District (Kyrgyz ESMF, 2024).
- Income is never estimated: there is no verified local yield, price or cost data.
