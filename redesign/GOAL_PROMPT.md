# TASK: GlobalLab Reader — Premium Design Implementation
## Target Files: c:\Users\mhamm\Downloads\globallab\redesign\DESIGN.md, c:\Users\mhamm\Downloads\globallab\redesign\mockup_homepage.png, c:\Users\mhamm\Downloads\globallab\redesign\mockup_reader_sticky_note.png, c:\Users\mhamm\Downloads\globallab\src\index.css, c:\Users\mhamm\Downloads\globallab\src\gl-transitions.css, c:\Users\mhamm\Downloads\globallab\src\components\TextbookSection.tsx, c:\Users\mhamm\Downloads\globallab\src\components\KitabiPage.tsx, c:\Users\mhamm\Downloads\globallab\src\components\LearningCompanion.tsx, c:\Users\mhamm\Downloads\globallab\src\components\HomePage.tsx, c:\Users\mhamm\Downloads\globallab\src\components\LibraryPage.tsx
## Priority / Mode: CRITICAL — PERFECTIONIST. Do not stop until visual output matches the mockups exactly.

---

## 0. MANDATORY FIRST STEP — READ BEFORE ANY CODE

Before writing a single line of code you MUST:

1. Read `c:\Users\mhamm\Downloads\globallab\redesign\DESIGN.md` in full
2. View both reference images:
   - `c:\Users\mhamm\Downloads\globallab\redesign\mockup_homepage.png`
   - `c:\Users\mhamm\Downloads\globallab\redesign\mockup_reader_sticky_note.png`
3. Run `npx vite --port 5174` in `c:\Users\mhamm\Downloads\globallab` and inspect the live app
4. Read the current CSS in `src\index.css` (search for tbp-reading-surface, tbp-companion-panel, gl-home)
5. Only THEN begin making changes

Do not guess what the current state is. Read it. See it. Then act.

---

## 1. OBJECTIVE

Make the GlobalLab app match the visual quality and layout of the approved mockup images exactly. The gap between what currently renders and what the mockups show must be zero. The end state is a premium editorial reading room: a cream paper card floating on dark warm leather, overhead lamp fixed to the viewport, a sticky-note companion that springs in beside the text when personalization is triggered, and directional section slides. Every pixel must feel intentional.

You are not done until a human looking at the live app and the mockup images sees the same thing.

---

## 2. CONTEXT & INVARIANTS

**Project root:** `c:\Users\mhamm\Downloads\globallab`
**Tech stack:** React + TypeScript + Vite + CSS custom properties (no Tailwind, no CSS-in-JS)
**Design tokens:** All in `src\index.css` `:root` block — `--gl-backdrop`, `--gl-paper`, `--gl-amber`, `--gl-paper-ink` etc.
**Test suite:** 128 tests must stay green. Run `npx vitest run` after every significant change.
**TypeScript:** `npx tsc --noEmit` must return 0 errors after every change.
**Build:** `npx vite build` must exit cleanly.
**CSS append strategy:** New CSS rules are appended at the bottom of `src\index.css` — later rules override earlier ones. This is intentional. Do not restructure the file.

**Non-goals — DO NOT touch:**
- Any TypeScript logic, state management, AI calls, quiz logic, learner model
- Test files (unless a test breaks due to a class name change — fix the test, not the logic)
- `src\knowledge\` data files
- Any file not related to visual presentation

**Invariants:**
- Paper card is ALWAYS cream (`#f5f0e4`) in both dark and light mode — never inverts
- Companion is ALWAYS a sticky note — never a full-panel takeover
- Upload is ALWAYS first-class accessible from the homepage
- No inline `style={{ display: 'flex' }}` on elements tested by testing-library — use CSS classes instead (causes jsdom crash)
- `window.matchMedia?.()` with optional chain — jsdom does not define `matchMedia`
- Two `beforeEach` stubs in test files: `getComputedStyle` safe wrapper + `matchMedia` stub

---

## 3. ROOT CAUSE / DIAGNOSIS

The current implementation has CSS written for the new design but several layers of old CSS earlier in `index.css` are overriding it. Specific known issues:

1. **Companion panel** — `lc-card` has `background: var(--gl-companion-surface)` which is a light grey, overriding the sticky note `#f8eecc` background. The `tbp-companion-panel` rules need `!important` overrides on all background/shadow/transform properties, or the `lc-card` default must be reset inside the companion context.

2. **Overhead lamp** — Currently on `.tbp-reading-surface::before` using `position: absolute` — this scrolls with the card. It must be moved to the `.textbook-reader-page` or `.ubr-reader-stage` element using `background-attachment: fixed` so the light source is fixed to the viewport.

3. **Card visibility on homepage/library** — Subject cards and file cards blend into the dark background. They need explicit border (`rgb(255 255 255 / 0.10)`) and box-shadow (`0 4px 20px rgb(0 0 0 / 0.30)`).

4. **Text contrast in dark mode** — Some text elements inherit a light colour from the body/root dark mode overrides instead of the paper-ink token. All text inside `.tbp-reading-surface` must explicitly declare `color: #1a1208` regardless of mode.

5. **Reader stage background** — `.textbook-reader-wrap` and `.ubr-reader-body` do not always have `background: var(--gl-backdrop)` — without it the leather dark background doesn't appear and the paper has no surface to float on.

---

## 4. STEP-BY-STEP INSTRUCTIONS

### Step 1 — Read + inspect (mandatory, no code yet)
- Read `redesign\DESIGN.md` fully
- View both mockup images
- Run `npx vite --port 5174`, open browser, navigate to reader
- Note every visual gap between live and mockup

### Step 2 — Fix the reader stage background
In `src\index.css` (append at bottom):
```css
.kitabi-shell, .ubr-reader-shell,
.textbook-reader-wrap, .ubr-reader-body,
.textbook-reader-stage, .ubr-reader-stage,
.textbook-reader-page {
  background: var(--gl-backdrop, #0a0907);
}
```

### Step 3 — Fix overhead lamp (fixed to viewport)
Remove the lamp from `.tbp-reading-surface::before` (set `display: none`).
Add to `.textbook-reader-page`:
```css
.textbook-reader-page {
  background:
    radial-gradient(
      ellipse 55% 28% at 50% 0px,
      rgb(255 245 195 / 0.10) 0%,
      transparent 65%
    ),
    var(--gl-backdrop, #0a0907);
  background-attachment: fixed, scroll;
}
```

### Step 4 — Fix paper card floating
`.tbp-reading-surface` must:
- Have `margin: 40px auto 60px` (breathing room all sides)
- Have `max-width: 680px` (not full width)
- Have layered box-shadow: `0 1px 2px rgb(0 0 0 / 0.20), 0 4px 12px rgb(0 0 0 / 0.30), 0 16px 40px rgb(0 0 0 / 0.40), 0 40px 80px rgb(0 0 0 / 0.30)`
- Transition max-width with spring easing when companion opens

### Step 5 — Fix sticky note companion
`.tbp-companion-panel` must override ALL `lc-card` defaults:
```css
.tbp-companion-panel { background: #f8eecc !important; border-top: 3px solid #c97d2a !important; transform: rotate(0.4deg) !important; width: 260px !important; ... }
.tbp-companion-panel .lc-card { background: transparent !important; box-shadow: none !important; }
.tbp-companion-panel .lc-card::before { display: none; }
.tbp-companion-panel * { color: #2a1a06 !important; }
```

### Step 6 — Fix card visibility on homepage/library
```css
.gl-libpage-subject-card { background: rgb(255 255 255 / 0.06) !important; border: 1px solid rgb(255 255 255 / 0.10) !important; box-shadow: 0 4px 20px rgb(0 0 0 / 0.30); }
.gl-libpage-subject-card__title { color: #e8dcc8 !important; }
.gl-home-hero-tile { background: rgb(255 255 255 / 0.06) !important; border: 1px solid rgb(255 255 255 / 0.12) !important; color: #e8dcc8 !important; }
```

### Step 7 — Verify section slides work
Check that `[data-turn-direction='next'] .gl-section-arrive` and `[data-turn-direction='prev'] .gl-section-arrive` animations are defined in `src\gl-transitions.css`. Navigate sections in the live app and confirm directional sliding.

### Step 8 — Left nav strip
Confirm `tbp-left-strip` and `tbp-left-dot` are rendering in the reader. Active dot must glow amber. Dots must be vertically centred in the left column.

### Step 9 — Run full verification
```
npx tsc --noEmit       # must be 0 errors
npx vitest run         # must be 128/128
npx vite build         # must exit 0
```

Then manually verify in browser — hold the mockup image side-by-side with the live app and confirm they match.

---

## 5. EDGE CASES & COMMON ERRORS

**CSS specificity traps:**
- `lc-card` styles defined earlier in `index.css` WILL override `.tbp-companion-panel` child rules unless you use `!important` or a more specific selector like `.tbp-companion-panel .lc-card { ... }`
- Always append at the bottom of `index.css` — do not restructure the file
- `background-attachment: fixed` does NOT work inside elements with `transform` applied — if the parent has `transform`, remove it or use an alternative technique

**jsdom test environment:**
- Do NOT add `style={{ display: 'flex' }}` inline on JSX elements — causes `getComputedStyle` crash in tests
- Use CSS classes for layout instead
- `window.matchMedia` is undefined in jsdom — always use `window.matchMedia?.()` with optional chain
- If a test finds "multiple elements with role button and name X" — the left nav strip dots and bottom nav dots both match. Left strip dots must use `aria-label="Go to section: X"` (prefixed), not the raw heading text

**PowerShell file editing:**
- NEVER use `Select-String -Pattern "^}$"` to trim files — it matches the first closing brace and destroys the rest of the file
- For bulk class name replacements, use a `.ps1` script file with `$content.Replace(...)` — not inline regex with quote escaping issues
- Always verify file line count after any PowerShell edit: `(Get-Content file).Count`

**React/TypeScript:**
- `storedSource` prop in `PdfSpreadView` is declared in the interface but not destructured — do not remove it
- `RunningHeader` must export a named function — do not default export it
- All component imports in `KitabiPage` must remain named imports from their respective files

---

## 6. VERIFICATION GATES

- [ ] **Gate 1:** Live app reader — paper card is visibly floating on dark leather background with clear shadow depth
- [ ] **Gate 2:** Overhead lamp glow stays fixed at top of viewport as user scrolls down the section
- [ ] **Gate 3:** Companion panel when open — warm yellow sticky note, 260px wide, amber top border, slight tilt, springs in from right. NOT a white panel.
- [ ] **Gate 4:** Page narrows from 680px to 560px with spring animation when companion opens
- [ ] **Gate 5:** Homepage subject cards are legible — visible border, readable text, not blending into backdrop
- [ ] **Gate 6:** Section navigation — next section slides in from right, previous from left. Direction is visible.
- [ ] **Gate 7:** Left nav strip — amber dots visible on left edge of reader. Active dot glows.
- [ ] **Gate 8:** Dark mode text on paper — always dark ink (#1a1208), never light text on cream
- [ ] **Gate 9:** `npx tsc --noEmit` → 0 errors
- [ ] **Gate 10:** `npx vitest run` → 128/128 green
- [ ] **Gate 11:** `npx vite build` → exits 0 cleanly
- [ ] **Gate 12:** Side-by-side comparison of live app with `mockup_reader_sticky_note.png` — a human judges them equivalent in quality and layout
