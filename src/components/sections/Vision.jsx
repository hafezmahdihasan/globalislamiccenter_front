import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

// NOTE: copy below is a polished draft. Replace with the client's approved
// vision statement when available.
export default function Vision() {
  return (
    <section
      id="vision"
      aria-labelledby="vision-title"
      className="section-y scroll-mt-16 bg-brand-50"
    >
      <div className="container-page">
        <Reveal>
          <SectionHeading id="vision-title" eyebrow="আমাদের ভিশন" title="কুরআনের আলোয় আলোকিত সমাজ" />
          <p className="mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-charcoal/80 sm:text-xl">
            আমরা এমন একটি সমাজের স্বপ্ন দেখি, যেখানে প্রত্যেক মানুষ শুদ্ধভাবে কুরআন শিখতে পারে এবং
            নৈতিকতার ভিত্তিতে নিজের জীবন গড়ে তোলে।
          </p>
        </Reveal>
      </div>
    </section>
  );
}
