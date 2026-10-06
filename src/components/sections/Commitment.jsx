import Reveal from "@/components/ui/Reveal";

export default function Commitment() {
  return (
    <section
      id="commitment"
      aria-labelledby="commitment-title"
      className="section-y scroll-mt-16 bg-brand-900 text-ivory"
    >
      <div className="container-page">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-wide text-gold-light">আমাদের অঙ্গীকার</p>
          <h2 id="commitment-title" className="sr-only">
            আমাদের অঙ্গীকার
          </h2>
          <div aria-hidden="true" className="mx-auto mt-4 h-px w-16 bg-gold" />
          <blockquote className="mt-6 text-2xl font-bold leading-snug sm:text-4xl sm:leading-snug">
            “কুরআনের আলোয় জীবন গঠন, নৈতিকতায় সমাজ পরিবর্তন।”
          </blockquote>
          <div aria-hidden="true" className="mx-auto mt-6 h-px w-16 bg-gold" />
        </Reveal>
      </div>
    </section>
  );
}
