"use client";

import { Fragment, useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Brick } from "@/lib/lego";
import { BRICK_H } from "./brick-3d";

const STUD_R = 0.3;
const STUD_H = 0.18;

interface InstancedBricksProps {
  bricks: Brick[];
  center: [number, number, number];
  buildId: number | string;
  maxDelay?: number;
}

interface Placed {
  matrix: THREE.Matrix4;
  color: THREE.Color;
  delay: number;
  studMatrices: THREE.Matrix4[];
}

/**
 * High-performance brick renderer using instancedMesh per color.
 * Used when brick count is large (> 150). Each brick = 1 box instance +
 * N stud cylinder instances. Build animation progressively reveals instances.
 */
export function InstancedBricks({
  bricks,
  center,
  buildId,
  maxDelay = 2400,
}: InstancedBricksProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef<number | null>(null);
  const meshRefs = useRef<Map<string, THREE.InstancedMesh>>(new Map());
  const studRefs = useRef<Map<string, THREE.InstancedMesh>>(new Map());

  // group bricks by color + compute placements
  const groups = useMemo(() => {
    const map = new Map<string, { color: THREE.Color; placed: Placed[]; studCount: number }>();
    const total = bricks.length || 1;
    const maxY = Math.max(...bricks.map((b) => b.y + b.h), 1);

    // sort by (y, x+z) for build order
    const sorted = [...bricks].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return (a.x + a.z) - (b.x + b.z);
    });

    sorted.forEach((b, i) => {
      const colorHex = b.color;
      const color = new THREE.Color(colorHex);
      if (!map.has(colorHex)) {
        map.set(colorHex, { color, placed: [], studCount: 0 });
      }
      const g = map.get(colorHex)!;

      const px = center[0] + b.x + (b.w - 1) / 2;
      const py = b.y * BRICK_H + (b.h * BRICK_H) / 2;
      const pz = center[2] + b.z + (b.d - 1) / 2;

      const matrix = new THREE.Matrix4();
      matrix.makeScale(0, 0, 0); // hidden initially
      matrix.setPosition(px, py, pz);
      // apply scale via compose
      const finalMatrix = new THREE.Matrix4();
      finalMatrix.compose(
        new THREE.Vector3(px, py, pz),
        new THREE.Quaternion(),
        new THREE.Vector3(b.w, b.h * BRICK_H, b.d)
      );

      const layerFrac = b.y / maxY;
      const indexFrac = i / total;
      const delay = (layerFrac * 0.6 + indexFrac * 0.4) * maxDelay;

      // studs for this brick
      const studMatrices: THREE.Matrix4[] = [];
      for (let sx = 0; sx < b.w; sx++) {
        for (let sz = 0; sz < b.d; sz++) {
          const sm = new THREE.Matrix4();
          sm.compose(
            new THREE.Vector3(
              center[0] + b.x + sx,
              py + (b.h * BRICK_H) / 2 + STUD_H / 2,
              center[2] + b.z + sz
            ),
            new THREE.Quaternion(),
            new THREE.Vector3(1, 1, 1)
          );
          studMatrices.push(sm);
        }
      }

      g.placed.push({
        matrix: finalMatrix,
        color,
        delay,
        studMatrices,
      });
      g.studCount += studMatrices.length;
    });

    return Array.from(map.entries()).map(([hex, g]) => ({
      hex,
      color: g.color,
      placed: g.placed,
      studCount: g.studCount,
    }));
  }, [bricks, center, maxDelay]);

  // animate build progress
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 1000;
    if (startRef.current === null) startRef.current = t;

    groups.forEach((g) => {
      const mesh = meshRefs.current.get(g.hex);
      const studMesh = studRefs.current.get(g.hex);
      if (!mesh) return;

      let revealedCount = 0;
      const dummy = new THREE.Matrix4();
      const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

      g.placed.forEach((p, i) => {
        const elapsed = t - (startRef.current ?? t) - p.delay;
        if (elapsed < 0) {
          dummy.copy(hiddenMatrix);
          mesh.setMatrixAt(i, dummy);
        } else {
          const dur = 400;
          const prog = Math.min(1, elapsed / dur);
          const c1 = 1.70158;
          const c3 = c1 + 1;
          const ease = 1 + c3 * Math.pow(prog - 1, 3) + c1 * Math.pow(prog - 1, 2);
          const drop = (1 - ease) * 5;
          const s = 0.5 + 0.5 * ease;

          dummy.compose(
            new THREE.Vector3(
              p.matrix.elements[12],
              p.matrix.elements[13] + drop,
              p.matrix.elements[14]
            ),
            new THREE.Quaternion(),
            new THREE.Vector3(
              p.matrix.elements[0] * s,
              p.matrix.elements[5] * s,
              p.matrix.elements[10] * s
            )
          );
          mesh.setMatrixAt(i, dummy);
          revealedCount++;
        }
      });
      mesh.instanceMatrix.needsUpdate = true;

      // animate studs similarly
      if (studMesh) {
        let studIdx = 0;
        g.placed.forEach((p) => {
          const elapsed = t - (startRef.current ?? t) - p.delay;
          const visible = elapsed >= 0;
          p.studMatrices.forEach((sm) => {
            if (visible) {
              studMesh.setMatrixAt(studIdx, sm);
            } else {
              studMesh.setMatrixAt(studIdx, hiddenMatrix);
            }
            studIdx++;
          });
        });
        studMesh.instanceMatrix.needsUpdate = true;
      }
    });
  });

  // reset on buildId change
  useEffect(() => {
    startRef.current = null;
  }, [buildId]);

  return (
    <group ref={groupRef} key={buildId}>
      {groups.map((g) => (
        <Fragment key={g.hex}>
          <instancedMesh
            ref={(m) => {
              if (m) meshRefs.current.set(g.hex, m);
            }}
            args={[undefined, undefined, g.placed.length]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={g.color}
              roughness={0.35}
              metalness={0.05}
            />
          </instancedMesh>
          {g.studCount > 0 && (
            <instancedMesh
              ref={(m) => {
                if (m) studRefs.current.set(g.hex, m);
              }}
              args={[undefined, undefined, g.studCount]}
              castShadow
            >
              <cylinderGeometry args={[STUD_R, STUD_R, STUD_H, 12]} />
              <meshStandardMaterial
                color={g.color}
                roughness={0.35}
                metalness={0.05}
              />
            </instancedMesh>
          )}
        </Fragment>
      ))}
    </group>
  );
}
