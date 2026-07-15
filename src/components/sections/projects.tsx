"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, RefreshCw, MapPin, Boxes } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { SceneErrorBoundary } from "@/components/lego3d/scene-error-boundary";
import { useWebGLSlot } from "@/components/lego3d/use-webgl-slot";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
  type StructureType,
} from "@/lib/lego";

const LegoScene3D = dynamic(
  () => import("@/components/lego3d/lego-scene-3d").then((m) => m.LegoScene3D),
  { ssr: false, loading: () => null }
);

type PaletteName = keyof typeof PALETTE_SETS;

interface Project {
  id: string;
  title: string;
  location: string;
  year: number;
  structureType: StructureType;
  palette: PaletteName;
  opts: Record<string, number>;
}

const PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Torre Polanco",
    location: "Polanco, CDMX",
    year: 2024,
    structureType: "tower",
    palette: "classic",
    opts: { floors: 9, width: 3, depth: 3 },
  },
  {
    id: "p2",
    title: "Rascacielos Reforma",
    location: "Paseo de la Reforma, CDMX",
    year: 2023,
    structureType: "skyscraper",
    palette: "industrial",
    opts: { floors: 16, width: 3, depth: 3 },
  },
  {
    id: "p3",
    title: "Casa Valle de Bravo",
    location: "Valle de Bravo, Edo. Méx.",
    year: 2024,
    structureType: "house",
    palette: "forest",
    opts: { width: 5, depth: 4, walls: 3 },
  },
  {
    id: "p4",
    title: "Puente Los Cabos",
    location: "San José del Cabo, BCS",
    year: 2022,
    structureType: "bridge",
    palette: "coastal",
    opts: { span: 9 },
  },
  {
    id: "p5",
    title: "Pabellón Roma",
    location: "Colonia Roma, CDMX",
    year: 2024,
    structureType: "pavilion",
    palette: "monolith",
    opts: { width: 5, depth: 5 },
  },
  {
    id: "p6",
    title: "Torre Cancún",
    location: "Cancún, Q. Roo",
    year: 2023,
    structureType: "tower",
    palette: "sunset",
    opts: { floors: 7, width: 3, depth: 3 },
  },
];

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "tower", label: "Torres" },
  { value: "skyscraper", label: "Rascacielos" },
  { value: "house", label: "Casas" },
  { value: "bridge", label: "Puentes" },
  { value: "pavilion", label: "Pabellones" },
];

const TAB_LABEL: Record<StructureType, string> = {
  tower: "Torre",
  skyscraper: "Rascacielos",
  house: "Casa",
  bridge: "Puente",
  pavilion: "Pabellón",
};

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [buildId, setBuildId] = useState(1);
  const [inView, setInView] = useState(false);
  const hasSlot = useWebGLSlot(inView);
  const cardRef = useRef<HTMLDivElement>(null);
  const mounted = inView && hasSlot;
  const model: VoxelModel = useMemo(
    () =>
      generateBuilding(project.structureType, PALETTE_SETS[project.palette], project.opts),
    [project]
  );

  // Mount 3D when card is in view, UNMOUNT when scrolled away (frees WebGL context)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            // stagger so multiple contexts don't spin up simultaneously
            timeout = setTimeout(() => setInView(true), (index % 3) * 200);
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

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="group overflow-hidden rounded-2xl border border-border bg-ink-2/40 transition-colors hover:border-signal/40"
    >
      <div ref={cardRef}>
      <button
        type="button"
        onClick={() => { setInView(true); setBuildId((id) => id + 1); }}
        className="relative block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        aria-label={`Reconstruir modelo 3D de ${project.title}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-blueprint-fine">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl opacity-70"
            style={{
              background:
                "radial-gradient(circle, rgba(232,84,42,0.16), rgba(232,84,42,0) 65%)",
            }}
          />
          {mounted ? (
            <SceneErrorBoundary>
              <LegoScene3D
                model={model}
                buildId={buildId}
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
          {/* Top meta strip */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="rounded-md border border-border bg-ink/70 px-2 py-0.5 backdrop-blur">
              <span className="label-mono text-muted-foreground">
                {TAB_LABEL[project.structureType]}
              </span>
            </span>
          </div>
          {/* Rebuild hint */}
          <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-ink/70 px-2 py-1 backdrop-blur opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <RefreshCw className="h-3 w-3 text-signal" />
            <span className="label-mono text-muted-foreground">reconstruir</span>
          </div>
          {/* Block count badge */}
          <div className="absolute bottom-3 right-3">
            <Badge
              variant="outline"
              className="border-border bg-ink/70 font-mono text-xs backdrop-blur"
            >
              {model.metrics.blockCount} bloques
            </Badge>
          </div>
        </div>
      </button>

      {/* Info */}
      <div className="border-t border-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight">
              {project.title}
            </h3>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-signal" />
              <span>{project.location}</span>
            </div>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {project.year}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
          <div>
            <div className="label-mono text-muted-foreground">bloques</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">
              {model.metrics.blockCount}
            </div>
          </div>
          <div>
            <div className="label-mono text-muted-foreground">niveles</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">
              {model.metrics.layerCount}
            </div>
          </div>
          <div>
            <div className="label-mono text-muted-foreground">altura</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">
              {model.metrics.heightM} m
            </div>
          </div>
        </div>
      </div>
      </div>
    </motion.article>
  );
}

export function Projects() {
  const [filter, setFilter] = useState<string>("all");

  const visible = useMemo(
    () =>
      filter === "all"
        ? PROJECTS
        : PROJECTS.filter((p) => p.structureType === filter),
    [filter]
  );

  return (
    <section
      id="proyectos"
      className="relative bg-ink bg-grain py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="label-mono text-signal">Obras construidas</span>
            <h2 className="mt-4 font-display font-extrabold tracking-tight text-balance text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98]">
              Modelos que ya son muros.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground text-pretty leading-relaxed">
              Seis obras entregadas, cada una nacida de una imagen. Toca
              cualquier torre para reconstruirla desde la primera capa.
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <Tabs
          value={filter}
          onValueChange={setFilter}
          className="mt-10"
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

        {/* Grid */}
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-border bg-ink-2/40 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">
              ¿La tuya?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sube tu imagen y en minutos tienes un modelo 3D cotizable.
            </p>
          </div>
          <a
            href="#estudio"
            className="inline-flex items-center gap-1.5 rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-colors hover:bg-signal-2"
          >
            Sube tu imagen
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
