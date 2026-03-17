import { siteConfig } from "@/lib/config";
import ScrollReveal from "./ScrollReveal";

export default function ProblemSolution() {
  const { headline, pain, solution, painTitle, solutionTitle } = siteConfig.problem;

  return (
    <section className="relative py-28 md:py-36 mesh-bg overflow-hidden">
      {/* Decorative line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-electric/20" />

      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-20">
          <h2 className="font-display font-800 text-4xl md:text-5xl lg:text-6xl tracking-tight text-soft">
            {headline}
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Pain */}
          <ScrollReveal delay={1}>
            <div className="relative p-8 md:p-10 rounded-2xl bg-red-50 border border-red-200 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-red-200/50 blur-[60px]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-xs font-display font-700 uppercase tracking-[0.2em] text-red-600">
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
            <div className="relative p-8 md:p-10 rounded-2xl bg-blue-50 border border-blue-200 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-200/50 blur-[60px]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-electric" />
                  <span className="text-xs font-display font-700 uppercase tracking-[0.2em] text-electric">
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
