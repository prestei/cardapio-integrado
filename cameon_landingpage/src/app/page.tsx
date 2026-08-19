import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/sections/Hero";
import { Benefits } from "@/components/sections/Benefits";
import { Comparison } from "@/components/sections/Comparison";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Pricing } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Benefits />
        <Comparison />
        <HowItWorks />
        <Pricing />
        <FAQ />
      </main>
      <SiteFooter />
    </>
  );
}
