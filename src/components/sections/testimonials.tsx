"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  studColors: string[];
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Mi hija lloraba al despedirse y ahora corre para entrar. La adaptación fue tan dulce que al segundo mes ya no quería irse. Aquí aprendió a querer la escuela.",
    name: "Mariana Téllez",
    role: "Mamá de Sofía · 4 años",
    company: "Grupo Párvulos",
    studColors: ["#c8281c", "#f5b82e", "#1e5aa8", "#2e8b57"],
  },
  {
    quote:
      "Lo que más valoro es la comunicación: cada día sé cómo le fue, qué hizo y qué aprendió. Como papá, esa tranquilidad no tiene precio.",
    name: "Joaquín Rebollar",
    role: "Papá de Mateo · 5 años",
    company: "Familia Rebollar",
    studColors: ["#2e8b57", "#f5b82e", "#c8281c", "#1e5aa8"],
  },
  {
    quote:
      "Los dos hijos pasaron por BLOQE. Salieron leyendo, seguros y curiosos. La base que les dieron aquí se nota hasta hoy en primaria.",
    name: "Paula Coss y León",
    role: "Mamá de dos egresados",
    company: "Familia Coss",
    studColors: ["#1e5aa8", "#2e8b57", "#f5b82e", "#c8281c"],
  },
];

function StudAvatar({ colors }: { colors: string[] }) {
  return (
    <div
      aria-hidden
      className="grid h-11 w-11 grid-cols-2 gap-1 rounded-xl border border-border bg-paper-2 p-2"
    >
      {colors.map((c, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0) 45%), ${c}`,
            boxShadow:
              "inset 0 -1px 2px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.18)",
          }}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="paper-theme relative bg-paper bg-blueprint-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="label-mono text-signal">Familias</span>
            <h2 className="mt-4 font-display font-extrabold tracking-tight text-balance text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98] text-foreground">
              Lo que dicen las familias que ya crecen con nosotros.
            </h2>
          </motion.div>
        </div>

        {/* Cards */}
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <Quote
                className="h-7 w-7 text-signal"
                aria-hidden
              />
              <blockquote className="mt-4 flex-1 text-base text-foreground leading-relaxed text-pretty">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <StudAvatar colors={t.studColors} />
                <div>
                  <div className="font-display text-sm font-bold tracking-tight text-foreground">
                    {t.name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {t.role} · {t.company}
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
