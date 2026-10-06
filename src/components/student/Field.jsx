/**
 * Labelled form control with hint + error wiring for assistive tech.
 * No native `required` attribute is set (the form uses noValidate and our own
 * Zod messages); aria-required communicates the requirement instead.
 */
export default function Field({
  id,
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  hint,
  as = "input",
  className,
  ...controlProps
}) {
  const Control = as;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-red-800">
            {" "}
            *
          </span>
        ) : (
          <span className="ml-1 text-sm font-normal text-charcoal/60">(ঐচ্ছিক)</span>
        )}
      </label>

      <Control
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        aria-required={required ? "true" : undefined}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className="field-input"
        {...controlProps}
      />

      {hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-charcoal/65">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}
