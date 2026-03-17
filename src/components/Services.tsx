import { type ReactNode } from "react";
import { siteConfig } from "@/lib/config";
import ScrollReveal from "./ScrollReveal";

const icons: Record<string, ReactNode> = {
  voice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
  score: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  pipeline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 7.125h3M7.125 10.5v3M16.875 10.5v3" />
    </svg>
  ),
};

export default function Services() {
  return (
    <section id="services" className="relative py-28 md:py-36">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-20">
          <p className="text-xs font-display font-700 uppercase tracking-[0.25em] text-electric mb-4">
            What We Build
          </p>
          <h2 className="font-display font-800 text-4xl md:text-5xl lg:text-6xl tracking-tight text-soft">
            Three Pillars of Scale
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {siteConfig.services.map((service) => (
            <ScrollReveal key={service.title}>
              <div className="group relative p-8 md:p-10 rounded-2xl mesh-bg-card card-hover h-full flex flex-col">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-electric/10 flex items-center justify-center text-electric mb-6 group-hover:bg-electric/15 transition-colors">
                  {icons[service.icon]}
                </div>

                {/* Content */}
                <h3 className="font-display font-700 text-xl md:text-2xl text-soft mb-4 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-muted leading-relaxed font-body flex-1">
                  {service.description}
                </p>

                {/* Bottom accent */}
                <div className="mt-8 pt-6 border-t border-black/5">
                  <span className="text-sm font-display font-600 text-electric-glow group-hover:text-electric transition-colors flex items-center gap-2">
                    Learn more
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
