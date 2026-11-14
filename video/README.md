# Demo video (not built yet)

This folder is a note only. No video code lives in the website, and neither
Remotion nor HyperFrames is a dependency of the app.

## Idea: a 30-second demo made with Remotion

Keep it as a separate project so it never affects the site bundle:

```bash
cd video
npx create-video@latest .
```

Suggested storyboard (30 s, 30 fps, 1080p, no people, no voices, no NASA logos):

| Time | Scene | Source |
|---|---|---|
| 0–5 s | Globe turns and moves in on the Chuy Valley | Screen capture of the landing hero |
| 5–10 s | A pin drops on a field near Sokuluk | Screen capture of `/field` |
| 10–16 s | Five questions, tapped one by one | Screen capture of `/questions` |
| 16–23 s | Three climate charts draw in | Screen capture of `/results` |
| 23–28 s | Three rotation plans slide in side by side | Screen capture of `/results` |
| 28–30 s | "Jer Salamat" title and "Data: NASA POWER" | Text only |

Rules to keep:

- Use the tokens in `src/styles/tokens.css` for colours and Manrope for type.
- Record only real screens of the app. Do not show placeholder charts as if
  they were real data: record after the NASA POWER data is connected.
- Text on screen in English. Music only if it is licensed for reuse.
- Any AI-generated image needs a visible "AI-generated" watermark.
