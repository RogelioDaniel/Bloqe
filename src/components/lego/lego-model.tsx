"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { groupBricks, shade, type Brick, type VoxelModel } from "@/lib/lego";

// ============================================================
//  LEGO MODEL — SVG isométrico
//  Renderiza un VoxelModel como maqueta de bloques en SVG puro:
//  sin WebGL, sin three.js. Ligero, responsivo y compatible con
//  cualquier móvil. Cada brick "cae" en su lugar al montarse.
// ============================================================

// Proyección isométrica 2:1 — 1 stud = celda de la retícula.
const HW = 12; // medio ancho de celda (px de pantalla)
const HH = 6; // medio alto de celda
const VH = 11; // altura visual de un voxel

const px = (x: number, z: number) => (x - z) * HW;
const py = (x: number, y: number, z: number) => (x + z) * HH - y * VH;

interface LegoModelProps {
  model: VoxelModel;
  /** Cambia este valor para volver a disparar la animación de armado. */
  buildId?: number;
  className?: string;
  /** Ventana total (ms) sobre la que se escalona la caída de bricks. */
  maxDelay?: number;
  /** Flotación suave de la maqueta completa al terminar de armarse. */
  float?: boolean;
  /** Sombra elíptica bajo la maqueta. */
  shadow?: boolean;
  ariaLabel?: string;
}

interface RenderBrick extends Brick {
  delay: number;
  studs: number[]; // índices locales (0..w-1) con stud visible
}

function isFilled(model: VoxelModel, x: number, y: number, z: number): boolean {
  const [w, h, d] = model.size;
  if (x < 0 || y < 0 || z < 0 || x >= w || y >= h || z >= d) return false;
  return Boolean(model.grid[x]?.[y]?.[z]);
}

function prepareBricks(model: VoxelModel, maxDelay: number): RenderBrick[] {
  const bricks = groupBricks(model);
  const layers = Math.max(1, model.size[1]);
  const depth = model.size[2];
  const perLayer = maxDelay / layers;

  const visible: RenderBrick[] = [];
  for (const b of bricks) {
    let anyFaceVisible = false;
    const studs: number[] = [];
    for (let i = 0; i < b.w; i++) {
      const topOpen = !isFilled(model, b.x + i, b.y + 1, b.z);
      // El frente del modelo (fachadas, puertas) vive en z=0, así que
      // se espeja el eje z al renderizar: el frente visible es z-1.
      const frontOpen = !isFilled(model, b.x + i, b.y, b.z - 1);
      if (topOpen) studs.push(i);
      if (topOpen || frontOpen) anyFaceVisible = true;
    }
    if (!isFilled(model, b.x + b.w, b.y, b.z)) anyFaceVisible = true;
    if (!anyFaceVisible) continue;

    visible.push({
      ...b,
      z: depth - 1 - b.z,
      studs,
      delay: b.y * perLayer + ((b.x + b.z * 3) % 5) * (perLayer * 0.12),
    });
  }

  // Algoritmo del pintor: primero lo lejano (x+z menor), luego lo bajo.
  visible.sort(
    (a, b) => a.x + a.z - (b.x + b.z) || a.y - b.y || a.x - b.x
  );
  return visible;
}

function BrickShape({ brick }: { brick: RenderBrick }) {
  const { x, y, z, w, color } = brick;

  const tA = [px(x, z), py(x, y + 1, z)];
  const tB = [px(x + w, z), py(x + w, y + 1, z)];
  const tC = [px(x + w, z + 1), py(x + w, y + 1, z + 1)];
  const tD = [px(x, z + 1), py(x, y + 1, z + 1)];
  const bD = [px(x, z + 1), py(x, y, z + 1)];
  const bC = [px(x + w, z + 1), py(x + w, y, z + 1)];
  const bB = [px(x + w, z), py(x + w, y, z)];

  const pts = (p: number[][]) => p.map((c) => c.join(",")).join(" ");

  const top = shade(color, 1.14);
  const front = shade(color, 0.84);
  const side = shade(color, 0.6);
  const studSide = shade(color, 0.72);
  const studTop = shade(color, 1.28);

  return (
    <g
      className="lego-iso-brick"
      style={{ animationDelay: `${brick.delay}ms` }}
    >
      <polygon points={pts([tD, tC, bC, bD])} fill={front} />
      <polygon points={pts([tB, tC, bC, bB])} fill={side} />
      <polygon
        points={pts([tA, tB, tC, tD])}
        fill={top}
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {brick.studs.map((i) => {
        const cx = px(x + i + 0.5, z + 0.5);
        const cy = py(x + i + 0.5, y + 1, z + 0.5);
        return (
          <g key={i}>
            <ellipse
              cx={cx}
              cy={cy - 1}
              rx={HW * 0.34}
              ry={HH * 0.34}
              fill={studSide}
            />
            <ellipse
              cx={cx}
              cy={cy - 2.4}
              rx={HW * 0.34}
              ry={HH * 0.34}
              fill={studTop}
            />
          </g>
        );
      })}
    </g>
  );
}

export function LegoModel({
  model,
  buildId = 0,
  className,
  maxDelay = 1600,
  float = false,
  shadow = true,
  ariaLabel,
}: LegoModelProps) {
  // Los generadores usan aleatoriedad: renderizamos solo en cliente
  // para evitar desajustes de hidratación.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const gradientId = useId();

  const bricks = useMemo(
    () => prepareBricks(model, maxDelay),
    [model, maxDelay]
  );

  const viewBox = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const b of bricks) {
      const xs = [px(b.x, b.z + 1), px(b.x + b.w, b.z)];
      const ys = [py(b.x, b.y + 1, b.z) - HH, py(b.x + b.w, b.y, b.z + 1)];
      minX = Math.min(minX, ...xs);
      maxX = Math.max(maxX, ...xs);
      minY = Math.min(minY, ...ys);
      maxY = Math.max(maxY, ...ys);
    }
    if (!Number.isFinite(minX)) return "0 0 100 100";
    const pad = 14;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${
      maxY - minY + pad * 2 + (shadow ? 10 : 0)
    }`;
  }, [bricks, shadow]);

  const footprint = useMemo(() => {
    const [w, , d] = model.size;
    return {
      cx: px(w / 2, d / 2),
      cy: py(w / 2, 0, d / 2) + 6,
      rx: (w + d) * HW * 0.42,
      ry: (w + d) * HH * 0.42,
    };
  }, [model]);

  if (!mounted) {
    return <div className={className} aria-hidden />;
  }

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      {shadow && (
        <ellipse
          cx={footprint.cx}
          cy={footprint.cy}
          rx={footprint.rx}
          ry={footprint.ry}
          fill={`url(#${gradientId})`}
        />
      )}
      <g key={buildId} className={float ? "lego-floaty" : undefined}>
        {bricks.map((b) => (
          <BrickShape key={b.id} brick={b} />
        ))}
      </g>
    </svg>
  );
}
