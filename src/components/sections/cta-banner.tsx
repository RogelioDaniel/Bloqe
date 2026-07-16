"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrickLink } from "@/components/site/brick-transition";
import { LegoModel } from "@/components/lego/lego-model";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelCell,
  type VoxelModel,
} from "@/lib/lego";

// ============================================================
//  CTA FINAL — el castillo del rey
//  La última obra del recorrido: un castillo coronado por un
//  pequeño rey con corona dorada — el éxito que serán sus hijos.
//  Se construye bloque a bloque conforme llegas a la sección.
// ============================================================

const GOLD = "#e8a20c";

/**
 * Corona el castillo con un rey: pedestal, cuerpo con capa,
 * cabeza amarilla y corona dorada (los studs del bloque dorado
 * hacen de puntas de la corona).
 */
function withKing(base: VoxelModel): VoxelModel {
  const [w, h, d] = base.size;
  const cx = Math.floor(w / 2);
  const cz = Math.floor(d / 2);

  // cuántas capas extra necesita el rey sobre el punto más alto
  let topAtCenter = -1;
  for (let y = h - 1; y >= 0; y--) {
    if (base.grid[cx][y][cz]) {
      topAtCenter = y;
      break;
    }
  }
  let maxY = 0;
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++)
      for (let z = 0; z < d; z++) if (base.grid[x][y][z] && y > maxY) maxY = y;

  // el rey debe asomar por encima de las murallas
  const kingBase = Math.max(topAtCenter, maxY - 2);
  const kingTop = kingBase + 6; // pedestal(2) + cuerpo(2) + cabeza(1) + corona(1)
  const H = Math.max(h, kingTop + 1);

  // clona la rejilla (y extiéndela en altura si hace falta)
  const grid: (VoxelCell | null)[][][] = [];
  for (let x = 0; x < w; x++) {
    grid[x] = [];
    for (let y = 0; y < H; y++) {
      grid[x][y] = [];
      for (let z = 0; z < d; z++) {
        grid[x][y][z] = y < h ? base.grid[x][y][z] : null;
      }
    }
  }

  // pedestal gris (2), cuerpo azul con capa roja (2), cabeza, corona
  grid[cx][kingBase + 1][cz] = { color: "#9aa1ad" };
  grid[cx][kingBase + 2][cz] = { color: "#9aa1ad" };
  grid[cx][kingBase + 3][cz] = { color: "#1e5aa8" };
  // hombros/capa a los lados del torso
  if (cx > 0) grid[cx - 1][kingBase + 4][cz] = { color: "#c8281c" };
  if (cx < w - 1) grid[cx + 1][kingBase + 4][cz] = { color: "#c8281c" };
  grid[cx][kingBase + 4][cz] = { color: "#1e5aa8" };
  grid[cx][kingBase + 5][cz] = { color: "#f5b82e" }; // cabeza
  grid[cx][kingBase + 6][cz] = { color: GOLD }; // corona

  // métricas actualizadas
  let count = 0;
  for (let x = 0; x < w; x++)
    for (let y = 0; y < H; y++)
      for (let z = 0; z < d; z++) if (grid[x][y][z]) count++;

  return {
    ...base,
    grid,
    size: [w, H, d],
    metrics: {
      blockCount: count,
      layerCount: kingTop + 1,
      heightM: Math.round((kingTop + 1) * 0.096 * 10) / 10,
    },
  };
}

export function CtaBanner() {
  const sectionRef = useRef<HTMLElement>(null);

  const model = useMemo(
    () =>
      withKing(
        generateBuilding("castle", PALETTE_SETS.rainbow, {
          floors: 5,
          width: 11,
          depth: 11,
        })
      ),
    []
  );

  // El castillo del rey se arma conforme llegas al cierre.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.95", "start 0.25"],
  });
  const buildRaw = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [build, setBuild] = useState(0);
  useEffect(() => {
    const unsub = buildRaw.on("change", (v) =>
      setBuild(Math.round(v * 30) / 30)
    );
    return () => unsub();
  }, [buildRaw]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-ink py-16 sm:py-24">
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-blueprint-fine opacity-60"
      />

      <div className="relative mx-auto max-w-5xl px-5 sm:px-8 text-center">
        {/* ===== El castillo del rey — GRANDE, como el del inicio ===== */}
        <div className="relative mx-auto h-[52vh] w-full max-w-2xl sm:h-[68vh]">
          <LegoModel
            model={model}
            buildProgress={build}
            float
            interactive
            className="absolute inset-0 h-full w-full"
            ariaLabel="Castillo de bloques coronado por un rey"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-ink-2/60 px-3 py-1.5 backdrop-blur">
            <Crown className="h-3.5 w-3.5" style={{ color: GOLD }} />
            <span className="label-mono text-muted-foreground">
              cada niño, rey de su propio castillo
            </span>
          </div>

          <h2 className="mt-6 font-display font-extrabold tracking-tight text-balance text-[clamp(2.2rem,5.5vw,4rem)] leading-[0.95]">
            El primer bloque de su futuro{" "}
            <span className="text-signal">empieza aquí.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-pretty leading-relaxed">
            Agenda una visita y conoce la escuela con tu hijo. Te mostramos los
            espacios, el método y respondemos todas tus dudas. Sin costo y sin
            compromiso.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="btn-brick font-round bg-signal text-signal-foreground hover:bg-signal-2 h-12 px-7 text-base"
            >
              <BrickLink href="#contacto">
                Agendar una visita
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </BrickLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="brick-press font-round rounded-lg h-12 px-7 text-base border-border bg-ink-2/40 hover:bg-ink-3"
            >
              <BrickLink href="#espacios">Ver los espacios</BrickLink>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Sin compromiso · Visita sin costo · Respuesta en 24 horas hábiles
          </p>
        </motion.div>
      </div>
    </section>
  );
}
