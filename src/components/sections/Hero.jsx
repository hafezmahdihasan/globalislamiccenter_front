import Reveal from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { siteConfig } from "@/config/site";

const CHIPS = [
  "অনলাইন ক্লাস",
  "শিশু থেকে প্রাপ্তবয়স্ক",
  "নারী-পুরুষ সবার জন্য",
  "বাংলা ও English",
];

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-brand-900 text-ivory"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-size-[24px_24px]"
      />

      <div className="container-page py-16 sm:py-24 lg:py-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p
            lang="ar"
            dir="rtl"
            className="text-xl text-gold-light sm:text-2xl"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          <p className="mt-6 text-sm font-semibold tracking-wide text-gold-light">
            GIC — Global Islamic Center
          </p>

          <h1
            id="hero-title"
            className="mt-3 text-3xl font-bold leading-tight sm:text-5xl sm:leading-tight"
          >
            কুরআনের আলোয় জীবন গঠন
          </h1>

          <p className="mt-5 text-base leading-relaxed text-ivory/85 sm:text-lg">
            বিশ্বের যেকোনো প্রান্ত থেকে অনলাইনে শুদ্ধ কুরআন তিলাওয়াত, তাজবীদ,
            মাখরাজ ও ইসলামী আদব শিখুন।
          </p>
          <p className="mt-2 text-sm text-ivory/65 sm:text-base">
            Online Quran &amp; Islamic education for learners around the world —
            in Bangla and English.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <a href="#student-registration" className="btn btn-gold">
              ভর্তির আবেদন করুন
            </a>
            {siteConfig.whatsappUrl ? (
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-light"
              >
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp-এ কথা বলুন
              </a>
            ) : null}
          </div>

          <ul className="mt-10 flex flex-wrap justify-center gap-2">
            {CHIPS.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-ivory/25 px-4 py-1.5 text-sm text-ivory/90"
              >
                {chip}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
