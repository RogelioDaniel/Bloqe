"use client";

import { useState } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { BrickLink } from "./brick-transition";
import { Button } from "@/components/ui/button";
import { Menu, ArrowUpRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

const NAV = [
  { label: "Programas", href: "#servicios" },
  { label: "Proceso", href: "#proceso" },
  { label: "Espacios", href: "#espacios" },
  { label: "Preguntas", href: "#faq" },
  { label: "Contacto", href: "#contacto" },
  { label: "Lab", href: "/lab" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 glass border-b border-border`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          <a
            href="#top"
            className="flex items-center gap-2 rounded-md"
            aria-label="BLOQE Escuela — inicio"
          >
            <Logo size={30} />
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <BrickLink
                key={item.href}
                href={item.href}
                className="font-round px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
              >
                {item.label}
              </BrickLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              className="btn-brick font-round bg-signal text-signal-foreground hover:bg-signal-2"
            >
              <BrickLink href="#contacto">
                Agendar visita
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
              </BrickLink>
            </Button>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground"
                  aria-label="Abrir menú"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[82vw] bg-ink-2 border-border p-0"
              >
                <SheetTitle className="sr-only">Navegación</SheetTitle>
                <div className="flex h-16 items-center justify-between border-b border-border px-5">
                  <Logo size={28} />
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                  </div>
                </div>
                <nav className="flex flex-col p-3">
                  {NAV.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <BrickLink
                        href={item.href}
                        className="px-4 py-3.5 text-lg font-round font-semibold tracking-tight hover:bg-ink-3 rounded-lg transition-colors"
                      >
                        {item.label}
                      </BrickLink>
                    </SheetClose>
                  ))}
                </nav>
                <div className="p-5 mt-auto">
                  <Button
                    asChild
                    className="btn-brick font-round w-full h-12 bg-signal text-signal-foreground hover:bg-signal-2"
                  >
                    <BrickLink href="#contacto" onClick={() => setOpen(false)}>
                      Agendar visita
                    </BrickLink>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
