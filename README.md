# Global Lab

Global Lab is a source-preserving digital textbook and study companion. The
original lesson or uploaded file stays unchanged; Learn Your Way adds a
separate, source-anchored explanation, analogy, reading path, example, or quiz
only when the student asks for it.

## Current experience

1. A student can begin immediately and optionally add an interest or grade.
2. The library contains curated, source-attributed STEM textbooks and accepts
   student-owned learning files.
3. Learn Your Way offers six help modes without replacing the original text.
4. Presentation preferences are learned cautiously, shown to the student, and
   applied only after explicit approval.
5. The learner can inspect, edit, export, or delete learning data at any time.
6. Uploaded files and page images stay in the browser. Scanned pages and images
   use bundled, English-language on-device OCR on the focused page.
7. A student may explicitly enable cloud Koji for exact selected text from an
   upload. Whole uploaded pages and uploaded images are never sent to Gemini.

## Local development

    npm install
    npm test
    npm run dev

Live AI help for curated textbook content is optional. Copy .env.example to
.env and set GEMINI_API_KEY. The Vite development server uses that key from
the server process and exposes only the text-only /api/personalize route.
Never put a provider key in a VITE_ variable because those values are bundled
into browser code.

Without a key, Global Lab uses its local, source-grounded fallback. Uploaded
sources stay local by default. Cloud Koji is available only for bounded text
the student explicitly selects and approves; full pages and images remain local.

## Netlify deployment

Netlify Functions must be packaged by a Netlify build. Connect this repository
to Netlify for continuous deployment, or deploy the project root with the CLI:

    npx netlify-cli@latest login
    npx netlify-cli@latest link --name globallab
    npx netlify-cli@latest deploy --build --prod

The Netlify project must define `GEMINI_API_KEY` for the Functions runtime.
Dragging the prebuilt `dist` folder publishes the static site but does not deploy
the `/api/personalize` function.

## Quality checks

    npm run lint
    npm test
    npm run build

The learner profile, approved preferences, review history, cached companions,
and uploaded library metadata are stored in browser-local storage. Original
uploaded file bytes are kept in the browser's local file store.
