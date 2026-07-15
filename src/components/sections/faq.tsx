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
    q: "¿A partir de qué edad reciben niños?",
    a: "Recibimos niños desde los 3 hasta los 6 años, divididos en tres niveles: párvulos (3-4), intermedio (4-5) y preescolar (5-6). Cada grupo tiene su aula y sus maestras tituladas en educación inicial.",
  },
  {
    q: "¿Qué método pedagógico utilizan?",
    a: "Trabajamos por proyectos y aprendizaje basado en el juego. Los niños aprenden matemáticas, lenguaje, ciencias y arte explorando, construyendo y preguntando. No hay hojas de trabajo aburridas: todo es aprendizaje vivencial.",
  },
  {
    q: "¿Cómo manejan la adaptación los primeros días?",
    a: "Cada niño tiene su propio ritmo. Hacemos una adaptación gradual: los primeros días son cortos y acompañados por un familiar. Las maestras te mantienen informada en todo momento hasta que tu hijo se sienta seguro y contento.",
  },
  {
    q: "¿Qué horarios manejan y hay servicio de alimentos?",
    a: "Tenemos horario extendido de 7:30 a 15:30, con opción a estancia de tarde hasta las 18:00. Ofrecemos desayuno y comida con menú diseñado por nutrióloga, adaptado a alergias y necesidades especiales.",
  },
  {
    q: "¿Cuál es la ratio de maestros por niño?",
    a: "Mantenemos grupos pequeños con una ratio de 1 maestra por cada 8 niños, garantizando atención personalizada. Cada grupo cuenta además con una asistente para apoyar en rutinas y cuidados.",
  },
  {
    q: "¿Qué medidas de seguridad tienen?",
    a: "Las instalaciones están diseñadas con materiales no tóxicos, esquinas protegidas y acceso controlado. Solo personas autorizadas pueden recoger al niño, y contamos con personal capacitado en primeros auxilios.",
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
              Lo que más preguntan las familias.
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
