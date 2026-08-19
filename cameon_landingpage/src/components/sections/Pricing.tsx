"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { plans } from "@/content/site";
import { cn } from "@/lib/cn";

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M3.2 8.2 6.4 11.4 12.8 4.6"
        stroke="#D35427"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Pricing() {
  return (
    <section id="planos" className="py-20 lg:py-28">
      <Container>
        <SectionLabel index="04 / 06">Planos & preços</SectionLabel>
        <h2 className="max-w-2xl font-display text-3xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
          Um preço de gráfica. Todo mês, o cardápio certo.
        </h2>
        <p className="mt-4 max-w-xl text-muted">
          Comece pelo Completo — o plano que a maioria das casas usa para sair do
          papel sem taxa por pedido.
        </p>

        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-lg border border-white/[0.08] bg-surface p-7",
                plan.featured && "z-10 border-transparent lg:-my-4 lg:py-9",
              )}
            >
              {plan.featured && (
                <>
                  <div className="pricing-orbit pointer-events-none rounded-lg" aria-hidden />
                  <div className="pointer-events-none absolute inset-px rounded-[7px] bg-surface" />
                </>
              )}
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl">{plan.name}</h3>
                  {plan.featured && "badge" in plan && (
                    <span className="rounded-sm bg-accent px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-white uppercase">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted">{plan.blurb}</p>
                <p className="mt-6 font-display">
                  <span className="text-sm text-muted">R$</span>
                  <span className="ml-1 text-5xl tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted">{plan.period}</span>
                </p>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-ink/90"
                    >
                      <CheckIcon />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <Button
                    href="#faq"
                    variant={plan.featured ? "primary" : "secondary"}
                    pulse={plan.featured}
                    className="w-full"
                  >
                    <motion.span
                      className="inline-flex"
                      whileHover={
                        plan.featured ? { scale: 1.03 } : undefined
                      }
                    >
                      {plan.cta}
                    </motion.span>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
