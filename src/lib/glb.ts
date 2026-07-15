// ============================================================
//  GLB → LEGO
//  1) parseGlb: lector mínimo de glTF binario (.glb) sin three.js.
//     Extrae posiciones e índices de todas las mallas, aplicando
//     las transformaciones de nodos (matrix o TRS).
//  2) voxelizeMesh: convierte la malla en un VoxelModel por
//     "scanline": por cada celda (y,z) se lanza UN rayo en +X,
//     se ordenan los cruces con triángulos y se rellenan los
//     intervalos interiores. Coste ≈ filas × triángulos (mucho
//     más barato que el clásico voxel × triángulo) — pensado
//     para correr en el hilo principal de un celular en trozos
//     asíncronos con reporte de progreso.
// ============================================================

import type { VoxelCell, VoxelModel } from "@/lib/lego";

// ---------- mat4 helpers (column-major, como glTF) ----------
type Mat4 = number[];

const IDENTITY: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function mul(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16).fill(0);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = s;
    }
  }
  return out;
}

function composeTrs(
  t?: number[],
  q?: number[],
  s?: number[]
): Mat4 {
  const [tx, ty, tz] = t ?? [0, 0, 0];
  const [qx, qy, qz, qw] = q ?? [0, 0, 0, 1];
  const [sx, sy, sz] = s ?? [1, 1, 1];

  const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
  const xx = qx * x2, xy = qx * y2, xz = qx * z2;
  const yy = qy * y2, yz = qy * z2, zz = qz * z2;
  const wx = qw * x2, wy = qw * y2, wz = qw * z2;

  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

function transformPoint(m: Mat4, x: number, y: number, z: number): [number, number, number] {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

// ---------- GLB parsing ----------

interface ParsedMesh {
  positions: Float32Array; // ya transformadas a espacio de mundo
  indices: Uint32Array;
  triangleCount: number;
}

interface GltfJson {
  scene?: number;
  scenes?: { nodes?: number[] }[];
  nodes?: {
    children?: number[];
    mesh?: number;
    matrix?: number[];
    translation?: number[];
    rotation?: number[];
    scale?: number[];
  }[];
  meshes?: {
    primitives?: {
      attributes: Record<string, number>;
      indices?: number;
      mode?: number;
    }[];
  }[];
  accessors?: {
    bufferView?: number;
    byteOffset?: number;
    componentType: number;
    count: number;
    type: string;
  }[];
  bufferViews?: {
    buffer: number;
    byteOffset?: number;
    byteLength: number;
    byteStride?: number;
  }[];
}

export class GlbError extends Error {}

export function parseGlb(buffer: ArrayBuffer): ParsedMesh {
  const view = new DataView(buffer);
  if (buffer.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67) {
    throw new GlbError("El archivo no es un .glb válido (falta la firma glTF).");
  }
  const version = view.getUint32(4, true);
  if (version !== 2) {
    throw new GlbError(`Versión glTF ${version} no soportada (solo 2.0).`);
  }

  // chunks: [longitud, tipo, datos]
  let offset = 12;
  let json: GltfJson | null = null;
  let bin: ArrayBuffer | null = null;
  while (offset + 8 <= buffer.byteLength) {
    const chunkLen = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(
        new TextDecoder().decode(new Uint8Array(buffer, start, chunkLen))
      );
    } else if (chunkType === 0x004e4942) {
      bin = buffer.slice(start, start + chunkLen);
    }
    offset = start + chunkLen + ((4 - (chunkLen % 4)) % 4);
  }
  if (!json) throw new GlbError("El .glb no contiene el chunk JSON.");
  if (!bin) throw new GlbError("El .glb no contiene datos binarios (BIN).");

  const readAccessor = (
    accIdx: number
  ): { data: Float32Array | Uint32Array; components: number } => {
    const acc = json!.accessors?.[accIdx];
    if (!acc || acc.bufferView === undefined) {
      throw new GlbError("Accessor no soportado (sin bufferView).");
    }
    const bv = json!.bufferViews?.[acc.bufferView];
    if (!bv) throw new GlbError("BufferView inválido.");
    const components =
      ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 } as Record<string, number>)[
        acc.type
      ] ?? 0;
    if (!components) throw new GlbError(`Tipo de accessor ${acc.type} no soportado.`);
    const base = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);

    if (acc.componentType === 5126) {
      // float32 — respeta byteStride si existe
      const stride = bv.byteStride ? bv.byteStride / 4 : components;
      const raw = new Float32Array(bin!, base, stride * (acc.count - 1) + components);
      if (stride === components) return { data: raw.slice(0, acc.count * components), components };
      const out = new Float32Array(acc.count * components);
      for (let i = 0; i < acc.count; i++) {
        for (let c = 0; c < components; c++) out[i * components + c] = raw[i * stride + c];
      }
      return { data: out, components };
    }
    // índices: uint8 / uint16 / uint32
    const out = new Uint32Array(acc.count * components);
    if (acc.componentType === 5121) {
      const raw = new Uint8Array(bin!, base, acc.count * components);
      out.set(raw);
    } else if (acc.componentType === 5123) {
      const raw = new Uint16Array(bin!, base, acc.count * components);
      out.set(raw);
    } else if (acc.componentType === 5125) {
      const raw = new Uint32Array(bin!, base, acc.count * components);
      out.set(raw);
    } else {
      throw new GlbError(`componentType ${acc.componentType} no soportado.`);
    }
    return { data: out, components };
  };

  // recorre la escena aplicando transformaciones
  const positionsParts: Float32Array[] = [];
  const indexParts: Uint32Array[] = [];
  let vertexBase = 0;

  const visitNode = (nodeIdx: number, parent: Mat4) => {
    const node = json!.nodes?.[nodeIdx];
    if (!node) return;
    const local: Mat4 = node.matrix
      ? (node.matrix as Mat4)
      : composeTrs(node.translation, node.rotation, node.scale);
    const world = mul(parent, local);

    if (node.mesh !== undefined) {
      const mesh = json!.meshes?.[node.mesh];
      for (const prim of mesh?.primitives ?? []) {
        if (prim.mode !== undefined && prim.mode !== 4) continue; // solo TRIANGLES
        const posIdx = prim.attributes?.POSITION;
        if (posIdx === undefined) continue;
        const pos = readAccessor(posIdx).data as Float32Array;
        const transformed = new Float32Array(pos.length);
        for (let i = 0; i < pos.length; i += 3) {
          const [x, y, z] = transformPoint(world, pos[i], pos[i + 1], pos[i + 2]);
          transformed[i] = x;
          transformed[i + 1] = y;
          transformed[i + 2] = z;
        }
        positionsParts.push(transformed);

        const vertCount = pos.length / 3;
        if (prim.indices !== undefined) {
          const idx = readAccessor(prim.indices).data as Uint32Array;
          const shifted = new Uint32Array(idx.length);
          for (let i = 0; i < idx.length; i++) shifted[i] = idx[i] + vertexBase;
          indexParts.push(shifted);
        } else {
          const seq = new Uint32Array(vertCount);
          for (let i = 0; i < vertCount; i++) seq[i] = vertexBase + i;
          indexParts.push(seq);
        }
        vertexBase += vertCount;
      }
    }
    for (const child of node.children ?? []) visitNode(child, world);
  };

  const sceneIdx = json.scene ?? 0;
  const roots = json.scenes?.[sceneIdx]?.nodes ?? [];
  if (roots.length) {
    for (const r of roots) visitNode(r, IDENTITY);
  } else {
    // sin escena declarada: visita todos los nodos raíz
    (json.nodes ?? []).forEach((_, i) => visitNode(i, IDENTITY));
  }

  const totalPos = positionsParts.reduce((s, p) => s + p.length, 0);
  const totalIdx = indexParts.reduce((s, p) => s + p.length, 0);
  if (!totalPos || !totalIdx) {
    throw new GlbError("El .glb no contiene mallas de triángulos legibles.");
  }
  const positions = new Float32Array(totalPos);
  const indices = new Uint32Array(totalIdx);
  let po = 0;
  for (const p of positionsParts) {
    positions.set(p, po);
    po += p.length;
  }
  let io = 0;
  for (const p of indexParts) {
    indices.set(p, io);
    io += p.length;
  }

  return { positions, indices, triangleCount: indices.length / 3 };
}

// ---------- voxelización scanline ----------

export interface VoxelizeOptions {
  resolution: number; // celdas en el eje mayor (12–36 recomendado en móvil)
  palette: string[];
  onProgress?: (pct: number) => void;
  /** Presupuesto de triángulos: por encima se muestrea aleatoriamente. */
  maxTriangles?: number;
}

export async function voxelizeMesh(
  mesh: ParsedMesh,
  { resolution, palette, onProgress, maxTriangles = 50000 }: VoxelizeOptions
): Promise<VoxelModel> {
  const { positions } = mesh;
  let { indices } = mesh;

  // presupuesto móvil: muestreo uniforme de triángulos si la malla es enorme
  const triCount = indices.length / 3;
  if (triCount > maxTriangles) {
    const keep = maxTriangles / triCount;
    const sampled: number[] = [];
    for (let t = 0; t < triCount; t++) {
      if (Math.random() < keep) {
        sampled.push(indices[t * 3], indices[t * 3 + 1], indices[t * 3 + 2]);
      }
    }
    indices = new Uint32Array(sampled);
  }

  // bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]); maxX = Math.max(maxX, positions[i]);
    minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]); maxZ = Math.max(maxZ, positions[i + 2]);
  }
  const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const step = maxDim / resolution;
  const w = Math.max(2, Math.min(resolution, Math.ceil((maxX - minX) / step)));
  const h = Math.max(2, Math.ceil((maxY - minY) / step));
  const d = Math.max(2, Math.ceil((maxZ - minZ) / step));

  const grid: (VoxelCell | null)[][][] = [];
  for (let x = 0; x < w; x++) {
    grid[x] = [];
    for (let y = 0; y < h; y++) {
      grid[x][y] = [];
      for (let z = 0; z < d; z++) grid[x][y][z] = null;
    }
  }

  // precalcula triángulos como arrays planos
  const tri = indices;
  const nTris = tri.length / 3;

  // Rayo +X por cada celda (y,z): recoge cruces t y rellena por paridad.
  const totalRows = h * d;
  let row = 0;
  const crossings: number[] = [];

  for (let y = 0; y < h; y++) {
    const cy = minY + (y + 0.5) * step;
    for (let z = 0; z < d; z++) {
      const cz = minZ + (z + 0.5) * step;
      crossings.length = 0;

      for (let t = 0; t < nTris; t++) {
        const a = tri[t * 3] * 3, b = tri[t * 3 + 1] * 3, c = tri[t * 3 + 2] * 3;
        const ay = positions[a + 1], az = positions[a + 2];
        const by = positions[b + 1], bz = positions[b + 2];
        const cyy = positions[c + 1], czz = positions[c + 2];

        // descarte rápido por bounding en el plano YZ
        if (
          (ay < cy && by < cy && cyy < cy) ||
          (ay > cy && by > cy && cyy > cy) ||
          (az < cz && bz < cz && czz < cz) ||
          (az > cz && bz > cz && czz > cz)
        ) {
          continue;
        }

        // intersección rayo (+X) vs triángulo, proyectado en YZ (barycéntrico 2D)
        const v0y = by - ay, v0z = bz - az;
        const v1y = cyy - ay, v1z = czz - az;
        const det = v0y * v1z - v0z * v1y;
        if (Math.abs(det) < 1e-12) continue;
        const py2 = cy - ay, pz2 = cz - az;
        const u = (py2 * v1z - pz2 * v1y) / det;
        const v = (v0y * pz2 - v0z * py2) / det;
        if (u < 0 || v < 0 || u + v > 1) continue;

        const ax = positions[a], bx = positions[b], cx = positions[c];
        const ix = ax + u * (bx - ax) + v * (cx - ax);
        crossings.push(ix);
      }

      if (crossings.length >= 2) {
        crossings.sort((p, q) => p - q);
        for (let k = 0; k + 1 < crossings.length; k += 2) {
          const x0 = crossings[k];
          const x1 = crossings[k + 1];
          const from = Math.max(0, Math.ceil((x0 - minX) / step - 0.5));
          const to = Math.min(w - 1, Math.floor((x1 - minX) / step - 0.5));
          for (let x = from; x <= to; x++) {
            const colorIdx =
              Math.floor((y / h) * palette.length) % palette.length;
            grid[x][y][z] = { color: palette[colorIdx] };
          }
        }
      }

      row++;
      // cede el hilo cada ~48 filas para no congelar la UI en móvil
      if (row % 48 === 0) {
        onProgress?.(Math.round((row / totalRows) * 100));
        await new Promise((res) => setTimeout(res, 0));
      }
    }
  }
  onProgress?.(100);

  // métricas
  let count = 0;
  let maxYUsed = 0;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      for (let z = 0; z < d; z++) {
        if (grid[x][y][z]) {
          count++;
          if (y > maxYUsed) maxYUsed = y;
        }
      }
    }
  }
  if (count === 0) {
    throw new GlbError(
      "No se pudo voxelizar: la malla no encierra volumen (¿es un plano o una nube de puntos?)."
    );
  }

  return {
    structureType: "tower",
    palette,
    grid,
    size: [w, h, d],
    metrics: {
      blockCount: count,
      layerCount: maxYUsed + 1,
      heightM: Math.round((maxYUsed + 1) * 0.096 * 10) / 10,
    },
  };
}
