"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrickLink } from "@/components/site/brick-transition";
import { LegoModel } from "@/components/lego/lego-model";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
} from "@/lib/lego";

const STATS = [
  { value: "240+", label: "obras entregadas" },
  { value: "18", label: "años construyendo" },
  { value: "12", label: "ciudades activas" },
];

/** La maqueta del hero se rearma en loop hasta que el usuario juega con ella. */
function useLoopedTower(intervalMs = 8000) {
  const [buildId, setBuildId] = useState(0);
  const pausedRef = useRef(false);
  const [model] = useState<VoxelModel>(() =>
    generateBuilding("tower", PALETTE_SETS.classic, { floors: 8, width: 5, depth: 5 })
  );
  useEffect(() => {
    const t = setInterval(() => {
      if (!pausedRef.current) setBuildId((i) => i + 1);
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);
  return { buildId, model, pause };
}

/** Brick decorativo flotante con studs, en colores de marca. */
function FloatingBrick({
  color,
  className,
  duration = 6,
  delay = 0,
  studs = 2,
}: {
  color: string;
  className?: string;
  duration?: number;
  delay?: number;
  studs?: number;
}) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute ${className ?? ""}`}
      animate={{ y: [0, -12, 0], rotate: [0, 2.5, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <div
        className="relative h-7 rounded-[4px] shadow-brick"
        style={{ backgroundColor: color, width: `${studs * 22}px` }}
      >
        <div className="absolute -top-1.5 inset-x-0 flex justify-evenly">
          {Array.from({ length: studs }).map((_, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow:
                  "inset 0 2px 2px rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.35)",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const { buildId, model, pause } = useLoopedTower();

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-ink bg-blueprint bg-grain pt-28 pb-16 sm:pt-32 lg:pt-36"
    >
      {/* ambient signal glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 h-[480px] w-[480px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(232,84,42,0.20), rgba(232,84,42,0) 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(30,90,168,0.16), rgba(30,90,168,0) 65%)",
        }}
      />

      {/* bricks flotantes de fondo */}
      <FloatingBrick color="#c8281c" className="top-24 left-[4%] opacity-25 hidden sm:block" duration={7} />
      <FloatingBrick color="#f5b82e" className="top-40 right-[6%] opacity-20 hidden md:block" duration={6} delay={1.2} studs={3} />
      <FloatingBrick color="#1e5aa8" className="bottom-24 left-[10%] opacity-15 hidden lg:block" duration={8} delay={0.6} />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-6 xl:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-ink-2/60 px-3 py-1.5 backdrop-blur"
            >
              <HardHat className="h-3.5 w-3.5 text-signal" />
              <span className="label-mono text-muted-foreground">
                Constructora · CDMX · est. 2008
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-6 font-display font-extrabold tracking-tight text-balance text-[clamp(2.6rem,7vw,5.2rem)] leading-[0.92]"
            >
              Construimos tu obra{" "}
              <span className="relative inline-block">
                <span className="text-signal">bloque a bloque</span>
                <svg
                  aria-hidden
                  className="absolute -bottom-2 left-0 w-full h-3"
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
              className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty leading-relaxed"
            >
              Bloqe es una constructora: casas, locales, remodelaciones y obra
              comercial. Antes de colocar el primer ladrillo te mostramos tu
              proyecto como una maqueta de bloques — así ves exactamente qué
              vamos a construir, pieza por pieza.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Button
                asChild
                size="lg"
                className="btn-brick font-round bg-signal text-signal-foreground hover:bg-signal-2 h-12 px-6 text-base"
              >
                <BrickLink href="#contacto">
                  Cotizar mi obra
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </BrickLink>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="brick-press font-round rounded-lg h-12 px-6 text-base border-border bg-ink-2/40 hover:bg-ink-3"
              >
                <BrickLink href="#proyectos">Ver proyectos</BrickLink>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.dl
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-12 grid grid-cols-3 gap-4 max-w-lg"
            >
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-ink-2/40 px-4 py-3.5 backdrop-blur"
                >
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="font-display text-3xl font-bold tracking-tight text-foreground">
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

          {/* Right: maqueta en vivo */}
          <div className="lg:col-span-6 xl:col-span-7">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* technical frame */}
              <div className="relative rounded-2xl border border-border bg-ink-2/40 backdrop-blur-sm overflow-hidden">
                {/* top bar */}
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-signal" />
                    <span className="label-mono text-muted-foreground">
                      maqueta-001 · torre residencial
                    </span>
                  </div>
                  <span className="label-mono text-muted-foreground hidden sm:inline">
                    tócala · gírala · rómpela
                  </span>
                </div>

                <div className="relative aspect-[4/3] sm:aspect-[16/11] bg-blueprint-fine">
                  {/* crane line */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-0 h-2/3 w-px bg-gradient-to-b from-transparent via-signal/40 to-transparent"
                  />
                  <LegoModel
                    model={model}
                    buildId={buildId}
                    className="absolute inset-0 h-full w-full p-6 sm:p-10"
                    maxDelay={2200}
                    float
                    interactive
                    controls
                    onUserAction={pause}
                    ariaLabel="Maqueta de bloques de una torre residencial armándose"
                  />
                  {/* scanning beam */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 h-16 shimmer opacity-60"
                  />
                </div>

                {/* footer metrics */}
                <div className="grid grid-cols-3 border-t border-border">
                  <div className="px-4 py-3 border-r border-border">
                    <div className="label-mono text-muted-foreground">bloques</div>
                    <div className="mt-0.5 font-mono text-sm text-foreground">
                      {model.metrics.blockCount}
                    </div>
                  </div>
                  <div className="px-4 py-3 border-r border-border">
                    <div className="label-mono text-muted-foreground">niveles</div>
                    <div className="mt-0.5 font-mono text-sm text-foreground">
                      {model.metrics.layerCount}
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="label-mono text-muted-foreground">altura</div>
                    <div className="mt-0.5 font-mono text-sm text-foreground">
                      {model.metrics.heightM} m
                    </div>
                  </div>
                </div>
              </div>

              {/* floating tag */}
              <div className="absolute -bottom-4 -left-3 sm:-left-6 rounded-lg border border-border bg-ink-2 px-3.5 py-2.5 shadow-brick">
                <div className="label-mono text-signal">maqueta de bloques</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  así presentamos cada diseño antes de construirlo
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
