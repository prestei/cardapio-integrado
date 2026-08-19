"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

type Props = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  pulse?: boolean;
  type?: "button" | "submit";
};

export function Button({
  href,
  children,
  variant = "primary",
  className,
  pulse,
  type = "button",
}: Props) {
  const classes = cn(
    "relative inline-flex items-center justify-center overflow-hidden rounded-md px-5 py-3 text-sm font-semibold tracking-tight transition-colors",
    variant === "primary" &&
      "btn-shine bg-accent text-white hover:bg-accent-soft",
    variant === "secondary" &&
      "border border-white/14 bg-transparent text-ink hover:border-accent hover:bg-accent hover:text-white",
    variant === "ghost" && "text-muted hover:text-ink",
    pulse && "hover:animate-[pulse-ring-accent_1.1s_ease-out]",
    className,
  );

  const inner = (
    <motion.span
      className="relative z-10 inline-flex items-center gap-2"
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: variant === "ghost" ? 0 : -1 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
    >
      {children}
    </motion.span>
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {inner}
      </a>
    );
  }

  return (
    <button type={type} className={classes}>
      {inner}
    </button>
  );
}
