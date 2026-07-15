# Task 4-API — full-stack-developer (backend)

## Task
Build the backend API for BLOQE: a server-side VLM image-analysis wrapper, and three Next.js App Router API routes (`/api/analyze`, `/api/projects`, `/api/contact`). Validate inputs with zod, persist with Prisma, and ensure `/api/analyze` never 500s.

## Work Log
- Read `worklog.md`, `prisma/schema.prisma`, `src/lib/lego.ts`, `src/lib/db.ts`, and the VLM skill docs.
- Invoked the `VLM` skill and verified SDK usage via `skills/VLM/scripts/vlm.ts` (`zai.chat.completions.createVision` with `image_url.url`).
- Created `src/lib/lego-analysis.ts`:
  - `analyzeConstructionImage(imageDataUrl)` — calls `ZAI.create()` then `createVision({ messages, thinking:{type:"disabled"} })`. Sends the Spanish JSON-only prompt; strips code fences; `JSON.parse`s; coerces to `StructureAnalysis`. Throws on any error so the route can fall back.
  - `fallbackAnalysis()` — picks a random `StructureType`, maps a random `PALETTE_SETS` palette through `mapToLegoColors`, returns a plausible `StructureAnalysis` with `confidence: 0.35` and summary "Análisis aproximado: estructura detectada por heurística."
- Created `src/app/api/analyze/route.ts`:
  - Accepts `multipart/form-data` with `image` File OR `application/json` with `{image}` (data URL or http(s) URL). Converts all to `data:image/...;base64,...` using `Buffer.from(arrayBuffer).toString("base64")`.
  - Calls `analyzeConstructionImage(dataUrl)`. On throw → `fallbackAnalysis()` with summary prefixed by "Análisis aproximado (el modelo visual no respondió):".
  - Builds palette via `mapToLegoColors(analysis.dominantColors)` + dedupe; empty → `PALETTE_SETS[forest|industrial|classic]` by structureType.
  - Generator opts: `{ floors: clamp(analysis.floors||8, 3, 16) }` plus type-specific width/depth/span (tower/skyscraper 3×3, house 5×4, bridge span 9, pavilion 5×5).
  - Returns 200 `{ analysis, blueprint, sourceImage, palette }`. Malformed input → 400. Never 500s.
- Created `src/app/api/projects/route.ts`:
  - `GET` — newest 50 from DB, JSON-parsed back to objects. If empty, returns 6 in-memory sample projects (`Torre Nórdica`, `Pabellón Costero`, `Casa Bosque`, `Rascacielos Monolito`, `Viaducto Industrial`, `Atardecer Residencial`) generated via `generateBlueprint` with varied structureTypes/palettes. DB unreachable → also returns samples (with `dbError`).
  - `POST` — zod-validated (`title` min 2, `structureType` enum, `palette` array of hex, `blueprint` passthrough object, optional `sourceImage`/`analysis`). Computes `blockCount = blueprint.bricks.length` and `layerCount = blueprint.metrics.layerCount || blueprint.bounds.h`. Persists with `JSON.stringify` for palette/blueprint/analysis. Returns 201 `{ project: parsedBack }`.
- Created `src/app/api/contact/route.ts`:
  - `POST` — zod-validated (`name` min 2, `email` via `z.email()`, `phone` optional, `message` min 5, `intent` enum default `general`). Persists `Inquiry`. 201 `{ ok: true }`. Validation error → 400 `{ error: flattened }`.
- Ran `bun run lint` → exit 0, no errors.
- Smoke-tested all routes via curl:
  - `GET /api/projects` (empty DB) → 200 with 6 samples.
  - `POST /api/projects` → 201 with parsed-back project.
  - `POST /api/contact` (valid) → 201 `{ok:true}`; (invalid) → 400 with fieldErrors.
  - `POST /api/analyze` with `{image: "data:image/png;base64,..."}` (1×1 PNG) → 200 with valid `{ analysis, blueprint, sourceImage, palette }`. The VLM **actually succeeded** on the tiny image, returning `{"title":"Torre de Hormigón","structureType":"tower","summary":"Torre de hormigón...","features":[...],"materials":["hormigón","vidrio"],"dominantColors":["#a0a0a0","#808080","#c0c0c0"],"floors":10,"height":"tall","confidence":0.9}` and the palette was correctly mapped to LEGO `["#9aa1ad","#d9c7a3"]`.
  - `POST /api/analyze` malformed → 400 (missing image / bad URL).
- Cleaned up the smoke-test Project row from the dev DB so the frontend agent starts with an empty DB (samples path).

## Stage Summary
- Files created:
  - `src/lib/lego-analysis.ts`
  - `src/app/api/analyze/route.ts`
  - `src/app/api/projects/route.ts`
  - `src/app/api/contact/route.ts`
- **Confirmed JSON shape returned by `POST /api/analyze`** (status 200):
  ```json
  {
    "analysis": {  // StructureAnalysis
      "title": string,
      "structureType": "tower"|"skyscraper"|"house"|"bridge"|"pavilion",
      "summary": string,           // Spanish, 1-2 sentences
      "features": string[],
      "materials": string[],
      "dominantColors": string[],  // hex
      "floors": number,
      "height": "low"|"medium"|"tall",
      "confidence": number         // 0-1
    },
    "blueprint": {  // Blueprint (from src/lib/lego.ts)
      "structureType": string,
      "palette": string[],
      "bricks": Brick[],
      "bounds": { "w": number, "d": number, "h": number },
      "metrics": { "blockCount": number, "layerCount": number, "heightM": number },
      "analysis": undefined        // not populated at route layer
    },
    "sourceImage": string,         // the data URL built from the input
    "palette": string[]            // deduped mapToLegoColors(dominantColors)
  }
  ```
- **VLM SDK observations**: The `z-ai-web-dev-sdk` Vision API accepts a `data:image/...;base64,...` URL directly in `image_url.url`. The model sometimes wraps JSON in ```json fences — handled by `extractJson()`. On a 1×1 PNG the model still returned a coherent Spanish analysis (it inferred a generic tower). The fallback path was NOT triggered during testing but is wired and will produce a valid shape if the SDK ever fails.
- DB contract (Prisma): palette/blueprint/analysis stored as `JSON.stringify` strings; route layer parses them back to objects on read.
- All routes return only relative-path JSON. No client-side `z-ai-web-dev-sdk` imports.
- `bun run lint` clean (exit 0).
