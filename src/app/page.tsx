"use client";

import { useEffect } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteLoader } from "@/components/site/site-loader";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { BackToTop } from "@/components/site/back-to-top";
import { SectionDivider } from "@/components/site/section-divider";
import { SectionBlock } from "@/components/site/section-block";
import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { Process } from "@/components/sections/process";
import { Projects } from "@/components/sections/projects";
import { Stats } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { FAQ } from "@/components/sections/faq";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  // Al recargar la página (sin importar la sección en la URL), empezamos
  // siempre arriba y limpiamos cualquier hash residual para que el
  // navegador no intente saltar a una sección intermedia.
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname);
      }
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div id="bloqe-root" className="flex min-h-screen flex-col bg-ink text-foreground transition-colors duration-500">
      <SiteLoader />
      <ScrollProgress />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        {/* Cada sección "encaja" en la construcción al llegar a ella. */}
        <SectionBlock>
          <Services />
        </SectionBlock>
        <SectionDivider variant="dark-to-light" />
        <SectionBlock>
          <Process />
        </SectionBlock>
        <SectionDivider variant="light-to-dark" />
        <SectionBlock>
          <Projects />
        </SectionBlock>
        <SectionBlock>
          <Stats />
        </SectionBlock>
        <SectionDivider variant="dark-to-light" />
        <SectionBlock>
          <Testimonials />
        </SectionBlock>
        <SectionBlock>
          <FAQ />
        </SectionBlock>
        <SectionDivider variant="light-to-dark" />
        <SectionBlock>
          <CtaBanner />
        </SectionBlock>
        <SectionBlock>
          <Contact />
        </SectionBlock>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
