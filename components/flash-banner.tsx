"use client";

import { useEffect, useRef } from "react";

const AUTO_DISMISS_MS = 6000;

type FlashBannerProps = {
  variant: "success" | "error";
  children: React.ReactNode;
  onDismiss: () => void;
  className?: string;
};

export function FlashBanner({ variant, children, onDismiss, className = "" }: FlashBannerProps) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const id = window.setTimeout(() => dismissRef.current(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [children]);

  const palette =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      className={`flex items-start gap-2 border px-3 py-2 text-sm ${palette} ${className}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <p className="min-w-0 flex-1 leading-snug">{children}</p>
      <button
        type="button"
        onClick={() => dismissRef.current()}
        className={`shrink-0 rounded-lg p-1 transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          variant === "error" ? "focus:ring-red-400" : "focus:ring-emerald-400"
        }`}
        aria-label="Dismiss notification"
      >
        <svg
          className="h-4 w-4 opacity-70"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
