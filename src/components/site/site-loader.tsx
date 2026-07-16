"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { LegoModel } from "@/components/lego/lego-model";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
} from "@/lib/lego";

// ============================================================
//  SITE LOADER — pantalla de carga temática
//  En cada visita se arma una obra DISTINTA (tipo, paleta y
//  tamaño aleatorios) pieza por pieza, mientras el wordmark
//  BLOQE cae letra a letra. Siempre se muestra: es la firma
//  de entrada del sitio.
// ============================================================

const BUILD_MS = 1200;
const REDUCED_MS = 400;

const LETTERS = [
  { char: "B", color: "#e8542a" },
  { char: "L", color: "#f5b82e" },
  { char: "O", color: "#1e5aa8" },
  { char: "Q", color: "#2e8b57" },
  { char: "E", color: "#c8281c" },
];

/** Construye siempre el edificio de la escuela — la identidad de
 *  BLOQE. Modelo pequeño para renderizar fluido. */
function schoolModel(): { model: VoxelModel; label: string } {
  const palettes = ["candy", "rainbow", "storybook", "classic"];
  const paletteKey = palettes[Math.floor(Math.random() * palettes.length)];
  const palette = PALETTE_SETS[paletteKey] ?? PALETTE_SETS.classic;
  return {
    model: generateBuilding("schoolhouse", palette, {
      width: 6,
      depth: 4,
      floors: 3,
    }),
    label: "escuela",
  };
}

export function SiteLoader() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();
  const [build, setBuild] = useState<{ model: VoxelModel; label: string } | null>(
    null
  );
  const startedRef = useRef(false);

  const duration = reducedMotion ? REDUCED_MS : BUILD_MS;

  useEffect(() => {
    // Sobrevive al doble efecto de React Strict Mode sin re-generar.
    if (!startedRef.current) {
      startedRef.current = true;
      setBuild(schoolModel());
    }

    const counter = animate(0, 100, {
      duration: duration / 1000,
      ease: "linear",
      onUpdate: (v) => setProgress(Math.round(v)),
    });
    const timeout = setTimeout(() => setShow(false), duration + 250);
    return () => {
      counter.stop();
      clearTimeout(timeout);
    };
  }, [duration]);

  // Bloquea el scroll mientras el sitio "se construye".
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="site-loader"
          role="status"
              aria-label="Armando el sitio"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink bg-blueprint-fine"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
        >
          {/* resplandor signal */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 60%, rgba(232,84,42,0.14), rgba(232,84,42,0) 55%)",
            }}
          />

          <div className="relative flex flex-col items-center px-6">
            {/* obra aleatoria armándose — buildProgress animado de 0→1
                sigue a la barra de progreso, así los bloques caen en
                orden de abajo→arriba pero fluido (modo quick). Se
                cuantiza a pasos de ~3% para no saturar de re-renders. */}
            <div className="h-48 w-64 sm:h-56 sm:w-80">
              {build && (
                <LegoModel
                  model={build.model}
                  buildProgress={Math.round((progress / 100) * 32) / 32}
                  className="h-full w-full"
                  ariaLabel="Maqueta de bloques en construcción"
                />
              )}
            </div>
            {build && (
              <span className="label-mono mt-3 text-muted-foreground">
                armamos algo nuevo · {build.label}
              </span>
            )}

            {/* wordmark por bloques */}
            <div className="mt-6 flex items-center gap-2" aria-hidden>
              {LETTERS.map((l, i) => (
                <span
                  key={l.char}
                  className="loader-letter flex h-11 w-11 items-center justify-center rounded-md font-display text-xl shadow-brick sm:h-12 sm:w-12 sm:text-2xl"
                  style={{
                    backgroundColor: l.color,
                    animationDelay: `${300 + i * 130}ms`,
                    color: "#0b0d10",
                  }}
                >
                  {l.char}
                </span>
              ))}
            </div>

            {/* progreso */}
            <div className="mt-8 w-56 sm:w-64">
              <div className="flex items-baseline justify-between">
                <span className="label-mono text-muted-foreground">
                  armando bloques
                </span>
                <span className="font-mono text-sm text-signal tabular-nums">
                  {progress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3">
                <div
                  className="h-full rounded-full bg-signal transition-[width] duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
