"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";
import ScrollReveal from "./ScrollReveal";
import ParticleCanvas from "./ParticleCanvas";

export default function FinalCTA() {
  const { headline, subheadline, cta, ctaLink } = siteConfig.finalCta;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <section className="section-dark relative py-32 md:py-40 overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
          src="/videos/cta-bg-16x9.mp4"
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
        />
        <div className="absolute inset-0 mesh-bg" />
        <div className="absolute inset-0 cta-video-overlay" />
      </div>

      {/* Aurora + Particles */}
      <div className="aurora-bg z-[1]" />
      <ParticleCanvas className="z-[2]" particleCount={35} speed={0.2} color="96,165,250" />

      {/* Floating orbs */}
      <div className="absolute top-1/3 left-[15%] w-48 h-48 rounded-full bg-electric/10 blur-[80px] floating-orb pointer-events-none" />
      <div className="absolute bottom-1/4 right-[15%] w-56 h-56 rounded-full bg-blue-400/10 blur-[90px] floating-orb-delayed pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <ScrollReveal>
          <h2 className="font-display font-800 text-4xl md:text-5xl lg:text-6xl tracking-tight text-soft mb-6">
            {headline}
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={1}>
          <p className="text-lg md:text-xl text-muted font-body max-w-2xl mx-auto mb-12 leading-relaxed">
            {subheadline}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={2}>
          <a href={ctaLink} className="btn-primary text-lg px-12 py-5">
            {cta}
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
