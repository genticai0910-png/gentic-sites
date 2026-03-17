import { siteConfig } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="section-dark relative py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.25)]">
              <span className="font-display font-800 text-sm text-white">G</span>
            </div>
            <span className="font-display font-700 text-lg text-soft tracking-tight">
              {siteConfig.name}
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-8">
            {siteConfig.footer.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-dim hover:text-electric-glow font-body transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-dim/60 font-body">
            {siteConfig.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
