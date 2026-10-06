import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const HIGHLIGHTS = [
  { title: "শুদ্ধ তিলাওয়াত", text: "সঠিক উচ্চারণে কুরআন পড়ার নিয়মিত অনুশীলন।" },
  { title: "তাজবীদ", text: "তাজবীদের নিয়মগুলো সহজভাবে বোঝা ও প্রয়োগ করা।" },
  { title: "মাখরাজ", text: "প্রতিটি হরফ সঠিক স্থান থেকে উচ্চারণ করতে শেখা।" },
  { title: "ইসলামী আদব", text: "দৈনন্দিন জীবনে আদব-আখলাক চর্চার অভ্যাস গড়া।" },
];

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="section-y scroll-mt-16">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <Reveal>
            <SectionHeading
              id="about-title"
              eyebrow="GIC সম্পর্কে"
              title="কুরআন ও ইসলামী শিক্ষার একটি কেন্দ্র"
              align="left"
            />
            <div className="mt-6 space-y-4 text-base leading-relaxed text-charcoal/80 sm:text-lg">
              <p>
                GIC — Global Islamic Center একটি কুরআন ও ইসলামী শিক্ষা কেন্দ্র। এখানে শিশু থেকে
                প্রাপ্তবয়স্ক, নারী-পুরুষ সবাই শিখতে পারেন।
              </p>
              <p>
                আমাদের মূল লক্ষ্য শুদ্ধভাবে কুরআন তিলাওয়াত, তাজবীদ, মাখরাজ ও ইসলামী আদব শেখানো — যাতে
                কুরআনের দিকনির্দেশনা ও নৈতিক মূল্যবোধের আলোয় জীবন গড়ে ওঠে।
              </p>
              <p>
                আমাদের শিক্ষা কার্যক্রম মূলত অনলাইনে, তাই বিশ্বের যেকোনো দেশ থেকে যুক্ত হওয়া যায়।
              </p>
            </div>
          </Reveal>

          <ul className="grid gap-4 sm:grid-cols-2">
            {HIGHLIGHTS.map((item, index) => (
              <li key={item.title}>
                <Reveal delay={index * 0.08} className="card h-full">
                  <h3 className="text-lg font-bold text-brand-900">{item.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-charcoal/75">{item.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
