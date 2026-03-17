"use client";

import { useState, type FormEvent } from "react";
import { siteConfig } from "@/lib/config";
import ScrollReveal from "./ScrollReveal";

const businessTypes = [
  "Real Estate Investing",
  "Real Estate Brokerage",
  "Home Services",
  "Medical/Dental Practice",
  "Legal Services",
  "Insurance Agency",
  "Financial Services",
  "Other",
];

const revenueRanges = [
  "Under $250K",
  "$250K – $500K",
  "$500K – $1M",
  "$1M – $5M",
  "$5M+",
];

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      businessType: (form.elements.namedItem("businessType") as HTMLSelectElement).value,
      revenue: (form.elements.namedItem("revenue") as HTMLSelectElement).value,
    };

    try {
      // HubSpot form submission
      if (siteConfig.hubspot.formId) {
        await fetch(
          `https://api.hsforms.com/submissions/v3/integration/submit/${siteConfig.hubspot.portalId}/${siteConfig.hubspot.formId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: [
                { name: "firstname", value: data.name.split(" ")[0] },
                { name: "lastname", value: data.name.split(" ").slice(1).join(" ") },
                { name: "email", value: data.email },
                { name: "phone", value: data.phone },
                { name: "company", value: data.businessType },
                { name: "annualrevenue", value: data.revenue },
              ],
            }),
          }
        );
      }

      // Telegram notification via n8n webhook
      if (siteConfig.webhooks.telegramNotify) {
        await fetch(siteConfig.webhooks.telegramNotify, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "gentic-landing",
            ...data,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {}); // Non-blocking
      }

      setStatus("success");
      window.location.href = "/thank-you";
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="relative py-28 md:py-36 mesh-bg">
      <div className="max-w-3xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <p className="text-xs font-display font-700 uppercase tracking-[0.25em] text-electric mb-4">
            Get Started
          </p>
          <h2 className="font-display font-800 text-4xl md:text-5xl tracking-tight text-soft mb-4">
            {siteConfig.contact.headline}
          </h2>
          <p className="text-lg text-muted font-body">
            {siteConfig.contact.subheadline}
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <form
            onSubmit={handleSubmit}
            className="relative p-8 md:p-12 rounded-2xl mesh-bg-card border border-electric/10 glow-blue"
          >
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-display font-600 text-soft mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3.5 rounded-lg bg-navy-light border border-white/10 text-soft font-body placeholder:text-dim focus:outline-none focus:border-electric/40 focus:ring-1 focus:ring-electric/20 transition-all"
                  placeholder="Gabe Martinez"
                />
              </div>

              {/* Email + Phone */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-display font-600 text-soft mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3.5 rounded-lg bg-navy-light border border-white/10 text-soft font-body placeholder:text-dim focus:outline-none focus:border-electric/40 focus:ring-1 focus:ring-electric/20 transition-all"
                    placeholder="gabe@company.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-display font-600 text-soft mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-3.5 rounded-lg bg-navy-light border border-white/10 text-soft font-body placeholder:text-dim focus:outline-none focus:border-electric/40 focus:ring-1 focus:ring-electric/20 transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Business Type + Revenue */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="businessType" className="block text-sm font-display font-600 text-soft mb-2">
                    Business Type
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    required
                    className="w-full px-4 py-3.5 rounded-lg bg-navy-light border border-white/10 text-soft font-body focus:outline-none focus:border-electric/40 focus:ring-1 focus:ring-electric/20 transition-all appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled className="text-dim">
                      Select your industry
                    </option>
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="revenue" className="block text-sm font-display font-600 text-soft mb-2">
                    Annual Revenue
                  </label>
                  <select
                    id="revenue"
                    name="revenue"
                    required
                    className="w-full px-4 py-3.5 rounded-lg bg-navy-light border border-white/10 text-soft font-body focus:outline-none focus:border-electric/40 focus:ring-1 focus:ring-electric/20 transition-all appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled className="text-dim">
                      Select range
                    </option>
                    {revenueRanges.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="btn-primary w-full text-lg py-5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "submitting" ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Book a Free Audit"
                )}
              </button>

              {status === "error" && (
                <p className="text-center text-sm text-red-400 font-body">
                  Something went wrong. Please try again or email us directly.
                </p>
              )}
            </div>

            {/* Trust line */}
            <p className="text-center text-xs text-dim mt-6 font-body">
              No spam. No commitment. Just a clear picture of what AI can do for your business.
            </p>
          </form>
        </ScrollReveal>
      </div>
    </section>
  );
}
