import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Come On — Cardápio digital para restaurantes",
  description:
    "Modernize seu restaurante com um cardápio interativo, atualizações em tempo real e zero custos com reimpressão.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${syne.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="relative min-h-full overflow-x-hidden bg-bg font-sans text-ink">
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
