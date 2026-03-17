import { siteConfig } from "@/lib/config";
import ScrollReveal from "./ScrollReveal";

export default function FinalCTA() {
  const { headline, subheadline, cta, ctaLink } = siteConfig.finalCta;

  return (
    <section className="section-dark relative py-28 md:py-36 overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/videos/cta-bg-16x9.mp4"
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
        />
        <div className="absolute inset-0 cta-video-overlay" />
      </div>

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
