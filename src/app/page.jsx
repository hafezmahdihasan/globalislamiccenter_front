import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StickyWhatsApp from "@/components/layout/StickyWhatsApp";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Vision from "@/components/sections/Vision";
import Mission from "@/components/sections/Mission";
import Commitment from "@/components/sections/Commitment";
import HowItWorks from "@/components/sections/HowItWorks";
import ContactCta from "@/components/sections/ContactCta";
import StudentForm from "@/components/student/StudentForm";
import JsonLd from "@/components/seo/JsonLd";

// Server Component: only the form and the small Reveal wrapper ship client JS.
export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Vision />
        <Mission />
        <Commitment />
        <HowItWorks />
        <StudentForm />
        <ContactCta />
      </main>
      <Footer />
      <StickyWhatsApp />
      <JsonLd />
    </>
  );
}
