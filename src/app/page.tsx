"use client";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { BackToTop } from "@/components/site/back-to-top";
import { SectionDivider } from "@/components/site/section-divider";
import { Hero } from "@/components/sections/hero";
import { Marquee } from "@/components/sections/marquee";
import { BuilderStudio } from "@/components/sections/builder-studio";
import { Services } from "@/components/sections/services";
import { Process } from "@/components/sections/process";
import { Projects } from "@/components/sections/projects";
import { Pricing } from "@/components/sections/pricing";
import { Stats } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { CommunityGallery } from "@/components/sections/community-gallery";
import { FAQ } from "@/components/sections/faq";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <div id="bloqe-root" className="flex min-h-screen flex-col bg-ink text-foreground transition-colors duration-500">
      <ScrollProgress />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <BuilderStudio />
        <Services />
        <SectionDivider variant="dark-to-light" />
        <Process />
        <SectionDivider variant="light-to-dark" />
        <Projects />
        <Pricing />
        <Stats />
        <SectionDivider variant="dark-to-light" />
        <Testimonials />
        <SectionDivider variant="light-to-dark" />
        <CommunityGallery />
        <FAQ />
        <CtaBanner />
        <Contact />
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
