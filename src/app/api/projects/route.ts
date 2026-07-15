// ============================================================
//  /api/projects
//  GET  — list newest 50 projects (parsed back to objects).
//         If DB is empty, returns 6 in-memory sample projects.
//  POST — validate with zod, persist a new project (palette/blueprint/analysis
//         stored as JSON strings), return the parsed-back project (201).
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
  type StructureType,
} from "@/lib/lego";

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const createProjectSchema = z.object({
  title: z.string().min(2, "title must be at least 2 characters"),
  description: z.string().optional(),
  structureType: z.enum([
    "tower",
    "skyscraper",
    "house",
    "bridge",
    "pavilion",
  ]),
  palette: z.array(z.string().regex(HEX)).min(1, "palette requires at least one hex color"),
  blueprint: z
    .object({
      structureType: z.string().optional(),
      palette: z.array(z.string()).optional(),
      bricks: z.array(z.any()).optional(),
      bounds: z.any().optional(),
      metrics: z.any().optional(),
    })
    .passthrough(),
  sourceImage: z.string().optional(),
  analysis: z.any().optional(),
});

interface ParsedProject {
  id: string;
  title: string;
  description: string | null;
  structureType: string;
  palette: string[];
  blueprint: VoxelModel | null;
  analysis: any | null;
  sourceImage: string | null;
  blockCount: number;
  layerCount: number;
  featured: boolean;
  createdAt: Date | string;
}

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function parseProject(p: {
  id: string;
  title: string;
  description: string | null;
  structureType: string;
  palette: string;
  blueprint: string;
  sourceImage: string | null;
  analysis: string;
  blockCount: number;
  layerCount: number;
  featured: boolean;
  createdAt: Date;
}): ParsedProject {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    structureType: p.structureType,
    palette: safeParse<string[]>(p.palette, []),
    blueprint: safeParse<VoxelModel | null>(p.blueprint, null),
    analysis: safeParse<any | null>(p.analysis, null),
    sourceImage: p.sourceImage,
    blockCount: p.blockCount,
    layerCount: p.layerCount,
    featured: p.featured,
    createdAt: p.createdAt,
  };
}

// ---- Sample projects (used when DB is empty) ----
interface SampleSpec {
  title: string;
  description: string;
  type: StructureType;
  palette: string[];
  opts: Record<string, number>;
}

const SAMPLE_SPECS: SampleSpec[] = [
  {
    title: "Torre Nórdica",
    description:
      "Torre residencial modular de 12 niveles con coronación naranja.",
    type: "tower",
    palette: PALETTE_SETS.classic,
    opts: { floors: 12, width: 3, depth: 3 },
  },
  {
    title: "Pabellón Costero",
    description:
      "Pabellón abierto frente al mar con columnata perimetral.",
    type: "pavilion",
    palette: PALETTE_SETS.coastal,
    opts: { width: 5, depth: 5 },
  },
  {
    title: "Casa Bosque",
    description:
      "Vivienda modular de dos aguas en paleta bosque con chimenea.",
    type: "house",
    palette: PALETTE_SETS.forest,
    opts: { width: 5, depth: 4 },
  },
  {
    title: "Rascacielos Monolito",
    description:
      "Torre corporativa de 16 pisos con bandas estructurales naranjas.",
    type: "skyscraper",
    palette: PALETTE_SETS.monolith,
    opts: { floors: 16, width: 3, depth: 3 },
  },
  {
    title: "Viaducto Industrial",
    description:
      "Puente modular de vano 9 con arco suspendido y barandillas.",
    type: "bridge",
    palette: PALETTE_SETS.industrial,
    opts: { span: 9 },
  },
  {
    title: "Atardecer Residencial",
    description:
      "Torre residencial de 10 pisos en tonos cálidos atardecer.",
    type: "tower",
    palette: PALETTE_SETS.sunset,
    opts: { floors: 10, width: 3, depth: 3 },
  },
];

function generateSampleProjects(): ParsedProject[] {
  const now = Date.now();
  return SAMPLE_SPECS.map((s, i) => {
    const bp = generateBuilding(s.type, s.palette, s.opts);
    return {
      id: `sample-${i + 1}`,
      title: s.title,
      description: s.description,
      structureType: s.type,
      palette: s.palette,
      blueprint: bp,
      analysis: null,
      sourceImage: null,
      blockCount: bp.metrics.blockCount,
      layerCount: bp.metrics.layerCount,
      featured: i === 0,
      createdAt: new Date(now - i * 86_400_000),
    };
  });
}

// ---- GET ----
export async function GET() {
  try {
    const rows = await db.project.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    if (rows.length === 0) {
      return NextResponse.json({ projects: generateSampleProjects() });
    }
    return NextResponse.json({
      projects: rows.map(parseProject),
    });
  } catch (err: any) {
    // If DB is unreachable, still return sample content so frontend works.
    return NextResponse.json(
      { projects: generateSampleProjects(), dbError: err?.message || "db unavailable" }
    );
  }
}

// ---- POST ----
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const bp = data.blueprint as unknown as VoxelModel;
  const blockCount =
    (typeof bp?.metrics?.blockCount === "number" && bp.metrics.blockCount) ||
    (Array.isArray(bp?.grid) ? bp.grid.flat(2).filter((c: unknown) => c !== null).length : 0);
  const layerCount =
    (typeof bp?.metrics?.layerCount === "number" && bp.metrics.layerCount) ||
    (Array.isArray(bp?.size) ? bp.size[1] : 0) ||
    0;

  try {
    const created = await db.project.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        structureType: data.structureType,
        palette: JSON.stringify(data.palette),
        blueprint: JSON.stringify(data.blueprint),
        sourceImage: data.sourceImage ?? null,
        analysis: data.analysis ? JSON.stringify(data.analysis) : "{}",
        blockCount,
        layerCount,
      },
    });
    return NextResponse.json(
      { project: parseProject(created) },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Could not create project: ${err?.message || err}` },
      { status: 500 }
    );
  }
}
