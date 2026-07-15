"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  ScanLine,
  Ruler,
  Hammer,
  Factory,
  Wrench,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
} from "@/lib/lego";

const LegoScene3D = dynamic(
  () => import("@/components/lego3d/lego-scene-3d").then((m) => m.LegoScene3D),
  { ssr: false, loading: () => null }
);

interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
  featured?: boolean;
}

const SERVICES: Service[] = [
  {
    icon: Boxes,
    title: "Construcción modular",
    description:
      "Ensambllaje por capas con bloques prefabricados: cada pieza encaja con tolerancia milimétrica y se reemplaza sin demoler.",
    featured: true,
  },
  {
    icon: ScanLine,
    title: "Modelado desde imagen",
    description:
      "Subes una foto, nuestra VLM la decodifica y devuelve un blueprint de bloques listo para fabricar.",
  },
  {
    icon: Ruler,
    title: "Ingeniería estructural",
    description:
      "Cálculo de cargas, paletas de refuerzo y bandas estructurales firmadas por nuestro estudio.",
  },
  {
    icon: Hammer,
    title: "Remodelación",
    description:
      "Intervenimos obra existente: capas nuevas sobre muros viejos, sin tirar lo que ya funciona.",
  },
  {
    icon: Factory,
    title: "Fabricación de bloques",
    description:
      "Producimos cada lote en planta con polímero reforzado y numeración por capas.",
  },
  {
    icon: Wrench,
    title: "Montaje & mantenimiento",
    description:
      "Equipo propio de montaje y programa de mantenimiento anual con garantía de 10 años.",
  },
];

const STUD_COLORS = ["#c8281c", "#f5b82e", "#1e5aa8", "#2e8b57"];

function StudRow({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 ${className ?? ""}`}
      aria-hidden
    >
      {STUD_COLORS.map((c) => (
        <span
          key={c}
          className="h-2.5 w-2.5 rounded-full"
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

export function Services() {
  const featuredModel: VoxelModel = useMemo(
    () =>
      generateBuilding("pavilion", PALETTE_SETS.monolith, {
        width: 6,
        depth: 6,
      }),
    []
  );

  return (
    <section
      id="servicios"
      className="relative bg-ink bg-grain py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="label-mono text-signal">Servicios</span>
            <h2 className="mt-4 font-display font-extrabold tracking-tight text-balance text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98]">
              Seis capas de oficio, un solo contrato.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground text-pretty leading-relaxed">
              Desde la primera imagen hasta el mantenimiento anual: cubrimos
              toda la cadena de la obra modular. Contratas lo que necesites,
              escalas cuando quieras.
            </p>
          </motion.div>
        </div>

        {/* Bento grid */}
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {SERVICES.map((service, i) => {
            const Icon = service.icon;

            if (service.featured) {
              return (
                <motion.article
                  key={service.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.05 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-ink-2/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-signal/40 md:col-span-2 lg:col-span-2 lg:row-span-2"
                >
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-ink-3/60 text-signal">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="label-mono text-muted-foreground">
                        servicio · 01
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                      {service.title}
                    </h3>
                    <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed sm:text-base">
                      {service.description}
                    </p>
                    <StudRow className="mt-5" />
                  </div>

                  {/* Tower preview */}
                  <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-xl border border-border bg-blueprint-fine">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full blur-3xl"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(232,84,42,0.18), rgba(232,84,42,0) 65%)",
                      }}
                    />
                    <LegoScene3D
                      model={featuredModel}
                      buildId={1}
                      className="absolute inset-0 h-full w-full"
                      maxDelay={1800}
                      autoRotate
                      quality="lite"
                    />
                    <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-ink/70 px-2.5 py-1 backdrop-blur">
                      <span className="label-mono text-muted-foreground">
                        pavilion · monolith · {featuredModel.metrics.blockCount} bloques
                      </span>
                    </div>
                  </div>

                  <a
                    href="#contacto"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-signal link-signal w-fit"
                  >
                    Cotizar este servicio
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </motion.article>
              );
            }

            return (
              <motion.article
                key={service.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.05 }}
                className="group relative flex flex-col rounded-2xl border border-border bg-ink-2/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-signal/40"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-ink-3/60 text-signal transition-colors group-hover:bg-signal group-hover:text-signal-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="label-mono text-muted-foreground">
                    0{SERVICES.indexOf(service) + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold tracking-tight">
                  {service.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
                <StudRow className="mt-5" />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
