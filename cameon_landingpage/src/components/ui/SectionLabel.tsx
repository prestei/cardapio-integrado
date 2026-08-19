import { cn } from "@/lib/cn";

type Props = {
  index?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionLabel({ index, children, className }: Props) {
  return (
    <div
      className={cn(
        "mb-5 flex items-center gap-3 text-[11px] font-medium tracking-[0.28em] text-muted uppercase",
        className,
      )}
    >
      {index ? (
        <span className="text-accent">{index}</span>
      ) : (
        <span className="h-px w-8 bg-accent/70" />
      )}
      <span>{children}</span>
    </div>
  );
}
