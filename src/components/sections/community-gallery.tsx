"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  Layers,
  Ruler,
  ArrowUpRight,
  Loader2,
  Sparkles,
  Wand2,
  CalendarDays,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { SceneErrorBoundary } from "@/components/lego3d/scene-error-boundary";
import { useWebGLSlot } from "@/components/lego3d/use-webgl-slot";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
  type StructureType,
  type StructureAnalysis,
} from "@/lib/lego";

// 3D scene is client-only (Three.js uses WebGL).
const LegoScene3D = dynamic(
  () => import("@/components/lego3d/lego-scene-3d").then((m) => m.LegoScene3D),
  { ssr: false, loading: () => null }
);

// ---------- shared types ----------
interface CommunityProject {
  id: string;
  title: string;
  description: string | null;
  structureType: string;
  palette: string[];
  blueprint: VoxelModel | null;
  analysis: StructureAnalysis | null;
  sourceImage: string | null;
  blockCount: number;
  layerCount: number;
  featured: boolean;
  createdAt: string;
}

// ---------- static config ----------
const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "tower", label: "Torres" },
  { value: "house", label: "Casas" },
  { value: "skyscraper", label: "Rascacielos" },
  { value: "bridge", label: "Puentes" },
  { value: "pavilion", label: "Pabellones" },
];

const STRUCTURE_LABEL: Record<StructureType, string> = {
  tower: "Torre",
  skyscraper: "Rascacielos",
  house: "Casa",
  bridge: "Puente",
  pavilion: "Pabellón",
};

const PAGE_SIZE = 8;

// Spanish date formatter (cache once).
const dateFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string): string {
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

// A project counts as "saved by the community" when it comes from the DB
// (samples ship with `sample-N` ids when the DB is empty).
function isSavedProject(p: CommunityProject): boolean {
  return !p.id.startsWith("sample-");
}

// ---------- card ----------
function GalleryCard({
  project,
  index,
  onOpen,
}: {
  project: CommunityProject;
  index: number;
  onOpen: () => void;
}) {
  const [inView, setInView] = useState(false);
  const hasSlot = useWebGLSlot(inView);
  const cardRef = useRef<HTMLButtonElement>(null);
  const mounted = inView && hasSlot;

  // Mount 3D when in view, UNMOUNT when scrolled away (frees WebGL context)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            timeout = setTimeout(() => setInView(true), (index % 3) * 220);
          } else {
            if (timeout) { clearTimeout(timeout); timeout = null; }
            setInView(false);
          }
        }
      },
      { rootMargin: "80px" }
    );
    io.observe(el);
    return () => { io.disconnect(); if (timeout) clearTimeout(timeout); };
  }, [index]);

  const typeLabel =
    STRUCTURE_LABEL[project.structureType as StructureType] ??
    project.structureType;

  // Normalize blueprint: if it's a legacy shape (has `bricks`/`bounds` but no
  // `grid`/`size`), regenerate a fresh VoxelModel from structureType + palette.
  const normalizedModel: VoxelModel | null = useMemo(() => {
    const bp = project.blueprint as unknown as Partial<VoxelModel> & {
      bricks?: unknown;
      bounds?: unknown;
    };
    if (bp && Array.isArray(bp.grid) && Array.isArray(bp.size)) {
      return bp as VoxelModel;
    }
    // legacy or missing — regenerate
    const st = (project.structureType as StructureType) ?? "tower";
    const palette =
      Array.isArray(project.palette) && project.palette.length > 0
        ? project.palette
        : PALETTE_SETS.classic;
    try {
      return generateBuilding(st, palette, { floors: 8 });
    } catch {
      return null;
    }
  }, [project.blueprint, project.structureType, project.palette]);

  return (
    <motion.button
      ref={cardRef}
      type="button"
      onClick={onOpen}
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      aria-label={`Ver detalle de ${project.title}`}
      className="group block w-full overflow-hidden rounded-2xl border border-border bg-ink-2/40 text-left transition-colors hover:border-signal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
    >
      {/* 3D canvas */}
      <div className="relative aspect-[4/3] overflow-hidden bg-blueprint-fine">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(232,84,42,0.16), rgba(232,84,42,0) 65%)",
          }}
        />
        {mounted && normalizedModel ? (
          <SceneErrorBoundary>
            <LegoScene3D
              model={normalizedModel}
              buildId={project.id}
              className="absolute inset-0 h-full w-full"
              maxDelay={1400}
              autoRotate
              quality="lite"
            />
          </SceneErrorBoundary>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <span className="relative flex h-10 w-10 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-signal/20" />
                <Boxes className="h-7 w-7 text-signal/60" />
              </span>
              <span className="label-mono text-[0.6rem]">cargando 3D…</span>
            </div>
          </div>
        )}

        {/* type badge */}
        <div className="absolute left-3 top-3">
          <span className="rounded-md border border-border bg-ink/70 px-2 py-0.5 backdrop-blur">
            <span className="label-mono text-muted-foreground">{typeLabel}</span>
          </span>
        </div>

        {/* open hint */}
        <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-ink/70 px-2 py-1 backdrop-blur opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Sparkles className="h-3 w-3 text-signal" />
          <span className="label-mono text-muted-foreground">abrir</span>
        </div>

        {/* block count */}
        <div className="absolute bottom-3 right-3">
          <Badge
            variant="outline"
            className="border-border bg-ink/70 font-mono text-xs backdrop-blur"
          >
            {project.blockCount} bloques
          </Badge>
        </div>
      </div>

      {/* meta */}
      <div className="border-t border-border p-5">
        <h3 className="font-display text-lg font-bold tracking-tight line-clamp-1">
          {project.title}
        </h3>
        {project.description && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 text-pretty leading-relaxed">
            {project.description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-signal" />
            <span>{formatDate(project.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {project.layerCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Boxes className="h-3 w-3" />
              {project.blockCount}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ---------- loading skeleton ----------
function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-ink-2/40">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between border-t border-border pt-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// ---------- empty state ----------
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-ink-2/30 p-10 sm:p-14 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-blueprint opacity-60"
      />
      <div className="relative mx-auto max-w-xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-3/70 text-signal ring-hairline">
          <Boxes className="h-6 w-6" />
        </span>
        <h3 className="mt-5 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
          Aún no hay proyectos guardados por la comunidad.
        </h3>
        <p className="mt-3 text-muted-foreground text-pretty leading-relaxed">
          Sé el primero — sube tu imagen en el estudio de bloques y verás tu
          modelo 3D publicado aquí junto al resto de la galería.
        </p>
        <div className="mt-6">
          <a
            href="#estudio"
            className="inline-flex items-center gap-1.5 rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-colors hover:bg-signal-2"
          >
            <Wand2 className="h-4 w-4" />
            Ir al estudio de bloques
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ---------- detail dialog ----------
function ProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: CommunityProject | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  // Normalize blueprint (legacy shape → regenerate). Hook must run before any early return.
  const dialogModel: VoxelModel | null = useMemo(() => {
    if (!project) return null;
    const bp = project.blueprint as unknown as Partial<VoxelModel> & {
      bricks?: unknown;
      bounds?: unknown;
    };
    if (bp && Array.isArray(bp.grid) && Array.isArray(bp.size)) {
      return bp as VoxelModel;
    }
    const st = (project.structureType as StructureType) ?? "tower";
    const palette =
      Array.isArray(project.palette) && project.palette.length > 0
        ? project.palette
        : PALETTE_SETS.classic;
    try {
      return generateBuilding(st, palette, { floors: 8 });
    } catch {
      return null;
    }
  }, [project]);

  if (!project) return null;
  const analysis = project.analysis;
  const typeLabel =
    STRUCTURE_LABEL[project.structureType as StructureType] ??
    project.structureType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-ink-2 border-border text-foreground p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* 3D viewer */}
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[420px] bg-blueprint-fine border-b md:border-b-0 md:border-r border-border">
            {project.blueprint && open && dialogModel && (
              <SceneErrorBoundary>
                <LegoScene3D
                  model={dialogModel}
                  buildId={`dialog-${project.id}`}
                  className="absolute inset-0 h-full w-full"
                  maxDelay={200}
                  autoRotate
                  quality="full"
                />
              </SceneErrorBoundary>
            )}
            <div className="absolute left-3 top-3">
              <span className="rounded-md border border-border bg-ink/70 px-2 py-0.5 backdrop-blur">
                <span className="label-mono text-muted-foreground">
                  {typeLabel}
                </span>
              </span>
            </div>
            {project.sourceImage && (
              <div className="absolute bottom-3 right-3 h-16 w-20 overflow-hidden rounded-md border border-border shadow-brick">
                <img
                  src={project.sourceImage}
                  alt="Imagen fuente"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          {/* details */}
          <div className="flex flex-col gap-4 p-6 max-h-[80vh] overflow-y-auto">
            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-2xl font-extrabold tracking-tight text-balance">
                {project.title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-pretty leading-relaxed">
                {project.description ??
                  analysis?.summary ??
                  "Modelo modular generado por la comunidad BLOQE."}
              </DialogDescription>
            </DialogHeader>

            {/* metrics */}
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-ink-3/40 p-3">
              <div>
                <div className="flex items-center gap-1.5 label-mono text-muted-foreground">
                  <Boxes className="h-3 w-3" />
                  bloques
                </div>
                <div className="mt-0.5 font-mono text-sm">
                  {project.blockCount}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 label-mono text-muted-foreground">
                  <Layers className="h-3 w-3" />
                  capas
                </div>
                <div className="mt-0.5 font-mono text-sm">
                  {project.layerCount}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 label-mono text-muted-foreground">
                  <Ruler className="h-3 w-3" />
                  altura
                </div>
                <div className="mt-0.5 font-mono text-sm">
                  {project.blueprint?.metrics.heightM ?? "—"} m
                </div>
              </div>
            </div>

            {/* analysis: features */}
            {analysis?.features && analysis.features.length > 0 && (
              <div>
                <div className="label-mono text-muted-foreground mb-2">
                  Características
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.features.map((f, i) => (
                    <Badge
                      key={`${f}-${i}`}
                      variant="secondary"
                      className="bg-ink-3 text-foreground/80 font-normal"
                    >
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* analysis: materials */}
            {analysis?.materials && analysis.materials.length > 0 && (
              <div>
                <div className="label-mono text-muted-foreground mb-2">
                  Materiales
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {analysis.materials.join(" · ")}
                </p>
              </div>
            )}

            {/* analysis: summary block */}
            {analysis?.summary && (
              <div>
                <div className="label-mono text-muted-foreground mb-2">
                  Resumen del análisis
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed text-pretty">
                  {analysis.summary}
                </p>
                {typeof analysis.confidence === "number" && (
                  <div className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="label-mono">confianza</span>
                    <span className="font-mono text-signal">
                      {Math.round(analysis.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* palette swatches */}
            {project.palette.length > 0 && (
              <div>
                <div className="label-mono text-muted-foreground mb-2">
                  Paleta de bloques
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.palette.map((c, i) => (
                    <span
                      key={`${c}-${i}`}
                      className="h-7 w-7 rounded-md ring-hairline"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* footer */}
            <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-signal" />
                {formatDate(project.createdAt)}
              </span>
              {project.featured && (
                <Badge
                  variant="outline"
                  className="border-signal/40 text-signal"
                >
                  Destacado
                </Badge>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- main section ----------
export function CommunityGallery() {
  const [projects, setProjects] = useState<CommunityProject[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [active, setActive] = useState<CommunityProject | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // fetch on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { projects?: CommunityProject[] };
        if (cancelled) return;
        setProjects(data.projects ?? []);
      } catch (e) {
        if (cancelled) return;
        setLoadError((e as Error).message);
        setProjects([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // only saved-by-community projects count toward the gallery
  const saved = useMemo(
    () => (projects ?? []).filter(isSavedProject),
    [projects]
  );

  // reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter]);

  const filtered = useMemo(() => {
    if (filter === "all") return saved;
    return saved.filter((p) => p.structureType === filter);
  }, [saved, filter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const openProject = (p: CommunityProject) => {
    setActive(p);
    setDialogOpen(true);
  };

  const loading = projects === null;

  return (
    <section
      id="galeria"
      className="relative bg-ink bg-blueprint bg-grain py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/4 -right-32 h-[440px] w-[440px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(232,84,42,0.10), rgba(232,84,42,0) 65%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <span className="label-mono text-signal">Galería comunitaria</span>
          <h2 className="mt-4 font-display font-extrabold tracking-tight text-balance text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98]">
            Modelos que la comunidad ya construyó.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground text-pretty leading-relaxed">
            Cada proyecto aquí fue subido por alguien como tú: una imagen, un
            análisis de visión y un modelo 3D de bloques listo para cotizar.
            Toca cualquier tarjeta para orbitar el modelo y ver el análisis
            completo.
          </p>
        </motion.div>

        {/* body */}
        <div className="mt-10">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-muted-foreground">
              No pude cargar la galería ({loadError}). Vuelve a intentarlo en un
              momento.
            </div>
          ) : saved.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* filter pills */}
              <Tabs
                value={filter}
                onValueChange={setFilter}
                className="mb-8"
              >
                <TabsList className="h-auto flex-wrap gap-1 rounded-full border border-border bg-ink-2/60 p-1">
                  {FILTERS.map((f) => (
                    <TabsTrigger
                      key={f.value}
                      value={f.value}
                      className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-signal data-[state=active]:text-signal-foreground"
                    >
                      {f.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* grid */}
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-ink-2/30 p-10 text-center text-sm text-muted-foreground">
                  No hay proyectos de este tipo todavía. Prueba con otro filtro
                  o sube el tuyo.
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <motion.div
                    layout
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  >
                    {visible.map((p, i) => (
                      <GalleryCard
                        key={p.id}
                        project={p}
                        index={i}
                        onOpen={() => openProject(p)}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* "ver más" */}
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    className="border-border bg-ink-2/40 hover:bg-ink-3 rounded-full"
                    onClick={() =>
                      setVisibleCount((c) => c + PAGE_SIZE)
                    }
                  >
                    Ver más proyectos
                    <span className="ml-2 rounded-full bg-ink-3/60 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {visibleCount} / {filtered.length}
                    </span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* small bottom CTA — always visible */}
        {!loading && saved.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-border bg-ink-2/40 p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-display text-xl font-bold tracking-tight">
                ¿Tu modelo no está aquí?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sube una imagen y en minutos lo verás publicado en esta galería.
              </p>
            </div>
            <a
              href="#estudio"
              className="inline-flex items-center gap-1.5 rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-colors hover:bg-signal-2"
            >
              Subir mi imagen
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>
        )}
      </div>

      <ProjectDialog
        project={active}
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) {
            // free the active ref shortly after close so the dialog can fade out
            setTimeout(() => setActive(null), 200);
          }
        }}
      />

      {/* visually-hidden loading sentinel for screen readers */}
      {loading && (
        <span className="sr-only" aria-live="polite">
          <Loader2 className="inline h-3 w-3" /> Cargando proyectos de la
          comunidad.
        </span>
      )}
    </section>
  );
}
