"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Boxes,
  FileUp,
  FlaskConical,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/site/logo";
import { LegoModel } from "@/components/lego/lego-model";
import { GlbError, parseGlb, voxelizeMesh } from "@/lib/glb";
import {
  generateBuilding,
  PALETTE_SETS,
  type VoxelModel,
} from "@/lib/lego";

// ============================================================
//  LABORATORIO DE BLOQUES
//  Sube un modelo 3D (.glb) → se voxeliza → se arma con bloques.
//  Interactivo: rotar (swipe), desprender bricks al tocarlos,
//  romper y rearmar. Optimizado para móvil (SVG + scanline).
// ============================================================

type Status = "idle" | "parsing" | "voxelizing" | "done" | "error";

const PALETTE_OPTIONS = Object.keys(PALETTE_SETS);

export default function LabPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<VoxelModel | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [resolution, setResolution] = useState(22);
  const [paletteName, setPaletteName] = useState("classic");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const busy = status === "parsing" || status === "voxelizing";

  const voxelize = useCallback(
    async (file: File) => {
      setStatus("parsing");
      setError(null);
      setProgress(0);
      setModel(null);
      try {
        const buffer = await file.arrayBuffer();
        const mesh = parseGlb(buffer);
        setStatus("voxelizing");
        const result = await voxelizeMesh(mesh, {
          resolution,
          palette: PALETTE_SETS[paletteName],
          onProgress: setProgress,
        });
        setModel(result);
        setStatus("done");
      } catch (err) {
        setStatus("error");
        setError(
          err instanceof GlbError
            ? err.message
            : "No se pudo procesar el archivo. Verifica que sea un .glb (glTF binario 2.0)."
        );
      }
    },
    [resolution, paletteName]
  );

  const onFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".glb")) {
        setStatus("error");
        setError("Solo aceptamos .glb (glTF binario). Exporta tu modelo como GLB.");
        return;
      }
      fileRef.current = file;
      setFileName(file.name);
      void voxelize(file);
    },
    [voxelize]
  );

  const demo = useCallback(() => {
    fileRef.current = null;
    setFileName(null);
    setError(null);
    setProgress(100);
    setModel(
      generateBuilding("skyscraper", PALETTE_SETS[paletteName], {
        width: 5,
        depth: 5,
        floors: 10,
      })
    );
    setStatus("done");
  }, [paletteName]);

  return (
    <div className="min-h-screen bg-ink bg-blueprint bg-grain text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" className="flex items-center gap-2" aria-label="BLOQE — inicio">
          <Logo size={30} />
        </a>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="brick-press rounded-full border-border bg-ink-2/40 hover:bg-ink-3"
        >
          <a href="/">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Volver al sitio
          </a>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-ink-2/60 px-3 py-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-signal" />
            <span className="label-mono text-muted-foreground">
              laboratorio interno · beta
            </span>
          </div>
          <h1 className="mt-5 font-display text-balance text-[clamp(1.9rem,5vw,3.2rem)] leading-tight">
            De modelo 3D a obra de bloques.
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground text-pretty leading-relaxed">
            Sube un <code className="font-mono text-sm text-signal">.glb</code>{" "}
            (glTF binario) y el motor lo voxeliza y lo arma con bloques, pieza
            por pieza. Luego juega: gira la obra con un swipe, toca un bloque
            para desprenderlo — lo que pierda soporte se viene abajo — o
            rómpela completa y reármala.
          </p>
        </motion.div>

        {/* Controles */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card-brick mt-8 rounded-2xl border border-border bg-ink-2/40 p-5 sm:p-6"
        >
          <div className="grid gap-5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div>
              <span className="label-mono text-muted-foreground">
                modelo 3D (.glb)
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".glb,model/gltf-binary"
                  className="sr-only"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <Button
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="btn-brick h-11 bg-signal px-5 text-signal-foreground hover:bg-signal-2"
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileUp className="mr-2 h-4 w-4" />
                  )}
                  {busy ? "Procesando…" : "Subir .glb"}
                </Button>
                <Button
                  onClick={demo}
                  disabled={busy}
                  variant="outline"
                  className="brick-press h-11 rounded-lg border-border bg-ink-2/40 hover:bg-ink-3"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-signal" />
                  Usar obra demo
                </Button>
                {fileName && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {fileName}
                  </span>
                )}
              </div>
            </div>

            <div className="w-full sm:w-44">
              <span className="label-mono text-muted-foreground">
                resolución · {resolution}
              </span>
              <Slider
                className="mt-3"
                min={12}
                max={32}
                step={1}
                value={[resolution]}
                onValueChange={([v]) => setResolution(v)}
                disabled={busy}
                aria-label="Resolución de voxelizado"
              />
            </div>

            <div className="w-full sm:w-40">
              <span className="label-mono text-muted-foreground">paleta</span>
              <Select
                value={paletteName}
                onValueChange={setPaletteName}
                disabled={busy}
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PALETTE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {status === "voxelizing" && (
            <div className="mt-5">
              <div className="flex items-baseline justify-between">
                <span className="label-mono text-muted-foreground">
                  voxelizando malla
                </span>
                <span className="font-mono text-sm text-signal tabular-nums">
                  {progress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3">
                <div
                  className="h-full rounded-full bg-signal transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === "error" && error && (
            <p className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </motion.div>

        {/* Resultado */}
        {model && status === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 overflow-hidden rounded-2xl border border-border bg-ink-2/40"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-signal" />
                <span className="label-mono text-muted-foreground">
                  {fileName ?? "obra demo"} · interactiva
                </span>
              </div>
              <span className="label-mono hidden text-muted-foreground sm:inline">
                toca un bloque · swipe para girar
              </span>
            </div>

            <div className="relative aspect-square bg-blueprint-fine sm:aspect-[16/9]">
              <LegoModel
                model={model}
                className="absolute inset-0 h-full w-full p-4 sm:p-8"
                maxDelay={2000}
                interactive
                controls
                float
                ariaLabel="Obra voxelizada interactiva"
              />
            </div>

            <div className="grid grid-cols-3 border-t border-border">
              <div className="border-r border-border px-4 py-3">
                <div className="label-mono text-muted-foreground">bloques</div>
                <div className="mt-0.5 font-mono text-sm">
                  {model.metrics.blockCount}
                </div>
              </div>
              <div className="border-r border-border px-4 py-3">
                <div className="label-mono text-muted-foreground">niveles</div>
                <div className="mt-0.5 font-mono text-sm">
                  {model.metrics.layerCount}
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="label-mono text-muted-foreground">
                  rejilla
                </div>
                <div className="mt-0.5 font-mono text-sm">
                  {model.size[0]}×{model.size[1]}×{model.size[2]}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          Consejos: exporta como <span className="font-mono">.glb</span> desde
          Blender (File → Export → glTF 2.0, formato binario). Modelos cerrados
          (con volumen) voxelizan mejor. En celulares usa resolución ≤ 24.
        </p>
      </main>
    </div>
  );
}
