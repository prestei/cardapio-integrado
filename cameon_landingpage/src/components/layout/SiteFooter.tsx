import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { nav } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <Container className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">
            Cardápio digital para casas que ainda respeitam o serviço — e já não
            respeitam o custo do papel.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>
      </Container>
      <Container className="mt-10 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-[11px] tracking-wide text-muted uppercase sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} Come On</span>
        <span>Feito para o salão — não para a gráfica</span>
      </Container>
    </footer>
  );
}
