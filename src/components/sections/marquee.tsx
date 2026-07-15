"use client";

import { Hexagon } from "lucide-react";

const ITEMS = [
  "Educación lúdica",
  "Inglés diario",
  "Taller de bloques y robótica",
  "Arte y música",
  "Grupos reducidos",
  "Ratio 1:8",
  "Adaptación gradual",
  "Espacios seguros",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <section
      aria-hidden
      className="border-y border-border bg-ink-2/50 py-4 overflow-hidden"
    >
      <div className="flex w-max animate-marquee">
        {row.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-6">
            <Hexagon className="h-4 w-4 text-signal" fill="currentColor" />
            <span className="font-display text-sm font-medium tracking-tight text-foreground/80 whitespace-nowrap">
              {item}
            </span>
            <span className="text-muted-foreground/40">·</span>
          </div>
        ))}
      </div>
    </section>
  );
}
