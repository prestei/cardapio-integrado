import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className }: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
