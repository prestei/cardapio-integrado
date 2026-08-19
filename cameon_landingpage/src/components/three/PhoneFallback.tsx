export function PhoneFallback() {
  return (
    <div className="grid h-[420px] place-items-center sm:h-[520px] lg:h-[620px]">
      <div className="relative h-[380px] w-[186px] rounded-[32px] border border-white/10 bg-[#121212] p-[7px] shadow-[0_40px_80px_-32px_rgba(0,0,0,0.9)] sm:h-[460px] sm:w-[224px]">
        <div className="absolute top-3 left-1/2 z-10 h-4 w-[72px] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex h-full flex-col overflow-hidden rounded-[26px] bg-[#1e1e1e] px-4 pt-10 pb-4">
          <p className="text-[9px] tracking-[0.22em] text-accent uppercase">
            Come On
          </p>
          <p className="mt-1 font-display text-lg text-ink">Casa Aurora</p>
          <p className="text-[11px] text-muted">Mesa 12 · cardápio ao vivo</p>
          <div className="mt-4 space-y-2.5">
            {["Ancho 300g", "Risotto de funghi", "Branzino na brasa"].map(
              (dish) => (
                <div
                  key={dish}
                  className="flex items-center gap-3 rounded-md border border-white/[0.06] bg-surface px-2 py-2"
                >
                  <span className="h-9 w-9 rounded-sm bg-accent/25" />
                  <span className="text-xs text-ink">{dish}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
