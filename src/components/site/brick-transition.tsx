"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";

// ============================================================
//  MURO DE TRANSICIÓN — navegación con bloques
//  Al navegar, un muro de bricks se construye cubriendo la
//  pantalla (sube o cae según la dirección), el scroll salta
//  bajo el muro, y el muro se rompe con los bricks cayendo.
//  Todo CSS-animado (barato en móvil) y aleatorio en cada uso.
// ============================================================

interface WallRequest {
  href: string;
  id: number;
}

interface WallStore {
  pending: WallRequest | null;
  trigger: (href: string) => void;
}

export const useWallStore = create<WallStore>((set) => ({
  pending: null,
  trigger: (href) => set({ pending: { href, id: Date.now() } }),
}));

/** Navega a un destino usando el muro de bloques. Uso programático. */
export function navigateWithWall(href: string) {
  useWallStore.getState().trigger(href);
}

const WALL_COLORS = [
  "#c8281c",
  "#f5b82e",
  "#1e5aa8",
  "#2e8b57",
  "#e8542a",
  "#d9c7a3",
  "#22262e",
];

const IN_MS = 480; // el muro termina de cubrir (filas + jitter + duración)
const OUT_MS = 620; // los bricks terminan de caer

/**
 * Tiempo total que tarda la transición en cubrir la pantalla por completo.
 * Se expone para que callers programáticos (p.ej. "volver arriba") esperen
 * a que el muro tape todo ANTES de hacer el salto — así no se ve cómo la
 * página se desliza debajo del muro.
 */
export const WALL_COVER_MS = IN_MS;

interface WallBrick {
  color: string;
  delayIn: number;
  delayOut: number;
  wx: number;
  wr: number;
  wr0: number;
}

interface WallGrid {
  rows: number;
  cols: number;
  brickW: number;
  brickH: number;
  bricks: WallBrick[];
}

function buildWall(direction: "up" | "down"): WallGrid {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Bricks más anchos y altos → menos piezas → cubren la pantalla antes
  // y de forma más uniforme (sin ver el contenido deslizándose debajo).
  const brickW = Math.max(96, Math.ceil(vw / 8));
  const brickH = 56;
  const cols = Math.ceil(vw / brickW) + 1;
  const rows = Math.ceil(vh / brickH) + 1;
  const perRow = 260 / rows;

  const bricks: WallBrick[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // las hiladas entran en orden según la dirección de navegación
      const rowOrder = direction === "down" ? rows - 1 - r : r;
      bricks.push({
        color: WALL_COLORS[Math.floor(Math.random() * WALL_COLORS.length)],
        delayIn: rowOrder * perRow + Math.random() * 40,
        delayOut: Math.random() * 180,
        wx: (Math.random() - 0.5) * 140,
        wr: (Math.random() - 0.5) * 120,
        wr0: (Math.random() - 0.5) * 6,
      });
    }
  }
  return { rows, cols, brickW, brickH, bricks };
}

export function BrickTransition() {
  const pending = useWallStore((s) => s.pending);
  const router = useRouter();
  const [wall, setWall] = useState<{
    grid: WallGrid;
    phase: "in" | "out";
    direction: "up" | "down";
  } | null>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const jumpTo = useCallback(
    (href: string) => {
      if (href.startsWith("#")) {
        const el = document.querySelector(href);
        if (el) {
          // Salto instantáneo (sin animación) para que la página NO se
          // deslice bajo el muro: el destino aparece ya posicionado.
          const top =
            el.getBoundingClientRect().top + window.scrollY - 0;
          window.scrollTo({ top, behavior: "auto" });
          history.replaceState(null, "", href);
        }
      } else {
        router.push(href);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!pending) return;
    const { href } = pending;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      jumpTo(href);
      return;
    }

    // dirección: ¿el destino está abajo o arriba del viewport?
    let direction: "up" | "down" = "down";
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) direction = el.getBoundingClientRect().top >= 0 ? "down" : "up";
    }

    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setWall({ grid: buildWall(direction), phase: "in", direction });

    timeouts.current.push(
      setTimeout(() => {
        jumpTo(href);
        setWall((w) => (w ? { ...w, phase: "out" } : w));
      }, IN_MS),
      setTimeout(() => setWall(null), IN_MS + OUT_MS)
    );
  }, [pending, jumpTo]);

  // bloquear scroll mientras el muro está en pantalla
  useEffect(() => {
    if (!wall) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [wall]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  if (!wall) return null;

  const { grid, phase, direction } = wall;
  const inClass = direction === "down" ? "in-up" : "in-down";

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[90] overflow-hidden"
      style={{ pointerEvents: "all" }}
    >
      {Array.from({ length: grid.rows }).map((_, r) => (
        <div
          key={r}
          className="flex"
          style={{
            marginLeft: r % 2 === 1 ? -grid.brickW / 2 : 0,
            height: grid.brickH,
          }}
        >
          {Array.from({ length: grid.cols + 1 }).map((__, c) => {
            const b = grid.bricks[(r * grid.cols + c) % grid.bricks.length];
            return (
              <div
                key={c}
                className={`wall-brick shrink-0 ${
                  phase === "in" ? inClass : "out"
                }`}
                style={
                  {
                    width: grid.brickW,
                    height: grid.brickH,
                    backgroundColor: b.color,
                    boxShadow:
                      "inset 0 2px 0 rgba(255,255,255,0.18), inset 0 -3px 0 rgba(0,0,0,0.28), inset 1px 0 0 rgba(0,0,0,0.18)",
                    animationDelay: `${
                      phase === "in" ? b.delayIn : b.delayOut
                    }ms`,
                    "--wx": `${b.wx}px`,
                    "--wr": `${b.wr}deg`,
                    "--wr0": `${b.wr0}deg`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
//  BrickLink — <a> que navega a través del muro de bloques.
//  Fuera de contexto (sin overlay montado) degrada a ancla normal.
// ------------------------------------------------------------
interface BrickLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

export function BrickLink({ href, children, onClick, ...rest }: BrickLinkProps) {
  const trigger = useWallStore((s) => s.trigger);
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        // deja pasar aperturas en pestaña nueva / modificadores
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (href.startsWith("http")) return;
        e.preventDefault();
        trigger(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
