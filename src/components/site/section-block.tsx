"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ============================================================
//  SECTION BLOCK — la página como construcción de bloques
//  Cada sección "encaja" al entrar en viewport: sube, rebota
//  levemente al asentarse (como un brick al abrocharse) y una
//  fila de studs de conexión se ilumina en su borde superior,
//  marcando la unión con la sección anterior.
// ============================================================

const STUD_COLORS = [
  "#c8281c",
  "#f5b82e",
  "#1e5aa8",
  "#2e8b57",
  "#e8542a",
  "#f5b82e",
  "#1e5aa8",
];

export function SectionBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="apart"
      whileInView="joined"
      viewport={{ once: true, margin: "-12% 0px" }}
      variants={{
        apart: { y: 56, opacity: 0 },
        joined: {
          y: 0,
          opacity: 1,
          transition: {
            // rebote corto: el "click" del bloque al encajar
            type: "spring",
            stiffness: 220,
            damping: 22,
            mass: 0.9,
          },
        },
      }}
      className={cn("relative", className)}
    >
      {/* Studs de conexión: se encienden al encajar la sección. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[7px] left-1/2 z-10 flex -translate-x-1/2 gap-3"
      >
        {STUD_COLORS.map((c, i) => (
          <motion.span
            key={i}
            variants={{
              apart: { scale: 0, opacity: 0 },
              joined: {
                scale: 1,
                opacity: 0.85,
                transition: {
                  delay: 0.18 + i * 0.05,
                  type: "spring",
                  stiffness: 420,
                  damping: 16,
                },
              },
            }}
            className="h-3 w-3 rounded-full sm:h-3.5 sm:w-3.5"
            style={{
              background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%), ${c}`,
              boxShadow:
                "inset 0 -1px 2px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.35)",
            }}
          />
        ))}
      </div>
      {children}
    </motion.div>
  );
}
