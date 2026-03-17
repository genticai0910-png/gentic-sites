import Link from "next/link";

export const metadata = {
  title: "Thank You | Gentic AI",
  robots: { index: false, follow: false },
};

export default function ThankYou() {
  return (
    <main className="min-h-screen flex items-center justify-center mesh-bg px-6">
      <div className="max-w-lg text-center">
        {/* Animated check */}
        <div className="mx-auto w-20 h-20 rounded-full bg-electric/10 flex items-center justify-center mb-8 animate-bounce">
          <svg className="w-10 h-10 text-electric" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="font-display font-800 text-4xl md:text-5xl text-soft mb-4 tracking-tight">
          You&apos;re In.
        </h1>

        <p className="text-lg text-muted font-body leading-relaxed mb-8">
          We&apos;ve received your info and will reach out within 24 hours to schedule
          your free automation audit. Keep an eye on your inbox.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-electric-glow hover:text-electric font-display font-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
