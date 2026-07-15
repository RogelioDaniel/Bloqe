"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  PerspectiveCamera,
  Html,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import {
  groupBricks,
  type VoxelModel,
  type Brick,
} from "@/lib/lego";
import { Brick3D, BRICK_H } from "./brick-3d";
import { InstancedBricks } from "./instanced-bricks";

interface LegoScene3DProps {
  model: VoxelModel;
  buildId?: number | string;
  className?: string;
  autoRotate?: boolean;
  enableControls?: boolean;
  cameraDistance?: number;
  maxDelay?: number;
  /** "full" = HDRI environment + contact shadows (hero/builder). "lite" = simple lights (cards). */
  quality?: "full" | "lite";
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-signal border-t-transparent" />
        <span className="label-mono text-[0.6rem]">
          {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

export function LegoScene3D({
  model,
  buildId = 0,
  className,
  autoRotate = false,
  enableControls = true,
  cameraDistance,
  maxDelay,
  quality = "full",
}: LegoScene3DProps) {
  const [w, h, d] = model.size;

  // group voxels into bricks
  const bricks: Brick[] = useMemo(() => groupBricks(model), [model]);

  // center offset (so the model is centered at origin, sitting on y=0)
  const center = useMemo<[number, number, number]>(() => {
    return [-(w - 1) / 2, 0, -(d - 1) / 2];
  }, [w, d]);

  // compute per-brick screen position + delay
  const placed = useMemo(() => {
    // sort by (y, then x+z) for natural build order (bottom-up, outside-in)
    const sorted = [...bricks].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return (a.x + a.z) - (b.x + b.z);
    });
    const maxLayer = h;
    const total = sorted.length || 1;
    return sorted.map((b, i) => {
      const layerFrac = b.y / maxLayer;
      const indexFrac = i / total;
      const baseDelay = (layerFrac * 0.6 + indexFrac * 0.4) * (maxDelay ?? 2400);
      return {
        brick: b,
        position: [
          center[0] + b.x + (b.w - 1) / 2,
          b.y * BRICK_H + (b.h * BRICK_H) / 2,
          center[2] + b.z + (b.d - 1) / 2,
        ] as [number, number, number],
        delay: baseDelay,
      };
    });
  }, [bricks, center, h, maxDelay]);

  // camera distance based on model size
  const camDist = cameraDistance ?? Math.max(w, h, d) * 1.9 + 6;

  return (
    <div className={className}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={<Loader />}>
          <PerspectiveCamera makeDefault position={[camDist * 0.7, camDist * 0.55, camDist * 0.7]} fov={42} />

          {/* lighting */}
          <ambientLight intensity={0.5} />
          <hemisphereLight args={["#fff7e6", "#1a1d22", 0.5]} />
          <directionalLight
            position={[8, 14, 6]}
            intensity={quality === "full" ? 1.6 : 1.4}
            castShadow={quality === "full"}
            shadow-mapSize={quality === "full" ? [2048, 2048] : [1024, 1024]}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-camera-near={0.5}
            shadow-camera-far={50}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[-6, 4, -4]} intensity={0.4} color="#9fd0ff" />

          {quality === "full" && <Environment preset="city" />}

          {/* ground */}
          {quality === "full" ? (
            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.5}
              scale={Math.max(w, d) * 4}
              blur={2.5}
              far={20}
              resolution={1024}
              color="#000000"
            />
          ) : (
            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.4}
              scale={Math.max(w, d) * 3}
              blur={3}
              far={12}
              resolution={512}
              color="#000000"
            />
          )}
          {/* baseplate disc */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <circleGeometry args={[Math.max(w, d) * 1.4, 64]} />
            <meshStandardMaterial color="#11141a" roughness={0.9} metalness={0} />
          </mesh>

          {/* bricks — instanced for large models, individual for small */}
          {bricks.length > 150 ? (
            <InstancedBricks
              bricks={bricks}
              center={center}
              buildId={buildId}
              maxDelay={maxDelay}
            />
          ) : (
            <group key={buildId}>
              {placed.map(({ brick, position, delay }, i) => (
                <Brick3D
                  key={`${buildId}-${brick.id}-${i}`}
                  position={position}
                  size={[brick.w, brick.h, brick.d]}
                  color={brick.color}
                  delay={delay}
                  buildId={buildId}
                />
              ))}
            </group>
          )}

          {enableControls && (
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={camDist * 0.4}
              maxDistance={camDist * 2.2}
              minPolarAngle={Math.PI * 0.12}
              maxPolarAngle={Math.PI * 0.52}
              autoRotate={autoRotate}
              autoRotateSpeed={0.6}
              target={[0, (h * BRICK_H) / 3, 0]}
              makeDefault
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
