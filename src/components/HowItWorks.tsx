"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";
import ScrollReveal from "./ScrollReveal";

export default function HowItWorks() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <section id="how-it-works" className="relative py-28 md:py-36 mesh-bg overflow-hidden">
      {/* Decorative vertical line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-electric/10 to-transparent" />

      {/* Floating orb */}
      <div className="absolute top-1/3 right-[5%] w-80 h-80 rounded-full bg-electric/5 blur-[120px] floating-orb pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <p className="text-xs font-display font-700 uppercase tracking-[0.25em] text-electric mb-4">
            The Process
          </p>
          <h2 className="font-display font-800 text-4xl md:text-5xl lg:text-6xl tracking-tight text-soft">
            Audit. Build. Scale.
          </h2>
        </ScrollReveal>

        {/* Video showcase */}
        <ScrollReveal className="mb-20">
          <div className="max-w-3xl mx-auto video-frame">
            <video
              ref={videoRef}
              className={`w-full aspect-video object-cover transition-opacity duration-1000 ${
                videoLoaded ? "opacity-100" : "opacity-0"
              }`}
              src="/videos/hero-command-center-16x9.mp4"
              poster="/videos/hero-command-center-poster.jpg"
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedData={() => setVideoLoaded(true)}
            />
          </div>
        </ScrollReveal>

        <div className="relative space-y-20 md:space-y-28">
          {siteConfig.howItWorks.map((step, i) => {
            const isEven = i % 2 === 1;
            return (
              <ScrollReveal key={step.step} delay={i + 1}>
                <div
                  className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Number */}
                  <div className="shrink-0 relative">
                    <div className="step-number">0{step.step}</div>
                    <div className="absolute -inset-6 bg-electric/5 rounded-full blur-3xl ambient-glow" />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${isEven ? "md:text-right" : ""}`}>
                    <h3 className="font-display font-800 text-3xl md:text-4xl text-soft mb-4 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-lg text-muted leading-relaxed font-body max-w-lg">
                      {step.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
