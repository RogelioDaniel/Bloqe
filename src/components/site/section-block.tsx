"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ============================================================
//  SECTION BLOCK — la página como construcción de bloques
//  Cada sección "encaja" al entrar en viewport: sube y rebota
//  levemente al asentarse, como un brick al abrocharse.
// ============================================================

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
      {children}
    </motion.div>
  );
}
