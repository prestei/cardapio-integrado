"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { nav } from "@/content/site";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-white/[0.06] bg-[#121212]/72 backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <Container className="flex h-[72px] items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] tracking-wide text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Button href="#planos" className="px-4 py-2.5 text-[13px]">
            Experimentar Agora
          </Button>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center border border-white/10 lg:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Menu</span>
          <span className="flex w-4 flex-col gap-1.5">
            <span className="h-px w-full bg-ink" />
            <span className="h-px w-full bg-ink" />
          </span>
        </button>
      </Container>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="overflow-hidden border-b border-white/[0.06] bg-[#121212]/95 lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-5 py-4">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm text-muted hover:text-ink"
                >
                  {item.label}
                </a>
              ))}
              <Button href="#planos" className="mt-3">
                Experimentar Agora
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
