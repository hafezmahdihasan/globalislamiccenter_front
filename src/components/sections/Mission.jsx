import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { CheckIcon } from "@/components/ui/Icons";

// NOTE: copy below is a polished draft. Replace with the client's approved
// mission statement when available.
const MISSION_POINTS = [
  "সহজ, সুশৃঙ্খল ও শিক্ষার্থীবান্ধব পদ্ধতিতে কুরআন শেখানো।",
  "তাজবীদ ও মাখরাজসহ শুদ্ধ তিলাওয়াতের শক্ত ভিত্তি তৈরি করা।",
  "ইসলামী আদব ও নৈতিক মূল্যবোধ চর্চায় উৎসাহিত করা।",
  "অনলাইনে বিশ্বজুড়ে মুসলিম উম্মাহ'র কাছে কুরআনের শিক্ষা পৌঁছে দেওয়া।",
  "শিশুদের জন্য কুরআন শিক্ষার একটি নিরাপদ, সৃজনশীল ও আনন্দময় পরিবেশ তৈরি করা।",
];

export default function Mission() {
  return (
    <section
      id="mission"
      aria-labelledby="mission-title"
      className="section-y scroll-mt-16"
    >
      <div className="container-page">
        <Reveal>
          <SectionHeading
            id="mission-title"
            eyebrow="আমাদের মিশন"
            title="আমরা যা করতে চাই"
          />
        </Reveal>

        <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {MISSION_POINTS.map((point, index) => (
            <li key={point}>
              <Reveal
                delay={index * 0.08}
                className="card flex h-full items-start gap-4"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-800 text-gold-light"
                >
                  <CheckIcon className="h-5 w-5" />
                </span>
                <p className="text-base leading-relaxed text-charcoal/85">
                  {point}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
