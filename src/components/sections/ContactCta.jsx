import Reveal from "@/components/ui/Reveal";
import { MailIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { siteConfig } from "@/config/site";

export default function ContactCta() {
  if (!siteConfig.whatsappUrl && !siteConfig.email) return null;

  return (
    <section aria-labelledby="contact-title" className="section-y bg-ivory-dark/60">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="contact-title" className="text-2xl font-bold text-brand-900 sm:text-3xl">
            আরও কিছু জানতে চান?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-charcoal/75 sm:text-lg">
            ফর্ম পূরণের আগে কোনো প্রশ্ন থাকলে সরাসরি আমাদের লিখুন।
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {siteConfig.whatsappUrl ? (
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp-এ লিখুন
              </a>
            ) : null}
            {siteConfig.email ? (
              <a href={`mailto:${siteConfig.email}`} className="btn btn-outline">
                <MailIcon className="h-5 w-5" />
                ইমেইল করুন
              </a>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
