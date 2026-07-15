"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  voxelizeGeometry,
  type VoxelModel,
} from "@/lib/lego";

interface GltfVoxelizerProps {
  url: string;
  palette: string[];
  resolution: number;
  onVoxelized: (model: VoxelModel) => void;
  onError: (msg: string) => void;
}

/**
 * Loads a GLTF/GLB from `url`, extracts the largest mesh geometry,
 * voxelizes it, and calls `onVoxelized` with a VoxelModel.
 * Renders nothing visible (headless processor).
 */
export function GltfVoxelizer({
  url,
  palette,
  resolution,
  onVoxelized,
  onError,
}: GltfVoxelizerProps) {
  const gltf = useGLTF(url);

  useEffect(() => {
    if (!gltf?.scene) return;
    try {
      // collect all mesh geometries
      const geometries: THREE.BufferGeometry[] = [];
      gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh && mesh.geometry) {
          // bake world transform into geometry
          const geom = mesh.geometry.clone();
          geom.applyMatrix4(mesh.matrixWorld);
          geometries.push(geom);
        }
      });

      if (geometries.length === 0) {
        onError("El modelo no contiene geometría 3D.");
        return;
      }

      // merge all geometries into one
      const merged = mergeGeometries(geometries);
      const positions = merged.attributes.position.array as Float32Array;
      const indices = merged.index
        ? (merged.index.array as Uint16Array | Uint32Array)
        : null;

      const model = voxelizeGeometry(positions, indices, resolution, palette);
      if (model.metrics.blockCount === 0) {
        onError("No se pudieron extraer bloques del modelo. Prueba con mayor resolución.");
        return;
      }
      onVoxelized(model);
    } catch (e) {
      onError(`Error al procesar el modelo: ${(e as Error).message}`);
    }
     
  }, [gltf, palette, resolution]);

  return null;
}

// Simple geometry merge (positions + indices)
function mergeGeometries(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  let totalVerts = 0;
  let totalIdx = 0;
  let hasIndex = true;
  for (const g of geoms) {
    totalVerts += g.attributes.position.count;
    if (!g.index) hasIndex = false;
    else totalIdx += g.index.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  let offset = 0;
  let vOffset = 0;
  const indexArr = hasIndex ? new Uint32Array(totalIdx) : null;

  for (const g of geoms) {
    const pos = g.attributes.position.array as Float32Array;
    positions.set(pos, vOffset);
    const count = g.attributes.position.count;
    if (indexArr && g.index) {
      const idx = g.index.array as ArrayLike<number>;
      for (let i = 0; i < idx.length; i++) {
        indexArr[offset + i] = idx[i] + vOffset / 3;
      }
      offset += idx.length;
    }
    vOffset += count * 3;
  }

  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  if (indexArr) merged.setIndex(new THREE.BufferAttribute(indexArr, 1));
  return merged;
}

// --- Demo shape generators (no GLB needed) ---
export function generateDemoShape(
  shape: "sphere" | "torus" | "cone" | "pyramid",
  palette: string[],
  resolution: number
): VoxelModel {
  let geom: THREE.BufferGeometry;
  switch (shape) {
    case "sphere":
      geom = new THREE.SphereGeometry(1, 24, 16);
      break;
    case "torus":
      geom = new THREE.TorusGeometry(0.8, 0.3, 12, 24);
      break;
    case "cone":
      geom = new THREE.ConeGeometry(0.8, 1.6, 16);
      break;
    case "pyramid":
      geom = new THREE.ConeGeometry(1, 1.4, 4);
      break;
  }
  const positions = geom.attributes.position.array as Float32Array;
  const indices = geom.index
    ? (geom.index.array as Uint16Array | Uint32Array)
    : null;
  return voxelizeGeometry(positions, indices, resolution, palette);
}
