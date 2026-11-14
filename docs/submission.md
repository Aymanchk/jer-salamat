# NASA Space Apps Challenge 2026 — Submission Copy

Ready-to-paste English text for the official NASA Space Apps Challenge project page (*Challenge: "Field Shift: Adapting Farms with NASA Data"*). Every statement and number below comes directly from the live app and verified repository sources.

---

## Project Name

Jer Salamat — Adapting Crop Rotations in the Chuy Valley with NASA Climate Data

---

## High-Level Summary (≤ 3 sentences)

Jer Salamat (*"Healthy Land"* in Kyrgyz) is a mobile-first web app in English and Russian that helps farmers in Kyrgyzstan's Chuy Valley (Sokuluk District) adapt their crop rotations using 40 years (1986–2025) of NASA POWER agroclimatology records. Farmers place a pin on their field and answer 5 short questions about their current crops, soil, irrigation, summer water shortages, and priority to see how local temperature, precipitation, and root-zone soil wetness have changed since 1986 and compare their current crop sequence against three multi-year rotation plans (**Water saving**, **Soil health**, and **Market crops**). Every number carries a clear provenance badge, and the app never invents yields, prices, profits, or water-saving percentages.

---

## Link to Project / Demo

- **Live Web App:** https://jer-salamat.vercel.app
- **Source Code Repository:** https://github.com/Aymanchk/jer-salamat

---

## Detailed Description

### What It Does

**Jer Salamat** translates 40 years of NASA satellite- and model-derived agroclimatology records into a two-minute, field-ready crop rotation guide for farmers in the Chuy Valley (focused on Sokuluk District), Kyrgyzstan.

Most of Kyrgyzstan is mountainous; flat, irrigated farmland in the northern Chuy Valley is scarce and supports winter wheat, barley, grain maize, sugar beet, potatoes, vegetables, and forage crops watered by mountain rivers and canals. NASA POWER records for the Sokuluk area (`42.86° N, 74.30° E`) show that yearly mean air temperature has risen by **+1.3 °C along the 1986–2025 linear trend line** (**+0.32 °C per decade**, statistically significant; **+1.06 °C** comparing the 1986–1995 and 2016–2025 decade averages), while annual precipitation fluctuates between **197 mm and 599 mm** (40-year mean **347 mm/year**), with **2025** being both the hottest (**15.69 °C**) and driest (**197 mm**) year in the 40-year record. Warmer summers increase water loss from soil and crops just when canal water turns are tightest, while repeating winter wheat or water-intensive row crops wears out soil fertility and builds up pests.

### How It Works

1. **Pick a field (`/field`):** Farmers search their village via OpenStreetMap, tap a pre-cached demo location (`Sokuluk`, `Shopokov`, `Kyzyl-Tuu`), use browser GPS (used only to place the pin, never stored), or drag the pin onto their parcel.
2. **Answer 5 plain-language questions (`/questions`):** Farmers report (1) their current 2–3 year crop sequence, (2) soil texture (*light/sandy*, *medium/loam*, *heavy/clay*, *stony*), (3) irrigation source (*canal*, *well/pump*, *rain-only*), (4) summer water shortages (*often*, *sometimes*, *rarely*), and (5) their top priority (*save water*, *keep soil healthy*, *grow crops to sell*). *"I don't know"* is accepted on every question and adjusts the plan's confidence rating.
3. **Inspect 40 years of NASA climate (`/results#climate`):** The app queries the NASA POWER monthly point API (`1986–2025`, community `AG`) for `T2M`, `PRECTOTCORR`, and `GWETROOT` (falling back to cached NASA POWER data for the same ~50 km grid cell if offline), computes annual series and ordinary least squares (OLS) linear trends with *t*-test significance, summarizes what changed in plain language, and offers an optional **+2 °C hypothetical scenario** toggle explicitly labeled *Hypothetical — not a forecast*.
4. **Compare crop rotation plans (`/results#recommendation`):** A pure TypeScript rules engine compares the farmer's current crop sequence (or a published 6-field regional reference rotation when the farmer chose *"I don't know"*) against three 4-year alternatives:
   - **Water saving:** `Winter wheat → Beans or peas → Barley → Winter wheat` (FAO range: 425–613 mm/season)
   - **Soil health:** `Alfalfa (forage) → Alfalfa (forage) → Winter wheat → Beans or peas` (FAO range: 600–1088 mm/season)
   - **Market crops:** `Sugar beet → Winter wheat → Potato → Beans or peas` (FAO range: 463–650 mm/season; income is not estimated)
   A *"What makes your plan yours"* card re-runs the engine without each answer to show which answers changed the top plan, which already matched the farmer's priority, and what is shared regional NASA climate.

### Benefits & Goals

- **Designed for a phone in the field:** Works in English and Russian, in light and dark themes, with ≥ 44×44 px tap targets, zero horizontal overflow from 320 px to 1440 px, and offline-resilient cached NASA data for Sokuluk District.
- **Honest by design:** Every statement is tagged with its provenance (`Historical NASA data`, `Your answers`, `General guidance`, `Reference (FAO / published)`, or `Hypothetical scenario`). Because verified parcel-level yields, farm-gate prices, and input costs for Sokuluk are not available, income always reads *"Insufficient verified data"* rather than inventing profit or yield numbers.

### Tools, Languages & Technologies

- **Frontend:** React 19, TypeScript, Vite 8, React Router 7, Tailwind CSS 3, custom CSS design tokens (`src/styles/tokens.css`)
- **Climate & Recommendation Engine:** Framework-free TypeScript (`src/core/climate.ts`, `src/core/rotation.ts`)
- **Maps & Visualization:** Leaflet + React-Leaflet (OpenStreetMap + Esri backup tiles, Nominatim search), Chart.js + `react-chartjs-2`, Three.js + React Three Fiber (3D globe and valley terrain on the landing page with static SVG fallback), Motion (`motion/react`), Lucide icons
- **Deployment:** Vercel

---

## NASA Data

- **NASA POWER (Prediction Of Worldwide Energy Resources) — Agroclimatology (`AG`) Monthly Point API**
  - **Publisher:** NASA Langley Research Center (derived from NASA satellite observations and MERRA-2 assimilation model)
  - **Portal:** https://power.larc.nasa.gov/
  - **API Endpoint:** `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR,GWETROOT&community=AG&longitude=74.30&latitude=42.86&start=1986&end=2025&format=JSON`
  - **Parameters Used:**
    1. `T2M` — Air temperature at 2 metres (`°C`), aggregated from monthly means to day-weighted annual means (1986–2025).
    2. `PRECTOTCORR` — Precipitation corrected (`mm/day`), multiplied by the number of days in each month and summed across all 12 months to annual total precipitation (`mm/year`, 1986–2025).
    3. `GWETROOT` — Root-zone soil wetness (`0–1` dimensionless fraction, from `0` completely dry to `1` saturated, top ~1 m), aggregated from monthly means to day-weighted annual means (1986–2025).
  - **Spatial Resolution:** `0.5° × 0.625°` (~50 km regional grid).

---

## Space Agency Partner Data & Other References

No other space agency datasets were used. The following non-NASA sources are used strictly as clearly labeled agronomic reference or regional context (never as values computed from NASA data):

1. **Volkov & Denisov, *Land Management in the Kyrgyz Republic*, Chapter 21 (2025 upload):** Published 6-field crop rotation for irrigated land in the Chuy, Kemin, and Talas valleys (`Cereals with perennial grasses → Alfalfa → Alfalfa → Winter wheat → Sugar beet → Barley`), used as the labeled baseline reference when a farmer selects *"I don't know"* for their current rotation. Link: https://taek.edu.kg/wp-content/uploads/2025/01/Землеустройство-КР-Волков.pdf
2. **FAO *Irrigation Water Management, Training Manual 3: Crop Water Needs*, Chapter 2 (1986):** General reference water-need ranges per growing period (`mm/season`: wheat/barley 450–650 mm, grain maize 500–800 mm, sugar beet 550–750 mm, potato 500–700 mm, peas/beans 350–500 mm, alfalfa 800–1600 mm), used solely to compare relative water demand across crop sequences. Links: https://www.fao.org/4/s2022e/s2022e02.htm and https://www.fao.org/4/s2022e/s2022e04.htm
3. **FAO *Conservation Agriculture — Species Diversification* & *Soil Biology*:** General qualitative guidance on crop rotation, root depth diversity, pest/disease cycle interruption, and biological nitrogen fixation by legumes. Links: https://www.fao.org/conservation-agriculture/in-practice/species-diversification/en/ and https://www.fao.org/4/y5146e/y5146e0a.htm
4. **Government of the Kyrgyz Republic — *Environmental and Social Management Framework (ESMF), WSSUAP* (October 2024) & *Economist.kg* (Feb 2026):** Reference list of crops grown in Sokuluk District (wheat, barley, grain maize, sugar beet, potatoes, vegetables, forage crops, grain legumes, oilseeds). Links: https://tunuksuu.kg/wp-content/uploads/2024/11/KG_ESMF_WSSUAP_PIU_SIDDWSWD_RUS1.pdf and https://economist.kg/agriculture/2026/02/06/v-sokulukie-k-viesiennim-rabotam-podghotovili-38-tysiach-gha-torobaiev-provieril/
5. **National Statistical Committee of the Kyrgyz Republic (`stat.gov.kg`):** Noted as a potential future source for verified local yield and price data (not used in calculations today). Link: https://www.stat.gov.kg/ru/statistics/selskoe-hozyajstvo/
6. **OpenStreetMap & Natural Earth (`world-atlas`):** Map tiles, Nominatim village search, and globe/country outlines.

---

## Use of Artificial Intelligence (AI) / Use of SI

- **Use of AI:** AI coding assistants helped write code and text; the idea, research, data verification, and product decisions are the team's. No AI-generated images, faces, or voices are used anywhere in the application.
- **Use of SI / Scientific Units:** All physical and environmental quantities use standard metric / SI-compatible units with explicit labels: air temperature in degrees Celsius (`°C`), temperature trends in `°C per decade`, precipitation and FAO reference crop water ranges in millimetres (`mm/day` converted to `mm/year` or `mm per season`), root-zone soil wetness as a dimensionless fraction (`0–1` over the top ~1 m root zone), and spatial grid resolution in degrees (`0.5° × 0.625°`, ~50 km).
