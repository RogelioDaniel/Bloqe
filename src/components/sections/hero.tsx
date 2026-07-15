"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
} from "@/lib/lego";

// Three.js Canvas must be client-only, no SSR
const LegoScene3D = dynamic(
  () => import("@/components/lego3d/lego-scene-3d").then((m) => m.LegoScene3D),
  { ssr: false, loading: () => null }
);

const STATS = [
  { value: "240+", label: "obras entregadas" },
  { value: "1.8M", label: "bloques colocados" },
  { value: "12", label: "ciudades activas" },
];

function useLoopedTower(intervalMs = 6200) {
  const [buildId, setBuildId] = useState(0);
  const [model] = useState<VoxelModel>(() =>
    generateBuilding("tower", PALETTE_SETS.classic, { floors: 9, width: 5, depth: 5 })
  );
  useEffect(() => {
    const t = setInterval(() => setBuildId((i) => i + 1), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return { buildId, model };
}

export function Hero() {
  const { buildId, model } = useLoopedTower();

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
              <Sparkles className="h-3.5 w-3.5 text-signal" />
              <span className="label-mono text-muted-foreground">
                Constructora modular · est. 2019
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-6 font-display font-extrabold tracking-tight text-balance text-[clamp(2.6rem,7vw,5.2rem)] leading-[0.92]"
            >
              Construimos con{" "}
              <span className="relative inline-block">
                <span className="text-signal">bloques</span>
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
              </span>{" "}
              lo que solo imaginabas.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty leading-relaxed"
            >
              Sube una imagen de la obra que sueñas. Nuestro estudio la analiza,
              genera un modelo 3D de bloques modulares y lo construimos pieza por
              pieza — con la precisión del LEGO y el oficio de una constructora.
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
                className="bg-signal text-signal-foreground hover:bg-signal-2 rounded-full h-12 px-6 text-base"
              >
                <a href="#estudio">
                  Abrir estudio de bloques
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full h-12 px-6 text-base border-border bg-ink-2/40 hover:bg-ink-3"
              >
                <a href="#proyectos">
                  <Play className="mr-2 h-4 w-4" />
                  Ver obras construidas
                </a>
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

          {/* Right: live tower */}
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
                      modelo-001 · torre residencial
                    </span>
                  </div>
                  <span className="label-mono text-muted-foreground hidden sm:inline">
                    en construcción
                  </span>
                </div>

                <div className="relative aspect-[4/3] sm:aspect-[16/11] bg-blueprint-fine">
                  {/* crane line */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-0 h-2/3 w-px bg-gradient-to-b from-transparent via-signal/40 to-transparent"
                  />
                  <LegoScene3D
                    model={model}
                    buildId={buildId}
                    className="absolute inset-0 h-full w-full"
                    maxDelay={2400}
                    autoRotate
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
                <div className="label-mono text-signal">ensamblaje en vivo</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  cada bloque se coloca con tolerancia ±0.4&nbsp;mm
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
