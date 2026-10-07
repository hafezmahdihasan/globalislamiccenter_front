"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { siteConfig } from "@/config/site";

const NAV_ITEMS = [
  { href: "#about", label: "পরিচিতি" },
  { href: "#vision", label: "ভিশন" },
  { href: "#mission", label: "মিশন" },
  { href: "#how", label: "কীভাবে শুরু করবেন" },
];

function MenuIcon({ open }) {
  return (
    <span className="relative block h-5 w-5" aria-hidden="true">
      <span
        className={`absolute left-0 top-1 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
          open ? "top-2 rotate-45" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-2.5 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
          open ? "opacity-0" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-4 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
          open ? "top-2 -rotate-45" : ""
        }`}
      />
    </span>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-brand-100/80 bg-ivory/90 backdrop-blur-xl supports-backdrop-filter:bg-ivory/75">
        <div className="container-page">
          <div className="flex h-18 items-center justify-between gap-4">
            {/* Brand */}
            <a
              href="#top"
              onClick={closeMobileMenu}
              className="group flex min-w-0 items-center gap-3"
              aria-label={`${siteConfig.name} — হোম`}
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-900/5 ring-1 ring-brand-900/10 transition-all duration-300 group-hover:bg-brand-900/10 group-hover:ring-brand-900/20">
                <Image
                  src="/GIC.svg"
                  alt="GIC — Global Islamic Center"
                  width={44}
                  height={44}
                  priority
                  className="h-10 w-10 object-contain"
                />
              </span>

              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[15px] font-extrabold tracking-tight text-brand-900 sm:text-base">
                  GIC
                </span>

                <span className="block truncate text-[10px] font-medium tracking-wide text-charcoal/65 sm:text-xs">
                  Global Islamic Center
                </span>
              </span>
            </a>

            {/* Desktop navigation */}
            <nav
              aria-label="প্রধান মেনু"
              className="hidden items-center gap-7 md:flex"
            >
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="group relative py-2 text-sm font-semibold text-charcoal/75 transition-colors duration-300 hover:text-brand-800"
                >
                  {item.label}

                  <span className="absolute inset-x-0 -bottom-0.5 mx-auto h-0.5 w-0 rounded-full bg-gold-light transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href="#student-registration"
                className="btn btn-primary hidden min-h-10! px-5! py-2! text-sm sm:inline-flex"
              >
                ভর্তি হতে যোগাযোগ করুন
              </a>

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 bg-white/60 text-brand-900 transition-all duration-300 hover:border-brand-200 hover:bg-brand-900/5 md:hidden"
                aria-label={mobileOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
              >
                <MenuIcon open={mobileOpen} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              id="mobile-navigation"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                duration: 0.25,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="overflow-hidden border-t border-brand-100/70 bg-ivory/95 backdrop-blur-xl md:hidden"
            >
              <nav
                aria-label="মোবাইল প্রধান মেনু"
                className="container-page py-4"
              >
                <div className="space-y-1">
                  {NAV_ITEMS.map((item, index) => (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: index * 0.04,
                        duration: 0.25,
                      }}
                      className="flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold text-charcoal/80 transition-colors hover:bg-brand-900/5 hover:text-brand-900"
                    >
                      {item.label}
                    </motion.a>
                  ))}
                </div>

                <a
                  href="#student-registration"
                  onClick={closeMobileMenu}
                  className="btn btn-primary mt-3 flex w-full"
                >
                  ভর্তি হতে যোগাযোগ করুন
                </a>
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>
    </>
  );
}
