"use client";

import { motion } from "framer-motion";

interface SectionDividerProps {
  /** "light-to-dark" or "dark-to-light" — controls the gradient direction */
  variant?: "light-to-dark" | "dark-to-light";
  /** flip the brick pattern orientation */
  flip?: boolean;
}

/**
 * Divisor entre secciones: una fila de bloques que LLEGAN DE DERECHA A
 * IZQUIERDA y se ensamblan horizontalmente para "cerrar" la sección
 * anterior antes de iniciar la siguiente. Refuerza la metáfora de que
 * la página se construye con bloques.
 */
export function SectionDivider({
  variant = "dark-to-light",
  flip = false,
}: SectionDividerProps) {
  const bricks = Array.from({ length: 16 }, (_, i) => i);
  const colors = [
    "#c8281c",
    "#f5b82e",
    "#1e5aa8",
    "#2e8b57",
    "#e8542a",
    "#9aa1ad",
  ];

  const fromBg = variant === "dark-to-light" ? "var(--ink)" : "var(--paper)";
  const toBg = variant === "dark-to-light" ? "var(--paper)" : "var(--ink)";

  return (
    <div
      className="relative h-16 sm:h-20 overflow-hidden"
      style={{
        background: `linear-gradient(${flip ? "0deg" : "180deg"}, ${fromBg} 0%, ${fromBg} 45%, ${toBg} 55%, ${toBg} 100%)`,
      }}
      aria-hidden
    >
      {/* brick row — entran de derecha a izquierda en cascada */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center gap-1 sm:gap-1.5 px-2">
        {bricks.map((i) => {
          const color = colors[i % colors.length];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 120, rotate: 8 }}
              whileInView={{ opacity: 0.85, x: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                // Los primeros bloques (izquierda) llegan primero: se
                // ensamblan de derecha → izquierda como pidiendo orden.
                delay: (bricks.length - i) * 0.045,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative h-6 w-8 sm:h-8 sm:w-11 rounded-sm shrink-0"
              style={{
                backgroundColor: color,
                boxShadow:
                  "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              {/* stud */}
              <span
                className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.3)",
                  boxShadow: "inset 0 -1px 1px rgba(0,0,0,0.2)",
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
