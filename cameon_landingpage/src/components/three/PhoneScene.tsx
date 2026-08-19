"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, PerformanceMonitor } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { PhoneModel } from "./PhoneModel";

type Pointer = { x: number; y: number };

type Props = {
  reduced?: boolean;
};

export default function PhoneScene({ reduced = false }: Props) {
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dpr, setDpr] = useState(reduced ? 1 : 1.5);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const gl = useMemo(
    () => ({
      antialias: !reduced,
      alpha: true,
      powerPreference: reduced
        ? ("low-power" as const)
        : ("high-performance" as const),
      stencil: false,
    }),
    [reduced],
  );

  return (
    <div ref={wrapRef} className="h-[420px] w-full sm:h-[520px] lg:h-[620px]">
      <Canvas
        dpr={dpr}
        gl={gl}
        camera={{ position: [0, 0, 4.15], fov: 32 }}
        frameloop={visible ? "always" : "never"}
      >
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(reduced ? 1 : 1.5)}
        />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[2.4, 3.2, 4]}
          intensity={1.15}
          color="#f2e6d4"
        />
        <spotLight
          position={[-3, 2.2, 3]}
          intensity={16}
          angle={0.45}
          penumbra={0.7}
          color="#d35427"
          distance={12}
        />
        <spotLight
          position={[3.2, 1.4, 2.4]}
          intensity={10}
          angle={0.5}
          penumbra={0.8}
          color="#d35427"
          distance={12}
        />
        <Suspense fallback={null}>
          <PhoneModel pointer={pointer} reduced={reduced} />
        </Suspense>
        {!reduced && (
          <ContactShadows
            position={[0, -1.42, 0]}
            opacity={0.42}
            scale={7}
            blur={2.4}
            far={3.2}
            color="#000000"
          />
        )}
      </Canvas>
    </div>
  );
}
