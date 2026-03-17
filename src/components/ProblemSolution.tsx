"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";
import ScrollReveal from "./ScrollReveal";

export default function ProblemSolution() {
  const { headline, pain, solution, painTitle, solutionTitle } = siteConfig.problem;
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
          src="/videos/chaos-to-clarity-16x9.mp4"
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
        />
        <div className="absolute inset-0 mesh-bg" />
        <div className="absolute inset-0 problem-video-overlay" />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-[10%] w-64 h-64 rounded-full bg-red-500/10 blur-[100px] floating-orb pointer-events-none" />
      <div className="absolute bottom-1/4 right-[10%] w-64 h-64 rounded-full bg-electric/10 blur-[100px] floating-orb-delayed pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-20">
          <h2 className="font-display font-800 text-4xl md:text-5xl lg:text-6xl tracking-tight text-soft">
            {headline}
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Pain */}
          <ScrollReveal delay={1}>
            <div className="relative p-8 md:p-10 rounded-2xl glass-card h-full">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-red-500/15 blur-[60px]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.5)]" />
                  <span className="text-xs font-display font-700 uppercase tracking-[0.2em] text-red-400">
                    {painTitle}
                  </span>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed text-muted font-body">
                  {pain}
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Solution */}
          <ScrollReveal delay={2}>
            <div className="relative p-8 md:p-10 rounded-2xl glass-card h-full">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-electric/15 blur-[60px]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-electric shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                  <span className="text-xs font-display font-700 uppercase tracking-[0.2em] text-electric-glow">
                    {solutionTitle}
                  </span>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed text-soft font-body">
                  {solution}
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
