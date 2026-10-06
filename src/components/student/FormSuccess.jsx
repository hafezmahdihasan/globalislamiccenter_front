"use client";

import { useEffect, useRef } from "react";
import { CheckIcon } from "@/components/ui/Icons";

export default function FormSuccess({ submissionId, onReset }) {
  const ref = useRef(null);

  // Move focus to the confirmation so screen-reader and keyboard users land on it.
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-brand-200 bg-white p-8 text-center shadow-sm focus:outline-none sm:p-10"
    >
      <span
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-800 text-gold-light"
      >
        <CheckIcon className="h-8 w-8" />
      </span>

      <h3 className="mt-5 text-2xl font-bold text-brand-900">আপনার আবেদন গ্রহণ করা হয়েছে</h3>
      <p className="mt-3 text-base leading-relaxed text-charcoal/80">
        জাযাকাল্লাহু খাইরান। আপনার দেওয়া WhatsApp নম্বরে আমাদের টিম শীঘ্রই যোগাযোগ করবে, ইনশাআল্লাহ।
      </p>
      <p className="mt-1 text-sm text-charcoal/60">
        Thank you — your inquiry was received and our team will contact you.
      </p>

      {submissionId ? (
        <p className="mt-6 text-sm text-charcoal/70">
          আবেদন নম্বর:{" "}
          <span className="font-mono font-semibold text-brand-900">{submissionId}</span>
        </p>
      ) : null}

      <button type="button" onClick={onReset} className="btn btn-outline mt-8">
        আরেকটি আবেদন করুন
      </button>
    </div>
  );
}
