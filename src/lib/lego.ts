// ============================================================
//  LEGO VOXEL ENGINE — building generators
//  Produces 3D voxel grids that form RECOGNIZABLE buildings,
//  then groups adjacent voxels into real LEGO bricks.
//  Rendered with Three.js (react-three-fiber) for true 3D.
// ============================================================

export type StructureType =
  | "tower"
  | "skyscraper"
  | "house"
  | "bridge"
  | "pavilion";

// Classic LEGO palette — used ONLY for brick colors, never UI chrome.
export const LEGO_PALETTE = {
  red: "#c8281c",
  darkRed: "#931e15",
  yellow: "#f5b82e",
  blue: "#1e5aa8",
  darkBlue: "#143f75",
  green: "#2e8b57",
  darkGreen: "#1f5e3b",
  white: "#f4f1ea",
  lightGray: "#9aa1ad",
  darkGray: "#4a4f57",
  black: "#1a1d22",
  orange: "#e8542a",
  tan: "#d9c7a3",
  brown: "#6b4a2b",
  azure: "#3aa6c9",
  sand: "#c2a878",
} as const;

export const PALETTE_SETS: Record<string, string[]> = {
  classic: [LEGO_PALETTE.red, LEGO_PALETTE.yellow, LEGO_PALETTE.blue, LEGO_PALETTE.white],
  industrial: [LEGO_PALETTE.orange, LEGO_PALETTE.darkGray, LEGO_PALETTE.lightGray, LEGO_PALETTE.yellow],
  monolith: [LEGO_PALETTE.black, LEGO_PALETTE.darkGray, LEGO_PALETTE.lightGray, LEGO_PALETTE.orange],
  coastal: [LEGO_PALETTE.azure, LEGO_PALETTE.white, LEGO_PALETTE.tan, LEGO_PALETTE.blue],
  forest: [LEGO_PALETTE.green, LEGO_PALETTE.brown, LEGO_PALETTE.tan, LEGO_PALETTE.white],
  sunset: [LEGO_PALETTE.orange, LEGO_PALETTE.red, LEGO_PALETTE.yellow, LEGO_PALETTE.tan],
  desert: [LEGO_PALETTE.sand, LEGO_PALETTE.brown, LEGO_PALETTE.tan, LEGO_PALETTE.white],
};

// ---------- color utils ----------
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(n, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function shade(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function mapToLegoColors(colors: string[]): string[] {
  const legoColors = Object.values(LEGO_PALETTE);
  return colors.map((c) => {
    const [r1, g1, b1] = hexToRgb(c);
    let best = legoColors[0];
    let bestD = Infinity;
    for (const lc of legoColors) {
      const [r2, g2, b2] = hexToRgb(lc);
      const d = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
      if (d < bestD) { bestD = d; best = lc; }
    }
    return best;
  });
}

// ---------- voxel model ----------
export interface VoxelCell {
  color: string;
}

export interface VoxelModel {
  structureType: StructureType;
  palette: string[];
  /** 3D grid [x][y][z], y is up. null = empty. */
  grid: (VoxelCell | null)[][][];
  size: [number, number, number]; // [w, h, d]
  metrics: {
    blockCount: number;
    layerCount: number;
    heightM: number;
  };
  analysis?: StructureAnalysis;
}

export interface StructureAnalysis {
  title: string;
  structureType: StructureType;
  summary: string;
  features: string[];
  materials: string[];
  dominantColors: string[];
  floors: number;
  height: "low" | "medium" | "tall";
  confidence: number;
}

// ---------- brick (grouped voxels) ----------
export interface Brick {
  id: string;
  x: number; y: number; z: number; // min corner (voxel coords)
  w: number; d: number; h: number; // size in voxels
  color: string;
}

let brickId = 0;
const nid = () => `b${brickId++}`;
function resetIds() { brickId = 0; }

// ---------- grid helpers ----------
function makeGrid(w: number, h: number, d: number): (VoxelCell | null)[][][] {
  const g: (VoxelCell | null)[][][] = [];
  for (let x = 0; x < w; x++) {
    g[x] = [];
    for (let y = 0; y < h; y++) {
      g[x][y] = [];
      for (let z = 0; z < d; z++) {
        g[x][y][z] = null;
      }
    }
  }
  return g;
}

function fill(
  grid: (VoxelCell | null)[][][],
  x0: number, y0: number, z0: number,
  w: number, h: number, d: number,
  color: string
) {
  for (let x = x0; x < x0 + w; x++) {
    for (let y = y0; y < y0 + h; y++) {
      for (let z = z0; z < z0 + d; z++) {
        if (grid[x]?.[y]?.[z] !== undefined) {
          grid[x][y][z] = { color };
        }
      }
    }
  }
}

function fillShell(
  grid: (VoxelCell | null)[][][],
  x0: number, y0: number, z0: number,
  w: number, h: number, d: number,
  color: string,
  thickness = 1
) {
  for (let x = x0; x < x0 + w; x++) {
    for (let y = y0; y < y0 + h; y++) {
      for (let z = z0; z < z0 + d; z++) {
        const onEdge =
          x < x0 + thickness || x >= x0 + w - thickness ||
          z < z0 + thickness || z >= z0 + d - thickness;
        if (onEdge && grid[x]?.[y]?.[z] !== undefined) {
          grid[x][y][z] = { color };
        }
      }
    }
  }
}

function clear(
  grid: (VoxelCell | null)[][][],
  x0: number, y0: number, z0: number,
  w: number, h: number, d: number
) {
  for (let x = x0; x < x0 + w; x++) {
    for (let y = y0; y < y0 + h; y++) {
      for (let z = z0; z < z0 + d; z++) {
        if (grid[x]?.[y]?.[z] !== undefined) grid[x][y][z] = null;
      }
    }
  }
}

// ============================================================
//  BUILDING GENERATORS — produce recognizable architecture
// ============================================================

function genHouse(palette: string[], w = 9, d = 7, walls = 4): VoxelModel {
  const wallColor = palette[0];
  const roofColor = palette[2] ?? LEGO_PALETTE.red;
  const trim = palette[1] ?? LEGO_PALETTE.yellow;
  const door = LEGO_PALETTE.brown;
  const glass = LEGO_PALETTE.azure;
  const ground = shade(palette[0], 0.7);

  const roofLayers = Math.ceil(Math.min(w, d) / 2);
  const totalH = 1 + walls + roofLayers + 1;
  const grid = makeGrid(w, totalH, d);

  // ground/floor slab
  fill(grid, 0, 0, 0, w, 1, d, ground);
  // lawn edge (green border)
  fill(grid, 0, 0, 0, w, 1, 1, LEGO_PALETTE.green);
  fill(grid, 0, 0, d - 1, w, 1, 1, LEGO_PALETTE.green);

  // walls (shell)
  fillShell(grid, 0, 1, 0, w, walls, d, wallColor, 1);
  // corner quoins (trim)
  for (let y = 1; y <= walls; y++) {
    grid[0][y][0] = { color: trim };
    grid[w - 1][y][0] = { color: trim };
    grid[0][y][d - 1] = { color: trim };
    grid[w - 1][y][d - 1] = { color: trim };
  }

  // door (front, z=0, center) — clear 2 wide x 2 tall
  const doorX = Math.floor(w / 2) - 1;
  clear(grid, doorX, 1, 0, 2, 2, 1);
  // door frame
  grid[doorX][1][0] = { color: door };
  grid[doorX + 1][1][0] = { color: door };
  grid[doorX][2][0] = { color: door };
  grid[doorX + 1][2][0] = { color: door };
  grid[doorX][3][0] = { color: trim }; // lintel
  grid[doorX + 1][3][0] = { color: trim };

  // windows (front, sides of door)
  clear(grid, 2, 2, 0, 1, 1, 1);
  grid[2][2][0] = { color: glass };
  clear(grid, w - 3, 2, 0, 1, 1, 1);
  grid[w - 3][2][0] = { color: glass };
  // side windows
  clear(grid, 0, 2, Math.floor(d / 2), 1, 1, 1);
  grid[0][2][Math.floor(d / 2)] = { color: glass };
  clear(grid, w - 1, 2, Math.floor(d / 2), 1, 1, 1);
  grid[w - 1][2][Math.floor(d / 2)] = { color: glass };

  // pitched roof — gable along the longer axis (x). Triangle profile on z.
  const roofBase = 1 + walls;
  for (let layer = 0; layer < roofLayers; layer++) {
    const zMin = layer;
    const zMax = d - layer;
    if (zMax <= zMin) break;
    const roofY = roofBase + layer;
    for (let x = 0; x < w; x++) {
      for (let z = zMin; z < zMax; z++) {
        grid[x][roofY][z] = { color: roofColor };
      }
    }
  }
  // gable end walls (fill the triangle gap on front/back with wall color)
  for (let layer = 0; layer < roofLayers - 1; layer++) {
    const zMin = layer + 1;
    const zMax = d - layer - 1;
    const roofY = roofBase + layer;
    if (zMax <= zMin) continue;
    // front gable (z=0 side): the wall already stops at walls; the triangle above needs filling
    // Actually our roof layer covers full footprint shrinking, so gables are already covered.
  }

  // chimney
  fill(grid, w - 2, roofBase, 0, 1, roofLayers + 1, 1, LEGO_PALETTE.darkGray);

  // ridge cap
  fill(grid, 0, roofBase + roofLayers, Math.floor(d / 2), w, 1, 1, shade(roofColor, 0.8));

  return finalize("house", palette, grid, [w, totalH, d]);
}

function genTower(palette: string[], w = 5, d = 5, floors = 9): VoxelModel {
  const wallColor = palette[0];
  const corner = palette[1] ?? LEGO_PALETTE.yellow;
  const glass = LEGO_PALETTE.azure;
  const ground = shade(palette[0], 0.7);
  const cap = LEGO_PALETTE.orange;

  const totalH = 1 + floors + 2;
  const grid = makeGrid(w, totalH, d);

  // base
  fill(grid, 0, 0, 0, w, 1, d, ground);

  // walls + windows
  for (let f = 0; f < floors; f++) {
    const y = 1 + f;
    // perimeter
    fillShell(grid, 0, y, 0, w, 1, d, wallColor, 1);
    // corner highlights
    grid[0][y][0] = { color: corner };
    grid[w - 1][y][0] = { color: corner };
    grid[0][y][d - 1] = { color: corner };
    grid[w - 1][y][d - 1] = { color: corner };
    // windows every 2 floors on front/back
    if (f % 2 === 1) {
      const mid = Math.floor(w / 2);
      grid[mid][y][0] = { color: glass };
      grid[mid][y][d - 1] = { color: glass };
      if (w > 4) {
        grid[1][y][0] = { color: glass };
        grid[w - 2][y][0] = { color: glass };
      }
    }
    // floor band every 3 floors
    if (f % 3 === 0 && f > 0) {
      fill(grid, 0, y, 0, w, 1, d, shade(wallColor, 0.85));
    }
  }

  // flat roof
  fill(grid, 0, 1 + floors, 0, w, 1, d, shade(wallColor, 0.8));
  // roof edge trim
  fillShell(grid, 0, 1 + floors, 0, w, 1, d, corner, 1);

  // antenna
  fill(grid, Math.floor(w / 2), 1 + floors + 1, Math.floor(d / 2), 1, 1, 1, cap);

  return finalize("tower", palette, grid, [w, totalH, d]);
}

function genSkyscraper(palette: string[], w = 7, d = 7, floors = 16): VoxelModel {
  const frame = palette[0];
  const glass = palette[1] ?? LEGO_PALETTE.azure;
  const band = LEGO_PALETTE.orange;
  const ground = shade(palette[0], 0.7);
  const crown = palette[2] ?? LEGO_PALETTE.yellow;

  const totalH = 1 + floors + 3;
  const grid = makeGrid(w, totalH, d);

  // podium/base (2 floors wider base look via darker color)
  fill(grid, 0, 0, 0, w, 1, d, ground);

  // curtain wall: frame perimeter + glass infill, with horizontal bands
  for (let f = 0; f < floors; f++) {
    const y = 1 + f;
    // structural frame (corners + every other column)
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        const edge = x === 0 || z === 0 || x === w - 1 || z === d - 1;
        const mullion = (x % 2 === 0) || (z % 2 === 0);
        if (edge) grid[x][y][z] = { color: frame };
        else if (mullion && (x === 2 || x === w - 3 || z === 2 || z === d - 3))
          grid[x][y][z] = { color: shade(frame, 0.85) };
        else grid[x][y][z] = { color: glass };
      }
    }
    // floor band every 4 floors
    if (f % 4 === 3) {
      fillShell(grid, 0, y, 0, w, 1, d, band, 1);
    }
  }

  // roof slab
  fill(grid, 0, 1 + floors, 0, w, 1, d, shade(frame, 0.8));
  // setback crown (smaller top)
  fill(grid, 2, 1 + floors + 1, 2, w - 4, 1, d - 4, crown);
  fill(grid, 2, 1 + floors + 2, 2, w - 4, 1, d - 4, shade(crown, 0.85));
  // mast
  fill(grid, Math.floor(w / 2), 1 + floors + 1, Math.floor(d / 2), 1, 1, 1, band);

  return finalize("skyscraper", palette, grid, [w, totalH, d]);
}

function genBridge(palette: string[], span = 13): VoxelModel {
  const pier = palette[0];
  const deck = palette[1] ?? LEGO_PALETTE.lightGray;
  const cable = LEGO_PALETTE.yellow;
  const rail = LEGO_PALETTE.orange;
  const ground = LEGO_PALETTE.darkGray;

  const w = span + 2;
  const d = 5;
  const deckY = 6;
  const totalH = deckY + 3;
  const grid = makeGrid(w, totalH, d);

  // ground/riverbed
  fill(grid, 0, 0, 0, w, 1, d, ground);

  // two piers (support towers)
  const pierXs = [1, w - 3];
  for (const px of pierXs) {
    fill(grid, px, 1, 1, 2, deckY - 1, 3, pier);
    // pier top extends above deck (tower)
    fill(grid, px, deckY + 1, 1, 2, 2, 3, pier);
  }

  // deck
  fill(grid, 0, deckY, 0, w, 1, d, deck);

  // railings (posts every 2 studs)
  for (let x = 0; x < w; x++) {
    if (x % 2 === 0) {
      grid[x][deckY + 1][0] = { color: rail };
      grid[x][deckY + 1][d - 1] = { color: rail };
    }
  }
  // rail top rail
  fill(grid, 0, deckY + 1, 0, w, 1, 1, shade(rail, 0.9));
  fill(grid, 0, deckY + 1, d - 1, w, 1, 1, shade(rail, 0.9));

  // suspension cables (diagonal from pier tops to deck midpoint) — approximate with stair-step
  for (const px of pierXs) {
    const dir = px < w / 2 ? 1 : -1;
    let cx = px + 1;
    let cy = deckY + 2;
    const targetX = Math.floor(w / 2);
    while (cx !== targetX && cx >= 0 && cx < w) {
      grid[cx][cy][0] = { color: cable };
      grid[cx][cy][d - 1] = { color: cable };
      cx += dir;
      cy -= 1;
      if (cy <= deckY) break;
    }
  }

  // deck suspenders (vertical lines from cable to deck)
  for (let x = 2; x < w - 2; x++) {
    if (x % 2 === 0 && grid[x][deckY + 1][0]?.color !== cable) {
      grid[x][deckY + 1][0] = { color: shade(cable, 0.85) };
      grid[x][deckY + 1][d - 1] = { color: shade(cable, 0.85) };
    }
  }

  return finalize("bridge", palette, grid, [w, totalH, d]);
}

function genPavilion(palette: string[], w = 8, d = 8): VoxelModel {
  const colColor = palette[0];
  const roofColor = palette[1] ?? LEGO_PALETTE.white;
  const floor = shade(palette[2] ?? LEGO_PALETTE.tan, 0.85);
  const accent = LEGO_PALETTE.orange;
  const colH = 4;

  const totalH = 1 + colH + 2;
  const grid = makeGrid(w, totalH, d);

  // floor slab
  fill(grid, 0, 0, 0, w, 1, d, floor);
  // steps front
  fill(grid, Math.floor(w / 2) - 1, 0, d, 3, 1, 1, shade(floor, 0.9));

  // 8 columns (4 corners + 4 mid-edge)
  const cols: [number, number][] = [
    [0, 0], [w - 1, 0], [0, d - 1], [w - 1, d - 1],
    [Math.floor(w / 2), 0], [Math.floor(w / 2), d - 1],
    [0, Math.floor(d / 2)], [w - 1, Math.floor(d / 2)],
  ];
  for (const [cx, cz] of cols) {
    fill(grid, cx, 1, cz, 1, colH, 1, colColor);
    // capital
    grid[cx][1 + colH][cz] = { color: accent };
  }

  // flat roof with overhang
  fill(grid, 0, 1 + colH, 0, w, 1, d, roofColor);
  // roof trim
  fillShell(grid, 0, 1 + colH + 1, 0, w, 1, d, shade(roofColor, 0.9), 1);
  // center roof ornament
  grid[Math.floor(w / 2)][1 + colH + 1][Math.floor(d / 2)] = { color: accent };

  return finalize("pavilion", palette, grid, [w, totalH, d]);
}

function finalize(
  structureType: StructureType,
  palette: string[],
  grid: (VoxelCell | null)[][][],
  size: [number, number, number]
): VoxelModel {
  let count = 0;
  let maxY = 0;
  for (let x = 0; x < size[0]; x++) {
    for (let y = 0; y < size[1]; y++) {
      for (let z = 0; z < size[2]; z++) {
        if (grid[x][y][z]) {
          count++;
          if (y > maxY) maxY = y;
        }
      }
    }
  }
  return {
    structureType,
    palette,
    grid,
    size,
    metrics: {
      blockCount: count,
      layerCount: maxY + 1,
      heightM: Math.round((maxY + 1) * 0.096 * 10) / 10,
    },
  };
}

export function generateBuilding(
  structureType: StructureType,
  palette: string[],
  opts: { floors?: number; width?: number; depth?: number } = {}
): VoxelModel {
  resetIds();
  const floors = opts.floors ?? 8;
  switch (structureType) {
    case "skyscraper":
      return genSkyscraper(palette, opts.width ?? 7, opts.depth ?? 7, Math.max(8, floors));
    case "house":
      return genHouse(palette, opts.width ?? 9, opts.depth ?? 7, opts.floors ?? 4);
    case "bridge":
      return genBridge(palette, opts.width ?? 13);
    case "pavilion":
      return genPavilion(palette, opts.width ?? 8, opts.depth ?? 8);
    case "tower":
    default:
      return genTower(palette, opts.width ?? 5, opts.depth ?? 5, floors);
  }
}

// ============================================================
//  VOXEL → BRICK grouping
//  Greedy meshing along X axis: merge adjacent same-color
//  voxels in a row into a single brick (1x1xN or wider).
//  Limits brick width to 4 (realistic LEGO plate sizes).
// ============================================================
export function groupBricks(model: VoxelModel): Brick[] {
  const [w, h, d] = model.size;
  const visited: boolean[][][] = [];
  for (let x = 0; x < w; x++) {
    visited[x] = [];
    for (let y = 0; y < h; y++) {
      visited[x][y] = [];
      for (let z = 0; z < d; z++) visited[x][y][z] = false;
    }
  }

  const bricks: Brick[] = [];
  const MAX_RUN = 6;

  for (let y = 0; y < h; y++) {
    for (let z = 0; z < d; z++) {
      for (let x = 0; x < w; x++) {
        const cell = model.grid[x][y][z];
        if (!cell || visited[x][y][z]) continue;
        // try to extend run along X (same color, same y,z)
        let run = 1;
        while (
          x + run < w &&
          run < MAX_RUN &&
          model.grid[x + run][y][z]?.color === cell.color &&
          !visited[x + run][y][z]
        ) {
          run++;
        }
        // mark visited
        for (let i = 0; i < run; i++) visited[x + i][y][z] = true;
        bricks.push({
          id: nid(),
          x, y, z,
          w: run, d: 1, h: 1,
          color: cell.color,
        });
      }
    }
  }
  return bricks;
}

// ============================================================
//  VOXELIZE A 3D MESH into a VoxelModel (for GLTF uploads)
//  Called from a worker/browser context where we have the
//  THREE.BufferGeometry. Returns a VoxelModel.
// ============================================================
export function voxelizeGeometry(
  positions: Float32Array,
  indices: Uint16Array | Uint32Array | null,
  resolution: number,
  palette: string[],
  structureType: StructureType = "tower"
): VoxelModel {
  // compute bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);
    minY = Math.min(minY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]);
    maxX = Math.max(maxX, positions[i]);
    maxY = Math.max(maxY, positions[i + 1]);
    maxZ = Math.max(maxZ, positions[i + 2]);
  }
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxDim = Math.max(sizeX, sizeY, sizeZ) || 1;
  const step = maxDim / resolution;
  const w = Math.max(2, Math.ceil(sizeX / step));
  const h = Math.max(2, Math.ceil(sizeY / step));
  const d = Math.max(2, Math.ceil(sizeZ / step));

  const grid = makeGrid(w, h, d);

  // For each triangle, rasterize voxels it touches (conservative).
  // Simple approach: for each voxel center, check if inside the mesh
  // using ray-casting (cast ray in +X, count triangle crossings).
  const tris: number[][] = [];
  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      tris.push([indices[i], indices[i + 1], indices[i + 2]]);
    }
  } else {
    for (let i = 0; i < positions.length; i += 9) {
      tris.push([i / 3, i / 3 + 1, i / 3 + 2]);
    }
  }

  // helper: point-in-mesh via ray cast along +X
  const triIntersect = (
    ox: number, oy: number, oz: number,
    a: number, b: number, c: number
  ): boolean => {
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
    const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
    const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2];
    const ex1 = bx - ax, ey1 = by - ay, ez1 = bz - az;
    const ex2 = cx - ax, ey2 = cy - ay, ez2 = cz - az;
    // normal
    const nx = ey1 * ez2 - ez1 * ey2;
    const ny = ez1 * ex2 - ex1 * ez2;
    const nz = ex1 * ey2 - ey1 * ex2;
    const denom = nx; // ray dir (1,0,0) dot normal
    if (Math.abs(denom) < 1e-9) return false;
    const t = ((ax - ox) * nx + (ay - oy) * ny + (az - oz) * nz) / denom;
    if (t < 0) return false;
    // intersection point
    const px = ox + t, py = oy, pz = oz;
    // barycentric
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const wx = px - ax, wy = py - ay, wz = pz - az;
    const uu = ux * ux + uy * uy + uz * uz;
    const uv = ux * vx + uy * vy + uz * vz;
    const uw = ux * wx + uy * wy + uz * wz;
    const vv = vx * vx + vy * vy + vz * vz;
    const vw = vx * wx + vy * wy + vz * wz;
    const det = uu * vv - uv * uv;
    if (Math.abs(det) < 1e-9) return false;
    const s = (vv * uw - uv * vw) / det;
    const tt = (uu * vw - uv * uw) / det;
    return s >= 0 && tt >= 0 && s + tt <= 1;
  };

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      for (let z = 0; z < d; z++) {
        const cx = minX + (x + 0.5) * step;
        const cy = minY + (y + 0.5) * step;
        const cz = minZ + (z + 0.5) * step;
        let crossings = 0;
        for (const tri of tris) {
          if (triIntersect(cx, cy, cz, tri[0], tri[1], tri[2])) crossings++;
        }
        if (crossings % 2 === 1) {
          // interior voxel — color by height (gradient) for visual interest
          const colorIdx = Math.floor((y / h) * palette.length) % palette.length;
          grid[x][y][z] = { color: palette[colorIdx] };
        }
      }
    }
  }

  const model: VoxelModel = {
    structureType,
    palette,
    grid,
    size: [w, h, d],
    metrics: { blockCount: 0, layerCount: h, heightM: Math.round(h * 0.096 * 10) / 10 },
  };
  // compute count
  let count = 0;
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++)
      for (let z = 0; z < d; z++)
        if (grid[x][y][z]) count++;
  model.metrics.blockCount = count;
  return model;
}

// ---------- legacy compat (kept for any API consumers) ----------
export type Blueprint = VoxelModel;
export function generateBlueprint(
  structureType: StructureType,
  palette: string[],
  opts: { floors?: number; width?: number; depth?: number } = {}
): VoxelModel {
  return generateBuilding(structureType, palette, opts);
}
