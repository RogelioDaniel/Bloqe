"use client";

import { Logo } from "./logo";
import { ArrowUpRight, MapPin, Mail, Phone } from "lucide-react";

const COLS = [
  {
    title: "Navegación",
    links: [
      { label: "Programas", href: "#servicios" },
      { label: "Proceso", href: "#proceso" },
      { label: "Espacios", href: "#espacios" },
      { label: "Preguntas", href: "#faq" },
      { label: "Contacto", href: "#contacto" },
      { label: "Laboratorio de bloques", href: "/lab" },
    ],
  },
  {
    title: "Programas",
    links: [
      { label: "Párvulos · 3-4 años", href: "#servicios" },
      { label: "Intermedio · 4-5 años", href: "#servicios" },
      { label: "Preescolar · 5-6 años", href: "#servicios" },
      { label: "Taller de bloques", href: "#servicios" },
      { label: "Inglés y música", href: "#servicios" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-ink bg-blueprint bg-grain">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Logo size={32} />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Escuela de educación inicial para niños de 3 a 6 años.
              Aprendizaje lúdico con bloques, arte, música e inglés en espacios
              diseñados para descubrir y crecer — pieza por pieza.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <MapPin className="h-4 w-4 text-signal" />
                Av. Insurgentes 1245, CDMX
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="h-4 w-4 text-signal" />
                hola@bloqe.mx
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="h-4 w-4 text-signal" />
                +52 55 8472 9900
              </div>
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h3 className="label-mono text-muted-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-foreground/80 hover:text-signal transition-colors link-signal"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CTA card */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-ink-2/60 p-5">
              <h3 className="font-display text-lg font-bold tracking-tight">
                ¿Buscas escuela para tu hijo?
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Agenda una visita y te respondemos en 24 horas hábiles.
              </p>
              <a
                href="#contacto"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-signal hover:text-signal-2 transition-colors"
              >
                Agendar una visita
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BLOQE Escuela de Educación Inicial.
            Construido con bloques, no con plantillas.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Aviso de privacidad
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Términos
            </a>
            <span className="label-mono text-signal">v2.4 · bloqe-os</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
