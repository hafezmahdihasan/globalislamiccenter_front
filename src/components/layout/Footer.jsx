import { siteConfig } from "@/config/site";
import { FacebookIcon, MailIcon, WhatsAppIcon } from "@/components/ui/Icons";

export default function Footer() {
  const year = new Date().getFullYear();

  const links = [
    siteConfig.facebookUrl && {
      href: siteConfig.facebookUrl,
      label: "Facebook",
      Icon: FacebookIcon,
      external: true,
    },
    siteConfig.whatsappUrl && {
      href: siteConfig.whatsappUrl,
      label: "WhatsApp",
      Icon: WhatsAppIcon,
      external: true,
    },
    siteConfig.email && {
      href: `mailto:${siteConfig.email}`,
      label: siteConfig.email,
      Icon: MailIcon,
      external: false,
    },
  ].filter(Boolean);

  return (
    <footer className="bg-charcoal pb-28 pt-14 text-ivory/80 sm:pb-16">
      <div className="container-page">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <p className="text-xl font-bold text-ivory">GIC — Global Islamic Center</p>
            <p className="mt-3 text-base leading-relaxed">
              “কুরআনের আলোয় জীবন গঠন, নৈতিকতায় সমাজ পরিবর্তন।”
            </p>
          </div>

          {links.length > 0 ? (
            <nav aria-label="যোগাযোগ">
              <p className="text-sm font-semibold tracking-wide text-gold-light">যোগাযোগ</p>
              <ul className="mt-4 space-y-3">
                {links.map(({ href, label, Icon, external }) => (
                  <li key={label}>
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="inline-flex items-center gap-3 text-base transition-colors hover:text-gold-light"
                    >
                      <Icon className="h-5 w-5 text-gold-light" />
                      <span className="break-all">{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>

        <p className="mt-12 border-t border-ivory/10 pt-6 text-sm text-ivory/60">
          © {year} GIC — Global Islamic Center. সর্বস্বত্ব সংরক্ষিত।
        </p>
      </div>
    </footer>
  );
}
