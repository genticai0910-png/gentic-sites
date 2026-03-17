import { siteConfig } from "@/lib/config";
import ScrollReveal from "./ScrollReveal";

export default function FinalCTA() {
  const { headline, subheadline, cta, ctaLink } = siteConfig.finalCta;

  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-electric/8 blur-[150px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
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

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 divider-glow" />
    </section>
  );
}
