import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  FileText,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  WandSparkles,
} from 'lucide-react'

interface LandingPageProps {
  hasProfile: boolean
  isDark: boolean
  onToggleDark: () => void
  onStart: () => void
  onOpenLibrary: () => void
}

const SOURCE_FORMATS = ['PDF', 'DOCX', 'Slides', 'Markdown', 'Images', 'Code']

export function LandingPage({
  hasProfile,
  isDark,
  onToggleDark,
  onStart,
  onOpenLibrary,
}: LandingPageProps) {
  return (
    <div className="glw-landing">
      <header className="glw-landing-nav">
        <a className="glw-wordmark" href="#top" aria-label="GlobalLab home">
          <span className="glw-wordmark__mark" aria-hidden="true">GL</span>
          <span>
            <strong>GlobalLab</strong>
            <small>Your learning companion</small>
          </span>
        </a>

        <nav aria-label="Landing page navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#sources">Sources</a>
          <a href="#personalization">Personalization</a>
        </nav>

        <div className="glw-landing-nav__actions">
          <button
            type="button"
            className="glw-icon-button"
            onClick={onToggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          </button>
          <button type="button" className="glw-button glw-button--quiet" onClick={onStart}>
            {hasProfile ? 'Open workspace' : 'Get started'}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="glw-landing-hero" aria-labelledby="landing-title">
          <div className="glw-landing-hero__copy">
            <p className="glw-eyebrow"><Sparkles size={14} aria-hidden="true" /> Study material that adapts with you</p>
            <h1 id="landing-title">Turn anything you study into a lesson that <em>clicks.</em></h1>
            <p className="glw-landing-hero__lede">
              Read the original source unchanged. When something gets difficult, Koji explains
              that exact part around your interests, level, and learning patterns.
            </p>
            <div className="glw-landing-hero__actions">
              <button type="button" className="glw-button glw-button--primary" onClick={onStart}>
                {hasProfile ? 'Continue learning' : 'Build my learning profile'}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button type="button" className="glw-button glw-button--secondary" onClick={onOpenLibrary}>
                <Upload size={16} aria-hidden="true" />
                {hasProfile ? 'Open my library' : 'See the source workspace'}
              </button>
            </div>
            <div className="glw-trust-row" aria-label="GlobalLab principles">
              <span><ShieldCheck size={14} aria-hidden="true" /> Original stays unchanged</span>
              <span><BookOpenCheck size={14} aria-hidden="true" /> Source-grounded help</span>
              <span><BrainCircuit size={14} aria-hidden="true" /> You control what is remembered</span>
            </div>
          </div>

          <div className="glw-hero-demo" aria-label="Preview of GlobalLab's source and tutor workspace">
            <div className="glw-hero-demo__glow" aria-hidden="true" />
            <div className="glw-hero-demo__window">
              <div className="glw-hero-demo__bar">
                <span className="glw-hero-demo__dots" aria-hidden="true"><i /><i /><i /></span>
                <span>Cell biology · Chapter 01</span>
                <span className="glw-hero-demo__status">Koji ready</span>
              </div>
              <div className="glw-hero-demo__body">
                <article className="glw-demo-page">
                  <span className="glw-demo-page__kicker">Core reading</span>
                  <h2>The cell membrane</h2>
                  <p>
                    The cell membrane is a <mark>selectively permeable</mark> boundary that
                    regulates what enters and exits the cell.
                  </p>
                  <p className="glw-demo-page__muted">
                    Its phospholipid structure helps maintain a stable internal environment.
                  </p>
                  <span className="glw-demo-selection" aria-hidden="true">selectively permeable</span>
                </article>
                <aside className="glw-demo-koji">
                  <header>
                    <span className="glw-demo-koji__mark"><WandSparkles size={16} aria-hidden="true" /></span>
                    <span><small>Koji</small><strong>Let’s make that part clear</strong></span>
                  </header>
                  <div className="glw-demo-koji__source"><FileText size={13} aria-hidden="true" /> From your selected sentence</div>
                  <p>
                    Think of the membrane like a game lobby with role-based access: some
                    players enter freely, while others need the right channel.
                  </p>
                  <div className="glw-demo-koji__choices" aria-hidden="true">
                    <span>Got it</span><span>Still stuck</span>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="glw-proof-strip" aria-label="Supported study formats">
          <span>Bring the material you already use</span>
          <div>{SOURCE_FORMATS.map((format) => <strong key={format}>{format}</strong>)}</div>
        </section>

        <section className="glw-landing-section" id="how-it-works" aria-labelledby="how-title">
          <div className="glw-section-heading">
            <p className="glw-eyebrow">A calmer study loop</p>
            <h2 id="how-title">Read first. Ask at the exact moment you need help.</h2>
            <p>No dashboard maze and no rewritten textbook. The source stays central.</p>
          </div>
          <div className="glw-step-grid">
            <article><span>01</span><Upload size={20} aria-hidden="true" /><h3>Open any source</h3><p>Use GlobalLab subjects or keep an uploaded file in its original form.</p></article>
            <article><span>02</span><WandSparkles size={20} aria-hidden="true" /><h3>Select what is unclear</h3><p>Ask about a sentence, a page, or the current concept—never more than you chose.</p></article>
            <article><span>03</span><BrainCircuit size={20} aria-hidden="true" /><h3>Teach Koji what works</h3><p>“Got it” and “Still stuck” refine future help while you stay in control.</p></article>
          </div>
        </section>

        <section className="glw-landing-feature" id="personalization">
          <div>
            <p className="glw-eyebrow">Personalization with boundaries</p>
            <h2>It learns your learning style—not your identity.</h2>
            <p>
              Koji starts with your chosen level, goals, and interest lens. It improves only
              from study interactions you can inspect, edit, export, or delete.
            </p>
            <ul>
              <li>Different support for “I need a hint” and “walk me through it.”</li>
              <li>Subject-level patterns without forcing one style everywhere.</li>
              <li>Source citations remain visible beside every personalized explanation.</li>
            </ul>
          </div>
          <div className="glw-learning-card" aria-hidden="true">
            <span className="glw-learning-card__light" />
            <p>Your learning pattern</p>
            <h3>Clear steps first.<br />Gaming analogies when useful.</h3>
            <div><span>Structure</span><strong>Step by step</strong></div>
            <div><span>When stuck</span><strong>Try another explanation</strong></div>
            <div><span>Control</span><strong>Editable anytime</strong></div>
          </div>
        </section>

        <section className="glw-final-cta" id="sources">
          <div><p className="glw-eyebrow">Your next difficult page can feel different</p><h2>Start with a subject or bring your own material.</h2></div>
          <button type="button" className="glw-button glw-button--primary" onClick={onStart}>
            {hasProfile ? 'Return to GlobalLab' : 'Start learning'} <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      </main>

      <footer className="glw-landing-footer">
        <span>GlobalLab</span>
        <p>Original sources. Personal help. Student control.</p>
      </footer>
    </div>
  )
}
