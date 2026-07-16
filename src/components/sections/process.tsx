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
import {
  generateBuilding,
  PALETTE_SETS,
  type StructureType,
  type VoxelModel,
} from "@/lib/lego";

interface Step {
  number: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
  /** Modelo 3D que representa esta etapa de "construcción". */
  structureType: StructureType;
  structureOpts: { floors?: number; width?: number; depth?: number };
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Nos conocemos",
    description:
      "Una llamada o mensaje para contarnos sobre tu hijo: su edad, sus intereses y lo que buscan como familia. Te respondemos todas tus dudas.",
    detail: "respuesta en 24 h",
    icon: MessagesSquare,
    // Bloques base: los primeros cimientos.
    structureType: "tower",
    structureOpts: { floors: 2, width: 3, depth: 3 },
  },
  {
    number: "02",
    title: "Visita guiada",
    description:
      "Conoces la escuela y los espacios con tu hijo. Vemos juntos las aulas, el patio y el método. La primera visita es sin costo.",
    detail: "visita sin costo",
    icon: CalendarHeart,
    // La estructura empieza a tomar forma.
    structureType: "house",
    structureOpts: { floors: 2, width: 5, depth: 4 },
  },
  {
    number: "03",
    title: "Inscripción",
    description:
      "Reservamos el lugar, entregamos la documentación y te platicamos sobre la adaptación del niño a su nuevo grupo. Todo claro, por escrito.",
    detail: "cupos limitados por grupo",
    icon: ClipboardCheck,
    // La escuela está casi lista.
    structureType: "schoolhouse",
    structureOpts: { floors: 3, width: 6, depth: 5 },
  },
  {
    number: "04",
    title: "Su primer día",
    description:
      "Acompañamos la adaptación con mucho cariño: periodo de adaptación gradual, reportes diarios y comunicación cercana con la familia.",
    detail: "adaptación gradual",
    icon: HeartHandshake,
    // ¡Construcción completa! El castillo del niño.
    structureType: "castle",
    structureOpts: { floors: 4, width: 7, depth: 7 },
  },
];

function StepModel({ step }: { step: Step }) {
  const model: VoxelModel = useMemo(
    () =>
      generateBuilding(
        step.structureType,
        PALETTE_SETS.storybook,
        step.structureOpts
      ),
    [step]
  );
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-border bg-blueprint-fine">
      <LegoModel
        model={model}
        className="absolute inset-0 h-full w-full p-2"
        maxDelay={900}
        float
        ariaLabel={`Construcción de bloques: ${step.title}`}
      />
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 rounded border border-border bg-ink/70 px-1.5 py-0.5 backdrop-blur">
        <span className="label-mono text-muted-foreground">
          etapa · {model.metrics.blockCount} bloques
        </span>
      </div>
    </div>
  );
}

export function Process() {
  return (
    <section
      id="proceso"
      className="paper-theme relative bg-blueprint-paper py-20 sm:py-28"
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
