"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Hammer, RefreshCw, RotateCcw, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  groupBricks,
  shade,
  type Brick,
  type VoxelCell,
  type VoxelModel,
} from "@/lib/lego";

// ============================================================
//  LEGO MODEL v2 — SVG isométrico interactivo
//
//  Pipeline: VoxelModel (rejilla 3D) → rotación → groupBricks
//  (greedy por filas) → culling de caras ocultas → proyección
//  isométrica 2:1 → SVG con animaciones CSS por brick.
//
//  Interacción (prop `interactive`):
//  · Tocar un brick lo desprende; los bricks que pierden conexión
//    con el suelo caen en cascada (grafo de soporte vertical).
//  · Swipe horizontal rota la maqueta 90°.
//  · Controles: rotar, romper todo, rearmar.
//
//  Sin WebGL: todo es SVG + CSS transforms (barato en móvil).
// ============================================================

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
  /** Permite tocar bricks para desprenderlos y swipe para rotar. */
  interactive?: boolean;
  /** Muestra los botones rotar / romper / rearmar (requiere interactive). */
  controls?: boolean;
  /** Se llama cuando el usuario interactúa (útil para pausar loops). */
  onUserAction?: () => void;
  ariaLabel?: string;
  /**
   * Destrucción dirigida por scroll (0–1). 0 = maqueta intacta;
   * 1 = toda destruida. Los bloques se desprenden de arriba hacia
   * abajo de forma determinística (estable entre renders). Se suma
   * a los bloques que el usuario desprenda manualmente.
   */
  breakProgress?: number;
  /**
   * Construcción dirigida por scroll (0–1). 0 = sin bloques;
   * 1 = obra completa. Los bloques van "cayendo" y apilándose de
   * abajo hacia arriba conforme avanza el scroll — como si la obra
   * se armara con los bloques que caen de la sección anterior.
   */
  buildProgress?: number;
  /**
   * Giros de cámara adicionales (90° por unidad) controlados desde
   * fuera — p.ej. rotar la maqueta conforme avanza el scroll.
   */
  extraRotation?: number;
  /**
   * false = los bloques aparecen al instante (sin animación de
   * caída). Útil tras el armado inicial, para que un giro de cámara
   * por scroll sea un corte limpio y no un re-armado completo.
   */
  entryAnimation?: boolean;
  /**
   * Rotación 3D FLUIDA (grados) aplicada vía CSS `rotateY` sobre el
   * contenedor del SVG. A diferencia de `extraRotation` (que rota la
   * rejilla en saltos de 90° y recalcula), esta es puramente visual:
   * gira la maqueta como un objeto 3D sin recalcular nada. Ideal para
   * seguir el scroll con una cámara que orbita.
   */
  spinY?: number;
}

interface RenderBrick extends Brick {
  delay: number;
  studs: number[]; // índices locales (0..w-1) con stud visible
  frontVisible: boolean;
  sideVisible: boolean;
}

interface ScatterMeta {
  delay: number;
  dur: number;
  sx: number;
  sy: number;
  fy: number;
  srot: number;
}

function isFilled(model: VoxelModel, x: number, y: number, z: number): boolean {
  const [w, h, d] = model.size;
  if (x < 0 || y < 0 || z < 0 || x >= w || y >= h || z >= d) return false;
  return Boolean(model.grid[x]?.[y]?.[z]);
}

/** Rota la rejilla k×90° sobre el plano XZ (vista isométrica). */
function rotateModel(model: VoxelModel, k: number): VoxelModel {
  const turns = ((k % 4) + 4) % 4;
  if (turns === 0) return model;
  let src = model;
  for (let t = 0; t < turns; t++) {
    const [w, h, d] = src.size;
    const grid: (VoxelCell | null)[][][] = [];
    for (let x = 0; x < d; x++) {
      grid[x] = [];
      for (let y = 0; y < h; y++) {
        grid[x][y] = [];
        for (let z = 0; z < w; z++) grid[x][y][z] = null;
      }
    }
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        for (let z = 0; z < d; z++) {
          const cell = src.grid[x][y][z];
          if (cell) grid[z][y][w - 1 - x] = cell;
        }
      }
    }
    src = { ...src, grid, size: [d, h, w] };
  }
  return src;
}

interface PreparedBricks {
  /** Bricks con alguna cara visible, ordenados para pintar. */
  visible: RenderBrick[];
  /** TODOS los bricks (incluye interiores ocultos) — para el grafo de
      soporte: un brick oculto también sostiene a los de arriba. */
  all: Brick[];
}

function prepareBricks(model: VoxelModel, maxDelay: number): PreparedBricks {
  const bricks = groupBricks(model);
  const layers = Math.max(1, model.size[1]);
  const depth = model.size[2];
  const perLayer = maxDelay / layers;

  // Espeja el eje z en TODOS (el frente del modelo vive en z=0 y la
  // cámara isométrica mira la cara z máxima).
  const all: Brick[] = bricks.map((b) => ({ ...b, z: depth - 1 - b.z }));

  const visible: RenderBrick[] = [];
  for (let i = 0; i < bricks.length; i++) {
    const b = bricks[i];
    let frontVisible = false;
    const studs: number[] = [];
    for (let j = 0; j < b.w; j++) {
      const topOpen = !isFilled(model, b.x + j, b.y + 1, b.z);
      const frontOpen = !isFilled(model, b.x + j, b.y, b.z - 1);
      if (topOpen) studs.push(j);
      if (frontOpen) frontVisible = true;
    }
    const sideVisible = !isFilled(model, b.x + b.w, b.y, b.z);
    // Solo se renderizan bricks con alguna cara visible, y solo las
    // caras visibles (menos polígonos = más rápido en móvil).
    if (!frontVisible && !sideVisible && studs.length === 0) continue;

    visible.push({
      ...all[i],
      studs,
      frontVisible,
      sideVisible,
      delay: b.y * perLayer + ((b.x + b.z * 3) % 5) * (perLayer * 0.12),
    });
  }

  // Algoritmo del pintor: primero lo lejano (x+z menor), luego lo bajo.
  visible.sort(
    (a, b) => a.x + a.z - (b.x + b.z) || a.y - b.y || a.x - b.x
  );
  return { visible, all };
}

/**
 * Grafo de soporte: dos bricks se "abrochan" si comparten una celda
 * (x,z) en capas adyacentes (como el clutch real de los bloques).
 * Devuelve los ids que quedan desconectados del suelo al quitar `removed`.
 */
function findUnsupported(
  bricks: Brick[],
  removed: Set<string>
): Map<string, number> {
  const remaining = bricks.filter((b) => !removed.has(b.id));
  const cell = new Map<string, string>(); // "x,y,z" → brickId
  for (const b of remaining) {
    for (let i = 0; i < b.w; i++) cell.set(`${b.x + i},${b.y},${b.z}`, b.id);
  }
  const byId = new Map(remaining.map((b) => [b.id, b]));

  // BFS desde los bricks apoyados en el suelo.
  const grounded = new Set<string>();
  const queue: string[] = [];
  const depth = new Map<string, number>();
  for (const b of remaining) {
    if (b.y === 0) {
      grounded.add(b.id);
      depth.set(b.id, 0);
      queue.push(b.id);
    }
  }
  while (queue.length) {
    const id = queue.shift()!;
    const b = byId.get(id)!;
    const dNext = (depth.get(id) ?? 0) + 1;
    for (let i = 0; i < b.w; i++) {
      for (const ny of [b.y - 1, b.y + 1]) {
        const nId = cell.get(`${b.x + i},${ny},${b.z}`);
        if (nId && !grounded.has(nId)) {
          grounded.add(nId);
          depth.set(nId, dNext);
          queue.push(nId);
        }
      }
    }
  }

  const falling = new Map<string, number>();
  for (const b of remaining) {
    if (!grounded.has(b.id)) falling.set(b.id, b.y);
  }
  return falling;
}

const BrickShape = memo(function BrickShape({
  brick,
  scatter,
  interactive,
  quick,
  entry = true,
  onPick,
}: {
  brick: RenderBrick;
  scatter?: ScatterMeta;
  interactive?: boolean;
  /** Retrasos cortos (para construcción por scroll en lotes). */
  quick?: boolean;
  /** false = sin animación de caída: el brick aparece al instante. */
  entry?: boolean;
  onPick?: (id: string) => void;
}) {
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
  const studSide = shade(color, 0.7);
  const studTop = shade(color, 1.28);

  // Vars de animación por pieza — cada armado se ve distinto.
  const seed = (x * 7 + y * 13 + z * 29 + w * 3) % 100;
  const style: React.CSSProperties & Record<string, string> = scatter
    ? {
        "--sx": `${scatter.sx}px`,
        "--sy": `${scatter.sy}px`,
        "--fy": `${scatter.fy}px`,
        "--srot": `${scatter.srot}deg`,
        "--dur": `${scatter.dur}s`,
        animationDelay: `${scatter.delay}ms`,
      }
    : {
        "--dx": `${((seed % 21) - 10) * 1.6}px`,
        "--rz": `${((seed % 13) - 6) * 1.2}deg`,
        "--dur": `${0.45 + (seed % 10) * 0.02}s`,
        animationDelay: `${quick ? (seed % 4) * 45 : brick.delay}ms`,
      };

  return (
    <g
      className={cn(
        (entry || scatter) && "lego-iso-brick",
        scatter && "scattering"
      )}
      style={scatter || entry ? style : undefined}
      onClick={interactive && !scatter ? () => onPick?.(brick.id) : undefined}
      role={interactive ? "button" : undefined}
      cursor={interactive ? "pointer" : undefined}
    >
      {brick.frontVisible && (
        <polygon points={pts([tD, tC, bC, bD])} fill={front} />
      )}
      {brick.sideVisible && (
        <polygon points={pts([tB, tC, bC, bB])} fill={side} />
      )}
      <polygon
        points={pts([tA, tB, tC, tD])}
        fill={top}
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {brick.studs.map((i) => (
        <ellipse
          key={i}
          cx={px(x + i + 0.5, z + 0.5)}
          cy={py(x + i + 0.5, y + 1, z + 0.5) - 1.7}
          rx={HW * 0.34}
          ry={HH * 0.34}
          fill={studTop}
          stroke={studSide}
          strokeWidth="1.1"
        />
      ))}
    </g>
  );
});

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="brick-press pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border border-border bg-ink-2/80 text-foreground backdrop-blur transition-colors hover:bg-signal hover:text-signal-foreground hover:border-signal"
    >
      {children}
    </button>
  );
}

export function LegoModel({
  model,
  buildId = 0,
  className,
  maxDelay = 1600,
  float = false,
  shadow = true,
  interactive = false,
  controls = false,
  onUserAction,
  ariaLabel,
  breakProgress = 0,
  buildProgress,
  extraRotation = 0,
  entryAnimation = true,
  spinY = 0,
}: LegoModelProps) {
  // Los modelos pueden generarse con aleatoriedad: solo cliente.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const gradientId = useId();
  const [rotation, setRotation] = useState(0);
  const [internalBuild, setInternalBuild] = useState(0);
  const [scattered, setScattered] = useState<Map<string, ScatterMeta>>(
    () => new Map()
  );
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const totalRotation = rotation + extraRotation;
  const rotated = useMemo(
    () => rotateModel(model, totalRotation),
    [model, totalRotation]
  );
  const { visible: bricks, all: allBricks } = useMemo(
    () => prepareBricks(rotated, maxDelay),
    [rotated, maxDelay]
  );

  // Un rebuild externo (buildId) también limpia los escombros.
  useEffect(() => {
    setScattered(new Map());
  }, [buildId]);

  const rebuild = useCallback(() => {
    setScattered(new Map());
    setInternalBuild((i) => i + 1);
    onUserAction?.();
  }, [onUserAction]);

  const rotate = useCallback(
    (dir: 1 | -1) => {
      setScattered(new Map());
      setRotation((r) => r + dir);
      onUserAction?.();
    },
    [onUserAction]
  );

  const scatterMetaFor = useCallback(
    (b: RenderBrick, extraDelay: number): ScatterMeta => {
      const r = Math.random;
      const [sw, sh, sd] = rotated.size;
      const centerX = px(sw / 2, sd / 2);
      const bx = px(b.x + b.w / 2, b.z);
      const dir = bx >= centerX ? 1 : -1;
      // Distancia de caída proporcional al alto del modelo: en maquetas
      // grandes (castillo del hero) los bloques salen del lienzo y caen
      // "hacia la pantalla" completa (el svg tiene overflow visible).
      const modelPx = sh * VH + (sw + sd) * HH;
      return {
        delay: extraDelay + r() * 90,
        dur: 0.78 + r() * 0.45,
        sx: dir * (18 + r() * 90),
        sy: -(14 + r() * 34),
        fy: modelPx * (1.15 + r() * 0.85) + 140,
        srot: (r() - 0.5) * 260,
      };
    },
    [rotated]
  );

  /** Desprende un brick; lo que pierda soporte cae en cascada. */
  const pickBrick = useCallback(
    (id: string) => {
      if (movedRef.current) return; // fue swipe, no tap
      setScattered((prev) => {
        if (prev.has(id)) return prev;
        const next = new Map(prev);
        const brick = bricks.find((b) => b.id === id);
        if (!brick) return prev;
        next.set(id, scatterMetaFor(brick, 0));

        const removed = new Set(next.keys());
        const falling = findUnsupported(allBricks, removed);
        for (const [fid, fy] of falling) {
          if (next.has(fid)) continue;
          const fb = bricks.find((b) => b.id === fid);
          if (fb) next.set(fid, scatterMetaFor(fb, 60 + fy * 45));
        }
        return next;
      });
      onUserAction?.();
    },
    [bricks, allBricks, scatterMetaFor, onUserAction]
  );

  /** Rompe toda la maqueta, de arriba hacia abajo. */
  const breakAll = useCallback(() => {
    const maxY = Math.max(...bricks.map((b) => b.y), 0);
    const next = new Map<string, ScatterMeta>();
    for (const b of bricks) {
      next.set(b.id, scatterMetaFor(b, (maxY - b.y) * 55));
    }
    setScattered(next);
    onUserAction?.();
  }, [bricks, scatterMetaFor, onUserAction]);

  // Drag/arrastre horizontal → rotar. Mientras mantienes presionado y
  // mueves, el modelo va rotando 90° por cada tramo recorrido, dando
  // sensación de rotación continua con click sostenido.
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
  }, []);
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      if (Math.abs(dx) > 12) movedRef.current = true;
      // Rotación progresiva: cada ~46px de arrastre, gira 90°.
      if (movedRef.current && Math.abs(dx) > 46) {
        rotate(dx > 0 ? 1 : -1);
        // reinicia el origen para el siguiente tramo
        dragRef.current.x = e.clientX;
      }
    },
    [rotate]
  );
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start) return;
    // Swipe corto (sin arrastre sostenido) también rota.
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (
      !movedRef.current &&
      Math.abs(dx) > 30 &&
      Math.abs(dx) > Math.abs(dy) * 1.4
    ) {
      rotate(dx > 0 ? 1 : -1);
    }
    // deja que el click de tap llegue al brick; el flag evita
    // desprender piezas cuando en realidad fue un swipe
    setTimeout(() => {
      movedRef.current = false;
    }, 0);
  }, [rotate]);

  // ---- Destrucción dirigida por scroll (breakProgress 0–1) ----
  // Cuantizada a CONTEOS de bricks (no al pixel de scroll) y con metas
  // cacheadas por id: los bricks no afectados conservan la MISMA
  // identidad de props y React.memo evita re-renderizarlos. Esto es lo
  // que mantiene fluido el scroll en móvil.
  const metaCache = useRef(new Map<string, ScatterMeta>());
  useEffect(() => {
    metaCache.current.clear();
  }, [bricks]);

  const scrollOrder = useMemo(
    () =>
      [...bricks].sort((a, b) => b.y - a.y || b.x + b.z - (a.x + a.z)),
    [bricks]
  );

  const scatterCount =
    breakProgress > 0 && bricks.length > 0
      ? Math.ceil(bricks.length * Math.min(1, breakProgress))
      : 0;

  const scrollScattered = useMemo<Map<string, ScatterMeta>>(() => {
    if (scatterCount === 0) return new Map();
    const next = new Map<string, ScatterMeta>();
    const maxY = scrollOrder[0]?.y ?? 0;
    const minY = scrollOrder[scrollOrder.length - 1]?.y ?? 0;
    const span = Math.max(1, maxY - minY);
    for (let i = 0; i < scatterCount && i < scrollOrder.length; i++) {
      const b = scrollOrder[i];
      let m = metaCache.current.get(b.id);
      if (!m) {
        // los más altos salen primero: delay crece hacia abajo
        const tier = (maxY - b.y) / span;
        m = scatterMetaFor(b, tier * 220);
        metaCache.current.set(b.id, m);
      }
      next.set(b.id, m);
    }
    return next;
  }, [scatterCount, scrollOrder, scatterMetaFor]);

  // La rotura manual tiene prioridad visual sobre la del scroll.
  const effectiveScattered = useMemo(() => {
    if (scrollScattered.size === 0) return scattered;
    const merged = new Map(scrollScattered);
    for (const [k, v] of scattered) merged.set(k, v);
    return merged;
  }, [scrollScattered, scattered]);

  // ---- Construcción dirigida por scroll (buildProgress 0–1) ----
  // La obra se apila de abajo hacia arriba: solo se montan los primeros
  // N bricks según el progreso; cada lote nuevo cae con su animación.
  const buildOrder = useMemo(
    () =>
      [...bricks].sort((a, b) => a.y - b.y || a.x + a.z - (b.x + b.z)),
    [bricks]
  );
  const builtCount =
    buildProgress === undefined
      ? bricks.length
      : Math.ceil(bricks.length * Math.max(0, Math.min(1, buildProgress)));

  const renderBricks = useMemo(() => {
    if (buildProgress === undefined || builtCount >= bricks.length) {
      return bricks;
    }
    const shown = new Set<string>();
    for (let i = 0; i < builtCount; i++) shown.add(buildOrder[i].id);
    // conserva el orden del pintor
    return bricks.filter((b) => shown.has(b.id));
  }, [bricks, buildOrder, builtCount, buildProgress]);

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
    const [w, , d] = rotated.size;
    return {
      cx: px(w / 2, d / 2),
      cy: py(w / 2, 0, d / 2) + 6,
      rx: (w + d) * HW * 0.42,
      ry: (w + d) * HH * 0.42,
    };
  }, [rotated]);

  if (!mounted) {
    return <div className={className} aria-hidden />;
  }

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={viewBox}
        // overflow-visible: los bloques desprendidos caen FUERA del
        // lienzo (hacia la pantalla) en vez de cortarse en el borde.
        className={cn(
          "h-full w-full overflow-visible",
          interactive && "cursor-grab active:cursor-grabbing"
        )}
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        aria-hidden={ariaLabel ? undefined : true}
        preserveAspectRatio="xMidYMid meet"
        style={{
          // Rotación 3D fluida (CSS rotateY) controlada por scroll.
          // No recalcula la grilla: gira el SVG como un objeto 3D.
          transform: spinY ? `perspective(1200px) rotateY(${spinY}deg)` : undefined,
          transformOrigin: "center center",
          transition: "transform 0.1s linear",
          ...(interactive ? { touchAction: "pan-y" as const } : {}),
        }}
        onPointerDown={interactive ? onPointerDown : undefined}
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerUp={interactive ? onPointerUp : undefined}
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
        <g
          key={`${buildId}-${internalBuild}-${rotation}`}
          className={float ? "lego-floaty" : undefined}
        >
          {renderBricks.map((b) => (
            <BrickShape
              key={b.id}
              brick={b}
              scatter={effectiveScattered.get(b.id)}
              interactive={interactive}
              quick={buildProgress !== undefined}
              entry={entryAnimation}
              onPick={pickBrick}
            />
          ))}
        </g>
      </svg>

      {controls && interactive && (
        <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5">
          <ControlButton label="Rotar a la izquierda" onClick={() => rotate(-1)}>
            <RotateCcw className="h-4 w-4" />
          </ControlButton>
          <ControlButton label="Rotar a la derecha" onClick={() => rotate(1)}>
            <RotateCw className="h-4 w-4" />
          </ControlButton>
          <ControlButton label="Romper la maqueta" onClick={breakAll}>
            <Hammer className="h-4 w-4" />
          </ControlButton>
          <ControlButton label="Rearmar la maqueta" onClick={rebuild}>
            <RefreshCw className="h-4 w-4" />
          </ControlButton>
        </div>
      )}
    </div>
  );
}
