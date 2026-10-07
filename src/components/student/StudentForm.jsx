"use client";

import { useRef, useState } from "react";
import Field from "./Field";
import ContactFields from "./ContactFields";
import FormSuccess from "./FormSuccess";
import useRecaptcha from "./useRecaptcha";
import SectionHeading from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils/cn";
import {
  LIMITS,
  MINOR_AGE_LIMIT,
  STUDY_TOPICS,
  validateStudentInquiry,
} from "@/lib/students/validation";

const RECAPTCHA_ACTION = "student_form"; // must match the server-side expected action
const REQUEST_TIMEOUT_MS = 20000;

const INITIAL_VALUES = {
  studentName: "",
  age: "",
  classLevel: "",
  country: "",
  city: "",
  studyTopic: "",
  whatsapp: "",
  email: "",
  contactName: "",
  guardianWhatsapp: "",
  guardianEmail: "",
  message: "",
  consent: false,
  guardianConsent: false,
  website: "", // honeypot
};

const COUNTRY_SUGGESTIONS = [
  "Bangladesh",
  "Saudi Arabia",
  "United Arab Emirates",
  "Qatar",
  "Kuwait",
  "Oman",
  "Malaysia",
  "Singapore",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Italy",
];

const MESSAGES = {
  validation: "ফর্মের চিহ্নিত অংশগুলো ঠিক করে আবার চেষ্টা করুন।",
  network: "ইন্টারনেট সংযোগে সমস্যা হয়েছে। সংযোগ দেখে আবার চেষ্টা করুন।",
  server:
    "দুঃখিত, এই মুহূর্তে আবেদন জমা দেওয়া যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
  security:
    "নিরাপত্তা যাচাই সম্পন্ন করা যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।",
  rateLimited: "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
};

export default function StudentForm() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | editing | submitting | success
  const [banner, setBanner] = useState(null); // { message } | null
  const [submissionId, setSubmissionId] = useState("");

  const formRef = useRef(null);
  const submittingRef = useRef(false); // blocks duplicate submits even before state updates
  const { preload, getToken } = useRecaptcha();

  const submitting = status === "submitting";

  const ageText = values.age.trim();
  const ageNumber = Number(ageText);
  const isMinor =
    ageText !== "" && Number.isFinite(ageNumber) && ageNumber < MINOR_AGE_LIMIT;

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => {
      if (!current[name]) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });
    if (status === "idle") setStatus("editing");
  }

  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
    });
  }

  function showFailure(kind, fields) {
    setBanner({ message: MESSAGES[kind] });
    if (fields) {
      setErrors(fields);
      focusFirstInvalid();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) return;

    setBanner(null);

    const result = validateStudentInquiry(values);
    if (!result.success) {
      showFailure("validation", result.fields);
      return;
    }
    setErrors({});

    submittingRef.current = true;
    setStatus("submitting");

    try {
      let recaptchaToken;
      try {
        recaptchaToken = await getToken(RECAPTCHA_ACTION);
      } catch {
        showFailure("security");
        setStatus("editing");
        return;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let response;
      try {
        response = await fetch("/api/student-inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, recaptchaToken }),
          signal: controller.signal,
        });
      } catch {
        showFailure("network");
        setStatus("editing");
        return;
      } finally {
        clearTimeout(timer);
      }

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        // non-JSON body: fall through to the generic server message
      }

      if (response.ok && payload?.success) {
        setSubmissionId(payload.data?.submissionId ?? "");
        setValues(INITIAL_VALUES);
        setStatus("success");
        return;
      }

      setStatus("editing");
      switch (payload?.error) {
        case "VALIDATION_ERROR":
          showFailure("validation", payload.fields ?? {});
          break;
        case "RATE_LIMITED":
          showFailure("rateLimited");
          break;
        case "RECAPTCHA_FAILED":
        case "REQUEST_REJECTED":
          showFailure("security");
          break;
        default:
          showFailure("server");
      }
    } finally {
      submittingRef.current = false;
    }
  }

  function handleReset() {
    setStatus("idle");
    setBanner(null);
    setErrors({});
    setSubmissionId("");
  }

  return (
    <section
      id="student-registration"
      aria-labelledby="student-registration-title"
      className="section-y scroll-mt-16 bg-brand-50"
    >
      <div className="container-page">
        <SectionHeading
          id="student-registration-title"
          eyebrow="ভর্তির আবেদন"
          title="শেখা শুরু করতে আবেদন করুন"
          description="নিচের ফর্মটি পূরণ করুন। আমাদের টিম আপনার সাথে যোগাযোগ করবে।"
        />

        <div className="mx-auto mt-10 max-w-3xl">
          {status === "success" ? (
            <FormSuccess submissionId={submissionId} onReset={handleReset} />
          ) : (
            <form
              ref={formRef}
              noValidate
              onSubmit={handleSubmit}
              onFocusCapture={preload}
              aria-busy={submitting}
              className="space-y-8 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8"
            >
              {/* Screen-reader announcement of progress */}
              <p role="status" aria-live="polite" className="sr-only">
                {submitting ? "আবেদন জমা দেওয়া হচ্ছে…" : ""}
              </p>

              {banner ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-base font-medium text-red-900"
                >
                  {banner.message}
                </div>
              ) : null}

              {/* Honeypot: hidden from people and assistive tech, tempting to bots */}
              <div
                aria-hidden="true"
                className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
              >
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.website}
                  onChange={handleChange}
                />
              </div>

              {/* 1. Student information */}
              <fieldset className="space-y-5">
                <legend className="mb-1 text-lg font-bold text-brand-900">
                  শিক্ষার্থীর তথ্য
                </legend>

                <Field
                  id="studentName"
                  name="studentName"
                  label="শিক্ষার্থীর নাম"
                  value={values.studentName}
                  onChange={handleChange}
                  error={errors.studentName}
                  required
                  autoComplete="name"
                  maxLength={LIMITS.name}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="age"
                    name="age"
                    label="বয়স"
                    value={values.age}
                    onChange={handleChange}
                    error={errors.age}
                    required
                    inputMode="numeric"
                    maxLength={3}
                    placeholder="যেমন: 12"
                  />
                  <Field
                    id="classLevel"
                    name="classLevel"
                    label="শ্রেণি / শিক্ষাগত স্তর"
                    value={values.classLevel}
                    onChange={handleChange}
                    error={errors.classLevel}
                    maxLength={LIMITS.classLevel}
                    placeholder="যেমন: ৫ম শ্রেণি"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="country"
                    name="country"
                    label="দেশ"
                    value={values.country}
                    onChange={handleChange}
                    error={errors.country}
                    required
                    autoComplete="country-name"
                    maxLength={LIMITS.country}
                    list="country-suggestions"
                  />
                  <Field
                    id="city"
                    name="city"
                    label="শহর / অবস্থান"
                    value={values.city}
                    onChange={handleChange}
                    error={errors.city}
                    autoComplete="address-level2"
                    maxLength={LIMITS.city}
                  />
                </div>
                <datalist id="country-suggestions">
                  {COUNTRY_SUGGESTIONS.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </fieldset>

              {/* 2. Learning information */}
              <fieldset>
                <legend className="field-label">
                  পড়ার বিষয়
                  <span aria-hidden="true" className="text-red-800">
                    {" "}
                    *
                  </span>
                </legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {STUDY_TOPICS.map((topic, index) => (
                    <label
                      key={topic}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 has-checked:border-brand-700 has-checked:bg-brand-50 has-focus-visible:ring-2 has-focus-visible:ring-brand-700/40",
                        errors.studyTopic
                          ? "border-red-700"
                          : "border-brand-200",
                      )}
                    >
                      <input
                        type="radio"
                        name="studyTopic"
                        value={topic}
                        checked={values.studyTopic === topic}
                        onChange={handleChange}
                        aria-invalid={
                          index === 0 && errors.studyTopic ? "true" : undefined
                        }
                        aria-describedby={
                          errors.studyTopic ? "studyTopic-error" : undefined
                        }
                        className="h-5 w-5 accent-brand-700"
                      />
                      <span className="font-medium text-charcoal">{topic}</span>
                    </label>
                  ))}
                </div>
                {errors.studyTopic ? (
                  <p id="studyTopic-error" className="field-error">
                    <span aria-hidden="true">⚠ </span>
                    {errors.studyTopic}
                  </p>
                ) : null}
              </fieldset>

              {/* 3. Student contact */}
              <fieldset className="space-y-5">
                <legend className="mb-1 text-lg font-bold text-brand-900">
                  যোগাযোগ
                </legend>
                <ContactFields
                  idPrefix="student"
                  names={{ phone: "whatsapp", email: "email" }}
                  values={values}
                  errors={errors}
                  onChange={handleChange}
                  phoneLabel="WhatsApp নম্বর"
                  phoneRequired
                  phoneHint="দেশের কোড সহ লিখুন।"
                  emailLabel="ইমেইল"
                />
              </fieldset>

              {/* 4. Guardian / contact person: required for under 18, hidden for adults */}
              {isMinor ? (
                <fieldset className="space-y-5 rounded-xl border border-gold/40 bg-ivory p-4 sm:p-5">
                  <legend className="px-2 text-lg font-bold text-brand-900">
                    অভিভাবক / যোগাযোগকারী ব্যক্তি
                  </legend>
                  <p className="text-sm text-charcoal/70">
                    শিক্ষার্থীর বয়স {MINOR_AGE_LIMIT} বছরের কম, তাই অভিভাবকের
                    তথ্য প্রয়োজন।
                  </p>

                  <Field
                    id="contactName"
                    name="contactName"
                    label="অভিভাবকের নাম"
                    value={values.contactName}
                    onChange={handleChange}
                    error={errors.contactName}
                    required
                    maxLength={LIMITS.name}
                  />
                  <ContactFields
                    idPrefix="guardian"
                    names={{
                      phone: "guardianWhatsapp",
                      email: "guardianEmail",
                    }}
                    values={values}
                    errors={errors}
                    onChange={handleChange}
                    phoneLabel="অভিভাবকের WhatsApp নম্বর"
                    phoneRequired
                    emailLabel="অভিভাবকের ইমেইল"
                  />

                  <div>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        name="guardianConsent"
                        checked={values.guardianConsent}
                        onChange={handleChange}
                        aria-invalid={
                          errors.guardianConsent ? "true" : undefined
                        }
                        aria-describedby={
                          errors.guardianConsent
                            ? "guardianConsent-error"
                            : undefined
                        }
                        className="mt-1 h-5 w-5 shrink-0 accent-brand-700"
                      />
                      <span className="text-base leading-relaxed">
                        আমি নিশ্চিত করছি যে আমি এই শিক্ষার্থীর পক্ষে তথ্য
                        দেওয়ার জন্য অনুমোদিত (অভিভাবক বা দায়িত্বশীল ব্যক্তি)।
                      </span>
                    </label>
                    {errors.guardianConsent ? (
                      <p id="guardianConsent-error" className="field-error">
                        <span aria-hidden="true">⚠ </span>
                        {errors.guardianConsent}
                      </p>
                    ) : null}
                  </div>
                </fieldset>
              ) : null}

              {/* 5. Message */}
              <Field
                id="message"
                name="message"
                as="textarea"
                rows={4}
                label="আপনার বার্তা"
                value={values.message}
                onChange={handleChange}
                error={errors.message}
                maxLength={LIMITS.message}
                hint="কোনো বিশেষ প্রয়োজন বা প্রশ্ন থাকলে লিখুন।"
              />

              {/* 6. Consent */}
              <div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={values.consent}
                    onChange={handleChange}
                    aria-required="true"
                    aria-invalid={errors.consent ? "true" : undefined}
                    aria-describedby={
                      errors.consent ? "consent-error" : "consent-note"
                    }
                    className="mt-1 h-5 w-5 shrink-0 accent-brand-700"
                  />
                  <span className="text-base leading-relaxed">
                    আমার দেওয়া তথ্য ব্যবহার করে GIC আমার সাথে যোগাযোগ করতে পারে
                    — এতে আমি সম্মত।
                    <span aria-hidden="true" className="text-red-800">
                      {" "}
                      *
                    </span>
                  </span>
                </label>
                {errors.consent ? (
                  <p id="consent-error" className="field-error">
                    <span aria-hidden="true">⚠ </span>
                    {errors.consent}
                  </p>
                ) : null}
                <p id="consent-note" className="mt-2 text-sm text-charcoal/65">
                  স্প্যাম রোধে জমা দেওয়ার সময় আপনার IP ঠিকানা সংরক্ষণ করা হয়।
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {submitting ? "জমা দেওয়া হচ্ছে…" : "আবেদন জমা দিন"}
                </button>
                <p className="mt-4 text-xs leading-relaxed text-charcoal/60">
                  This site is protected by reCAPTCHA and the Google{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://policies.google.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Terms of Service
                  </a>{" "}
                  apply.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
