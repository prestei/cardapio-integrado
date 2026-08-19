"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { createMenuTexture } from "./createMenuTexture";

type Pointer = { x: number; y: number };

type Props = {
  pointer: React.RefObject<Pointer>;
  reduced: boolean;
};

export function PhoneModel({ pointer, reduced }: Props) {
  const group = useRef<THREE.Group>(null);
  const texture = useMemo(() => createMenuTexture(), []);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;

    if (reduced) {
      const t = state.clock.elapsedTime;
      node.rotation.y = THREE.MathUtils.damp(
        node.rotation.y,
        Math.sin(t * 0.35) * 0.16,
        3,
        delta,
      );
      node.rotation.x = THREE.MathUtils.damp(
        node.rotation.x,
        Math.sin(t * 0.28) * 0.05,
        3,
        delta,
      );
      return;
    }

    node.rotation.y = THREE.MathUtils.damp(
      node.rotation.y,
      pointer.current.x * 0.38,
      4.2,
      delta,
    );
    node.rotation.x = THREE.MathUtils.damp(
      node.rotation.x,
      pointer.current.y * 0.2,
      4.2,
      delta,
    );
  });

  const bodyMaterial = reduced ? (
    <meshStandardMaterial color="#1c1c1c" metalness={0.72} roughness={0.32} />
  ) : (
    <meshPhysicalMaterial
      color="#191919"
      metalness={0.92}
      roughness={0.22}
      clearcoat={0.55}
      clearcoatRoughness={0.18}
    />
  );

  return (
    <group ref={group} position={[0, 0.06, 0]}>
      <RoundedBox args={[1.18, 2.44, 0.12]} radius={0.12} smoothness={4} castShadow>
        {bodyMaterial}
      </RoundedBox>

      <RoundedBox
        args={[1.08, 2.32, 0.02]}
        radius={0.1}
        smoothness={3}
        position={[0, 0, 0.062]}
      >
        <meshStandardMaterial color="#050505" roughness={0.6} />
      </RoundedBox>

      <mesh position={[0, -0.02, 0.074]}>
        <planeGeometry args={[0.98, 2.12]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      <RoundedBox
        args={[0.34, 0.08, 0.02]}
        radius={0.04}
        smoothness={3}
        position={[0, 0.98, 0.082]}
      >
        <meshStandardMaterial color="#000000" />
      </RoundedBox>

      <mesh position={[0.605, 0.38, 0]}>
        <boxGeometry args={[0.02, 0.22, 0.045]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.605, 0.52, 0]}>
        <boxGeometry args={[0.018, 0.1, 0.04]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.605, 0.32, 0]}>
        <boxGeometry args={[0.018, 0.16, 0.04]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0, -0.062]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.28, 0.28]} />
        <meshStandardMaterial
          color="#111111"
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}
