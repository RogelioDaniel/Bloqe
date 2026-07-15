"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Hand, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BrickLink } from "@/components/site/brick-transition";
import { LegoModel } from "@/components/lego/lego-model";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
  type StructureType,
} from "@/lib/lego";

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
    opts: { floors: 14, width: 3, depth: 3 },
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
  { value: "all", label: "Todas" },
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

const STUD_STRIP_COLORS = ["#c8281c", "#f5b82e", "#1e5aa8", "#2e8b57", "#e8542a"];

function ProjectCard({ project }: { project: Project }) {
  const model: VoxelModel = useMemo(
    () =>
      generateBuilding(project.structureType, PALETTE_SETS[project.palette], project.opts),
    [project]
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="group card-brick relative overflow-hidden rounded-2xl border border-border bg-ink-2/40 transition-all duration-300 hover:-translate-y-1 hover:border-signal/40"
    >
      {/* studs que asoman al pasar el cursor */}
      <div
        aria-hidden
        className="stud-strip absolute left-5 top-2 z-10"
      >
        {STUD_STRIP_COLORS.map((c) => (
          <span
            key={c}
            className="h-2 w-2 rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%), ${c}`,
              boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.3)",
            }}
          />
        ))}
      </div>

      <div className="relative aspect-[4/3] overflow-hidden bg-blueprint-fine">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(232,84,42,0.16), rgba(232,84,42,0) 65%)",
          }}
        />
        <LegoModel
          model={model}
          className="absolute inset-0 h-full w-full p-4"
          maxDelay={1200}
          interactive
          controls
          ariaLabel={`Maqueta de bloques de ${project.title}`}
        />
        {/* Top meta strip */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-md border border-border bg-ink/70 px-2 py-0.5 backdrop-blur">
            <span className="label-mono text-muted-foreground">
              {TAB_LABEL[project.structureType]}
            </span>
          </span>
        </div>
        {/* Interaction hint */}
        <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-ink/70 px-2 py-1 backdrop-blur opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Hand className="h-3 w-3 text-signal" />
          <span className="label-mono text-muted-foreground">
            tócala · gírala
          </span>
        </div>
        {/* Block count badge */}
        <div className="pointer-events-none absolute bottom-3 left-3">
          <Badge
            variant="outline"
            className="border-border bg-ink/70 font-mono text-xs backdrop-blur"
          >
            {model.metrics.blockCount} bloques
          </Badge>
        </div>
      </div>

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
            <div className="label-mono text-muted-foreground">entrega</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">
              {project.year}
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
              Obra real, presentada bloque a bloque.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground text-pretty leading-relaxed">
              Cada obra entregada conserva su maqueta de bloques — la misma que
              vio el cliente antes de empezar. Juega con ellas: gíralas con un
              swipe, quítales bloques o rómpelas y reármalas.
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
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} />
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
              Cuéntanos qué quieres construir y recibe tu presupuesto con
              maqueta incluida.
            </p>
          </div>
          <BrickLink
            href="#contacto"
            className="btn-brick font-round inline-flex items-center gap-1.5 bg-signal px-5 py-2.5 text-sm font-semibold text-signal-foreground transition-colors hover:bg-signal-2"
          >
            Cotizar mi obra
            <ArrowUpRight className="h-4 w-4" />
          </BrickLink>
        </motion.div>
      </div>
    </section>
  );
}
