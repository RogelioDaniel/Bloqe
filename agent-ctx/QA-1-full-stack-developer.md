# Task QA-1 — full-stack-developer — Community Gallery + Export PNG

## Scope delivered
- **Feature A**: `CommunityGallery` section (`id="galeria"`) — fetches `/api/projects`, lazy-mounts 3D cards via IntersectionObserver, filter pills, empty-state for sample-only DBs, detail Dialog with full LegoScene3D + analysis.
- **Feature B**: `Exportar PNG` + `Copiar JSON` buttons in Builder Studio controls panel.

## Files
- Created: `src/components/sections/community-gallery.tsx` (export `CommunityGallery`)
- Modified: `src/components/sections/builder-studio.tsx` (added icons, state, `onExportPng`, `onCopyJson`, 2×2 button row)
- Modified: `src/components/lego3d/lego-scene-3d.tsx` (added `preserveDrawingBuffer: true` to Canvas `gl` props so `canvas.toDataURL()` works for PNG export)

## Key implementation decisions
- **Sample vs saved detection**: API ships 6 in-memory samples (id `sample-N`) when DB is empty. Real DB rows have Prisma CUIDs. `isSavedProject(p) = !p.id.startsWith("sample-")`. Empty state shown when no saved projects exist.
- **Lazy WebGL mount**: IntersectionObserver per card with `rootMargin: "120px"` and stagger `(index % 3) * 220ms` so multiple WebGL contexts don't spin up simultaneously. Mirrors the Projects section pattern.
- **Dialog lifecycle**: `ProjectDialog` only mounts its inner `LegoScene3D` while `open === true`, freeing the WebGL context on close. Active project ref cleared 200ms after close so the fade-out animation can finish.
- **PNG export**: `document.querySelector('#estudio canvas')` + `canvas.toDataURL('image/png')` + temporary `<a download>` element. Requires `preserveDrawingBuffer: true` (added to `lego-scene-3d.tsx` Canvas gl props) so the WebGL backbuffer survives between frames. Filename: `bloqe-{structureType}-{Date.now()}.png`.
- **JSON copy**: `navigator.clipboard.writeText` in secure contexts, `document.execCommand('copy')` via hidden textarea as fallback.
- **Spanish dates**: `Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" })`.

## Verification
- `bun run lint` → exit 0, clean.
- `bunx tsc --noEmit` → only pre-existing errors in `examples/` and `skills/` (untouched).
- `bunx eslint` on the 3 modified/created files → clean.
- `curl http://localhost:3000/` → 200, 176KB.
- `curl http://localhost:3000/api/projects` → 200, returns a real saved DB row (id `cmrlr...`) — confirms CommunityGallery will populate when wired in.
- Dev log shows clean ✓ compiles; no runtime errors after my edits.

## NOT touched (per task rules)
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx` — user will wire `<CommunityGallery />` themselves. Suggested slot: between Projects and Stats, or between Testimonials and Contact.

## Did NOT write tests
Per task rules.
