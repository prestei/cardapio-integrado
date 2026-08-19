"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FloatingBadges } from "@/components/effects/FloatingBadges";
import { PhoneFallback } from "@/components/three/PhoneFallback";
import { useMediaQuery } from "@/lib/use-media-query";

const PhoneScene = dynamic(() => import("@/components/three/PhoneScene"), {
  ssr: false,
  loading: () => <PhoneFallback />,
});

export function Hero() {
  const reduced = useMediaQuery("(max-width: 768px), (prefers-reduced-motion: reduce)");

  return (
    <section
      id="topo"
      className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(255 255 255 / 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.035) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 70% 40%, black, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-32 left-[4%] h-[320px] w-[320px] rounded-full bg-accent/10 blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 right-[8%] h-[420px] w-[420px] rounded-full bg-accent/15 blur-[120px]"
      />

      <Container className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-6">
        <div className="max-w-xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 text-[11px] font-medium tracking-[0.32em] text-muted uppercase"
          >
            Come On · Cardápio digital · Salão
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[42px] leading-[0.95] font-semibold tracking-tight text-ink sm:text-6xl lg:text-[76px]"
          >
            O <span className="text-accent">impresso</span>
            <br />
            ficou para trás.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg"
          >
            Modernize seu restaurante com um cardápio interativo, atualizações em
            tempo real e zero custos com reimpressão.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button href="#planos">Experimentar Agora</Button>
            <Button href="#beneficios" variant="secondary">
              Saber Mais
            </Button>
          </motion.div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/[0.06] pt-6 text-[11px] tracking-[0.16em] text-muted uppercase">
            <span>Sem taxa por pedido</span>
            <span>Sem app para o cliente</span>
            <span>QR em alta resolução</span>
          </div>
        </div>

        <div className="relative">
          <FloatingBadges />
          <PhoneScene reduced={reduced} />
        </div>
      </Container>
    </section>
  );
}
