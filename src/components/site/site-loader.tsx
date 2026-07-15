"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { LegoModel } from "@/components/lego/lego-model";
import { generateBuilding, PALETTE_SETS, type VoxelModel } from "@/lib/lego";

// ============================================================
//  SITE LOADER — pantalla de carga temática
//  Una maqueta de bloques se arma pieza por pieza mientras el
//  wordmark BLOQE cae letra a letra, como si el sitio mismo
//  se estuviera construyendo. Se muestra una vez por sesión.
// ============================================================

const SESSION_KEY = "bloqe-loader-seen";
const BUILD_MS = 2400;
const REDUCED_MS = 500;

const LETTERS = [
  { char: "B", color: "#e8542a" },
  { char: "L", color: "#f5b82e" },
  { char: "O", color: "#1e5aa8" },
  { char: "Q", color: "#2e8b57" },
  { char: "E", color: "#c8281c" },
];

export function SiteLoader() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();
  const modelRef = useRef<VoxelModel | null>(null);
  const [model, setModel] = useState<VoxelModel | null>(null);
  // Se decide una sola vez por montaje (sobrevive al doble efecto de
  // React Strict Mode en desarrollo).
  const shouldPlay = useRef<boolean | null>(null);

  const duration = reducedMotion ? REDUCED_MS : BUILD_MS;

  useEffect(() => {
    if (shouldPlay.current === null) {
      shouldPlay.current = !sessionStorage.getItem(SESSION_KEY);
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    if (!shouldPlay.current) {
      setShow(false);
      return;
    }

    if (!modelRef.current) {
      modelRef.current = generateBuilding("tower", PALETTE_SETS.classic, {
        floors: 5,
        width: 4,
        depth: 4,
      });
    }
    setModel(modelRef.current);

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
          aria-label="Construyendo el sitio"
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
            {/* maqueta armándose */}
            <div className="h-44 w-44 sm:h-52 sm:w-52">
              {model && (
                <LegoModel
                  model={model}
                  maxDelay={duration * 0.62}
                  className="h-full w-full"
                  ariaLabel="Maqueta de bloques en construcción"
                />
              )}
            </div>

            {/* wordmark por bloques */}
            <div className="mt-8 flex items-center gap-2" aria-hidden>
              {LETTERS.map((l, i) => (
                <span
                  key={l.char}
                  className="loader-letter flex h-11 w-11 items-center justify-center rounded-md font-display text-xl font-extrabold text-ink shadow-brick sm:h-12 sm:w-12 sm:text-2xl"
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
                  colocando bloques
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
