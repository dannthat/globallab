# CODEX BRIEF — Global Lab v5a (Design)

> Read the full brief before writing a single line. v4 must be complete and `npm run build` must exit 0 before starting v5a. v5a is a layout and visual overhaul only — no new logic, no new types, no new components beyond what already exist.

---

## WHAT V5A DOES

Transforms the current single-column scrollable reading view into a **two-page book spread**. Each section renders as a left page (heading + body + analogy) beside a right page (diagram + equation + callouts), separated by a physical spine with shadow depth. The whole book sits on the canvas background like an open textbook. Dark mode is added with a toggle in `RunningHeader`.

---

## FILES CHANGED — NOTHING ELSE

| File | Change |
|---|---|
| `src/components/KitabiPage.tsx` | New layout: book-scene → book-outer → book-wrap |
| `src/components/KitabiSection.tsx` | New render: section-spread (left \| spine \| right) |
| `src/components/RunningHeader.tsx` | Add dark mode toggle button (moon/sun icon) |
| `src/App.tsx` | Add `isDark` state, `data-theme` application, pass toggle down |
| `src/index.css` | ADD new book/spread/dark-mode classes — do not remove existing classes |

**No new component files. No new type files. No changes to knowledge base, hooks, services, or types.**

---

## STEP 1 — DARK MODE STATE IN `src/App.tsx`

Add at the top of the `App` component:

```typescript
const [isDark, setIsDark] = useState<boolean>(() => {
  return localStorage.getItem('gl_dark') === '1'
})

useEffect(() => {
  document.documentElement.dataset.theme = isDark ? 'dark' : ''
  localStorage.setItem('gl_dark', isDark ? '1' : '0')
}, [isDark])

const toggleDark = () => setIsDark((d) => !d)
```

Pass `isDark` and `toggleDark` down to `KitabiPage` when a topic is active. All other navigation states (OnboardingFlow, SubjectGrid, topic list) do not need these props — they will inherit dark mode automatically via CSS.

---

## STEP 2 — UPDATE `src/components/RunningHeader.tsx`

Add `isDark: boolean` and `onToggleDark: () => void` props.

Add a toggle button at the far right of the header:

```typescript
import { ChevronRight, Moon, Sun } from 'lucide-react'

// Inside the header JSX, as the rightmost element:
<button
  type="button"
  className="dark-toggle"
  onClick={onToggleDark}
  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
</button>
```

Keep all existing props and JSX unchanged. Only add the two new props and the button.

---

## STEP 3 — UPDATE `src/components/KitabiPage.tsx`

Replace the current layout structure. Keep all existing props, state, and IntersectionObserver logic unchanged.

Only change the returned JSX. Replace the `<div className="kitabi-layout">` block with:

```tsx
return (
  <div className="kitabi-shell" style={{ '--subject-color': subjectColor } as CSSProperties}>
    <RunningHeader
      subject={subject}
      topic={topic}
      profile={profile}
      subjectColor={subjectColor}
      isDark={isDark}
      onToggleDark={onToggleDark}
      onBack={onBack}
    />

    <div className="book-scene">
      <div className="book-outer">

        {/* ToC — unchanged, still left sidebar on desktop */}
        <aside className="kitabi-toc">
          <div className="toc-wrapper">
            <p className="toc-title">Contents</p>
            <TableOfContents
              sections={topic.sections}
              activeSectionId={activeSectionId}
            />
          </div>
        </aside>

        {/* The book */}
        <div className="book-wrap">

          {/* Coloured subject band across top of book */}
          <div
            className="book-top-band"
            style={{ background: subjectColor }}
          />

          {/* Topic header — full width inside book, above the spread */}
          <header className="book-topic-header">
            <div
              className="subject-pill"
              style={{ background: subjectLight, color: subjectColor }}
            >
              <span
                className="subject-pill-dot"
                style={{ background: subjectColor }}
                aria-hidden="true"
              />
              {subject.title}
            </div>
            <h1 className="topic-title">{topic.title}</h1>
            <p className="topic-subtitle">{topic.subtitle}</p>
          </header>

          {/* Sections — each renders as a spread */}
          {topic.sections.map((section) => {
            const rewrite =
              rewrites[
                getSectionRewriteKey(
                  topic.id,
                  section.id,
                  profile?.interest ?? 'neutral',
                )
              ] ?? null

            return (
              <KitabiSection
                key={section.id}
                section={section}
                rewrite={rewrite}
                isLoading={loadingSectionId === section.id}
                profile={profile}
                error={errorSectionId === section.id ? error : null}
                onLearnYourWay={() => onLearnYourWay(section)}
                onClearRewrite={() => onClearRewrite(section.id)}
              />
            )
          })}

          <SourcesFooter source={topic.source} />

        </div>{/* end book-wrap */}
      </div>{/* end book-outer */}
    </div>{/* end book-scene */}
  </div>
)
```

Add `isDark` and `onToggleDark` to `KitabiPageProps`:

```typescript
interface KitabiPageProps {
  // ...existing props
  isDark: boolean
  onToggleDark: () => void
}
```

Keep the `subjectLightMap` and `subjectLight` derivation exactly as-is.

---

## STEP 4 — UPDATE `src/components/KitabiSection.tsx`

Replace the returned JSX to use a spread layout. Keep all existing helper functions (`escapePattern`, `highlightTerms`) and the import list unchanged.

New return structure:

```tsx
return (
  <section className="section-spread" id={section.id} aria-busy={isLoading}>

    {/* LEFT PAGE — heading, body, learn-your-way, analogy */}
    <div className="spread-left">
      <h3 className="section-heading">{section.heading}</h3>

      <div className="section-body">
        {section.body.split(/\n{2,}/).map((paragraph, index) => (
          <p className={index > 0 ? 'mt-4' : undefined} key={index}>
            {highlightTerms(paragraph, section.keyTerms)}
          </p>
        ))}
      </div>

      <SectionErrorBoundary
        error={error}
        neutralAnalogy={
          section.presetAnalogies?.neutral ??
          'Use the original explanation above as the neutral reference.'
        }
        onRetry={onLearnYourWay}
      >
        {profile &&
          profile.interest.trim().toLowerCase() !== 'neutral' &&
          !rewrite && (
            <div className="liyw-row">
              <button
                type="button"
                className="liyw-button"
                disabled={isLoading}
                onClick={onLearnYourWay}
              >
                {isLoading ? (
                  <LoaderCircle className="liyw-spinner" size={14} aria-hidden="true" />
                ) : (
                  <WandSparkles size={14} aria-hidden="true" />
                )}
                {isLoading ? 'Writing your analogy…' : 'Learn it your way'}
              </button>
            </div>
          )}

        {rewrite && <AnalogyPanel rewrite={rewrite} onClear={onClearRewrite} />}
      </SectionErrorBoundary>
    </div>

    {/* SPINE — vertical shadow divider */}
    <div className="spread-spine" aria-hidden="true" />

    {/* RIGHT PAGE — diagram, equation, callouts */}
    <div className="spread-right">
      {section.diagram && <DiagramBlock diagram={section.diagram} />}

      {section.equation && (
        <div
          className="equation-block"
          aria-label={'Equation for ' + section.heading}
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(section.equation, {
              throwOnError: false,
              displayMode: true,
            }),
          }}
        />
      )}

      {section.callouts?.map((callout) => (
        <CalloutBox key={callout.heading} callout={callout} />
      ))}

      {/* If section has no right-side content, show a quiet placeholder */}
      {!section.diagram && !section.equation && !section.callouts?.length && (
        <div className="spread-right-empty" aria-hidden="true" />
      )}
    </div>

  </section>
)
```

---

## STEP 5 — ADD CSS TO `src/index.css`

**APPEND** these classes at the end of the existing `index.css`. Do not remove or modify any existing class. Only add.

```css
/* ============================================================
   v5a — Book Spread Layout
   ============================================================ */

/* Dark mode custom property overrides */
[data-theme='dark'] {
  --color-canvas: #18191c;
  --color-page: #25262a;
  --color-page-alt: #2c2d32;
  --color-text-primary: #e8e7e4;
  --color-text-secondary: #9b9a97;
  --color-border: #38393e;
  --color-spine-shadow: rgba(0, 0, 0, 0.5);
  --color-book-shadow: rgba(0, 0, 0, 0.55);
  --color-spine-center: rgba(0, 0, 0, 0.35);
}

/* Light mode defaults (explicit, for clarity) */
:root {
  --color-page: #ffffff;
  --color-page-alt: #fdfcfa;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  --color-spine-shadow: rgba(0, 0, 0, 0.07);
  --color-book-shadow: rgba(0, 0, 0, 0.12);
  --color-spine-center: rgba(0, 0, 0, 0.05);
}

/* Book scene — full-width stage */
.book-scene {
  min-height: calc(100vh - 48px);
  padding: 40px 24px 80px;
  background: var(--color-canvas);
}

/* Outer flex: ToC + book side by side */
.book-outer {
  display: flex;
  gap: 32px;
  max-width: 1280px;
  margin: 0 auto;
  align-items: flex-start;
}

/* ToC — unchanged behaviour, just inherits dark vars */
/* (kitabi-toc, toc-wrapper etc. already defined above) */

/* The book object */
.book-wrap {
  flex: 1;
  min-width: 0;
  border-radius: 4px 4px 6px 6px;
  background: var(--color-page);
  box-shadow:
    0 2px 4px var(--color-spine-shadow),
    0 12px 40px var(--color-book-shadow),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
  overflow: hidden;
}

/* Coloured subject band — top edge of book */
.book-top-band {
  height: 5px;
  width: 100%;
}

/* Topic header — full width, sits above the spreads */
.book-topic-header {
  padding: 40px 48px 32px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-page);
}

/* Section spread — the two-page layout */
.section-spread {
  display: grid;
  grid-template-columns: 1fr 14px 1fr;
  min-height: 400px;
  border-bottom: 1px solid var(--color-border);
}

.section-spread:last-of-type {
  border-bottom: none;
}

/* Left page */
.spread-left {
  padding: 48px 44px 48px 48px;
  background: var(--color-page);
  min-width: 0;
}

/* Spine — vertical shadow between pages */
.spread-spine {
  width: 14px;
  background:
    linear-gradient(
      to right,
      var(--color-spine-shadow) 0%,
      var(--color-spine-center) 50%,
      var(--color-spine-shadow) 100%
    );
  position: relative;
}

/* Subtle centre line on spine */
.spread-spine::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: var(--color-spine-center);
}

/* Right page */
.spread-right {
  padding: 48px 48px 48px 44px;
  background: var(--color-page-alt);
  min-width: 0;
}

/* Empty right page placeholder */
.spread-right-empty {
  height: 100%;
  min-height: 200px;
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 20px,
    var(--color-border) 20px,
    var(--color-border) 21px
  );
  opacity: 0.15;
  border-radius: 8px;
  margin-top: 16px;
}

/* Mobile — single column */
@media (max-width: 767px) {
  .book-scene {
    padding: 16px 0 60px;
  }

  .book-outer {
    flex-direction: column;
    gap: 0;
    max-width: 100%;
  }

  /* Hide ToC on mobile (already handled by kitabi-toc hidden md:block) */

  .book-wrap {
    border-radius: 0;
    box-shadow: none;
  }

  .book-top-band {
    display: none;
  }

  .book-topic-header {
    padding: 28px 20px 24px;
  }

  .section-spread {
    display: block;
    min-height: auto;
  }

  .spread-left {
    padding: 32px 20px 24px;
  }

  .spread-spine {
    display: none;
  }

  .spread-right {
    padding: 0 20px 32px;
    background: var(--color-page);
  }

  .spread-right-empty {
    display: none;
  }
}

/* Dark mode — existing component overrides */
[data-theme='dark'] body {
  background: var(--color-canvas);
  color: var(--color-text-primary);
}

[data-theme='dark'] .running-header {
  background: rgba(37, 38, 42, 0.92);
  border-color: var(--color-border);
}

[data-theme='dark'] .running-header-back,
[data-theme='dark'] .running-header-topic {
  color: var(--color-text-primary);
}

[data-theme='dark'] .running-header-interest {
  color: var(--color-text-secondary);
}

[data-theme='dark'] .topic-title {
  color: var(--color-text-primary);
}

[data-theme='dark'] .topic-subtitle {
  color: var(--color-text-secondary);
}

[data-theme='dark'] .section-heading {
  color: var(--color-text-primary);
}

[data-theme='dark'] .section-body {
  color: #c4c3c0;
}

[data-theme='dark'] .section-body strong {
  color: var(--color-text-primary);
}

[data-theme='dark'] .toc-item {
  color: var(--color-text-secondary);
}

[data-theme='dark'] .toc-item-active {
  color: var(--color-text-primary);
}

[data-theme='dark'] .toc-title {
  color: #5e5d5a;
}

[data-theme='dark'] .callout-key-insight {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.4);
}

[data-theme='dark'] .callout-real-world {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.4);
}

[data-theme='dark'] .callout-did-you-know {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.4);
}

[data-theme='dark'] .callout-body {
  color: #b0afac;
}

[data-theme='dark'] .analogy-panel {
  background: rgba(230, 92, 36, 0.08);
  border-color: #e65c24;
}

[data-theme='dark'] .analogy-body {
  color: #d4cfc8;
}

[data-theme='dark'] .analogy-limits {
  color: #6b6966;
}

[data-theme='dark'] .liyw-button {
  background: var(--color-page);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

[data-theme='dark'] .liyw-button:hover {
  background: rgba(230, 92, 36, 0.08);
  border-color: #e65c24;
  color: #e65c24;
}

[data-theme='dark'] .subject-pill {
  opacity: 0.9;
}

[data-theme='dark'] .sources-text {
  color: #5e5d5a;
}

[data-theme='dark'] .equation-block {
  background: var(--color-page-alt);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

[data-theme='dark'] .diagram-block {
  background: var(--color-page-alt);
  border-color: var(--color-border);
}

[data-theme='dark'] .diagram-caption {
  color: var(--color-text-secondary);
}

/* Dark mode toggle button */
.dark-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  flex-shrink: 0;
}

.dark-toggle:hover {
  background: var(--color-page-alt);
  color: var(--color-text-primary);
  border-color: var(--color-text-secondary);
}
```

---

## STEP 6 — UPDATE `.app-shell` IN `index.css`

Find the existing `.app-shell` rule and add a dark mode override **without changing the existing rule**:

```css
[data-theme='dark'] .app-shell {
  background:
    radial-gradient(circle at 50% -15%, rgb(180 72 28 / 12%), transparent 34rem),
    var(--color-canvas);
}
```

---

## BUILD ORDER

1. `src/App.tsx` — add `isDark` state, `useEffect` for `data-theme`, `toggleDark`, pass to `KitabiPage`
2. `src/components/RunningHeader.tsx` — add `isDark` + `onToggleDark` props, add toggle button
3. `src/components/KitabiPage.tsx` — new JSX structure (`book-scene` → `book-outer` → `book-wrap`), add `isDark`/`onToggleDark` props, pass to `RunningHeader`
4. `src/components/KitabiSection.tsx` — new spread JSX (`section-spread`, `spread-left`, `spread-spine`, `spread-right`)
5. `src/index.css` — append all new CSS at bottom
6. `npm run build` — must exit 0, zero TypeScript errors

---

## DONE WHEN

- [ ] Each section renders as a two-page spread on desktop: text left, diagram/callouts right
- [ ] Spine visible between pages with gradient shadow depth
- [ ] Book has outer shadow making it feel like a physical object on the page
- [ ] Subject colour band across top of book matches subject (Biology green, etc.)
- [ ] Topic title and subtitle render inside book header above spreads
- [ ] On mobile: spread collapses to single column, spine hidden, padding reduced
- [ ] Dark mode toggle button visible in RunningHeader (moon/sun icon)
- [ ] Clicking toggle switches dark mode on/off, persists across page refresh
- [ ] All existing components (callouts, analogy panel, diagram block, equation) look correct in both light and dark
- [ ] ToC still works, still highlights active section, still hidden on mobile
- [ ] `npm run build` exits code 0
