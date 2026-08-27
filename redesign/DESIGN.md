# GlobalLab — Design Specification

> Single source of truth for the GlobalLab redesign.
> All implementation decisions should be checked against this before code is written.

---

## Reference Images

| Image | What it shows |
|---|---|
| `mockup_homepage.png` | Homepage — hero subject card left, subject rows + upload right |
| `mockup_reader_sticky_note.png` | Reader — floating paper card, left nav strip, sticky note companion open |

---

## 1. Visual Language

### The feeling
Premium editorial reading room. Not a study app — closer to a beautifully produced book sitting on a desk under a warm lamp. Every interaction has weight. Things spring into place, slide with direction, breathe.

"Alive" means reactive to touch — not 3D geometry. The page narrows when a companion opens. Sections slide in the direction you navigated. The sticky note springs in with a slight tilt as if someone just stuck it there.

### Colour tokens

| Token | Value | Used for |
|---|---|---|
| Backdrop | `#0a0907` | Page background — dark warm leather |
| Paper | `#f5f0e4` | Reading surface — cream |
| Paper ink | `#1a1208` | Body text on paper |
| Amber | `#c97d2a` | All accents: active dots, CTAs, top borders |
| Sticky note | `#f8eecc` | Companion panel background |
| Subject: Biology | `#0D6E52` | Green |
| Subject: Physics | `#1A5FA8` | Blue |
| Subject: Chemistry | `#6B35C8` | Purple |
| Subject: Mathematics | `#C87B1A` | Amber |

### Typography
- **Serif** (reading): body text, headings on paper
- **UI sans**: header chrome, labels, buttons, nav
- Body size: `16.5px`, line-height `1.82`

### Dark + light mode
Both supported. The paper card is always cream / dark ink regardless of mode.
Only the app chrome responds to the mode toggle.

---

## 2. Homepage

**Reference:** `mockup_homepage.png`

### Layout — two zones side by side

**Left — Hero (≈60% width)**
- Active subject: large cover card with subject colour, texture overlay, section progress, "Continue reading →" CTA. Supports mouse-tilt parallax.
- No active subject: two entry tiles — "Pick a GlobalLab subject" and "Upload your own source".

**Right — Source rows (≈40% width)**
- "+ Upload new source" button pinned at top — always visible, first-class.
- GlobalLab Subjects: Biology, Physics, Chemistry, Mathematics as compact rows with colour stripe, name, topic count, progress arrow.
- Your Sources: uploaded files as compact rows.
- "Browse full library →" at bottom.
- No first-time empty state — subjects are always there.

### Interactions
- Hero card tilt on hover (spring reset on leave)
- Source rows slide in staggered on first load

---

## 3. Library Page

Full-width grid reached via "Browse full library →".

**Toolbar:** back, search, filter tabs (All / GlobalLab / Mine / Readable now), Upload.

**GlobalLab Subjects** — 2×2 card grid. Colour background, name, topic count.

**Your Sources** — file grid below. Cards are always legible — proper border and shadow against the dark background. Handles 50+ files.

---

## 4. Textbook Reader

**Reference:** `mockup_reader_sticky_note.png`

### Layout

```
[site header: back | title | lens | theme toggle]

[left dot strip]  [  floating paper card  ]  [sticky note — when open]

[bottom nav: ← dots count →]
```

**Left strip** — ~48px, amber dot per section. Active dot glows. Click to jump. Hidden on mobile.

**Paper card**
- Centered, max-width 680px alone / 560px with companion open
- Margins all four sides — always floating, never edge-to-edge
- Background always cream regardless of dark/light mode

**Overhead lamp**
- Fixed to the viewport top — NOT on the card itself
- `background-attachment: fixed` on the reader stage
- As the student scrolls, the paper moves under the stationary light source
- Upper card is brighter, lower gradually dims — like reading under a real lamp

**Paper card contents (top → bottom)**
1. Running head (subject · lesson number)
2. Section heading — large serif
3. Drop cap first paragraph
4. Body text — serif, generous line-height
5. Highlighted key terms bold inline
6. Diagram / figure / concept index
7. **"Connect this to [interest]" amber CTA** — pinned to card bottom, always visible

**Bottom navigation** — prev arrow, section dots, count, next arrow.

---

## 5. Personalization System

The most important feature. Help must be precise — for exactly what the student didn't understand.

### Flow

```
Student reads
  → Highlights a word, sentence, or paragraph
  → Toolbar appears: [colour swatches] | [Explain this →]
  → Taps "Explain this"
  → Page narrows with spring animation (680 → 560px)
  → Sticky note slides in from right simultaneously
  → Highlighted text stays marked on page for comparison
  → AI response streams in word-by-word
  → Student reads explanation while glancing at exact original words
```

### Sticky note spec
- **Width:** 260px
- **Background:** `#f8eecc` (warm Post-it yellow)
- **Top border:** 3px solid `#c97d2a`
- **Tilt:** `rotate(0.4deg)` — feels physically placed
- **Position:** `sticky`, top 88px — stays in view as student scrolls
- **Animation:** springs in from right — `translateX(24px) → 0` with `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Content:** mode label ("Analogy · Gaming"), explanation text, refinement buttons (Simpler / More detail / Another example / Test me), outcome row (Helpful / Not yet)
- No giant white panel. No full-screen takeover. Small, beside the words it explains.

### Full-section personalization
The amber "Connect this to [interest]" button at the bottom of the card reframes the entire section. Separate from the highlight-specific flow.

### Dismissing
- Dismiss sticky note → page springs back to full width
- Highlighted text clears

---

## 6. Section Transitions (Smooth Slide)

Directional — always tells the student which way they moved.

| Action | Animation |
|---|---|
| Next section → | Page slides out left, new page enters from right |
| Previous section ← | Page slides out right, new page enters from left |
| Duration | 340ms |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Reduced motion | Falls back to simple opacity fade |

---

## 7. Upload Reader

Identical visual language to the textbook reader:
- Same floating paper card, same fixed overhead lamp
- Same left nav strip for multi-page documents
- Same sticky note companion (triggered by selection or CTA)
- Same directional section slides between pages
- Header shows file name instead of textbook topic

---

## 8. What This Design Is NOT

- Not 3D book spines or rotating covers
- Not dark-mode-only (light mode fully supported)
- Not a gamified points/badge system
- Not a full-screen companion panel — always a sticky note
- Not an empty state for new users — upload always accessible from home
- Not edge-to-edge reading — paper always floats with breathing room

---

## 9. Implementation Notes

- CSS custom properties for all colour tokens
- Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Smooth easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- `prefers-reduced-motion` overrides all animations
- Paper card does not invert in dark mode — always cream
- `background-attachment: fixed` for the overhead lamp on the reader stage
- `:has(.tbp-companion-panel--open)` drives page narrowing — no JS needed
