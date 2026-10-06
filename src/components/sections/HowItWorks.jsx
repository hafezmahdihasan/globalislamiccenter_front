import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { STUDY_TOPICS } from "@/lib/students/validation";

const STEPS = [
  { title: "আবেদন করুন", text: "নিচের ফর্মে শিক্ষার্থীর তথ্য ও পড়ার বিষয় জানান।" },
  { title: "যোগাযোগ", text: "আমাদের টিম আপনার দেওয়া WhatsApp নম্বরে যোগাযোগ করবে।" },
  { title: "শেখা শুরু", text: "আলোচনা অনুযায়ী অনলাইনে শেখা শুরু করুন।" },
];

const LEARNERS = ["শিশু", "কিশোর-কিশোরী", "প্রাপ্তবয়স্ক", "নারী", "পুরুষ"];

export default function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-title"
      className="section-y scroll-mt-16 bg-ivory-dark/60"
    >
      <div className="container-page">
        <Reveal>
          <SectionHeading
            id="how-title"
            eyebrow="কীভাবে শুরু করবেন"
            title="তিনটি সহজ ধাপে শুরু"
            description="জটিল কোনো প্রক্রিয়া নেই। আবেদন করুন, আমরা যোগাযোগ করব।"
          />
        </Reveal>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 0.08} className="card h-full">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 text-lg font-bold text-gold-light"
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-brand-900">{step.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-charcoal/75">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal className="mt-12 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-bold text-brand-900">কারা শিখতে পারেন</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {LEARNERS.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-800"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-900">পড়ার বিষয়</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {STUDY_TOPICS.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-gold/50 bg-white px-4 py-1.5 text-sm font-medium text-gold-dark"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
