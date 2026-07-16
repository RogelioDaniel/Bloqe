"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll } from "framer-motion";

interface SectionDividerProps {
  /** "light-to-dark" or "dark-to-light" — controls the gradient direction */
  variant?: "light-to-dark" | "dark-to-light";
  /** flip the brick pattern orientation */
  flip?: boolean;
}

const COLORS = [
  "#c8281c",
  "#f5b82e",
  "#1e5aa8",
  "#2e8b57",
  "#e8542a",
  "#9aa1ad",
];

const BRICKS = 14;

/**
 * Divisor entre secciones, LIGADO AL SCROLL: conforme bajas, los
 * bloques van llegando desde la derecha y se ensamblan de derecha a
 * izquierda hasta cerrar la hilada; al completarse, un bloque corona
 * se asienta encima. Si subes, la hilada se desarma — la página se
 * construye y desconstruye contigo.
 */
export function SectionDivider({
  variant = "dark-to-light",
  flip = false,
}: SectionDividerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // 0 → el divisor asoma por abajo; 1 → llegó a ~55% del viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.55"],
  });

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) =>
      // cuantizado para no re-renderizar en cada pixel de scroll
      setProgress(Math.round(v * BRICKS * 2) / (BRICKS * 2))
    );
    return () => unsub();
  }, [scrollYProgress]);

  const fromBg = variant === "dark-to-light" ? "var(--ink)" : "var(--paper)";
  const toBg = variant === "dark-to-light" ? "var(--paper)" : "var(--ink)";

  // El brick i (0 = izquierda) se coloca cuando el progreso alcanza su
  // umbral; el orden de llegada es derecha → izquierda.
  const placedCount = Math.floor(progress * (BRICKS + 1));
  const capstonePlaced = progress >= 0.98;

  return (
    <div
      ref={ref}
      className="relative h-20 overflow-hidden sm:h-24"
      style={{
        background: `linear-gradient(${flip ? "0deg" : "180deg"}, ${fromBg} 0%, ${fromBg} 45%, ${toBg} 55%, ${toBg} 100%)`,
      }}
      aria-hidden
    >
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
        {/* bloque corona: se asienta al cerrar la hilada */}
        <div
          className="absolute -top-5 left-1/2 h-5 w-14 -translate-x-1/2 rounded-sm sm:-top-6 sm:h-6 sm:w-16"
          style={{
            backgroundColor: "#e8542a",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.25)",
            opacity: capstonePlaced ? 1 : 0,
            transform: `translateX(-50%) translateY(${capstonePlaced ? 0 : -26}px) rotate(${capstonePlaced ? 0 : -5}deg)`,
            transition:
              "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease",
          }}
        >
          <span className="absolute -top-[5px] inset-x-0 flex justify-evenly">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: "#e8542a",
                  boxShadow:
                    "inset 0 2px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.35)",
                }}
              />
            ))}
          </span>
        </div>

        {/* hilada: los bricks llegan desde la derecha, uno tras otro */}
        <div className="flex gap-1 px-2 sm:gap-1.5">
          {Array.from({ length: BRICKS }).map((_, i) => {
            const color = COLORS[i % COLORS.length];
            // la colocación avanza de derecha (i = BRICKS-1) a izquierda
            const placed = i >= BRICKS - placedCount;
            return (
              <div
                key={i}
                className="relative h-7 w-9 shrink-0 rounded-sm sm:h-8 sm:w-11"
                style={{
                  backgroundColor: color,
                  boxShadow:
                    "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                  opacity: placed ? 0.92 : 0,
                  // llegan deslizándose desde la derecha, con leve giro
                  transform: placed
                    ? "translateX(0) rotate(0deg)"
                    : "translateX(110px) rotate(6deg)",
                  transition:
                    "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease",
                }}
              >
                <span
                  className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.3)",
                    boxShadow: "inset 0 -1px 1px rgba(0,0,0,0.2)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
