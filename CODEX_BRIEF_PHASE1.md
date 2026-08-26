# TASK: Implement Phase 1 Interactive Polish (Keyboard Navigation, 3D Spread Turn Physics & Text Highlights)
## Target Files: `src/components/KitabiPage.tsx`, `src/components/KitabiSection.tsx`, `src/components/RunningHeader.tsx`, `src/components/TableOfContents.tsx`, `src/index.css`, `src/premium.css`
## Priority / Mode: HIGH | ARCHITECTURAL POLISH

---

## 1. OBJECTIVE
Elevate Global Lab's reader experience to AAA digital publication standards by implementing:
1. **Keyboard-First Navigation** (`J`/`K` or `ArrowLeft`/`ArrowRight` for spread-to-spread turning, `Cmd+K`/`Ctrl+K` quick switcher, `Escape` to close drawers).
2. **Hardware-Accelerated 3D Page Flip Physics** using pure CSS 3D transforms (`preserve-3d`, `rotateY`, dynamic spine curvature, and specular shading gradients during turn).
3. **Local Text Highlighting & Margin Notes** enabling students to select canonical text and attach visual highlights saved in `localStorage`.

All changes must maintain 60 FPS transitions, zero layout shift, and compile cleanly with `tsc -b && vite build`.

---

## 2. CONTEXT & INVARIANTS
- **Workspace:** `c:/Users/mhamm/Downloads/globallab`
- **Framework:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4.
- **Invariants:**
  - Zero new external npm packages. All 3D physics and modals must use native DOM, Web Animations / CSS transforms, and Lucide React icons.
  - Canonical textbook facts (`KnowledgeSection.body`) must remain strictly immutable. Highlighting is non-destructive overlay rendering.
  - Dark mode (`data-theme="dark"`) and Light mode must both be fully styled with matching contrast ratios.
- **Non-Goals:**
  - Do NOT rewrite or alter Gemini API services (`personaService.ts`, `learningCompanionService.ts`).
  - Do NOT touch existing knowledge base `.ts` files in `src/knowledge/`.

---

## 3. ROOT CAUSE & ARCHITECTURAL GAPS
1. **Spread Transitions:** `KitabiPage.tsx` currently renders sections in a standard scrolling container without discrete spread pagination state or 3D turn animations.
2. **Keyboard Traps:** Keyboard listeners only exist in inputs; readers have no tactile keyboard flow (`ArrowLeft`/`ArrowRight`, `J`/`K`).
3. **Active Reading Tools:** Students have no mechanism to mark confusing passages or anchor margin thoughts prior to triggering "Learn It Your Way".

---

## 4. STEP-BY-STEP IMPLEMENTATION INSTRUCTIONS

### Step 4.1: Spread Pagination & Keyboard Navigation Controller
In `src/components/KitabiPage.tsx`:
1. Add spread index state `[activeSpreadIndex, setActiveSpreadIndex]` (mapping 1 section per spread: left leaf = text/analogy, right leaf = diagram/equation/callouts).
2. Attach a global `keydown` event listener (skipping when `event.target` is an `input` or `textarea`):
   - `ArrowRight` / `KeyK` / `PageDown`: Next spread (with page flip animation trigger).
   - `ArrowLeft` / `KeyJ` / `PageUp`: Previous spread.
   - `KeyT`: Toggle Table of Contents sidebar.
   - `KeyD`: Toggle Dark/Light theme (`onToggleDark`).
   - `Escape`: Close active analogy panel, preference card, or search dialog.
   - `Cmd+K` / `Ctrl+K`: Open Quick Topic Switcher modal.

### Step 4.2: 3D Page Turn Physics in CSS
In `src/index.css` (or `src/premium.css`):
1. Define `.book-scene` with `perspective: 1800px; transform-style: preserve-3d;`.
2. Define `.page-leaf` with `transform-origin: left center; transition: transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1);`.
3. Add dynamic turn classes:
   ```css
   .page-turning-forward {
     animation: turnPageForward 480ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
   }
   .page-turning-backward {
     animation: turnPageBackward 480ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
   }
   @keyframes turnPageForward {
     0% { transform: rotateY(0deg); box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
     50% { transform: rotateY(-90deg) scale(0.98); box-shadow: -10px 10px 30px rgba(0,0,0,0.2); }
     100% { transform: rotateY(0deg); box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
   }
   ```
4. Add gutter shading overlay: a linear gradient simulating light falloff across the bound spine (`linear-gradient(to right, rgba(0,0,0,0.12), transparent 40px)`).

### Step 4.3: Quick Topic Switcher (`Cmd+K`)
In `src/components/KitabiPage.tsx` (or new sub-component):
1. Render a floating palette when `isQuickSearchOpen` is true.
2. Filter through all 20 topics across Biology, Physics, Chemistry, and Math with instant fuzzy match.
3. Allow `Up`/`Down` arrow navigation and `Enter` to switch topics seamlessly via `onSelectTopic`.

### Step 4.4: Local Text Highlighting & Margin Notes
In `src/components/KitabiSection.tsx`:
1. Add `onMouseUp` handler on `.section-body` to capture `window.getSelection()`.
2. When text (>3 characters) is selected within a section:
   - Render a floating pill with **[Highlight Yellow]**, **[Highlight Green]**, **[Ask Companion]**.
   - Store highlights in `localStorage` under `gl_highlights_${topic.id}`: `{ id, sectionId, text, color, timestamp }`.
3. Non-destructively highlight text matches in the rendered paragraphs.

---

## 5. EDGE CASES & DEFENSIVE CHECKS
- **Input Focus Protection:** Ensure keyboard navigation is strictly bypassed when typing in search bars or interest editing popovers.
- **Reduced Motion:** If `window.matchMedia('(prefers-reduced-motion: reduce)')` is active, instantly swap 3D rotation with a smooth opacity cross-fade.
- **Mobile Responsive Fallback:** On viewports `< 1024px`, collapse the 3D spread into a vertical stacked single-leaf view with bottom navigation controls.

---

## 6. VERIFICATION GATES
- [ ] **Gate 1:** Pressing `ArrowRight` / `ArrowLeft` advances spreads with a fluid 3D turn effect.
- [ ] **Gate 2:** Pressing `Cmd+K` / `Ctrl+K` opens the topic switcher and jumps directly to any of the 20 topics.
- [ ] **Gate 3:** Selecting text in a section reveals the highlight toolbar and persists highlights across page reloads.
- [ ] **Gate 4:** `tsc -b && vite build` and `npm test` pass with 0 errors and 0 warnings.
