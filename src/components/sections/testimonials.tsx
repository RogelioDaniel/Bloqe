"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  accent: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Mi hija lloraba al despedirse y ahora corre para entrar. La adaptación fue tan dulce que al segundo mes ya no quería irse. Aquí aprendió a querer la escuela.",
    name: "Mariana Téllez",
    role: "Mamá de Sofía · 4 años",
    accent: "#c8281c",
  },
  {
    quote:
      "Lo que más valoro es la comunicación: cada día sé cómo le fue, qué hizo y qué aprendió. Como papá, esa tranquilidad no tiene precio.",
    name: "Joaquín Rebollar",
    role: "Papá de Mateo · 5 años",
    accent: "#1e5aa8",
  },
  {
    quote:
      "Los dos hijos pasaron por BLOQE. Salieron leyendo, seguros y curiosos. La base que les dieron aquí se nota hasta hoy en primaria.",
    name: "Paula Coss y León",
    role: "Mamá de dos egresados",
    accent: "#2e8b57",
  },
];

/**
 * Tarjeta-bloque: tiene studs arriba (como un bloque LEGO) y un
 * conector de color que la "enlaza" con la siguiente, dando la
 * sensación de que las familias están unidas bloque a bloque.
 */
function BlockCard({
  t,
  index,
  total,
}: {
  t: Testimonial;
  index: number;
  total: number;
}) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  return (
    <motion.figure
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      // card-brick da la fila de studs superior
      className="card-brick relative flex flex-col rounded-2xl border border-border bg-card p-6 pb-7 shadow-brick"
    >
      {/* studs superiores teñidos con el color de la familia */}
      <span
        aria-hidden
        className="absolute -top-1 left-5 right-5 flex justify-between"
      >
        {[0, 1, 2].map((s) => (
          <span
            key={s}
            className="h-3 w-3 rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%), ${t.accent}`,
              boxShadow:
                "inset 0 -1px 2px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.18)",
            }}
          />
        ))}
      </span>

      <Heart
        className="h-6 w-6"
        style={{ color: t.accent }}
        fill="currentColor"
        aria-hidden
      />
      <blockquote className="mt-4 flex-1 text-base leading-relaxed text-pretty text-foreground">
        “{t.quote}”
      </blockquote>
      <figcaption className="mt-6 border-t border-border pt-4">
        <div className="font-display text-sm font-bold tracking-tight text-foreground">
          {t.name}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{t.role}</div>
      </figcaption>

      {/* Conector hacia la tarjeta siguiente (excepto la última):
          un "pin" de bloque que enlaza visualmente las familias. */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute -right-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 rounded-full md:block"
          style={{
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%), ${t.accent}`,
            boxShadow:
              "inset 0 -1px 2px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.18)",
          }}
        />
      )}
      {/* Conector desde la tarjeta anterior (excepto la primera) */}
      {!isFirst && (
        <span
          aria-hidden
          className="absolute -left-2 top-1/2 z-10 hidden h-3 w-3 -translate-y-1/2 rounded-full bg-card md:block"
          style={{ boxShadow: "inset 0 0 0 1px var(--border)" }}
        />
      )}
    </motion.figure>
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
              Así conectamos con las familias y construimos confianza bloque a bloque.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-pretty leading-relaxed text-muted-foreground">
              Cada familia que llega se vuelve parte de BLOQE. Lo que más valoran
              no es solo lo que sus hijos aprenden, sino cómo los acompañamos —
              pieza por pieza, día tras día.
            </p>
          </motion.div>
        </div>

        {/* Cards — bloques unidos entre sí */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <BlockCard
              key={t.name}
              t={t}
              index={i}
              total={TESTIMONIALS.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
