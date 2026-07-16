// ============================================================
//  MODELOS PRE-PROCESADOS
//  Registry para cargar modelos GLB (ya voxelizados) y usarlos
//  directamente en el sitio. Cada entrada apunta a un .glb en
//  /public/models/ y se procesa una sola vez (cache en memoria).
//
//  CÓMO AGREGAR UN MODELO:
//  1. Pon tu archivo .glb en: public/models/<nombre>.glb
//  2. Registra una entrada aquí con su id, ruta y resolución.
//  3. Úsalo desde cualquier componente:
//       const model = await loadModel("flor");
//
//  El motor de voxelización (src/lib/glb.ts) ahora lee los colores
//  reales del modelo (vertex colors), así que el resultado se
//  parece mucho al original.
// ============================================================

import { parseGlb, voxelizeMesh } from "@/lib/glb";
import { PALETTE_SETS, type VoxelModel } from "@/lib/lego";

export interface ModelEntry {
  id: string;
  /** Ruta al .glb dentro de /public. */
  src: string;
  /** Resolución de voxelizado (celdas en el eje mayor). 20–32 recomendado. */
  resolution: number;
  /** Paleta de colores LEGO para el fallback (si no hay vertex colors). */
  palette?: string;
}

/** Registry central. Agrega aquí tus modelos. */
export const MODEL_REGISTRY: ModelEntry[] = [
  // Ejemplo: la flor que mencionaste.
  // {
  //   id: "flor",
  //   src: "/models/flor.glb",
  //   resolution: 28,
  //   palette: "rainbow",
  // },
];

// ---- Cache en memoria (una voxelización por sesión) ----
const cache = new Map<string, VoxelModel>();
const loading = new Map<string, Promise<VoxelModel>>();

/** Carga y voxeliza un modelo del registry (con cache). */
export async function loadModel(id: string): Promise<VoxelModel> {
  const cached = cache.get(id);
  if (cached) return cached;

  const existing = loading.get(id);
  if (existing) return existing;

  const entry = MODEL_REGISTRY.find((m) => m.id === id);
  if (!entry) {
    throw new Error(`Modelo "${id}" no encontrado en MODEL_REGISTRY.`);
  }

  const promise = (async () => {
    const res = await fetch(entry.src);
    if (!res.ok) {
      throw new Error(`No se pudo cargar ${entry.src}: ${res.status}`);
    }
    const buffer = await res.arrayBuffer();
    const mesh = parseGlb(buffer);
    const palette =
      (entry.palette && PALETTE_SETS[entry.palette]) || PALETTE_SETS.rainbow;
    const model = await voxelizeMesh(mesh, {
      resolution: entry.resolution,
      palette,
    });
    cache.set(id, model);
    loading.delete(id);
    return model;
  })();

  loading.set(id, promise);
  return promise;
}

/** Lista de ids disponibles (para UI de selección). */
export function listModels(): string[] {
  return MODEL_REGISTRY.map((m) => m.id);
}
