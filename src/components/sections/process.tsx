"use client";

import { motion } from "framer-motion";
import {
  MessagesSquare,
  PencilRuler,
  Calculator,
  HardHat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Nos cuentas tu proyecto",
    description:
      "Una llamada o una visita al terreno. Escuchamos qué quieres construir, para quién y con qué presupuesto.",
    detail: "respuesta en 24 h · visita sin costo",
    icon: MessagesSquare,
  },
  {
    number: "02",
    title: "Diseño + maqueta de bloques",
    description:
      "Dibujamos el proyecto y lo armamos como maqueta de bloques: ves volúmenes, niveles y fachadas antes de aprobar nada.",
    detail: "2–4 semanas",
    icon: PencilRuler,
  },
  {
    number: "03",
    title: "Presupuesto pieza por pieza",
    description:
      "Desglosamos la obra como un set de bloques: cada partida con su precio. Presupuesto cerrado, sin sorpresas a mitad de obra.",
    detail: "precio cerrado por contrato",
    icon: Calculator,
  },
  {
    number: "04",
    title: "Construcción y entrega",
    description:
      "Construimos por etapas con reportes semanales de avance y residente en obra. Entregamos a tiempo, con garantía de 10 años.",
    detail: "3–9 meses según la obra",
    icon: HardHat,
  },
];

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
              De la idea a las llaves, en cuatro pasos.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground text-pretty leading-relaxed">
              Un proceso claro y sin intermediarios. Cada paso deja registro:
              sabes en qué va tu obra, siempre.
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
              ¿Listo para el paso 01?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuéntanos tu proyecto hoy y agenda una visita sin costo.
            </p>
          </div>
          <a
            href="#contacto"
            className="brick-press inline-flex items-center gap-1.5 rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-colors hover:bg-signal-2"
          >
            Cotizar mi obra
          </a>
        </motion.div>
      </div>
    </section>
  );
}
