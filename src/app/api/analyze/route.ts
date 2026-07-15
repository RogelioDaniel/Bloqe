// ============================================================
//  POST /api/analyze
//  Accepts an image (multipart File OR JSON {image: dataUrl|httpUrl}),
//  runs it through the VLM to get a StructureAnalysis, builds a LEGO
//  palette + generator options, and returns a ready-to-render blueprint.
//  NEVER returns a 500 — on any VLM/SDK failure it falls back to a
//  heuristic analysis and still returns a blueprint.
// ============================================================

import { NextResponse } from "next/server";
import {
  analyzeConstructionImage,
  fallbackAnalysis,
} from "@/lib/lego-analysis";
import {
  generateBlueprint,
  mapToLegoColors,
  PALETTE_SETS,
  type StructureType,
} from "@/lib/lego";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  // Buffer.from accepts ArrayBuffer (not SharedArrayBuffer) in Node runtime.
  return Buffer.from(buf).toString("base64");
}

function inferMime(file: File | null, fallback = "image/jpeg"): string {
  if (file?.type) return file.type;
  return fallback;
}

function optionsForType(
  structureType: StructureType,
  floors: number
): Record<string, number> {
  const opts: Record<string, number> = {
    floors: clamp(floors || 8, 3, 16),
  };
  switch (structureType) {
    case "tower":
      opts.width = 3;
      opts.depth = 3;
      break;
    case "skyscraper":
      opts.width = 3;
      opts.depth = 3;
      break;
    case "house":
      opts.width = 5;
      opts.depth = 4;
      break;
    case "bridge":
      opts.span = 9;
      break;
    case "pavilion":
      opts.width = 5;
      opts.depth = 5;
      break;
  }
  return opts;
}

function fallbackPaletteFor(structureType: StructureType): string[] {
  const key =
    structureType === "house"
      ? "forest"
      : structureType === "bridge"
        ? "industrial"
        : "classic";
  return PALETTE_SETS[key] ?? PALETTE_SETS.classic;
}

/** Build a final blueprint+analysis payload, used both on success and on fallback. */
function buildPayload(
  analysis: ReturnType<typeof fallbackAnalysis>,
  sourceImage: string
) {
  let palette = mapToLegoColors(analysis.dominantColors ?? []);
  palette = Array.from(new Set(palette));
  if (palette.length === 0) {
    palette = fallbackPaletteFor(analysis.structureType);
  }

  const opts = optionsForType(analysis.structureType, analysis.floors);
  const blueprint = generateBlueprint(analysis.structureType, palette, opts);

  return {
    analysis,
    blueprint,
    sourceImage,
    palette,
  };
}

export async function POST(req: Request) {
  let dataUrl: string | null = null;

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("image");
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json(
          { error: "Missing 'image' file in multipart form data" },
          { status: 400 }
        );
      }
      const buf = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buf);
      const mime = inferMime(file);
      dataUrl = `data:${mime};base64,${base64}`;
    } else if (contentType.includes("application/json")) {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        );
      }
      const image = body?.image;
      if (typeof image !== "string" || image.trim().length === 0) {
        return NextResponse.json(
          { error: "Missing 'image' (string) in JSON body" },
          { status: 400 }
        );
      }
      if (image.startsWith("data:")) {
        dataUrl = image;
      } else if (
        image.startsWith("http://") ||
        image.startsWith("https://")
      ) {
        try {
          const r = await fetch(image);
          if (!r.ok) {
            return NextResponse.json(
              { error: `Could not fetch image URL (status ${r.status})` },
              { status: 400 }
            );
          }
          const buf = await r.arrayBuffer();
          const base64 = arrayBufferToBase64(buf);
          const mime = r.headers.get("content-type") || "image/jpeg";
          dataUrl = `data:${mime};base64,${base64}`;
        } catch (err: any) {
          return NextResponse.json(
            { error: `Could not fetch image URL: ${err?.message || err}` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error:
              "'image' must be a data URL (data:...) or an http(s) URL",
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported content-type. Use multipart/form-data or application/json.",
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    // Malformed input — still a 400.
    return NextResponse.json(
      { error: `Malformed request: ${err?.message || err}` },
      { status: 400 }
    );
  }

  // ---- VLM analysis (with fallback so we never 500) ----
  let analysis;
  try {
    analysis = await analyzeConstructionImage(dataUrl);
  } catch (err: any) {
    analysis = fallbackAnalysis();
    analysis.summary = `Análisis aproximado (el modelo visual no respondió): ${analysis.summary}`;
  }

  const payload = buildPayload(analysis, dataUrl);
  return NextResponse.json(payload, { status: 200 });
}
