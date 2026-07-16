"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  MessagesSquare,
  CalendarHeart,
  ClipboardCheck,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrickLink } from "@/components/site/brick-transition";
import { LegoModel } from "@/components/lego/lego-model";
import type { VoxelCell, VoxelModel } from "@/lib/lego";

// ============================================================
//  Figuras hechas a mano en voxels — cada paso del proceso se
//  representa con SU objeto: teléfono (llamada), entrada de la
//  escuela (visita), lista con paloma (inscripción) y corazón
//  (su primer día). El frente de cada figura vive en z=0.
// ============================================================

type SetVoxel = (x: number, y: number, z: number, color: string) => void;

function buildFigure(
  w: number,
  h: number,
  d: number,
  paint: (set: SetVoxel) => void
): VoxelModel {
  const grid: (VoxelCell | null)[][][] = [];
  for (let x = 0; x < w; x++) {
    grid[x] = [];
    for (let y = 0; y < h; y++) {
      grid[x][y] = [];
      for (let z = 0; z < d; z++) grid[x][y][z] = null;
    }
  }
  const set: SetVoxel = (x, y, z, color) => {
    if (x >= 0 && y >= 0 && z >= 0 && x < w && y < h && z < d) {
      grid[x][y][z] = { color };
    }
  };
  paint(set);

  let count = 0;
  let maxY = 0;
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++)
      for (let z = 0; z < d; z++)
        if (grid[x][y][z]) {
          count++;
          if (y > maxY) maxY = y;
        }

  return {
    structureType: "pavilion",
    palette: [],
    grid,
    size: [w, h, d],
    metrics: {
      blockCount: count,
      layerCount: maxY + 1,
      heightM: Math.round((maxY + 1) * 0.096 * 10) / 10,
    },
  };
}

/** 01 — Teléfono clásico: base con teclas y bocina encima. */
function buildPhone(): VoxelModel {
  return buildFigure(7, 6, 4, (set) => {
    const body = "#c8281c";
    const dark = "#8f1d14";
    // cuerpo
    for (let x = 1; x <= 5; x++)
      for (let y = 1; y <= 2; y++)
        for (let z = 1; z <= 2; z++) set(x, y, z, body);
    // bocina: orejas + barra
    set(1, 3, 1, dark);
    set(5, 3, 1, dark);
    for (let x = 1; x <= 5; x++) set(x, 4, 1, dark);
    // pie/base
    for (let x = 0; x <= 6; x++) for (let z = 0; z <= 3; z++) set(x, 0, z, "#9aa1ad");
  });
}

/** 02 — La entrada de la escuela: arco, puerta y banderín. */
function buildDoor(): VoxelModel {
  return buildFigure(9, 7, 3, (set) => {
    const wall = "#b46fc9";
    const door = "#6b4a2b";
    // pasto
    for (let x = 0; x <= 8; x++) for (let z = 0; z <= 2; z++) set(x, 0, z, "#2e8b57");
    // columnas
    for (let y = 1; y <= 4; y++) {
      for (const x of [1, 2, 6, 7]) set(x, y, 1, wall);
    }
    // dintel
    for (let x = 1; x <= 7; x++) set(x, 5, 1, wall);
    // puerta al centro
    for (let y = 1; y <= 3; y++) set(4, y, 1, door);
    // escalón frontal
    for (let x = 3; x <= 5; x++) set(x, 1, 0, "#d9c7a3");
    // banderín
    set(4, 6, 1, "#f5b82e");
  });
}

/** 03 — Lápiz/pluma: cuerpo amarillo, goma rosa, punta gris y mina negra. */
function buildPencil(): VoxelModel {
  return buildFigure(3, 11, 3, (set) => {
    const body = "#f5b82e"; // madera amarilla
    const bodyDark = "#c89516";
    const tip = "#d9c7a3"; // madera clara (cono)
    const lead = "#1a1d22"; // mina
    const eraser = "#e85aa8"; // goma rosa
    const metal = "#9aa1ad"; // férula metálica
    // cuerpo (diagonal de abajo-izq a arriba-der)
    const rows: [number, number][] = [
      // [y, xCentral] — el lápiz sube en diagonal
      [1, 0], [2, 0],
      [3, 0], [4, 0],
      [5, 1], [6, 1],
      [7, 1], [8, 1],
    ];
    for (const [y, cx] of rows) {
      for (let z = 0; z <= 2; z++) {
        set(cx, y, z, body);
        set(cx + 1, y, z, body);
        // sombra lateral
        if (z === 2) { set(cx, y, z, bodyDark); set(cx + 1, y, z, bodyDark); }
      }
    }
    // férula metálica (entre cuerpo y goma)
    set(1, 9, 0, metal);
    set(1, 9, 1, metal);
    set(1, 9, 2, metal);
    // goma (rosa)
    set(1, 10, 0, eraser);
    set(1, 10, 1, eraser);
    set(1, 10, 2, eraser);
    // punta cónica (madera clara) + mina
    set(0, 0, 1, tip);
    set(0, 0, 0, tip);
    set(0, 0, 2, tip);
    // mina negra en la punta
    // (se quita el centro inferior y se pone mina)
    // base de apoyo
    for (let x = 0; x <= 2; x++) for (let z = 0; z <= 2; z++) set(x, 0, z, "#4a4f57");
    // mina visible en la punta inferior
    set(0, 1, 1, lead);
  });
}

/** 04 — Corazón: la adaptación con cariño. */
function buildHeart(): VoxelModel {
  return buildFigure(7, 7, 2, (set) => {
    const red = "#c8281c";
    // base
    for (let x = 0; x <= 6; x++) for (let z = 0; z <= 1; z++) set(x, 0, z, "#d9c7a3");
    const rows: [number, number[]][] = [
      [1, [3]],
      [2, [2, 3, 4]],
      [3, [1, 2, 3, 4, 5]],
      [4, [0, 1, 2, 3, 4, 5, 6]],
      [5, [0, 1, 2, 3, 4, 5, 6]],
      [6, [1, 2, 4, 5]],
    ];
    for (const [y, xs] of rows)
      for (const x of xs) for (let z = 0; z <= 1; z++) set(x, y, z, red);
    // brillo
    set(1, 5, 0, "#f4a3b5");
  });
}

interface Step {
  number: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
  /** Figura de bloques acorde al paso. */
  build: () => VoxelModel;
  caption: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Nos conocemos",
    description:
      "Una llamada o mensaje para contarnos sobre tu hijo: su edad, sus intereses y lo que buscan como familia. Te respondemos todas tus dudas.",
    detail: "respuesta en 24 h",
    icon: MessagesSquare,
    build: buildPhone,
    caption: "la llamada",
  },
  {
    number: "02",
    title: "Visita guiada",
    description:
      "Conoces la escuela y los espacios con tu hijo. Vemos juntos las aulas, el patio y el método. La primera visita es sin costo.",
    detail: "visita sin costo",
    icon: CalendarHeart,
    build: buildDoor,
    caption: "la entrada de la escuela",
  },
  {
    number: "03",
    title: "Inscripción",
    description:
      "Reservamos el lugar, entregamos la documentación y te platicamos sobre la adaptación del niño a su nuevo grupo. Todo claro, por escrito.",
    detail: "cupos limitados por grupo",
    icon: ClipboardCheck,
    build: buildPencil,
    caption: "la inscripción",
  },
  {
    number: "04",
    title: "Su primer día",
    description:
      "Acompañamos la adaptación con mucho cariño: periodo de adaptación gradual, reportes diarios y comunicación cercana con la familia.",
    detail: "adaptación gradual",
    icon: HeartHandshake,
    build: buildHeart,
    caption: "con mucho cariño",
  },
];

function StepModel({ step }: { step: Step }) {
  const model: VoxelModel = useMemo(() => step.build(), [step]);
  return (
    <div className="relative h-36 w-full overflow-hidden rounded-lg border border-border bg-blueprint-fine">
      <LegoModel
        model={model}
        className="absolute inset-0 h-full w-full p-3"
        maxDelay={900}
        float
        interactive
        ariaLabel={`Figura de bloques: ${step.caption}`}
      />
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 rounded border border-border bg-ink/70 px-1.5 py-0.5 backdrop-blur">
        <span className="label-mono text-muted-foreground">
          {step.caption} · {model.metrics.blockCount} bloques
        </span>
      </div>
    </div>
  );
}

export function Process() {
  return (
    <section
      id="proceso"
      className="paper-theme relative bg-paper bg-blueprint-paper py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="label-mono text-signal">Proceso</span>
            <h2 className="mt-4 font-display font-extrabold tracking-tight text-balance text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98] text-foreground">
              De la primera llamada a su primer día.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground text-pretty leading-relaxed">
              Un proceso claro y cercano. Cada paso pensado para que tu hijo y
              tú se sientan acompañados: sabes qué sigue, siempre.
            </p>
          </motion.div>
        </div>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Vertical line */}
          <div
            aria-hidden
            className="absolute left-5 top-2 bottom-2 w-px bg-foreground/15 md:left-1/2 md:-translate-x-px"
          />

          <ol className="space-y-12 md:space-y-0">
            {STEPS.map((step, i) => {
              const isLeft = i % 2 === 0;
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="relative md:grid md:grid-cols-2 md:gap-12 md:py-8"
                >
                  {/* Number node on the line */}
                  <div className="absolute left-5 top-1 z-10 -translate-x-1/2 md:left-1/2">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-signal bg-paper font-mono text-sm font-bold text-signal shadow-brick"
                      aria-hidden
                    >
                      {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      "pl-14 md:pl-0",
                      isLeft
                        ? "md:col-start-1 md:pr-16 md:text-right"
                        : "md:col-start-2 md:pl-16"
                    )}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-2",
                        isLeft && "md:flex-row-reverse"
                      )}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-signal">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="label-mono text-muted-foreground">
                        fase · {step.number}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed sm:text-base md:inline-block">
                      {step.description}
                    </p>
                    <div
                      className={cn(
                        "mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5",
                        isLeft && "md:flex-row-reverse"
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
                      <span className="font-mono text-xs text-muted-foreground">
                        {step.detail}
                      </span>
                    </div>
                    {/* Maqueta de bloques que representa esta etapa de
                        construcción: crece paso a paso. */}
                    <div className="mt-5 max-w-xs md:max-w-none">
                      <StepModel step={step} />
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card/70 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
              ¿Listos para el paso 01?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuéntanos sobre tu hijo y agenda una visita sin costo.
            </p>
          </div>
          <BrickLink
            href="#contacto"
            className="btn-brick font-round inline-flex items-center gap-1.5 bg-signal px-5 py-2.5 text-sm font-semibold text-signal-foreground transition-colors hover:bg-signal-2"
          >
            Agendar una visita
          </BrickLink>
        </motion.div>
      </div>
    </section>
  );
}
