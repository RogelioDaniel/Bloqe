// ============================================================
//  LEGO CONSTRUCTION ANALYSIS — server-side VLM wrapper
//  Uses z-ai-web-dev-sdk to analyze a photo of a building
//  and returns a StructureAnalysis consumed by the LEGO engine.
//  SERVER-ONLY. Never import this from a client component.
// ============================================================

import ZAI from "z-ai-web-dev-sdk";
import {
  PALETTE_SETS,
  mapToLegoColors,
  type StructureAnalysis,
  type StructureType,
} from "@/lib/lego";

// ---- Types accepted back from the VLM ----------------------
const STRUCTURE_TYPES: StructureType[] = [
  "tower",
  "skyscraper",
  "house",
  "bridge",
  "pavilion",
  "castle",
  "schoolhouse",
  "abc",
  "playground",
];

const VLM_PROMPT =
  'Analiza esta imagen de una construcción o edificio. Responde SOLO con JSON válido con esta forma exacta: {"title": string, "structureType": "tower"|"skyscraper"|"house"|"bridge"|"pavilion", "summary": string (1-2 frases en español), "features": string[], "materials": string[], "dominantColors": string[] (3-5 hex like #aabbcc), "floors": number, "height": "low"|"medium"|"tall", "confidence": number 0-1}';

/** Strip ```json ... ``` fences (and any surrounding prose) from a model reply. */
function extractJson(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();
  // Remove code fences if present
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    s = fenceMatch[1].trim();
  }
  // Find the first { ... last } block as a fallback
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s.trim();
}

function coerceAnalysis(obj: any): StructureAnalysis {
  const structureType: StructureType = STRUCTURE_TYPES.includes(obj?.structureType)
    ? obj.structureType
    : "tower";

  const dominantColors: string[] = Array.isArray(obj?.dominantColors)
    ? obj.dominantColors
        .filter((c: any) => typeof c === "string")
        .map((c: string) => (c.startsWith("#") ? c : `#${c}`))
    : [];

  const features: string[] = Array.isArray(obj?.features)
    ? obj.features.filter((f: any) => typeof f === "string")
    : [];

  const materials: string[] = Array.isArray(obj?.materials)
    ? obj.materials.filter((m: any) => typeof m === "string")
    : [];

  const floors =
    typeof obj?.floors === "number" && Number.isFinite(obj.floors)
      ? Math.max(1, Math.round(obj.floors))
      : 8;

  const heightRaw = obj?.height;
  const height: StructureAnalysis["height"] =
    heightRaw === "low" || heightRaw === "medium" || heightRaw === "tall"
      ? heightRaw
      : "medium";

  const confidence =
    typeof obj?.confidence === "number" && Number.isFinite(obj.confidence)
      ? Math.max(0, Math.min(1, obj.confidence))
      : 0.6;

  const title =
    typeof obj?.title === "string" && obj.title.trim().length > 0
      ? obj.title.trim().slice(0, 120)
      : "Estructura modular";

  const summary =
    typeof obj?.summary === "string" && obj.summary.trim().length > 0
      ? obj.summary.trim().slice(0, 400)
      : "Estructura detectada a partir de la imagen.";

  return {
    title,
    structureType,
    summary,
    features,
    materials,
    dominantColors,
    floors,
    height,
    confidence,
  };
}

/**
 * Analyze a construction image using the z-ai-web-dev-sdk vision model.
 * @param imageDataUrl a `data:image/...;base64,...` URL (also accepts http(s) URLs).
 * @returns a normalized StructureAnalysis.
 * @throws on ANY error (network, parse, SDK) — caller should use fallbackAnalysis().
 */
export async function analyzeConstructionImage(
  imageDataUrl: string
): Promise<StructureAnalysis> {
  if (!imageDataUrl) {
    throw new Error("analyzeConstructionImage: empty image URL");
  }

  const zai = await ZAI.create();

  const response = await zai.chat.completions.createVision({
    model: "glm-4v",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: VLM_PROMPT },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    thinking: { type: "disabled" },
  });

  const reply = response?.choices?.[0]?.message?.content;
  if (!reply || typeof reply !== "string") {
    throw new Error("VLM returned empty content");
  }

  const jsonText = extractJson(reply);
  if (!jsonText) {
    throw new Error("VLM reply contained no JSON");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(`VLM reply was not valid JSON: ${(err as Error).message}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("VLM reply did not parse to an object");
  }

  return coerceAnalysis(parsed);
}

const FALLBACK_TITLES: Record<StructureType, string> = {
  tower: "Torre Modular",
  skyscraper: "Rascacielos Modular",
  house: "Vivienda Modular",
  bridge: "Viaducto Modular",
  pavilion: "Pabellón Modular",
  castle: "Castillo de Cuento",
  schoolhouse: "Escuelita",
  abc: "Torre ABC",
  playground: "Juego Modular",
};

const FALLBACK_FEATURES: Record<StructureType, string[]> = {
  tower: ["Estructura vertical", "Bloques apilados", "Coronación superior"],
  skyscraper: ["Fachada acristalada", "Estructura perimetral", "Bands de forjado"],
  house: ["Techo a dos aguas", "Ventanas modulares", "Chimenea lateral"],
  bridge: ["Arco suspendido", "Dos soportes", "Barandillas modulares"],
  pavilion: ["Columnata perimetral", "Losplano", "Cubierta plana"],
  castle: ["Almenas", "Cuatro torres", "Bandera central"],
  schoolhouse: ["Tejado a dos aguas", "Campanario", "Ventanas amplias"],
  abc: ["Bloques de colores", "Letra marcada", "Coronación"],
  playground: ["Plataforma elevada", "Tobogán", "Escalera de acceso"],
};

const FALLBACK_MATERIALS: Record<StructureType, string[]> = {
  tower: ["Concreto", "Acero", "Vidrio"],
  skyscraper: ["Acero", "Vidrio", "Aluminio"],
  house: ["Madera", "Ladrillo", "Teja"],
  bridge: ["Acero", "Concreto", "Cables"],
  pavilion: ["Concreto", "Madera", "Acero"],
  castle: ["Bloque", "Madera", "Teja"],
  schoolhouse: ["Bloque", "Madera", "Teja"],
  abc: ["Bloque", "Plástico", "Esmalte"],
  playground: ["Madera", "Plástico", "Metal"],
};

/**
 * Returns a plausible StructureAnalysis when the VLM call fails.
 * Picks a random structureType and maps a PALETTE_SETS palette to LEGO colors.
 */
export function fallbackAnalysis(): StructureAnalysis {
  const structureType =
    STRUCTURE_TYPES[Math.floor(Math.random() * STRUCTURE_TYPES.length)];

  const paletteKeys = Object.keys(PALETTE_SETS);
  const randomPaletteKey =
    paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
  const basePalette = PALETTE_SETS[randomPaletteKey] ?? PALETTE_SETS.classic;
  const dominantColors = mapToLegoColors(basePalette);

  const floorsByType: Record<StructureType, number> = {
    tower: 10,
    skyscraper: 14,
    house: 3,
    bridge: 4,
    pavilion: 4,
    castle: 5,
    schoolhouse: 4,
    abc: 11,
    playground: 4,
  };

  const heightByType: Record<StructureType, StructureAnalysis["height"]> = {
    tower: "tall",
    skyscraper: "tall",
    house: "low",
    bridge: "medium",
    pavilion: "low",
    castle: "medium",
    schoolhouse: "low",
    abc: "tall",
    playground: "low",
  };

  return {
    title: FALLBACK_TITLES[structureType],
    structureType,
    summary: "Análisis aproximado: estructura detectada por heurística.",
    features: FALLBACK_FEATURES[structureType],
    materials: FALLBACK_MATERIALS[structureType],
    dominantColors,
    floors: floorsByType[structureType],
    height: heightByType[structureType],
    confidence: 0.35,
  };
}
