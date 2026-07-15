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
    q: "¿Cómo funciona el estudio de bloques?",
    a: "Subes una imagen o modelo 3D. Nuestro modelo de visión lo analiza, deduce estructura y materiales, y genera un modelo 3D de bloques modulares que puedes orbitar y exportar.",
  },
  {
    q: "¿Necesito un modelo 3D profesional?",
    a: "No. Con una foto basta para generar un prototipo. Si tienes un archivo .glb o .gltf, lo voxelizamos directamente en bloques.",
  },
  {
    q: "¿Los bloques son LEGO reales?",
    a: "Usamos bloques modulares prefabricados con tolerancia ±0.4 mm, compatibles con sistema LEGO. La fabricación es propia.",
  },
  {
    q: "¿Cuánto tarda una obra?",
    a: "Un prototipo 3D se entrega en minutos. La obra física depende del modelo: desde 3 semanas para viviendas hasta 8 meses para torres.",
  },
  {
    q: "¿Trabajan fuera de CDMX?",
    a: "Sí. Tenemos presencia en 12 ciudades y aliados en todo el país. La primera visita es sin costo en zona metropolitana.",
  },
  {
    q: "¿Qué garantía ofrecen?",
    a: "10 años en estructura, 2 años en acabados, y reemplazo de cualquier bloque defectuoso sin demoler.",
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
