# Design direction: "From orbit to furrow"

**Story.** The site opens where NASA sees the planet: a dark Earth drawn in points of light, its atmosphere glowing at the rim. Scrolling dives the camera through the air to Kyrgyzstan; the border draws itself in neon and the Chuy Valley lights up. We land on a stylised valley with a field grid, where real NASA numbers hover as glowing tags. Then the tone shifts from awe to work: four plain steps, honest sources, one button. Emotional arc: **awe → trust → "I know what to do."**

**Two modes.** The landing is cinematic. The tool (Field, Questions, Results) is calm: the same palette and type, no heavy 3D, one task per screen, big tap targets, plain English, fast on a 360 px phone and slow internet. Clarity beats wow: any effect that slows a phone or hides meaning is cut.

**Composition.** Asymmetric. Text sits left on a gradient scrim, never over busy 3D. Large type, generous negative space, thin hairline rules instead of boxes where possible. Data is light: values glow, structure stays quiet.

**Typography.** Display: *Space Grotesk* (technical, a little mechanical — mission-control labels, numbers). Text: *Inter* (highly legible at 16 px). Both Google Fonts, self-hosted through Fontsource. Numbers use tabular figures. Labels in small caps-style tracking, sparingly.

**Palette (60-30-10).**
- 60% deep space / night soil: `#070B0A` → `#0C1412`.
- 30% field greens and teal surfaces: `#0F2A23`, `#15392F`, `#1E5145`.
- 10% signature neon, chlorophyll lime `#C6FF3D` with glow: primary action, the selected pin, key numbers. Never body text backgrounds.
- Data: temperature `#FF7A45`, precipitation `#3DD8FF`, soil wetness `#2EE6B8`. Each chart also has its own form (line / bars / area), so colour is never the only signal.
- Daylight theme for outdoors: same hues, no glow, accent darkened to `#4D7C0F` for WCAG AA.

**Materials and light.** Matte night surfaces, one rim light (the atmosphere), emissive data. No glossy plastic, no stock gradients, no glassy SaaS cards stacked in rows. Glass is used only where content floats over a map or a scene (stepper, search bar).

**Depth and atmosphere.** Fresnel atmosphere shader around the globe, a warm terminator with city-light specks on the night side, faint star dust. In the valley: fog falling off into distance, ridges of the Kyrgyz Ala-Too in the south.

**Camera language.** Slow, deliberate, physical. Entrance: fade + ease-in under 1.5 s. Scroll drives the camera along one path (orbit → descent → valley); no free spinning. Cursor adds a few degrees of parallax on desktop only. UI easing `cubic-bezier(0.2, 0.7, 0.2, 1)`, 200–600 ms; tool-page transitions under 250 ms.

**Motion rules.** Every animation explains something: the border drawing shows *where*, the count-up shows *how much*, charts drawing show *change over time*, the pin ring shows *your field*. `prefers-reduced-motion`, no WebGL, weak devices and slow connections get a static SVG Earth and instant states.

**Honesty.** Every number shows where it comes from: *Historical NASA data*, *Your answers*, *General guidance*, *Hypothetical*. The terrain is labelled *illustrative*. No people, no faces, no NASA logos.
