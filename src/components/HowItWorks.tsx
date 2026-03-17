import { siteConfig } from "@/lib/config";
import ScrollReveal from "./ScrollReveal";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 md:py-36 mesh-bg overflow-hidden">
      {/* Decorative vertical line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-electric/10 to-transparent" />

      <div className="max-w-5xl mx-auto px-6">
        <ScrollReveal className="text-center mb-24">
          <p className="text-xs font-display font-700 uppercase tracking-[0.25em] text-electric mb-4">
            The Process
          </p>
          <h2 className="font-display font-800 text-4xl md:text-5xl lg:text-6xl tracking-tight text-soft">
            Audit. Build. Scale.
          </h2>
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
                    <div className="absolute -inset-4 bg-electric/5 rounded-full blur-2xl" />
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
