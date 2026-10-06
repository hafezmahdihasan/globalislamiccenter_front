import { cn } from "@/lib/utils/cn";

export default function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  tone = "light",
  align = "center",
  className,
}) {
  const dark = tone === "dark";

  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "text-sm font-semibold tracking-wide",
            dark ? "text-gold-light" : "text-gold-dark",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className={cn(
          "mt-2 text-2xl font-bold leading-snug sm:text-3xl",
          dark ? "text-ivory" : "text-brand-900",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            dark ? "text-ivory/80" : "text-charcoal/75",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
