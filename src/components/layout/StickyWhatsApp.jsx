import { siteConfig } from "@/config/site";
import { WhatsAppIcon } from "@/components/ui/Icons";

export default function StickyWhatsApp() {
  if (!siteConfig.whatsappUrl) return null;

  return (
    <a
      href={siteConfig.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp-এ GIC-এর সাথে যোগাযোগ করুন (নতুন ট্যাবে খুলবে)"
      className="fixed bottom-4 right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#128C7E] px-5 py-3 text-base font-semibold text-white shadow-lg transition-colors hover:bg-[#0f7b6d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#128C7E] sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon className="h-5 w-5" />
      <span>WhatsApp</span>
    </a>
  );
}
