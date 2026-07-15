"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// LEGO brick proportions (in voxel units)
export const STUD = 1; // width of 1 stud
export const BRICK_H = 1.2; // brick height (real LEGO ratio ~1.2)
const STUD_R = 0.3; // stud radius
const STUD_H = 0.18; // stud height

interface Brick3DProps {
  position: [number, number, number];
  size: [number, number, number]; // [w, h, d] in voxels
  color: string;
  delay: number; // ms
  buildId: number | string;
}

/**
 * A single LEGO brick rendered in 3D: a box body + N studs on top.
 * Animates a "drop in" reveal based on `delay` and `buildId`.
 */
export function Brick3D({ position, size, color, delay, buildId }: Brick3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef<number | null>(null);
  const [w, h, d] = size;
  const bh = h * BRICK_H;

  // stud positions on top face
  const studs = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let sx = 0; sx < w; sx++) {
      for (let sz = 0; sz < d; sz++) {
        arr.push([
          sx - (w - 1) / 2,
          bh / 2 + STUD_H / 2,
          sz - (d - 1) / 2,
        ]);
      }
    }
    return arr;
  }, [w, d, bh]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.35,
        metalness: 0.05,
      }),
    [color]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() * 1000;
    if (startRef.current === null) startRef.current = t;
    const elapsed = t - startRef.current - delay;
    if (elapsed < 0) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;
    const dur = 450;
    const p = Math.min(1, elapsed / dur);
    // easeOutBack
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const ease = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    const drop = (1 - ease) * 6; // start 6 units above
    groupRef.current.position.y = position[1] + drop;
    // subtle scale-in
    const s = 0.6 + 0.4 * ease;
    groupRef.current.scale.set(s, s, s);
  });

  // reset on buildId change
  useEffect(() => {
    startRef.current = null;
    if (groupRef.current) groupRef.current.visible = false;
  }, [buildId]);

  return (
    <group ref={groupRef} position={position}>
      {/* body */}
      <mesh material={material} castShadow receiveShadow>
        <boxGeometry args={[w, bh, d]} />
      </mesh>
      {/* studs */}
      {studs.map((p, i) => (
        <mesh key={i} position={p} material={material} castShadow>
          <cylinderGeometry args={[STUD_R, STUD_R, STUD_H, 16]} />
        </mesh>
      ))}
    </group>
  );
}
