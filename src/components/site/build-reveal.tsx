"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Envuelve el contenido de una sección para que se "ensamble" al entrar
 * en viewport: las piezas suben desde abajo y encajan en su lugar, como
 * si la sección se construyera con bloques. Refuerza la metáfora de que
 * la página entera es una construcción de bloques.
 *
 * No añade elementos decorativos: anima el contenido existente
 * (artículos, encabezados, tarjetas) con un escalonado por filas.
 */
export function BuildReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Bloque de construcción: un hijo que "cae y encaja" al ensamblarse.
 * Úsalo como wrapper de tarjetas/elementos dentro de BuildReveal.
 */
export function BuildBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 40, scale: 0.96 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
