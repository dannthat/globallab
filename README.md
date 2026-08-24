# Global Lab

Global Lab is a profile-driven STEM study companion built around a **Kitabi**: a clean textbook page that keeps canonical science intact and adds personalized analogy cards only when a student asks for help.

## V3 experience

1. A first-visit profile saves one interest and an optional grade level on the device.
2. The library presents Biology plus coming-soon Physics, Chemistry, and Mathematics subjects.
3. Biology contains five source-attributed topic kits with sectioned reading, bold key terms, and KaTeX equations.
4. “Learn it your way” adds a separate analogy card below one section. The original textbook body never changes.
5. Gaming, sports, and music interests use hand-vetted analogies instantly. Other interests use Gemini, with a clearly marked no-key preview fallback.

## Local development

    npm install
    npm test
    npm run dev

To enable live custom analogies, copy .env.example to .env and add a Gemini API key.

## Quality checks

    npm run lint
    npm test
    npm run build

The student profile is stored only in browser localStorage. VITE_GEMINI_API_KEY is intentionally git-ignored. Because Vite exposes VITE_ values to browser code, this key setup is for local development only; public deployment should call Gemini through a server-side proxy.
