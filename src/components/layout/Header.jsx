import { siteConfig } from "@/config/site";

const NAV_ITEMS = [
  { href: "#about", label: "পরিচিতি" },
  { href: "#vision", label: "ভিশন" },
  { href: "#mission", label: "মিশন" },
  { href: "#how", label: "কীভাবে শুরু করবেন" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-ivory/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3" aria-label={`${siteConfig.name} — হোম`}>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 text-lg font-bold text-gold-light"
          >
            G
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold text-brand-900">GIC</span>
            <span className="block text-xs text-charcoal/70">Global Islamic Center</span>
          </span>
        </a>

        <nav aria-label="প্রধান মেনু" className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-charcoal/80 transition-colors hover:text-brand-700"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a href="#join" className="btn btn-primary min-h-10! px-5! py-2! text-sm">
          আবেদন করুন
        </a>
      </div>
    </header>
  );
}
