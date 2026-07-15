"use client";

import { motion } from "framer-motion";
import {
  Check,
  ArrowUpRight,
  Sparkles,
  Building2,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tier {
  id: string;
  name: string;
  icon: LucideIcon;
  price: string;
  unit: string;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  popular: boolean;
}

const TIERS: Tier[] = [
  {
    id: "bloque",
    name: "Bloque",
    icon: Sparkles,
    price: "$0",
    unit: "prototipo",
    description: "Para explorar tu idea",
    features: [
      "1 modelo 3D desde imagen",
      "Resolución estándar",
      "Exportar PNG",
      "Sin guardar",
    ],
    cta: { label: "Probar gratis", href: "#estudio" },
    popular: false,
  },
  {
    id: "capa",
    name: "Capa",
    icon: Building2,
    price: "$4,900",
    unit: "MXN / proyecto",
    description: "Para cotizar tu obra",
    features: [
      "Modelos ilimitados",
      "Resolución alta",
      "Guardar en galería",
      "Análisis VLM completo",
      "Paletas personalizadas",
      "Soporte por correo",
    ],
    cta: { label: "Empezar", href: "#contacto" },
    popular: true,
  },
  {
    id: "estructura",
    name: "Estructura",
    icon: Crown,
    price: "A medida",
    unit: "",
    description: "Para desarrolladores e inmobiliarias",
    features: [
      "Todo de Capa",
      "Ingeniería estructural",
      "Modelos GLB personalizados",
      "Visita a obra",
      "Garantía 10 años",
      "Gerente dedicado",
    ],
    cta: { label: "Hablar con ventas", href: "#contacto" },
    popular: false,
  },
];

export function Pricing() {
  return (
    <section
      id="precios"
      className="relative overflow-hidden border-t border-border bg-ink bg-blueprint bg-grain py-20 sm:py-28"
    >
      {/* Soft accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(232,84,42,0.10), rgba(232,84,42,0) 65%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="label-mono text-signal">Planes</span>
            <h2 className="mt-4 font-display font-extrabold tracking-tight text-balance text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98]">
              Tres formas de construir con bloques.
            </h2>
          </motion.div>
        </div>

        {/* Cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          {TIERS.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <motion.article
                key={tier.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className={cn(
                  "group relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 sm:p-7",
                  tier.popular
                    ? "border-signal bg-ink-2 shadow-brick lg:-mt-4 lg:mb-4"
                    : "border-border bg-ink-2/50 hover:border-signal/40"
                )}
              >
                {/* "Más popular" badge */}
                {tier.popular && (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-signal px-3 py-1 label-mono text-signal-foreground shadow-brick">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Más popular
                  </span>
                )}

                {/* Header row: icon + tier id */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                      tier.popular
                        ? "border-signal/40 bg-signal/10 text-signal"
                        : "border-border bg-ink-3/60 text-signal group-hover:bg-signal group-hover:text-signal-foreground"
                    )}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="label-mono text-muted-foreground">
                    {tier.id}
                  </span>
                </div>

                {/* Tier name + description */}
                <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-foreground">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display font-extrabold tracking-tight leading-none text-foreground text-[clamp(2.4rem,5vw,3rem)]">
                    {tier.price}
                  </span>
                  {tier.unit && (
                    <span className="label-mono text-muted-foreground">
                      {tier.unit}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className="my-6 h-px w-full bg-border" aria-hidden />

                {/* Features */}
                <ul className="flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-foreground/90"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-signal"
                        aria-hidden
                      />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={tier.cta.href}
                  className={cn(
                    "mt-7 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                    tier.popular
                      ? "bg-signal text-signal-foreground hover:bg-signal/90"
                      : "border border-border bg-ink-3/40 text-foreground hover:border-signal/40 hover:text-signal"
                  )}
                >
                  {tier.cta.label}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              </motion.article>
            );
          })}
        </div>

        {/* Footnote */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 text-center text-sm text-muted-foreground"
        >
          Todos los precios en MXN + IVA. Prototipo gratuito sin compromiso.
        </motion.p>
      </div>
    </section>
  );
}
