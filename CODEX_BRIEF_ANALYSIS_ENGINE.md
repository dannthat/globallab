# Handoff Brief — Universal 3-Tier Document Analysis Engine

**Prepared by:** Antigravity (Manager / System Architect)  
**Date:** 2026-08-26  
**Worker:** Fullstack Worker Engineer  

---

## 1. Project Overview & Objective
Upgrade Global Lab's document ingestion and analysis engine to support 3 specialized parsing tiers:
- **Type A (Digital AST / Lossless Text):** Digital PDFs (with font vector data), DOCX, TXT, Markdown. Instant 0ms text extraction.
- **Type B (Printed Layout OCR):** Scanned clean textbook pages. Local Tesseract OCR with column awareness.
- **Type C (Multimodal Vision-to-LaTeX):** Handwritten math notes, blackboard formulas, complex diagrams. Multimodal vision parsing returning structured KaTeX equations ($\overline{A \cap B} = \overline{A} \cup \overline{B}$).

Also implement the **Detected Formula Confirmation Strip** (`Detected: \overline{A \cap B} = \overline{A} \cup \overline{B} [✎ Edit]`) in the companion leaf.

---

## 2. Technical Architecture & Endpoints

### Endpoint Specification (`vite.config.ts` / `/api/parse-source` & `/api/personalize`)
Accept payload:
```ts
{
  prompt?: string,
  image?: { mimeType: string, data: string },
  mode?: 'parse-math' | 'personalize'
}
```
When `image` is supplied, construct Gemini 2.0 Flash multimodal contents parts:
```ts
contents: [{
  parts: [
    { text: prompt },
    { inlineData: { mimeType: image.mimeType, data: image.data } }
  ]
}]
```

### Type C Math Parser Schema (`src/services/mathVisionParser.ts`)
```ts
export interface ParsedMathSource {
  topic: string
  theoremLatex?: string
  stepsLatex: string[]
  plainSummary: string
}
```

---

## 3. Work Breakdown & Tasks

### Task 1: Multimodal Vision Proxy in `vite.config.ts`
- Enhance `personalizationProxy` in `vite.config.ts` to accept optional `image` payload with `inlineData`.
- Support JSON parsing schema response when `mode === 'parse-math'`.

### Task 2: Implement `src/services/mathVisionParser.ts`
- Implement `parseMathSource(inlineData, options)` calling `/api/parse-source` (or `/api/personalize`).
- Provide honest fallback to clean local extraction when offline or API is not configured.

### Task 3: Enhance `src/services/sourceContext.ts`
- Categorize sources into `Type A (digital)`, `Type B (printed-ocr)`, and `Type C (math-vision)`.
- If PDF has digital text $\to$ extract directly via `pdfjs-dist` (Type A).
- If PDF is an image scan $\to$ prepare canvas JPEG for Type B / Type C routing.

### Task 4: Enhance `src/services/learningCompanionService.ts`
- For uploaded sources with mathematical formulas, accept `parsedMath` or structured source context.
- Use clean LaTeX formulas in the prompt to ensure the personalized lens (Gaming/Sports/Music) is grounded in true mathematics.

### Task 5: Reader UI with Detected Formula Strip
- In `UserBookReaderCore.tsx` & `userBookReader.css`:
  - Automatically route image pages to Math Vision when math characters / formulas are detected.
  - Display the compact **Detected Formula Strip** with KaTeX math rendering and inline quick-edit support.

### Task 6: Testing & Verification
- Unit test suite passes 100% (`npm test`).
- Production build succeeds with 0 errors (`npm run build`).

---

## 4. Verification Gates
```bash
npm test
npm run build
```
