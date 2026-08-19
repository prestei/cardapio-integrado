"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { floatingBadges } from "@/content/site";
import { cn } from "@/lib/cn";

const positions = [
  "top-[12%] left-[-4%] sm:left-[2%]",
  "top-[22%] right-[-2%] sm:right-[4%]",
  "bottom-[28%] left-[-6%] sm:left-0",
  "bottom-[16%] right-[-4%] sm:right-[6%]",
];

function BadgeIcon({ name }: { name: string }) {
  if (name === "bolt") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
        <path
          d="M9 1.5 3.5 9h4.2L7 14.5 12.5 7H8.2L9 1.5Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "phone") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
        <rect
          x="4"
          y="1.5"
          width="8"
          height="13"
          rx="1.6"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    );
  }
  if (name === "rocket") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
        <path
          d="M9.8 2.2c2.4.4 3.8 1.8 4 4.2-1.8 2-4.2 4.6-6.6 6.2l-2.4-2.4C6.4 7.8 8 5.2 9.8 2.2Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <circle cx="10.2" cy="5.6" r="0.9" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
      <rect
        x="2.5"
        y="2.5"
        width="11"
        height="11"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M4.5 8h7M8 4.5v7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function FloatingBadges() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const items = node.querySelectorAll<HTMLElement>("[data-float]");
    const animations = Array.from(items).map((item, index) =>
      animate(item, {
        y: [-9 - index, 9 + index],
        x: index % 2 === 0 ? [-4, 4] : [4, -4],
        duration: 2800 + index * 420,
        ease: "inOutSine",
        loop: true,
        alternate: true,
        delay: index * 180,
      }),
    );

    return () => {
      animations.forEach((animation) => animation.pause());
    };
  }, []);

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 z-10">
      {floatingBadges.map((badge, index) => (
        <div
          key={badge.id}
          data-float
          className={cn(
            "absolute flex items-center gap-2 rounded-md border border-white/[0.08] bg-[#1e1e1ecc] px-3 py-2 text-[11px] font-medium tracking-wide text-ink shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md",
            positions[index],
          )}
        >
          <span className="text-accent">
            <BadgeIcon name={badge.icon} />
          </span>
          {badge.label}
        </div>
      ))}
    </div>
  );
}
