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
  /** Colores por vértice (RGBA, normalizados 0–1). Vacío si el GLB
   *  no tiene vertex colors: en ese caso se usa color por material. */
  colors?: Float32Array;
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
  const colorParts: Float32Array[] = [];
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

        // Vertex colors (COLOR_0): vec3 o vec4, lineal o sRGB.
        const colIdx = prim.attributes?.COLOR_0;
        const vertCount = pos.length / 3;
        if (colIdx !== undefined) {
          const colAcc = readAccessor(colIdx);
          const col = colAcc.data as Float32Array;
          const comp = colAcc.components; // 3 (RGB) o 4 (RGBA)
          const out = new Float32Array(vertCount * 4);
          for (let i = 0; i < vertCount; i++) {
            out[i * 4] = col[i * comp];
            out[i * 4 + 1] = col[i * comp + 1];
            out[i * 4 + 2] = col[i * comp + 2];
            out[i * 4 + 3] = comp >= 4 ? col[i * comp + 3] : 1;
          }
          colorParts.push(out);
        } else {
          // sin vertex colors: rellena con blanco (se mapeará a palette)
          colorParts.push(new Float32Array(vertCount * 4).fill(1));
        }

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
  const totalCol = colorParts.reduce((s, p) => s + p.length, 0);
  if (!totalPos || !totalIdx) {
    throw new GlbError("El .glb no contiene mallas de triángulos legibles.");
  }
  const positions = new Float32Array(totalPos);
  const indices = new Uint32Array(totalIdx);
  const colors = new Float32Array(totalCol);
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
  let co = 0;
  for (const p of colorParts) {
    colors.set(p, co);
    co += p.length;
  }

  return { positions, indices, colors, triangleCount: indices.length / 3 };
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
  const { positions, colors } = mesh;
  let { indices } = mesh;
  const hasColors = !!colors && colors.length >= positions.length / 3 * 3;

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

  // Pre-mapeo LEGO: cache de colores hex ya convertidos para no
  // recalcular el más cercano en cada celda.
  const LEGO_PALETTE_ARR = [
    "#c8281c", "#931e15", "#f5b82e", "#1e5aa8", "#143f75",
    "#2e8b57", "#1f5e3b", "#f4f1ea", "#9aa1ad", "#4a4f57",
    "#1a1d22", "#e8542a", "#d9c7a3", "#6b4a2b", "#3aa6c9",
    "#c2a878", "#e85aa8", "#7b4ea8", "#9bc53d",
  ];
  function hexToRgb(h: string): [number, number, number] {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const legoRgb = LEGO_PALETTE_ARR.map(hexToRgb);

  /** Convierte un color RGB (0–1) al color LEGO más cercano (hex). */
  function snapToLego(r: number, g: number, b: number): string {
    let best = legoRgb[0];
    let bestD = Infinity;
    for (const [lr, lg, lb] of legoRgb) {
      const d = (r * 255 - lr) ** 2 + (g * 255 - lg) ** 2 + (b * 255 - lb) ** 2;
      if (d < bestD) { bestD = d; best = [lr, lg, lb]; }
    }
    return "#" + best
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("");
  }

  // Rayo +X por cada celda (y,z): recoge cruces t y rellena por paridad.
  // Además acumula el color (baricéntrico) de cada cruce para teñir la
  // celda con el color REAL del modelo, no por altura.
  const totalRows = h * d;
  let row = 0;
  const crossings: number[] = [];
  const crossingColors: [number, number, number][] = [];

  for (let y = 0; y < h; y++) {
    const cy = minY + (y + 0.5) * step;
    for (let z = 0; z < d; z++) {
      const cz = minZ + (z + 0.5) * step;
      crossings.length = 0;
      crossingColors.length = 0;

      for (let t = 0; t < nTris; t++) {
        const a = tri[t * 3] * 3, b = tri[t * 3 + 1] * 3, c = tri[t * 3 + 2] * 3;
        const ay = positions[a + 1], az = positions[a + 2];
        const by = positions[b + 1], bz = positions[b + 2];
        const cyy = positions[c + 1], czz = positions[c + 2];

        // descarte rápido por bounding en el plano YZ
        if (
          (ay < cy && by < cy && cyy < cy) ||
          (ay > cy && by > cy && cyy > cy) ||
          (az < cz && bz < cz && czz > cz) ||
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

        // color baricéntrico del punto de cruce (si hay vertex colors)
        if (hasColors) {
          const w = 1 - u - v;
          const va = tri[t * 3] * 4;
          const vb = tri[t * 3 + 1] * 4;
          const vc = tri[t * 3 + 2] * 4;
          crossingColors.push([
            w * colors![va] + u * colors![vb] + v * colors![vc],
            w * colors![va + 1] + u * colors![vb + 1] + v * colors![vc + 1],
            w * colors![va + 2] + u * colors![vb + 2] + v * colors![vc + 2],
          ]);
        }
      }

      if (crossings.length >= 2) {
        crossings.sort((p, q) => p - q);
        // reordena los colores para que coincidan con los cruces ordenados
        const order = crossings
          .map((val, idx) => [val, idx] as const)
          .sort((p, q) => p[0] - q[0]);
        for (let k = 0; k + 1 < order.length; k += 2) {
          const x0 = order[k][0];
          const x1 = order[k + 1][0];
          const from = Math.max(0, Math.ceil((x0 - minX) / step - 0.5));
          const to = Math.min(w - 1, Math.floor((x1 - minX) / step - 0.5));
          // color promedio del par de cruces (superficie visible)
          let cr = 0.7, cg = 0.7, cb = 0.7;
          if (hasColors && crossingColors[order[k][1]] && crossingColors[order[k + 1][1]]) {
            const e = crossingColors[order[k][1]];
            const f = crossingColors[order[k + 1][1]];
            // el primer cruce (entrada) es la cara visible
            cr = e[0]; cg = e[1]; cb = e[2];
          } else {
            // sin vertex colors: degradado por altura (fallback)
            const ci = Math.floor((y / h) * palette.length) % palette.length;
            const [rr, gg, bb] = hexToRgb(palette[ci]);
            cr = rr / 255; cg = gg / 255; cb = bb / 255;
          }
          const cellColor = hasColors ? snapToLego(cr, cg, cb) : palette[Math.floor((y / h) * palette.length) % palette.length];
          for (let x = from; x <= to; x++) {
            grid[x][y][z] = { color: cellColor };
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
