import Link from "next/link";

type BackToHomeLinkProps = {
  /** Compact text link for tight layouts (e.g. top of auth cards). */
  variant?: "button" | "text";
  className?: string;
};

export function BackToHomeLink({
  variant = "button",
  className = "",
}: BackToHomeLinkProps) {
  const base =
    "inline-flex items-center justify-center gap-2 text-sm font-semibold transition";

  if (variant === "text") {
    return (
      <Link
        href="/"
        className={`${base} text-emerald-700 hover:text-emerald-800 ${className}`.trim()}
      >
        <span aria-hidden className="text-base leading-none">
          ←
        </span>
        Back to home
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={`${base} rounded-bl-xl rounded-tr-lg border-2 border-neutral-200 bg-white px-4 py-2 text-neutral-800 hover:border-emerald-600 hover:text-emerald-700 ${className}`.trim()}
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
      Home
    </Link>
  );
}
