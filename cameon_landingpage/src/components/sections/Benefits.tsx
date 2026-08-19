"use client";

import { useRef } from "react";
import { GlowCard } from "@/components/ui/GlowCard";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { benefits } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";

export function Benefits() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-benefit]", {
        y: 36,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 78%",
        },
      });
    },
    { scope: root },
  );

  return (
    <section id="beneficios" ref={root} className="py-20 lg:py-28">
      <Container>
        <SectionLabel index="01 / 06">Benefícios diretos</SectionLabel>
        <h2 className="max-w-3xl font-display text-3xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
          Modernize a mesa e preserve seu jeito de operar.
        </h2>
        <p className="mt-4 max-w-xl text-muted">
          Três movimentos. Nenhum deles pede que você mude a cozinha, o salão ou
          o tom da casa — só o suporte de papel.
        </p>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {benefits.map((item) => (
            <GlowCard key={item.index} className="h-full">
              <article data-benefit className="flex h-full flex-col p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-display text-sm tracking-[0.2em] text-accent/80">
                    {item.index}
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-2xl text-ink">
                      {item.metric}
                    </span>
                    <span className="text-[11px] tracking-wide text-muted uppercase">
                      {item.metricLabel}
                    </span>
                  </span>
                </div>
                <h3 className="mt-10 font-display text-2xl tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
                <div className="mt-8 h-px w-full bg-white/[0.06]" />
                <p className="mt-4 text-[11px] tracking-[0.18em] text-muted uppercase">
                  Operação contínua
                </p>
              </article>
            </GlowCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
