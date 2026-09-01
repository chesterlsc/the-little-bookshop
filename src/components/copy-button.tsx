"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconCheck } from "./icons";

/** Clipboard with a fallback for non-secure contexts and older mobile browsers. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the textarea trick */
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copy-to-clipboard button that says "Copied ♡" for a moment afterwards.
 * The label is announced politely so screen readers hear the confirmation.
 */
export function CopyButton({
  value,
  label,
  className = "",
  variant = "quiet",
  onCopied,
}: {
  value: string;
  /** what is being copied, e.g. "GCash number" — used for the accessible name */
  label: string;
  className?: string;
  variant?: "quiet" | "blush" | "primary";
  onCopied?: () => void;
}) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback(async () => {
    const ok = await copyText(value);
    setState(ok ? "done" : "failed");
    if (ok) onCopied?.();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  }, [value, onCopied]);

  return (
    <button
      type="button"
      onClick={run}
      className={`btn btn-${variant} !min-h-[44px] !px-4 !py-2 text-[0.9rem] ${className}`}
      aria-label={state === "done" ? `${label} copied` : `Copy ${label}`}
    >
      {/* Every label stacked in one grid cell, so the button is always as wide as its
          widest state. Without this, "Copied ♡" grows the button ~55px, which at ≤360px
          wraps it onto its own line and shoves the payment steps 56px down the screen
          on the very tap the customer makes to copy the amount. */}
      <span aria-hidden className="grid">
        <span
          className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${state === "done" ? "" : "invisible"}`}
        >
          <IconCheck className="h-4 w-4" /> Copied ♡
        </span>
        <span
          className={`col-start-1 row-start-1 whitespace-nowrap ${state === "failed" ? "" : "invisible"}`}
        >
          Copy failed
        </span>
        <span
          className={`col-start-1 row-start-1 whitespace-nowrap ${state === "idle" ? "" : "invisible"}`}
        >
          Copy
        </span>
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "done" ? `${label} copied` : ""}
      </span>
    </button>
  );
}
