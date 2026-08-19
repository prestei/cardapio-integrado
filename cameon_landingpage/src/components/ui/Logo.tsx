export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a href="#topo" className="group inline-flex items-center gap-2.5">
      <span className="relative grid h-7 w-7 place-items-center border border-accent/50 bg-accent/10">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="absolute inset-[3px] border border-accent/25" />
      </span>
      <span className="font-display text-[15px] font-semibold tracking-[0.18em] text-ink uppercase">
        Come On
        {!compact && (
          <span className="mt-0.5 block text-[9px] tracking-[0.28em] text-muted">
            Cardápio digital
          </span>
        )}
      </span>
    </a>
  );
}
