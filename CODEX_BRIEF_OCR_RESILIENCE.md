# Handoff Brief — Global Lab (OCR Resiliency & Handwriting Fallback)

**Prepared by:** Antigravity (Manager / Product & Architecture Analyst)  
**Date:** 2026-08-26  
**Worker:** Codex / Claude  

---

## 1. Project Overview
Global Lab is a client-side STEM textbook and personal study companion. In the **User Book Reader**, uploaded documents (PDFs, images, notes) are read locally. When a student views a scanned PDF page or handwritten notebook (such as page 111 of an uploaded handwritten math PDF), the reader invokes on-device Tesseract OCR to extract context for the **Learning Companion**.

---

## 2. Repository & Tech Stack
- **Repo Root:** `c:/Users/mhamm/Downloads/globallab`
- **Framework:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + KaTeX + Tesseract.js (`^7.0.0`)
- **Key Files:**
  - `src/services/localOcr.ts` (Worker initialization and image recognition)
  - `src/services/localOcr.test.ts` (Unit tests for OCR service)
  - `src/components/UserBookReaderCore.tsx` (Reader controller, OCR trigger, and companion state)
  - `src/components/LearningCompanion.tsx` (Personalization UI and fallback display)

---

## 3. What Has Been Built (Completed Work)
- Full 4-subject STEM textbook library (Biology, Physics, Chemistry, Mathematics).
- 2-page Kitabi spread with Newsreader serif typography and KaTeX equations.
- Local user source reader with client-side PDF rendering (`pdfjs-dist`) and IndexedDB storage (`fileStore.ts`).
- Bundled offline Tesseract assets (`public/tesseract/worker.min.js`, `core/`, `lang/eng.traineddata.gz`).

---

## 4. Current Known Issues
1. **Infinite Loading Hang on Scanned/Handwritten Pages:**
   - On handwritten/scanned PDFs (e.g. Page 111 with handwritten graph theory definitions), clicking *"Learn page 111 your way"* stays perpetually stuck on *"OCR is starting locally. The image stays in this browser."* and *"Reading only the focused source context..."*.
   - **Root Cause:** `localOcr.ts` has no timeout protection on `getWorker()` or `worker.recognize()`. If worker instantiation or the 10.9MB language model download takes too long or stalls, the promise never rejects and the UI loading spinner spins indefinitely.
2. **Cold Worker Penalty:**
   - Tesseract worker initialization only begins when the student clicks the help button, causing noticeable latency.
3. **OCR Failures on Handwriting & Diagram Pages:**
   - Standard Tesseract English LSTM is trained on printed Latin text. When a student uploads handwritten notes or diagram-heavy pages, OCR produces low confidence or throws an error, leaving the student blocked with no alternate path.

---

## 5. Key Architectural Decisions
1. **Strict Privacy Invariant:** Uploaded student files must **never** be sent to external cloud APIs for OCR. All extraction remains 100% on-device in the browser worker.
2. **Zero-Block Fallback:** When OCR fails, times out, or detects handwriting, the UI must immediately offer a manual keyword/concept input rather than failing dead.

---

## 6. User Preferences & Constraints
- Keep code clean, surgical, and robust.
- Run `npm test` and `npm run build` upon completion to guarantee 0 regressions.
- Do NOT alter canonical textbook knowledge files in `src/knowledge/`.

---

## 7. The Plan (Worker's TODO List)

### Task 1: Add Strict Timeouts & Pre-Warming to `localOcr.ts`
**Target File:** `src/services/localOcr.ts`

1. **Add Timeout Invariant:**
   - Define `OCR_INIT_TIMEOUT_MS = 10_000` (10 seconds) and `OCR_RECOGNIZE_TIMEOUT_MS = 12_000` (12 seconds).
   - Wrap `createWorker` in a promise race with a timeout that calls `terminate()` and rejects with a clear `TimeoutError`.
   - Wrap `worker.recognize()` in a promise race with the timeout and abort signal.
2. **Add `prewarmLocalOcr()` Export:**
   - Add an exported asynchronous function `prewarmLocalOcr()` that initiates `getWorker()` in idle/background time without blocking execution.
   - Catch and silently ignore pre-warm errors (it will cleanly retry upon explicit request).

```ts
export async function prewarmLocalOcr(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await Promise.race([
      getWorker(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Prewarm timeout')), 12_000)),
    ])
  } catch {
    // Non-blocking background warmup
  }
}
```

### Task 2: Background Worker Pre-Warming in `UserBookReaderCore.tsx`
**Target File:** `src/components/UserBookReaderCore.tsx`

1. When a user opens an image source (`previewKind === 'image'`) or a PDF book, trigger `prewarmLocalOcr()` inside a `useEffect` on idle:
   ```ts
   useEffect(() => {
     if (previewKind === 'image' || previewKind === 'pdf') {
       void prewarmLocalOcr()
     }
   }, [previewKind])
   ```

### Task 3: Handwriting / Low-Confidence Concept Fallback Card
**Target Files:** `src/components/UserBookReaderCore.tsx`, `src/components/LearningCompanion.tsx`

1. In `UserBookReaderCore.tsx`, catch OCR timeout or low text errors (`text.length < 8` or timeout):
   - Rather than just showing a raw error banner, set a fallback context:
     ```ts
     setOcrFallbackPromptActive(true)
     ```
2. In the right-hand companion leaf, when `ocrFallbackPromptActive` is true:
   - Render a clean assistance card:
     * **Title:** *"Handwritten or Complex Visual Source"*
     * **Subtitle:** *"On-device OCR is best suited for printed text. Type a concept or phrase from this page to explain it with your lens:"*
     * **Input:** Text field with auto-focus (e.g. *"e.g. directed graph adjacency"*) and a *"Generate Explanation"* button.
   - Upon submit, synthesize the contextual explanation using the student's typed prompt and anchor it to `Page {focusedPage}`!

### Task 4: Unit Test Updates
**Target File:** `src/services/localOcr.test.ts`
- Add tests verifying that `recognizeLocalImage` properly aborts on timeout.
- Verify `prewarmLocalOcr` initializes without throwing.

---

## 8. Research & Reference Material
- Target Failure Screenshot: Page 111 of `All notes.pdf` (Handwritten graph theory notes).
- Tesseract Local Assets: `public/tesseract/worker.min.js`, `public/tesseract/core/tesseract-core-lstm.js`, `public/tesseract/lang/eng.traineddata.gz`.

---

## 9. Environment Setup & Verification
Run the following verification commands:
```bash
npm test
npm run build
```
Ensure all tests pass and the production build completes in < 5 seconds.
