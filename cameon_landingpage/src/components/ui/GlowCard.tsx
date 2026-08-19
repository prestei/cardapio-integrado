"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function GlowCard({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    node.style.setProperty("--my", `${event.clientY - rect.top}px`);
    node.style.setProperty("--glow", "1");
  }

  function onLeave() {
    ref.current?.style.setProperty("--glow", "0");
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "group relative overflow-hidden rounded-lg border border-white/[0.08] bg-surface",
        className,
      )}
      style={
        {
          "--mx": "50%",
          "--my": "0px",
          "--glow": "0",
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: "var(--glow)",
          background:
            "radial-gradient(420px circle at var(--mx) var(--my), rgb(211 84 39 / 0.18), transparent 42%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] p-px transition-opacity duration-300"
        style={{
          opacity: "var(--glow)",
          background:
            "radial-gradient(240px circle at var(--mx) var(--my), rgb(211 84 39 / 0.9), transparent 45%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
