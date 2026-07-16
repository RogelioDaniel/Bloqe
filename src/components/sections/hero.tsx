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

  // === Coreografía por scroll ===
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Destrucción: empieza al inicio del scroll y termina a media altura.
  const breakProgress = useTransform(scrollYProgress, [0.1, 0.6], [0, 1]);
  // El castillo se desvanece por completo a media altura — justo cuando
  // entra el contenido de Services, sin dejar vacío.
  const castleOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.62],
    [1, 1, 0]
  );

  // Rotación 3D FLUIDA de la cámara (CSS rotateY). De 0° a ~30°.
  const spinY = useTransform(scrollYProgress, [0, 0.6], [0, 30]);
  // El castillo se mueve hacia ABAJO con el scroll.
  const castleY = useTransform(scrollYProgress, [0, 0.7], [0, 260]);

  // El contenido sube y se desvanece.
  const copyY = useTransform(scrollYProgress, [0, 0.5], [0, 120]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  // Suscripción para alimentar breakProgress y spinY (números) al
  // LegoModel, que espera valores primitivos, no MotionValue.
  const [breakValue, setBreakValue] = useState(0);
  const [spinValue, setSpinValue] = useState(0);
  useEffect(() => {
    const ub = breakProgress.on("change", (v) =>
      setBreakValue(Math.round(v * 40) / 40)
    );
    const us = spinY.on("change", (v) => setSpinValue(Math.round(v * 10) / 10));
    return () => {
      ub();
      us();
    };
  }, [breakProgress, spinY]);

  // La animación de caída solo corre en el armado inicial; después,
  // los giros de cámara son cortes limpios (sin re-armar todo).
  const [entryDone, setEntryDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntryDone(true), 2800);
    return () => clearTimeout(t);
  }, []);

  // === Parallax sutil con el mouse — SOLO al inicio ===
  // Mientras vemos el castillo entero (scroll ≈ 0) sigue al mouse
  // para no verse estático. Al empezar a scrollear/desconstruir,
  // el parallax se desvanece a 0 y deja de seguir el mouse.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  // Multiplica el parallax por el fade: 1 al inicio, 0 al scrollear.
  const parallaxX = useTransform([sx, scrollYProgress], (vals) => {
    const [x, p] = vals as [number, number];
    const fade = Math.max(0, 1 - Math.min(1, p / 0.08));
    return x * fade;
  });
  const parallaxY = useTransform([sy, scrollYProgress], (vals) => {
    const [y, p] = vals as [number, number];
    const fade = Math.max(0, 1 - Math.min(1, p / 0.08));
    return y * fade;
  });

  function onMouseMove(e: React.MouseEvent) {
    const { innerWidth, innerHeight } = window;
    const nx = (e.clientX / innerWidth) * 2 - 1;
    const ny = (e.clientY / innerHeight) * 2 - 1;
    mx.set(nx * 16);
    my.set(ny * 10);
  }

  return (
    <section
      ref={sectionRef}
      id="top"
      onMouseMove={onMouseMove}
      // overflow-visible: los bloques desprendidos caen SOBRE la
      // siguiente sección. Altura ajustada: en desktop el castillo
      // termina justo cuando entra Services (sin vacío largo).
      className="relative h-[115vh] overflow-visible bg-ink bg-blueprint bg-grain sm:h-[140vh]"
    >
      {/* ===== Castillo gigante de fondo (pantalla completa) =====
          `fixed` + z alto: los bloques desprendidos caen VISIBLES
          sobre la sección siguiente (no se cortan ni se tapan por
          su fondo). El castillo completo se desvanece antes de que
          llegues abajo, así que no tapa el contenido permanentemente. */}
      <motion.div
        aria-hidden
        style={{ opacity: castleOpacity, y: castleY }}
        className="pointer-events-none fixed inset-0 z-40 flex items-start justify-center pt-[6vh] sm:items-start sm:justify-end sm:pt-[2vh] sm:pr-[2vw]"
      >
        {/* resplandor ambiental */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 45%, rgba(232,84,42,0.12), rgba(232,84,42,0) 60%)",
          }}
        />
        {/* parallax de mouse anidado — se desvanece al scrollear */}
        <motion.div
          style={{ x: parallaxX, y: parallaxY }}
          className="h-[62vh] w-full sm:h-[110vh] sm:w-[60vw]"
        >
          <LegoModel
            model={model}
            breakProgress={breakValue}
            spinY={spinValue}
            entryAnimation={!entryDone}
            maxDelay={2200}
            float
            className="h-full w-full"
            ariaLabel="Castillo de bloques de cuento"
          />
        </motion.div>
      </motion.div>

      {/* R4: Viñeta SOLO en móvil (el efecto "ventana transparente"
          que te gustó). Sube desde abajo, donde vive el texto, y
          deja ver el castillo arriba. Desaparece con el castillo. */}
      <motion.div
        aria-hidden
        style={{ opacity: castleOpacity }}
        className="pointer-events-none fixed inset-0 z-[45] bg-gradient-to-t from-ink via-ink/40 to-transparent sm:hidden"
      />

      {/* (Gradiente lateral izquierdo de desktop eliminado — tapaba
          el castillo al inicio. El texto ya tiene su propio fondo
          translúcido para legibilidad.) */}

      {/* ===== Contenido superpuesto (encima del castillo z-40) ===== */}
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative z-50 mx-auto flex min-h-screen max-w-7xl flex-col justify-end px-4 pt-28 pb-8 sm:justify-center sm:px-8 sm:pb-20"
      >
        <div className="max-w-xl">
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
