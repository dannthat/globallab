# Global Lab

Global Lab is a focused biology study companion that combines a ready-to-use content library with selective, interest-based analogy personalization.

V2 includes five topics:

- Cellular Respiration & ATP Synthesis
- Cell Membrane Transport
- DNA Expression
- Action Potentials
- Enzyme Kinetics

## Study modes

- **Cram:** concise, neutral, exam-focused definitions, stages, facts, and common mistakes.
- **Explorer:** a progressive three-question Socratic path with grounded scientific explanations and visually separate analogy cards.
- **Learning lenses:** Neutral, Gaming, Sports, Music, plus live Gemini-generated custom interests with a no-key mock fallback.
- **Topic memory:** the preferred mode is stored locally per topic in the browser.
- **Topic selector:** move between the five topic kits on desktop or mobile without losing each topic's saved mode.

## Local development

```bash
npm install
npm test
npm run dev
```

To enable live custom-interest generation, copy `.env.example` to `.env` and add a Gemini API key. The app remains fully usable with a clearly marked mock response when the key is absent.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

`VITE_GEMINI_API_KEY` is intentionally git-ignored. Because Vite exposes `VITE_` values to browser code, use this setup only for local development; a public deployment should call Gemini through a server-side proxy that protects the key.
