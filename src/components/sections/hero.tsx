"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrickLink } from "@/components/site/brick-transition";
import { LegoModel } from "@/components/lego/lego-model";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
} from "@/lib/lego";

const STATS = [
  { value: "12", label: "años formando niños" },
  { value: "8:1", label: "ratio maestro-niño" },
  { value: "3–6", label: "años de edad" },
];

/** Castillo generado una sola vez (memoizado fuera del render). */
function useCastleModel() {
  const [model] = useState<VoxelModel>(() =>
    generateBuilding("castle", PALETTE_SETS.storybook, {
      floors: 5,
      width: 11,
      depth: 11,
    })
  );
  return model;
}

export function Hero() {
  const model = useCastleModel();
  const sectionRef = useRef<HTMLElement>(null);

  // === Destrucción por scroll ===
  // La sección mide 190vh: tras salir el texto queda casi una pantalla
  // completa donde el castillo sigue visible rompiéndose — sus bloques
  // "alimentan" la construcción de la siguiente sección.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const breakProgress = useTransform(scrollYProgress, [0.2, 0.92], [0, 1]);
  const castleOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.5], [0, 120]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const [breakValue, setBreakValue] = useState(0);
  useEffect(() => {
    const unsub = breakProgress.on("change", (v) =>
      // Cuantizado: solo ~40 actualizaciones en todo el recorrido en
      // vez de una por pixel de scroll (re-render barato en móvil).
      setBreakValue(Math.round(v * 40) / 40)
    );
    return () => unsub();
  }, [breakProgress]);

  // === Parallax sutil con el mouse ===
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const castleX = useSpring(mx, { stiffness: 60, damping: 20 });
  const castleY = useSpring(my, { stiffness: 60, damping: 20 });

  function onMouseMove(e: React.MouseEvent) {
    const { innerWidth, innerHeight } = window;
    // -1 (izq/arriba) a 1 (der/abajo)
    const nx = (e.clientX / innerWidth) * 2 - 1;
    const ny = (e.clientY / innerHeight) * 2 - 1;
    // Movimiento tenué: máx ~18px
    mx.set(nx * 18);
    my.set(ny * 12);
  }

  return (
    <section
      ref={sectionRef}
      id="top"
      onMouseMove={onMouseMove}
      // overflow-visible permite que los bloques desprendidos caigan
      // por toda la pantalla en vez de cortarse en el canvas.
      className="relative h-[190vh] overflow-visible bg-ink bg-blueprint bg-grain"
    >
      {/* ===== Castillo gigante de fondo (pantalla completa) =====
          Móvil: ocupa el tercio superior, COMPLETO y sin texto encima.
          Desktop: corrido a la derecha; el texto vive a la izquierda. */}
      <motion.div
        aria-hidden
        style={{
          opacity: castleOpacity,
          x: castleX,
          y: castleY,
        }}
        // Fijo al viewport: ocupa toda la pantalla y los bloques caen
        // libremente sobre ella (no dentro de un contenedor recortado).
        className="pointer-events-none fixed inset-0 z-0 flex items-start justify-center pt-[9vh] sm:items-center sm:justify-end sm:pt-0 sm:pr-[2vw]"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 45%, rgba(232,84,42,0.13), rgba(232,84,42,0) 60%)",
          }}
        />
        <LegoModel
          model={model}
          breakProgress={breakValue}
          maxDelay={2200}
          float
          className="h-[52vh] w-full sm:h-[116vh] sm:w-[62vw]"
          ariaLabel="Castillo de bloques de cuento"
        />
      </motion.div>

      {/* Viñeta SOLO en móvil (sube desde abajo, donde vive el texto).
          En desktop no hay fades. Está ligada a la opacidad del castillo
          para que desaparezca con él y NUNCA se quede flotando sobre las
          secciones siguientes (era el "fade" fantasma que se veía en
          toda la página). */}
      <motion.div
        aria-hidden
        style={{ opacity: castleOpacity }}
        className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-t from-ink via-ink/40 to-transparent sm:hidden"
      />

      {/* ===== Contenido: placa de vidrio con studs =====
          Móvil: anclado abajo, bajo el castillo. Desktop: columna
          izquierda centrada. */}
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-end px-4 pt-28 pb-8 sm:justify-center sm:px-8 sm:pb-20"
      >
        <div className="card-brick max-w-xl rounded-2xl border border-border bg-ink/55 p-5 pt-7 backdrop-blur-md sm:border-transparent sm:bg-transparent sm:p-0 sm:pt-0 sm:backdrop-blur-none">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-ink-2/70 px-3 py-1.5 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-signal" />
            <span className="label-mono text-muted-foreground">
              Preescolar · CDMX · est. 2014
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-4 font-display text-[clamp(2rem,7vw,5rem)] font-extrabold leading-[0.92] tracking-tight text-balance sm:mt-6"
          >
            Donde crecen{" "}
            <span className="relative inline-block">
              <span className="text-signal">bloque a bloque</span>
              <svg
                aria-hidden
                className="absolute -bottom-2 left-0 h-3 w-full"
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
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-4 max-w-md text-base text-pretty leading-relaxed text-foreground/90 sm:mt-6 sm:text-lg"
          >
            Bloqe es una escuela preescolar para niños de 3 a 6 años. Aprenden
            jugando con bloques, arte, música e inglés — cada niño avanza a su
            ritmo, pieza por pieza.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="btn-brick font-round h-12 bg-signal px-6 text-base text-signal-foreground hover:bg-signal-2"
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
              className="brick-press font-round h-12 rounded-lg border-border bg-ink-2/50 px-6 text-base backdrop-blur hover:bg-ink-3"
            >
              <BrickLink href="#espacios">Ver los espacios</BrickLink>
            </Button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-6 grid max-w-md grid-cols-3 gap-3 sm:mt-12 sm:gap-4"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-ink-2/70 px-3 py-3 backdrop-blur sm:px-4 sm:py-3.5"
              >
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="font-display text-xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {s.value}
                  </span>
                  <span className="mt-1 block text-[0.65rem] text-muted-foreground sm:text-xs">
                    {s.label}
                  </span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </motion.div>
    </section>
  );
}
