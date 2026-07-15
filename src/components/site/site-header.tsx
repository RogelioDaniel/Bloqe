"use client";

import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowUpRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

const NAV = [
  { label: "Estudio", href: "#estudio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Precios", href: "#precios" },
  { label: "Galería", href: "#galeria" },
  { label: "Contacto", href: "#contacto" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          <a
            href="#top"
            className="flex items-center gap-2 rounded-md"
            aria-label="BLOQE — inicio"
          >
            <Logo size={30} />
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <a
              href="#contacto"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3"
            >
              Cotizar obra
            </a>
            <Button
              asChild
              size="sm"
              className="bg-signal text-signal-foreground hover:bg-signal-2 rounded-full"
            >
              <a href="#estudio">
                Abrir estudio
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
              </a>
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
                  <SheetClose asChild>
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md"
                      aria-label="Cerrar menú"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col p-3">
                  {NAV.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <a
                        href={item.href}
                        className="px-4 py-3.5 text-lg font-display font-semibold tracking-tight hover:bg-ink-3 rounded-lg transition-colors"
                      >
                        {item.label}
                      </a>
                    </SheetClose>
                  ))}
                </nav>
                <div className="p-5 mt-auto">
                  <Button
                    asChild
                    className="w-full bg-signal text-signal-foreground hover:bg-signal-2 rounded-full"
                  >
                    <a href="#estudio">Abrir estudio de bloques</a>
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
