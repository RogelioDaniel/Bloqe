"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrickLink } from "@/components/site/brick-transition";
import { LegoModel } from "@/components/lego/lego-model";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
} from "@/lib/lego";

const STATS = [
  { value: "12", label: "años formando niños" },
  { value: "8:1", label: "ratio maestro-niño" },
  { value: "3–6", label: "años de edad" },
];

/** Castillo generado una sola vez (memoizado fuera del render). */
function useCastleModel() {
  const [model] = useState<VoxelModel>(() =>
    generateBuilding("castle", PALETTE_SETS.storybook, {
      floors: 5,
      width: 11,
      depth: 11,
    })
  );
  return model;
}

export function Hero() {
  const model = useCastleModel();
  const sectionRef = useRef<HTMLElement>(null);

  // El progreso de destrucción sigue al scroll dentro del Hero.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // El castillo está intacto al inicio y se destruye por completo
  // antes de salir del viewport.
  const breakProgress = useTransform(scrollYProgress, [0.05, 0.85], [0, 1]);
  // El castillo se desvanece y sube ligeramente conforme se destruye.
  const castleOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.6, 0]);
  const castleY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  // El contenido aparece encima, con buen contraste siempre.
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  // Suscripción manual para alimentar breakProgress (0–1) al LegoModel,
  // que espera un número, no un MotionValue.
  const [breakValue, setBreakValue] = useState(0);
  useEffect(() => {
    const unsub = breakProgress.on("change", (v) => setBreakValue(v));
    return () => unsub();
  }, [breakProgress]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative h-[130vh] overflow-hidden bg-ink bg-blueprint bg-grain"
    >
      {/* ===== Castillo gigante de fondo (pantalla completa) ===== */}
      <motion.div
        aria-hidden
        style={{ opacity: castleOpacity, y: castleY }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {/* resplandor ambiental */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 65%, rgba(232,84,42,0.16), rgba(232,84,42,0) 60%)",
          }}
        />
        <LegoModel
          model={model}
          breakProgress={breakValue}
          maxDelay={2200}
          float
          className="h-[115vh] w-full max-w-none sm:h-[120vh]"
          ariaLabel="Castillo de bloques de cuento"
        />
      </motion.div>

      {/* Viñeta para garantizar legibilidad del texto sobre el castillo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 25% 45%, rgba(11,13,16,0.78) 0%, rgba(11,13,16,0.45) 45%, rgba(11,13,16,0.1) 100%)",
        }}
      />

      {/* ===== Contenido superpuesto ===== */}
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 pt-28 pb-20 sm:px-8"
      >
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-ink-2/70 px-3 py-1.5 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-signal" />
            <span className="label-mono text-muted-foreground">
              Preescolar · CDMX · est. 2014
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 font-display text-[clamp(2.4rem,8vw,5rem)] font-extrabold leading-[0.92] tracking-tight text-balance"
          >
            Donde crecen{" "}
            <span className="relative inline-block">
              <span className="text-signal">bloque a bloque</span>
              <svg
                aria-hidden
                className="absolute -bottom-2 left-0 h-3 w-full"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 8 Q 50 2, 100 7 T 198 6"
                  fill="none"
                  stroke="#e8542a"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-xl text-lg text-pretty leading-relaxed text-foreground/90"
          >
            Bloqe es una escuela preescolar para niños de 3 a 6 años. Aprenden
            jugando con bloques, arte, música e inglés en espacios diseñados
            para descubrir y crear — cada niño avanza a su ritmo, pieza por
            pieza.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="btn-brick font-round h-12 bg-signal px-6 text-base text-signal-foreground hover:bg-signal-2"
            >
              <BrickLink href="#contacto">
                Agendar una visita
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </BrickLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="brick-press font-round h-12 rounded-lg border-border bg-ink-2/50 px-6 text-base backdrop-blur hover:bg-ink-3"
            >
              <BrickLink href="#espacios">Ver los espacios</BrickLink>
            </Button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-12 grid max-w-lg grid-cols-3 gap-4"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-ink-2/70 px-4 py-3.5 backdrop-blur"
              >
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {s.value}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {s.label}
                  </span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </motion.div>
    </section>
  );
}
