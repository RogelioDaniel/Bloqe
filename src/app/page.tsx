"use client";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
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
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <BuilderStudio />
        <Services />
        <Process />
        <Projects />
        <Pricing />
        <Stats />
        <Testimonials />
        <CommunityGallery />
        <FAQ />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  );
}
