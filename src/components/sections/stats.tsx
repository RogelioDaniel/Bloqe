"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import { Building2, Boxes, MapPin, ShieldCheck } from "lucide-react";

interface Stat {
  to: number;
  format: (n: number) => string;
  label: string;
  icon: typeof Building2;
}

const STATS: Stat[] = [
  {
    to: 240,
    format: (n) => `${Math.round(n)}+`,
    label: "obras entregadas",
    icon: Building2,
  },
  {
    to: 1.8,
    format: (n) => `${n.toFixed(1)}M`,
    label: "bloques colocados",
    icon: Boxes,
  },
  {
    to: 12,
    format: (n) => Math.round(n).toString(),
    label: "ciudades activas",
    icon: MapPin,
  },
  {
    to: 10,
    format: (n) => Math.round(n).toString(),
    label: "años de garantía",
    icon: ShieldCheck,
  },
];

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
      className="relative border-t-2 border-signal bg-ink-2 bg-grain py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-center gap-3"
        >
          <span className="h-2 w-2 rounded-full bg-signal" aria-hidden />
          <span className="label-mono text-muted-foreground">
            constructora modular · métricas en vivo
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
                <dd className="mt-4 font-display font-extrabold tracking-tight text-[clamp(2.6rem,6vw,4rem)] leading-none text-foreground">
                  <Counter stat={stat} />
                </dd>
                <dt className="mt-2 label-mono text-muted-foreground">
                  {stat.label}
                </dt>
              </motion.div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
