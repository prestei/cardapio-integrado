"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { faqs } from "@/content/site";

export function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="py-20 lg:py-28">
      <Container className="grid gap-10 lg:grid-cols-[0.4fr_0.6fr] lg:gap-16">
        <div>
          <SectionLabel index="05 / 06">Dúvidas frequentes</SectionLabel>
          <h2 className="font-display text-3xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
            Antes de mandar o papel para o arquivo.
          </h2>
          <p className="mt-4 max-w-sm text-muted">
            Quatro perguntas que chegam de dono, gerente e maître — respondidas
            sem letra miúda.
          </p>
        </div>

        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {faqs.map((item, index) => {
            const active = open === index;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(active ? -1 : index)}
                  className="flex w-full items-start justify-between gap-6 py-5 text-left"
                  aria-expanded={active}
                >
                  <span className="font-display text-lg tracking-tight sm:text-xl">
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: active ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    className="mt-1 grid h-7 w-7 shrink-0 place-items-center border border-white/12 text-accent"
                  >
                    <svg viewBox="0 0 12 12" className="h-3 w-3">
                      <path
                        d="M6 1v10M1 6h10"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="square"
                      />
                    </svg>
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-sm leading-relaxed text-muted">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
