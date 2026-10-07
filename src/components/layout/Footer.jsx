"use client";
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { FacebookIcon, MailIcon, WhatsAppIcon } from "@/components/ui/Icons";

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function ArrowUpRightIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function ChevronUpIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

function SparkleIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <path d="m12 2 1.65 6.35L20 10l-6.35 1.65L12 18l-1.65-6.35L4 10l6.35-1.65L12 2Z" />
      <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
    </svg>
  );
}

function CodeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="m8 9-4 3 4 3" />
      <path d="m16 9 4 3-4 3" />
      <path d="m14 5-4 14" />
    </svg>
  );
}

function WaveDivider() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="overflow-hidden"
      style={{
        lineHeight: 0,
        marginBottom: -2,
      }}
      aria-hidden="true"
    >
      <motion.div
        className="flex w-[200%]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: ["0%", "-50%"],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 16,
                repeat: Infinity,
                ease: "linear",
              }
        }
      >
        <svg
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-15 w-1/2 shrink-0"
        >
          <path
            d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z"
            fill="#0a1a0a"
          />
        </svg>

        <svg
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-15 w-1/2 shrink-0"
        >
          <path
            d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z"
            fill="#0a1a0a"
          />
        </svg>
      </motion.div>
    </div>
  );
}

function PieteniumCredit() {
  return (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-7"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">
            <SparkleIcon className="h-3.5 w-3.5" />
            Digital Partner
          </div>

          <CodeIcon className="h-5 w-5 text-white/30" />
        </div>

        <a
          href="https://pietenium.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2"
        >
          <span className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Pietenium
          </span>

          <motion.span
            initial={{ opacity: 0, x: -4 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="text-emerald-300"
          >
            <ArrowUpRightIcon className="h-5 w-5" />
          </motion.span>
        </a>

        <p className="mt-3 max-w-xl text-sm leading-7 text-white/60 sm:text-[15px]">
          Custom software development agency building{" "}
          <span className="font-semibold text-white/80">
            100% hand-coded software
          </span>{" "}
          — without CMS platforms, website builders, or low-code/no-code
          platforms.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "Web Applications",
            "Dashboards",
            "Admin Panels",
            "AI-Integrated Systems",
          ].map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-white/55"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/30">
              Engineering approach
            </p>
            <p className="mt-1 text-sm text-white/60">
              Monolith or microservice — selected for the project&apos;s actual
              scale and complexity.
            </p>
          </div>

          <a
            href="https://pietenium.vercel.app/contact-us"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Start a project
            <ArrowUpRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const shouldReduceMotion = useReducedMotion();

  const links = [
    siteConfig.facebookUrl && {
      href: siteConfig.facebookUrl,
      label: "Facebook",
      Icon: FacebookIcon,
      external: true,
    },
    siteConfig.whatsappUrl && {
      href: siteConfig.whatsappUrl,
      label: "WhatsApp",
      Icon: WhatsAppIcon,
      external: true,
    },
    siteConfig.email && {
      href: `mailto:${siteConfig.email}`,
      label: siteConfig.email,
      Icon: MailIcon,
      external: false,
    },
  ].filter(Boolean);

  const navigation = [
    {
      label: "About",
      href: "#about",
    },
    {
      label: "Vision",
      href: "#vision",
    },
    {
      label: "Mission",
      href: "#mission",
    },
    {
      label: "Commitment",
      href: "#commitment",
    },
    {
      label: "Admission",
      href: "#student-registration",
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative isolate overflow-hidden bg-[#061006] text-white">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, 70, -40, 0],
                  y: [0, -40, 30, 0],
                  scale: [1, 1.08, 0.96, 1],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 18,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
          className="absolute -left-28 top-20 h-72 w-72 rounded-full bg-emerald-500/9 blur-[100px]"
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, -50, 45, 0],
                  y: [0, 40, -25, 0],
                  scale: [1, 0.94, 1.08, 1],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 22,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
          className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-amber-300/5.5 blur-[120px]"
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.045),transparent_42%)]" />
      </div>

      <div className="relative">
        <WaveDivider />
      </div>

      <div className="container-page relative">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.15,
          }}
          className="pb-12 pt-8 sm:pb-16 sm:pt-12"
        >
          {/* Main footer grid */}
          <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr_0.9fr]">
            {/* GIC brand */}
            <motion.div variants={fadeUp} className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/10 bg-emerald-300/4.5 px-3 py-1.5 text-xs font-medium text-emerald-200/75">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                Online Quran & Islamic Education
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                GIC — Global Islamic Center
              </h2>

              <p className="mt-4 max-w-lg text-base leading-8 text-white/60">
                কুরআনের শিক্ষা ও ইসলামী জ্ঞানের মাধ্যমে সুন্দর, আদর্শ ও নৈতিক
                জীবন গঠনের একটি অনলাইন শিক্ষাকেন্দ্র।
              </p>

              <div className="mt-6 border-l-2 border-emerald-400/40 pl-4">
                <p className="text-sm font-medium leading-7 text-white/75 sm:text-[15px]">
                  “কুরআনের আলোয় জীবন গঠন, নৈতিকতায় সমাজ পরিবর্তন।”
                </p>
              </div>

              {links.length > 0 ? (
                <div className="mt-7 flex flex-wrap gap-3">
                  {links.map(({ href, label, Icon, external }) => (
                    <motion.a
                      key={label}
                      href={href}
                      {...(external
                        ? {
                            target: "_blank",
                            rel: "noopener noreferrer",
                          }
                        : {})}
                      whileHover={{
                        y: -3,
                        scale: 1.03,
                      }}
                      whileTap={{ scale: 0.98 }}
                      className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/60 backdrop-blur-sm transition-colors hover:border-emerald-300/20 hover:bg-emerald-300/6 hover:text-white"
                    >
                      <Icon className="h-4.5 w-4.5 text-emerald-300/80 transition-transform duration-300 group-hover:scale-110" />
                      <span>{label}</span>
                    </motion.a>
                  ))}
                </div>
              ) : null}
            </motion.div>

            {/* Navigation */}
            <motion.nav variants={fadeUp} aria-label="Footer navigation">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300/70">
                Explore GIC
              </p>

              <ul className="mt-5 space-y-3">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="group inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
                    >
                      <span className="h-px w-0 bg-emerald-300 transition-all duration-300 group-hover:w-4" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>

            {/* Contact */}
            <motion.div variants={fadeUp}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300/70">
                Contact
              </p>

              <div className="mt-5 space-y-4">
                {siteConfig.whatsappUrl ? (
                  <a
                    href={siteConfig.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <span className="text-xs text-white/30">WhatsApp</span>
                    <span className="mt-1 block text-sm text-white/65 transition-colors group-hover:text-emerald-300">
                      Contact GIC directly
                    </span>
                  </a>
                ) : null}

                {siteConfig.email ? (
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="group block"
                  >
                    <span className="text-xs text-white/30">Email</span>
                    <span className="mt-1 block break-all text-sm text-white/65 transition-colors group-hover:text-emerald-300">
                      {siteConfig.email}
                    </span>
                  </a>
                ) : null}
              </div>
            </motion.div>
          </div>

          {/* Pietenium credit */}
          <div className="mt-12 border-t border-white/10 pt-12">
            <PieteniumCredit />
          </div>

          {/* Bottom bar */}
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm text-white/45">
                © {year} GIC — Global Islamic Center.
              </p>

              <p className="mt-1 text-xs text-white/25">সর্বস্বত্ব সংরক্ষিত।</p>
            </div>

            <motion.button
              type="button"
              onClick={scrollToTop}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/55 transition-colors hover:border-emerald-300/20 hover:text-white"
              aria-label="Back to top"
            >
              Back to top
              <ChevronUpIcon className="h-4 w-4" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Tiny animated light line */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-px bg-linear-to-r from-transparent via-emerald-300/50 to-transparent"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: ["-100%", "100%"],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }
        }
        style={{ width: "45%" }}
      />
    </footer>
  );
}
