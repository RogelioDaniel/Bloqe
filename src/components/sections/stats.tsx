"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import { Building2, Boxes, MapPin, ShieldCheck } from "lucide-react";

interface Stat {
  to: number;
  format: (n: number) => string;
  label: string;
  icon: typeof Building2;
  /** Target fill (0–1) for the decorative progress bar. */
  progress: number;
}

const STATS: Stat[] = [
  {
    to: 240,
    format: (n) => `${Math.round(n)}+`,
    label: "obras entregadas",
    icon: Building2,
    progress: 0.82,
  },
  {
    to: 480,
    format: (n) => `${Math.round(n)}K`,
    label: "m² construidos",
    icon: Boxes,
    progress: 0.68,
  },
  {
    to: 12,
    format: (n) => Math.round(n).toString(),
    label: "ciudades activas",
    icon: MapPin,
    progress: 0.45,
  },
  {
    to: 10,
    format: (n) => Math.round(n).toString(),
    label: "años de garantía",
    icon: ShieldCheck,
    progress: 1,
  },
];

/** Faint floating LEGO studs motif — scattered circles in classic brick colors. */
const STUD_MOTIF = [
  { x: "6%", y: "20%", color: "#c8281c", size: 14, delay: 0 },
  { x: "14%", y: "68%", color: "#f5b82e", size: 10, delay: 1.2 },
  { x: "32%", y: "14%", color: "#1e5aa8", size: 12, delay: 0.6 },
  { x: "48%", y: "82%", color: "#2e8b57", size: 16, delay: 2.0 },
  { x: "67%", y: "24%", color: "#f5b82e", size: 12, delay: 0.9 },
  { x: "78%", y: "70%", color: "#c8281c", size: 14, delay: 1.6 },
  { x: "88%", y: "32%", color: "#2e8b57", size: 10, delay: 2.4 },
  { x: "92%", y: "80%", color: "#1e5aa8", size: 12, delay: 0.3 },
] as const;

function Counter({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, stat.to, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, stat.to]);

  return (
    <span ref={ref} className="tabular-nums">
      {stat.format(value)}
    </span>
  );
}

export function Stats() {
  return (
    <section
      aria-label="Métricas de BLOQE"
      className="relative overflow-hidden border-t-2 border-signal bg-ink-2 bg-baseplate bg-grain py-16 sm:py-20"
    >
      {/* Floating LEGO studs motif (decorative, low opacity) */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {STUD_MOTIF.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: s.x,
              top: s.y,
              width: s.size,
              height: s.size,
              background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5), rgba(255,255,255,0) 45%), ${s.color}`,
              boxShadow:
                "inset 0 -1px 2px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.18)",
              opacity: 0.12,
            }}
            animate={{ y: [0, -14, 0], x: [0, 6, 0] }}
            transition={{
              duration: 8 + i * 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: s.delay,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header row: live indicator + "Actualizado 2025" */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-signal" aria-hidden />
            <span className="label-mono text-muted-foreground">
              constructora · resultados a la fecha
            </span>
          </div>
          <span className="label-mono text-muted-foreground">
            Actualizado 2026
          </span>
        </motion.div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative border-l border-border pl-5"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-ink-3/50 text-signal">
                  <Icon className="h-4 w-4" />
                </span>
                <dd className="mt-4 font-display font-extrabold tracking-tight text-5xl leading-none text-foreground sm:text-6xl">
                  <Counter stat={stat} />
                </dd>
                <dt className="mt-2 label-mono text-muted-foreground">
                  {stat.label}
                </dt>

                {/* Thin progress-bar decoration */}
                <div
                  className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-border"
                  aria-hidden
                >
                  <motion.div
                    className="h-full bg-signal"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${stat.progress * 100}%` }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{
                      duration: 1.4,
                      delay: 0.3 + i * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
