"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { steps } from "@/content/site";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMediaQuery } from "@/lib/use-media-query";

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 280 180" className="h-auto w-full text-accent/80">
        <rect
          x="24"
          y="18"
          width="232"
          height="144"
          rx="4"
          fill="#1e1e1e"
          stroke="rgba(255,255,255,0.08)"
        />
        <rect x="40" y="36" width="64" height="48" rx="3" fill="#d35427" opacity="0.35" />
        <rect x="116" y="40" width="118" height="8" rx="1" fill="#ffffff" opacity="0.55" />
        <rect x="116" y="56" width="88" height="6" rx="1" fill="#a0a0a0" opacity="0.5" />
        <rect x="40" y="100" width="64" height="48" rx="3" fill="#d35427" opacity="0.18" />
        <rect x="116" y="104" width="118" height="8" rx="1" fill="#ffffff" opacity="0.4" />
        <rect x="116" y="120" width="72" height="6" rx="1" fill="#a0a0a0" opacity="0.4" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 280 180" className="h-auto w-full">
        <rect
          x="86"
          y="22"
          width="108"
          height="136"
          rx="6"
          fill="#1e1e1e"
          stroke="#d35427"
          strokeOpacity="0.45"
        />
        <rect x="100" y="36" width="80" height="80" fill="#ffffff" />
        <rect x="108" y="44" width="20" height="20" fill="#121212" />
        <rect x="152" y="44" width="20" height="20" fill="#121212" />
        <rect x="108" y="88" width="20" height="20" fill="#121212" />
        <rect x="130" y="66" width="20" height="20" fill="#121212" />
        <rect x="152" y="88" width="20" height="20" fill="#121212" />
        <text
          x="140"
          y="140"
          textAnchor="middle"
          fill="#d35427"
          fontSize="9"
          fontFamily="sans-serif"
        >
          MESA 12
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 280 180" className="h-auto w-full">
      <rect
        x="48"
        y="36"
        width="120"
        height="108"
        rx="10"
        fill="#1e1e1e"
        stroke="rgba(255,255,255,0.08)"
      />
      <circle cx="108" cy="78" r="18" fill="#d35427" opacity="0.3" />
      <rect x="72" y="108" width="72" height="6" rx="1" fill="#a0a0a0" opacity="0.5" />
      <rect x="184" y="58" width="52" height="72" rx="8" fill="#25D366" opacity="0.85" />
      <path
        d="M200 86h20M200 98h14"
        stroke="#052e16"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StepCopy({
  index,
  onSelect,
}: {
  index: number;
  onSelect?: (value: number) => void;
}) {
  const current = steps[index];
  return (
    <div>
      <p className="font-display text-[72px] leading-none font-semibold text-accent/25 sm:text-[120px]">
        {current.num}
      </p>
      {onSelect && (
        <div className="mt-2 flex gap-2">
          {steps.map((item, itemIndex) => (
            <button
              key={item.num}
              type="button"
              onClick={() => onSelect(itemIndex)}
              className={`h-1 w-10 transition-colors ${
                itemIndex === index ? "bg-accent" : "bg-white/10"
              }`}
              aria-label={`Passo ${item.num}`}
            />
          ))}
        </div>
      )}
      <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
        {current.title}
      </h2>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
        {current.body}
      </p>
      <p className="mt-5 text-[11px] tracking-[0.2em] text-accent uppercase">
        {current.detail}
      </p>
      <div className="mt-8 max-w-sm border border-white/[0.08] bg-surface p-4">
        <StepVisual index={index} />
      </div>
    </div>
  );
}

export function HowItWorks() {
  const wrap = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const desktop = useMediaQuery("(min-width: 768px)");
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");

  useGSAP(
    () => {
      if (!desktop || reduce) return;

      const trigger = ScrollTrigger.create({
        trigger: wrap.current,
        start: "top top",
        end: "+=220%",
        pin: pin.current,
        scrub: 0.65,
        onUpdate: (self) => {
          const next = Math.min(2, Math.floor(self.progress * 3));
          if (line.current) {
            line.current.style.strokeDashoffset = String(1 - self.progress);
          }
          if (next !== stepRef.current) {
            stepRef.current = next;
            setStep(next);
          }
        },
      });

      return () => {
        trigger.kill();
      };
    },
    { scope: wrap, dependencies: [desktop, reduce] },
  );

  return (
    <section id="como-funciona" ref={wrap} className="relative">
      <div ref={pin} className="flex items-center py-20 md:min-h-[100svh]">
        <Container className="w-full">
          <SectionLabel index="03 / 06">Como funciona</SectionLabel>

          <div className="md:hidden space-y-14">
            {steps.map((item, index) => (
              <StepCopy key={item.num} index={index} />
            ))}
          </div>

          <div className="hidden items-center gap-10 md:grid md:grid-cols-[0.38fr_0.62fr]">
            <div className="relative">
              <svg
                className="pointer-events-none absolute top-8 left-3 h-[70%] w-10"
                viewBox="0 0 24 320"
                fill="none"
              >
                <path d="M12 0 V320" stroke="rgba(211,84,39,0.18)" strokeWidth="1" />
                <path
                  ref={line}
                  d="M12 0 V320"
                  stroke="#D35427"
                  strokeWidth="1.4"
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              </svg>
              <p className="font-display text-[140px] leading-none font-semibold text-accent/25">
                {steps[step].num}
              </p>
              <div className="mt-2 flex gap-2">
                {steps.map((item, index) => (
                  <span
                    key={item.num}
                    className={`h-1 w-10 ${index === step ? "bg-accent" : "bg-white/10"}`}
                  />
                ))}
              </div>
            </div>

            <div className="min-h-[320px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={steps[step].num}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                >
                  <h2 className="font-display text-4xl tracking-tight">
                    {steps[step].title}
                  </h2>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
                    {steps[step].body}
                  </p>
                  <p className="mt-5 text-[11px] tracking-[0.2em] text-accent uppercase">
                    {steps[step].detail}
                  </p>
                  <div className="mt-8 max-w-sm border border-white/[0.08] bg-surface p-4">
                    <StepVisual index={step} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
