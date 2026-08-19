"use client";

import { useRef } from "react";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { comparison } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";

function Check({ accent = false }: { accent?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0" fill="none">
      {accent ? (
        <path
          d="M3.2 8.2 6.4 11.4 12.8 4.6"
          stroke="#D35427"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="#9f6b6b"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function Comparison() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-compare='before']", {
        x: -64,
        opacity: 0,
        duration: 1.05,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
      gsap.from("[data-compare='after']", {
        x: 64,
        opacity: 0,
        duration: 1.05,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
    },
    { scope: root },
  );

  return (
    <section id="comparativo" ref={root} className="py-20 lg:py-28">
      <Container>
        <SectionLabel index="02 / 06">Comparativo de operação</SectionLabel>
        <h2 className="max-w-2xl font-display text-3xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
          O mesmo salão. Dois jeitos de colocar o cardápio na mesa.
        </h2>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <article
            data-compare="before"
            className="rounded-lg border border-red-950/40 bg-[#1c1414] p-7 sm:p-8"
          >
            <p className="text-[11px] tracking-[0.22em] text-[#c48787] uppercase">
              {comparison.before.kicker}
            </p>
            <h3 className="mt-3 font-display text-2xl text-[#e8d4d4]">
              {comparison.before.title}
            </h3>
            <ul className="mt-8 space-y-4">
              {comparison.before.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 text-sm leading-relaxed text-[#c4b0b0]"
                >
                  <Check />
                  {point}
                </li>
              ))}
            </ul>
          </article>

          <article
            data-compare="after"
            className="relative overflow-hidden rounded-lg border border-accent/45 bg-surface p-7 shadow-[0_0_0_1px_rgb(211_84_39_/_0.12),0_24px_80px_-40px_rgb(211_84_39_/_0.45)] sm:p-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl"
            />
            <p className="text-[11px] tracking-[0.22em] text-accent uppercase">
              {comparison.after.kicker}
            </p>
            <h3 className="mt-3 font-display text-2xl text-ink">
              {comparison.after.title}
            </h3>
            <ul className="mt-8 space-y-4">
              {comparison.after.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 text-sm leading-relaxed text-ink/85"
                >
                  <Check accent />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Container>
    </section>
  );
}
