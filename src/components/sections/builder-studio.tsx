"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  RefreshCw,
  Save,
  Wand2,
  Boxes,
  Ruler,
  Layers,
  Check,
  AlertTriangle,
  Link2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
  type StructureAnalysis,
  type StructureType,
} from "@/lib/lego";
import { GltfVoxelizer, generateDemoShape } from "@/components/lego3d/gltf-voxelizer";
import { Slider } from "@/components/ui/slider";

const LegoScene3D = dynamic(
  () => import("@/components/lego3d/lego-scene-3d").then((m) => m.LegoScene3D),
  { ssr: false, loading: () => null }
);

const SAMPLES = [
  { id: "tower", label: "Torre residencial", src: "/samples/tower.png" },
  { id: "house", label: "Casa", src: "/samples/house.png" },
  { id: "bridge", label: "Puente atirantado", src: "/samples/bridge.png" },
];

const STRUCTURE_OPTIONS: { value: StructureType; label: string }[] = [
  { value: "tower", label: "Torre" },
  { value: "skyscraper", label: "Rascacielos" },
  { value: "house", label: "Casa" },
  { value: "bridge", label: "Puente" },
  { value: "pavilion", label: "Pabellón" },
];

const PALETTE_OPTIONS = Object.keys(PALETTE_SETS);

type Status = "idle" | "analyzing" | "built" | "error";

const STAGES = [
  "Leyendo imagen",
  "Analizando con visión IA",
  "Mapeando colores a bloques",
  "Ensamblando capas",
];

interface AnalyzeResponse {
  analysis: StructureAnalysis;
  blueprint: VoxelModel;
  sourceImage: string;
  palette: string[];
}

export function BuilderStudio() {
  const [status, setStatus] = useState<Status>("idle");
  const [stage, setStage] = useState(0);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [buildId, setBuildId] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [structureType, setStructureType] = useState<StructureType>("tower");
  const [paletteName, setPaletteName] = useState("classic");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"image" | "model">("image");
  const [gltfUrl, setGltfUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState(14);
  const fileRef = useRef<HTMLInputElement>(null);
  const glbRef = useRef<HTMLInputElement>(null);

  // ---- 3D model handlers ----
  const handleGlb = useCallback((file: File) => {
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      toast.error("Sube un archivo .glb o .gltf");
      return;
    }
    if (gltfUrl) URL.revokeObjectURL(gltfUrl);
    const url = URL.createObjectURL(file);
    setGltfUrl(url);
    setStatus("analyzing");
    setStage(0);
    setResult(null);
  }, [gltfUrl]);

  const onVoxelized = useCallback(
    (model: VoxelModel) => {
      const analysis: StructureAnalysis = {
        title: "Modelo 3D legoificado",
        structureType: model.structureType,
        summary: `Modelo 3D convertido a ${model.metrics.blockCount} bloques modulares con resolución ${resolution}×.`,
        features: ["Voxelizado desde malla 3D", "Geometría original preservada"],
        materials: ["Bloques LEGO"],
        dominantColors: model.palette,
        floors: model.size[1],
        height: model.size[1] > 10 ? "tall" : model.size[1] > 5 ? "medium" : "low",
        confidence: 0.9,
      };
      setResult({ analysis, blueprint: model, sourceImage: gltfUrl ?? "", palette: model.palette });
      setStructureType(model.structureType);
      setBuildId((b) => b + 1);
      setStatus("built");
      toast.success("Modelo 3D convertido a bloques.", {
        description: `${model.metrics.blockCount} bloques · ${model.metrics.layerCount} capas`,
      });
    },
    [gltfUrl, resolution]
  );

  const onVoxelError = useCallback((msg: string) => {
    setStatus("error");
    toast.error(msg);
  }, []);

  const handleDemoShape = useCallback(
    (shape: "sphere" | "torus" | "cone" | "pyramid") => {
      setStatus("analyzing");
      setStage(0);
      setResult(null);
      // simulate brief processing
      setTimeout(() => {
        const palette = PALETTE_SETS[paletteName] ?? PALETTE_SETS.classic;
        const model = generateDemoShape(shape, palette, resolution);
        onVoxelized(model);
      }, 600);
    },
    [paletteName, resolution, onVoxelized]
  );

  // ---- image input helpers ----
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const urlToDataUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Ese archivo no es una imagen.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("La imagen pesa más de 8 MB. Prueba con una más pequeña.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setSourceImage(dataUrl);
      setStatus("idle");
      setResult(null);
    } catch {
      toast.error("No pude leer la imagen.");
    }
  }, []);

  const handleSample = useCallback(async (src: string) => {
    try {
      setStatus("analyzing");
      setStage(0);
      const dataUrl = await urlToDataUrl(src);
      setSourceImage(dataUrl);
      await runAnalyze(dataUrl);
    } catch {
      toast.error("No pude cargar la imagen de muestra.");
      setStatus("idle");
    }
  }, []);

  const runAnalyze = useCallback(async (image: string) => {
    setStatus("analyzing");
    setStage(0);
    const stageTimer = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 900);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AnalyzeResponse = await res.json();
      clearInterval(stageTimer);
      setStage(STAGES.length - 1);
      setResult(data);
      setStructureType(data.analysis.structureType);
      setBuildId((b) => b + 1);
      setStatus("built");
      toast.success("Modelo de bloques generado.", {
        description: `${data.blueprint.metrics.blockCount} bloques · ${data.blueprint.metrics.layerCount} capas`,
      });
    } catch (e) {
      clearInterval(stageTimer);
      setStatus("error");
      toast.error("El análisis falló. Intenta con otra imagen.", {
        description: (e as Error).message,
      });
    }
  }, []);

  // ---- client-side regeneration on override ----
  const regenerate = useCallback(
    (type: StructureType, pName: string) => {
      if (!result) return;
      const palette = PALETTE_SETS[pName] ?? result.palette;
      const floors = Math.max(3, Math.min(16, result.analysis.floors || 8));
      const bp = generateBuilding(type, palette, { floors });
      setResult({ ...result, blueprint: bp, palette });
      setBuildId((b) => b + 1);
    },
    [result]
  );

  const onStructureChange = (v: string) => {
    const t = v as StructureType;
    setStructureType(t);
    regenerate(t, paletteName);
  };

  const onPaletteChange = (v: string) => {
    setPaletteName(v);
    regenerate(structureType, v);
  };

  const onSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.analysis.title,
          structureType: result.blueprint.structureType,
          palette: result.palette,
          blueprint: result.blueprint,
          sourceImage: result.sourceImage,
          analysis: result.analysis,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Proyecto guardado en la galería.", {
        description: result.analysis.title,
      });
    } catch (e) {
      toast.error("No se pudo guardar el proyecto.", {
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      id="estudio"
      className="relative bg-ink bg-blueprint bg-grain py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -left-32 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(245,184,46,0.10), rgba(245,184,46,0) 65%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* header */}
        <div className="max-w-2xl">
          <div className="label-mono text-signal">Estudio de bloques</div>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
            Sube una imagen. Recibe una torre.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg text-pretty">
            Nuestro modelo de visión analiza la construcción que subas, deduce
            su estructura y materiales, y la reconstruye como un modelo 3D de
            bloques modulares — pieza por pieza.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          {/* LEFT: input + analysis */}
          <div className="lg:col-span-5 space-y-5">
            {/* mode switcher */}
            <div className="inline-flex rounded-full border border-border bg-ink-2/50 p-1">
              <button
                type="button"
                onClick={() => setMode("image")}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  mode === "image"
                    ? "bg-signal text-signal-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Imagen
              </button>
              <button
                type="button"
                onClick={() => setMode("model")}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  mode === "model"
                    ? "bg-signal text-signal-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Modelo 3D
              </button>
            </div>

            {/* hidden GLB input + voxelizer */}
            <input
              ref={glbRef}
              type="file"
              accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleGlb(f);
                e.target.value = "";
              }}
            />
            {gltfUrl && mode === "model" && status === "analyzing" && (
              <Suspense fallback={null}>
                <GltfVoxelizer
                  url={gltfUrl}
                  palette={PALETTE_SETS[paletteName] ?? PALETTE_SETS.classic}
                  resolution={resolution}
                  onVoxelized={onVoxelized}
                  onError={onVoxelError}
                />
              </Suspense>
            )}

            {mode === "image" ? (
            <div className="rounded-2xl border border-border bg-ink-2/50 p-5">
              <div className="flex items-center justify-between">
                <span className="label-mono text-muted-foreground">
                  Imagen fuente
                </span>
                {sourceImage && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs text-signal hover:text-signal-2 transition-colors"
                  >
                    Cambiar
                  </button>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />

              {!sourceImage ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFile(f);
                  }}
                  className={`mt-3 flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                    dragOver
                      ? "border-signal bg-signal/5"
                      : "border-border hover:border-signal/50 hover:bg-ink-3/40"
                  }`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-3 text-signal">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="text-sm text-foreground">
                    Arrastra una foto o{" "}
                    <span className="text-signal underline-offset-2 hover:underline">
                      súbela desde tu dispositivo
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG o WebP · máx 8 MB
                  </span>
                </button>
              ) : (
                <div className="mt-3 relative overflow-hidden rounded-xl border border-border">
                  <img
                    src={sourceImage}
                    alt="Construcción subida"
                    className="w-full max-h-64 object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1 backdrop-blur">
                    <Camera className="h-3 w-3 text-signal" />
                    <span className="label-mono text-[0.6rem] text-foreground">
                      fuente
                    </span>
                  </div>
                </div>
              )}

              {/* samples */}
              <div className="mt-4">
                <div className="label-mono text-muted-foreground mb-2">
                  O prueba un ejemplo
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSample(s.src)}
                      disabled={status === "analyzing"}
                      className="group relative overflow-hidden rounded-lg border border-border bg-ink-3/40 aspect-[4/3] disabled:opacity-50 hover:border-signal/50 transition-colors"
                    >
                      { }
                      <img
                        src={s.src}
                        alt={s.label}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent px-2 py-1.5 text-[0.65rem] text-foreground text-left">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* URL input */}
              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="o pega una URL de imagen"
                    className="pl-9 bg-ink-3/40 border-border"
                  />
                </div>
                <Button
                  variant="outline"
                  className="border-border bg-ink-3/40 hover:bg-ink-3"
                  disabled={!imageUrl || status === "analyzing"}
                  onClick={async () => {
                    try {
                      setStatus("analyzing");
                      setStage(0);
                      const dataUrl = await urlToDataUrl(imageUrl);
                      setSourceImage(dataUrl);
                      await runAnalyze(dataUrl);
                    } catch {
                      toast.error("No pude cargar esa URL.");
                      setStatus("idle");
                    }
                  }}
                >
                  Usar
                </Button>
              </div>

              {/* analyze button */}
              <Button
                className="mt-4 w-full bg-signal text-signal-foreground hover:bg-signal-2 rounded-full h-11"
                disabled={!sourceImage || status === "analyzing"}
                onClick={() => sourceImage && runAnalyze(sourceImage)}
              >
                {status === "analyzing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando…
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Analizar construcción
                  </>
                )}
              </Button>
            </div>
            ) : (
            /* ---- 3D MODEL MODE ---- */
            <div className="rounded-2xl border border-border bg-ink-2/50 p-5">
              <div className="flex items-center justify-between">
                <span className="label-mono text-muted-foreground">
                  Modelo 3D fuente
                </span>
                {gltfUrl && (
                  <button
                    onClick={() => glbRef.current?.click()}
                    className="text-xs text-signal hover:text-signal-2 transition-colors"
                  >
                    Cambiar
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => glbRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleGlb(f);
                }}
                className={`mt-3 flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragOver
                    ? "border-signal bg-signal/5"
                    : "border-border hover:border-signal/50 hover:bg-ink-3/40"
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-3 text-signal">
                  <Boxes className="h-5 w-5" />
                </span>
                <span className="text-sm text-foreground">
                  Arrastra un <span className="font-mono">.glb</span> / <span className="font-mono">.gltf</span> o{" "}
                  <span className="text-signal underline-offset-2 hover:underline">
                    súbelo desde tu dispositivo
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  El modelo se voxeliza en bloques LEGO
                </span>
                {gltfUrl && (
                  <span className="mt-1 rounded-md bg-ink-3/60 px-2 py-1 text-xs font-mono text-signal">
                    modelo cargado ✓
                  </span>
                )}
              </button>

              {/* resolution */}
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <span className="label-mono text-muted-foreground">
                    Resolución de bloques
                  </span>
                  <span className="font-mono text-sm text-foreground">{resolution}×</span>
                </div>
                <Slider
                  value={[resolution]}
                  onValueChange={(v) => setResolution(v[0])}
                  min={8}
                  max={22}
                  step={1}
                  className="mt-2"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Mayor resolución = más detalle y más bloques.
                </p>
              </div>

              {/* demo shapes */}
              <div className="mt-5">
                <div className="label-mono text-muted-foreground mb-2">
                  O prueba una forma demo
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { id: "sphere", label: "Esfera" },
                    { id: "torus", label: "Torsoide" },
                    { id: "cone", label: "Cono" },
                    { id: "pyramid", label: "Pirámide" },
                  ] as const).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleDemoShape(s.id)}
                      disabled={status === "analyzing"}
                      className="rounded-lg border border-border bg-ink-3/40 px-2 py-2.5 text-xs text-muted-foreground hover:border-signal/50 hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            )}

            {/* status / analysis */}
            <AnimatePresence mode="wait">
              {status === "analyzing" && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-border bg-ink-2/50 p-5"
                >
                  <div className="label-mono text-signal mb-3">Procesando</div>
                  <ol className="space-y-2.5">
                    {STAGES.map((s, i) => (
                      <li
                        key={s}
                        className={`flex items-center gap-2.5 text-sm transition-colors ${
                          i <= stage
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] ${
                            i < stage
                              ? "bg-signal text-signal-foreground"
                              : i === stage
                              ? "bg-ink-3 border border-signal text-signal"
                              : "bg-ink-3 text-muted-foreground"
                          }`}
                        >
                          {i < stage ? (
                            <Check className="h-3 w-3" />
                          ) : i === stage ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            i + 1
                          )}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}

              {status === "built" && result && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-border bg-ink-2/50 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="label-mono text-signal">Análisis</div>
                      <h3 className="mt-1 font-display text-xl font-bold tracking-tight">
                        {result.analysis.title}
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-signal/40 text-signal"
                    >
                      {Math.round(result.analysis.confidence * 100)}% conf.
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {result.analysis.summary}
                  </p>

                  {/* confidence bar */}
                  <div className="mt-3">
                    <div className="h-1 w-full rounded-full bg-ink-3 overflow-hidden">
                      <motion.div
                        className="h-full bg-signal"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${result.analysis.confidence * 100}%`,
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* features */}
                  {result.analysis.features.length > 0 && (
                    <div className="mt-4">
                      <div className="label-mono text-muted-foreground mb-2">
                        Características
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.analysis.features.map((f) => (
                          <Badge
                            key={f}
                            variant="secondary"
                            className="bg-ink-3 text-foreground/80 font-normal"
                          >
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* materials */}
                  {result.analysis.materials.length > 0 && (
                    <div className="mt-3">
                      <div className="label-mono text-muted-foreground mb-2">
                        Materiales
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.analysis.materials.map((m) => (
                          <span
                            key={m}
                            className="text-xs text-muted-foreground"
                          >
                            {m}
                            <span className="mx-1 text-muted-foreground/40">
                              ·
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* palette swatches */}
                  <div className="mt-4">
                    <div className="label-mono text-muted-foreground mb-2">
                      Paleta de bloques
                    </div>
                    <div className="flex gap-1.5">
                      {result.palette.map((c, i) => (
                        <span
                          key={i}
                          className="h-7 w-7 rounded-md ring-hairline"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5"
                >
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">El análisis falló</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Intenta con otra imagen más nítida o vuelve a intentarlo.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: builder canvas */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-ink-2/40 overflow-hidden">
              {/* top bar */}
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      status === "built"
                        ? "bg-signal"
                        : status === "analyzing"
                        ? "bg-yellow-400 animate-pulse"
                        : "bg-muted-foreground/40"
                    }`}
                  />
                  <span className="label-mono text-muted-foreground">
                    {status === "built"
                      ? `modelo · ${result?.blueprint.structureType}`
                      : status === "analyzing"
                      ? "ensamblando…"
                      : "esperando imagen"}
                  </span>
                </div>
                {status === "built" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-8"
                    onClick={() => setBuildId((b) => b + 1)}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Reconstruir
                  </Button>
                )}
              </div>

              {/* canvas */}
              <div className="relative aspect-[4/3] sm:aspect-[16/11] bg-blueprint-fine">
                {status === "built" && result ? (
                  <LegoScene3D
                    model={result.blueprint}
                    buildId={buildId}
                    className="absolute inset-0 h-full w-full"
                    maxDelay={2600}
                    autoRotate={autoRotate}
                  />
                ) : status === "analyzing" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-3 w-3 rounded-sm bg-signal"
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                    <span className="label-mono text-muted-foreground">
                      construyendo bloques…
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-3/60 text-muted-foreground">
                      <Boxes className="h-6 w-6" />
                    </span>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Sube o elige una imagen de construcción. Aquí verás
                      ensamblarse tu modelo 3D de bloques.
                    </p>
                  </div>
                )}

                {/* source thumb corner */}
                {status === "built" && sourceImage && (
                  <div className="absolute top-3 right-3 h-16 w-20 overflow-hidden rounded-md border border-border shadow-brick">
                    { }
                    <img
                      src={sourceImage}
                      alt="fuente"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* metrics */}
              <div className="grid grid-cols-3 border-t border-border">
                <Metric
                  icon={<Boxes className="h-3.5 w-3.5" />}
                  label="bloques"
                  value={result?.blueprint.metrics.blockCount ?? "—"}
                />
                <Metric
                  icon={<Layers className="h-3.5 w-3.5" />}
                  label="capas"
                  value={result?.blueprint.metrics.layerCount ?? "—"}
                />
                <Metric
                  icon={<Ruler className="h-3.5 w-3.5" />}
                  label="altura"
                  value={
                    result ? `${result.blueprint.metrics.heightM} m` : "—"
                  }
                />
              </div>
            </div>

            {/* controls */}
            {status === "built" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-2xl border border-border bg-ink-2/40 p-4"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label className="label-mono text-muted-foreground">
                      Estructura
                    </Label>
                    <Select
                      value={structureType}
                      onValueChange={onStructureChange}
                    >
                      <SelectTrigger className="mt-1.5 bg-ink-3/40 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-ink-2 border-border">
                        {STRUCTURE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="label-mono text-muted-foreground">
                      Paleta
                    </Label>
                    <Select
                      value={paletteName}
                      onValueChange={onPaletteChange}
                    >
                      <SelectTrigger className="mt-1.5 bg-ink-3/40 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-ink-2 border-border">
                        {PALETTE_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            <span className="capitalize">{p}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="lg:col-span-2">
                    <Label className="label-mono text-muted-foreground">
                      Rotación automática
                    </Label>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAutoRotate((v) => !v)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          autoRotate ? "bg-signal" : "bg-ink-3"
                        }`}
                        aria-pressed={autoRotate}
                        aria-label="Alternar rotación automática"
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            autoRotate ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {autoRotate ? "Activa" : "Pausada"} — arrastra para orbitar
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Button
                    className="flex-1 bg-signal text-signal-foreground hover:bg-signal-2 rounded-full"
                    onClick={() => setBuildId((b) => b + 1)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Reconstruir modelo
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-border bg-ink-3/40 hover:bg-ink-3 rounded-full"
                    onClick={onSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar proyecto
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 border-r border-border last:border-r-0">
      <div className="flex items-center gap-1.5 label-mono text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm text-foreground">{value}</div>
    </div>
  );
}
