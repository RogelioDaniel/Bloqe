"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface QA {
  q: string;
  a: string;
}

const FAQS: QA[] = [
  {
    q: "¿Por qué presentan los proyectos con bloques tipo LEGO?",
    a: "Es nuestra manera de mostrarte la obra antes de construirla. La maqueta de bloques deja ver volúmenes, niveles y fachadas de forma clara — sin planos difíciles de leer. Y refleja cómo trabajamos: por etapas y por piezas, sin sorpresas.",
  },
  {
    q: "¿La obra se construye con bloques de juguete?",
    a: "No. La maqueta es de bloques; la obra es construcción real: concreto, acero, block, instalaciones y acabados con proveedores certificados. Los bloques son la forma de presentarte y dar seguimiento al proyecto.",
  },
  {
    q: "¿Qué tipo de obras hacen?",
    a: "Casas desde cero, remodelaciones y ampliaciones, locales comerciales, oficinas y naves industriales. También proyectos de diseño arquitectónico si aún no tienes planos.",
  },
  {
    q: "¿Cuánto tarda una obra?",
    a: "Depende del proyecto: una remodelación media toma de 6 a 12 semanas; una casa nueva, de 6 a 9 meses. En el paso de diseño te damos un calendario por etapas y lo respetamos por contrato.",
  },
  {
    q: "¿Trabajan fuera de CDMX?",
    a: "Sí. Tenemos presencia en 12 ciudades y aliados en todo el país. La primera visita es sin costo en zona metropolitana.",
  },
  {
    q: "¿Qué garantía ofrecen?",
    a: "10 años en estructura y 2 años en acabados, por escrito en el contrato. Además, programa de mantenimiento anual opcional.",
  },
];

export function FAQ() {
  return (
    <section
      id="faq"
      className="paper-theme relative bg-blueprint-paper py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: heading + supporting copy */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <span className="label-mono text-signal">Dudas frecuentes</span>
            <h2 className="mt-4 font-display font-extrabold tracking-tight text-balance text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98] text-foreground">
              Lo que nos preguntan antes de construir.
            </h2>
            <p className="mt-5 max-w-md text-base text-muted-foreground leading-relaxed text-pretty">
              Las seis preguntas que aparecen en cada primera llamada. Si la
              tuya no está aquí, escríbenos y te respondemos en menos de 24
              horas hábiles.
            </p>
            <a
              href="#contacto"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-signal link-signal"
            >
              ¿Tu duda no está? Escríbenos
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </motion.div>

          {/* Right: accordion */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <Accordion
              type="single"
              collapsible
              defaultValue="faq-0"
              className="flex flex-col gap-3"
            >
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={faq.q}
                  value={`faq-${i}`}
                  className="rounded-xl border border-border bg-card px-5 shadow-sm last:border-b"
                >
                  <AccordionTrigger className="py-5 text-left font-display text-base font-bold tracking-tight text-foreground no-underline hover:no-underline [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg]:text-signal">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground text-pretty">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
