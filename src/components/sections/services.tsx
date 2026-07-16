"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Baby,
  Backpack,
  GraduationCap,
  Blocks,
  Palette,
  Music,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { BrickLink } from "@/components/site/brick-transition";
import { LegoModel } from "@/components/lego/lego-model";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
} from "@/lib/lego";

// ============================================================
//  PROGRAMAS — todo visible en una sola vista.
//  Izquierda: los tres niveles + talleres, compactos.
//  Derecha: la escuelita se CONSTRUYE conforme bajas — como si
//  los bloques que caen del castillo del hero la armaran.
// ============================================================

interface Program {
  icon: LucideIcon;
  title: string;
  description: string;
}

const LEVELS: Program[] = [
  {
    icon: Baby,
    title: "Párvulos · 3 a 4 años",
    description:
      "El primer contacto con la escuela: rutinas, lenguaje, autonomía y juego sensorial con mucha contención afectiva.",
  },
  {
    icon: Backpack,
    title: "Intermedio · 4 a 5 años",
    description:
      "Exploración del mundo mediante proyectos: ciencias, números, letras y mucha pregunta. Aprender haciendo.",
  },
  {
    icon: GraduationCap,
    title: "Preescolar · 5 a 6 años",
    description:
      "Preparación para primaria: lectoescritura inicial, pensamiento lógico y habilidades socioemocionales.",
  },
];

const WORKSHOPS: Program[] = [
  {
    icon: Blocks,
    title: "Bloques y robótica",
    description: "Pensamiento espacial e ingeniería temprana.",
  },
  {
    icon: Palette,
    title: "Arte y expresión",
    description: "Pintura, modelado, teatro y creación libre.",
  },
  {
    icon: Music,
    title: "Inglés y música diarios",
    description: "Inmersión con juegos, canciones y cuentos.",
  },
];

const STUD_COLORS = ["#c8281c", "#f5b82e", "#1e5aa8", "#2e8b57"];

function StudRow({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`} aria-hidden>
      {STUD_COLORS.map((c) => (
        <span
          key={c}
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0) 45%), ${c}`,
            boxShadow:
              "inset 0 -1px 2px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.18)",
          }}
        />
      ))}
    </div>
  );
}

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);

  const model: VoxelModel = useMemo(
    () =>
      generateBuilding("schoolhouse", PALETTE_SETS.storybook, {
        width: 8,
        depth: 6,
        floors: 3,
      }),
    []
  );

  // La escuelita se arma conforme la sección entra en pantalla.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.95", "start 0.2"],
  });
  const buildRaw = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [build, setBuild] = useState(0);
  useEffect(() => {
    const unsub = buildRaw.on("change", (v) =>
      // cuantizado a ~30 pasos: barato de re-renderizar
      setBuild(Math.round(v * 30) / 30)
    );
    return () => unsub();
  }, [buildRaw]);

  return (
    <section
      ref={sectionRef}
      id="servicios"
      className="relative bg-ink bg-baseplate bg-grain py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          {/* ===== Izquierda: todo el contenido, compacto ===== */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
            >
              <span className="label-mono text-signal">Programas</span>
              <h2 className="mt-4 font-display font-extrabold tracking-tight text-balance text-[clamp(1.9rem,3.6vw,3rem)] leading-[0.98]">
                Un programa para cada edad, una sola filosofía.
              </h2>
              <p className="mt-4 max-w-xl text-base text-muted-foreground text-pretty leading-relaxed sm:text-lg">
                De los primeros pasos a la puerta de primaria: tres niveles y
                talleres que encienden la curiosidad, al ritmo de cada niño.
              </p>
            </motion.div>

            {/* Niveles */}
            <div className="mt-8 space-y-3">
              {LEVELS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.article
                    key={p.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: i * 0.07 }}
                    className="group flex items-start gap-4 rounded-xl border border-border bg-ink-2/50 p-4 transition-colors hover:border-signal/40"
                  >
                    <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-ink-3/60 text-signal transition-colors group-hover:bg-signal group-hover:text-signal-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display text-base font-bold tracking-tight sm:text-lg">
                          {p.title}
                        </h3>
                        <span className="label-mono shrink-0 text-muted-foreground">
                          0{i + 1}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {/* Talleres */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6"
            >
              <span className="label-mono text-muted-foreground">
                todos los días, además
              </span>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {WORKSHOPS.map((w) => {
                  const Icon = w.icon;
                  return (
                    <div
                      key={w.title}
                      className="rounded-lg border border-border bg-ink-2/40 p-3"
                    >
                      <Icon className="h-4 w-4 text-signal" />
                      <div className="mt-2 font-round text-sm font-semibold">
                        {w.title}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {w.description}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex items-center justify-between gap-4">
                <StudRow />
                <BrickLink
                  href="#contacto"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-signal link-signal"
                >
                  Inscribir a mi hijo
                  <ArrowUpRight className="h-4 w-4" />
                </BrickLink>
              </div>
            </motion.div>
          </div>

          {/* ===== Derecha: la escuelita se construye con el scroll ===== */}
          <div className="lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-ink-2/40">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-signal" />
                  <span className="label-mono text-muted-foreground">
                    obra en curso · la escuelita
                  </span>
                </div>
                <span className="label-mono hidden text-muted-foreground sm:inline">
                  {Math.round(build * 100)}%
                </span>
              </div>
              <div className="relative aspect-[4/3] bg-blueprint-fine sm:aspect-[16/11]">
                <LegoModel
                  model={model}
                  buildProgress={build}
                  className="absolute inset-0 h-full w-full p-6"
                  interactive
                  ariaLabel="Escuelita de bloques construyéndose con el scroll"
                />
              </div>
              <div className="border-t border-border px-4 py-2.5">
                <span className="label-mono text-muted-foreground">
                  los bloques del castillo arman la siguiente obra ·{" "}
                  {model.metrics.blockCount} bloques
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
