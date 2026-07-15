"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A bold closing CTA banner that bridges the FAQ/Contact sections.
 * Premium: full-bleed signal-orange accent with a blueprint grid overlay
 * and a mini floating brick motif.
 */
export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-ink py-20 sm:py-28">
      {/* signal glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 120%, rgba(232,84,42,0.22), rgba(232,84,42,0) 60%)",
        }}
      />
      {/* blueprint grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-blueprint-fine opacity-60" />

      {/* floating brick motif */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-12 left-[8%] h-10 w-20 rounded-md opacity-20"
        style={{ background: "#c8281c" }}
        animate={{ y: [0, -14, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-16 right-[10%] h-10 w-16 rounded-md opacity-20"
        style={{ background: "#f5b82e" }}
        animate={{ y: [0, 12, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-[20%] h-10 w-14 rounded-md opacity-15"
        style={{ background: "#1e5aa8" }}
        animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <div className="relative mx-auto max-w-4xl px-5 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-ink-2/60 px-3 py-1.5 backdrop-blur">
            <Boxes className="h-3.5 w-3.5 text-signal" />
            <span className="label-mono text-muted-foreground">
              ¿Listo para construir?
            </span>
          </div>

          <h2 className="mt-6 font-display font-extrabold tracking-tight text-balance text-[clamp(2.2rem,5.5vw,4rem)] leading-[0.95]">
            Tu próxima obra{" "}
            <span className="text-signal">empieza con un bloque.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-pretty leading-relaxed">
            Sube una imagen de la construcción que tienes en mente. En minutos
            tendrás un modelo 3D de bloques, un blueprint cotizable y una
            estimación real.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-signal text-signal-foreground hover:bg-signal-2 rounded-full h-12 px-7 text-base"
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
              className="rounded-full h-12 px-7 text-base border-border bg-ink-2/40 hover:bg-ink-3"
            >
              <a href="#contacto">Hablar con un asesor</a>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Sin compromiso · Prototipo gratuito · Respuesta en 24 horas hábiles
          </p>
        </motion.div>
      </div>
    </section>
  );
}
