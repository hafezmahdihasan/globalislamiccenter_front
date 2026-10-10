import Field from "./Field";
import { LIMITS } from "@/lib/students/validation";

/**
 * Reusable WhatsApp + email pair, used for both the student and the guardian.
 * `names` maps the pair onto the form's field names.
 */
const numberPurify = (value) => {
  return value.trim().startsWith("+")
    ? value.trim().substring(1)
    : value.trim();
};
export default function ContactFields({
  idPrefix,
  names,
  values,
  errors,
  onChange,
  phoneLabel,
  phoneRequired = false,
  phoneHint,
  emailLabel,
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        id={`${idPrefix}-phone`}
        name={names.phone}
        label={phoneLabel}
        value={numberPurify(values[names.phone])}
        onChange={onChange}
        error={errors[names.phone]}
        required={phoneRequired}
        hint={phoneHint}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={LIMITS.phone}
        placeholder="+8801XXXXXXXXX"
      />
      <Field
        id={`${idPrefix}-email`}
        name={names.email}
        label={emailLabel}
        value={values[names.email]}
        onChange={onChange}
        error={errors[names.email]}
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={LIMITS.email}
        placeholder="name@example.com"
      />
    </div>
  );
}

/**
 *
 *
 * 


 */
