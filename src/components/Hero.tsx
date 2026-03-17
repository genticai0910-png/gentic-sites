"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  const { headline, subheadline, cta, ctaLink } = siteConfig.hero;

  return (
    <section className="section-dark relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
          src={siteConfig.hero.videoSrc}
          poster={siteConfig.hero.posterSrc}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
        />
        {/* Fallback gradient when no video */}
        <div className="absolute inset-0 mesh-bg" />
        {/* Overlay gradient */}
        <div className="absolute inset-0 hero-video-overlay" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-electric/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/5 w-72 h-72 rounded-full bg-electric-accent/8 blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-electric/20 bg-electric/5 backdrop-blur-sm opacity-0 animate-[fadeInUp_0.8s_0.2s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        >
          <span className="w-2 h-2 rounded-full bg-electric animate-pulse" />
          <span className="text-sm font-medium font-body text-electric-glow tracking-wide">
            AI Automation Systems
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-display font-800 text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-8 opacity-0 animate-[fadeInUp_1s_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        >
          {headline.split("\n").map((line, i) => (
            <span key={i} className="block">
              {line.includes("$") ? (
                <>
                  <span className="font-mono text-gradient">{line.split(".")[0]}.</span>
                  <span className="text-soft">{line.slice(line.indexOf(".") + 1)}</span>
                </>
              ) : (
                <span className="text-gradient">{line}</span>
              )}
            </span>
          ))}
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted leading-relaxed mb-12 opacity-0 animate-[fadeInUp_1s_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          {subheadline}
        </p>

        {/* CTA */}
        <div className="opacity-0 animate-[fadeInUp_1s_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          <a href={ctaLink} className="btn-primary text-lg px-10 py-5">
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
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-[fadeIn_1s_1.5s_forwards]">
          <div className="w-6 h-10 rounded-full border-2 border-muted/30 flex justify-center pt-2">
            <div className="w-1 h-2.5 rounded-full bg-electric animate-bounce" />
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
