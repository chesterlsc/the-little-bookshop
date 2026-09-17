"use client";

import { useRef, useState } from "react";
import { Button } from "./ui";
import { IconCamera, IconCheck } from "./icons";
import { INSTAGRAM_URL } from "@/content/site";

/**
 * The customer's payment screenshot, on its way to the shop.
 *
 * The image is shrunk here, in the browser, before it is sent: the host
 * refuses a request body over 4.5MB before our code runs, and a phone
 * screenshot is often bigger than that. Nothing is stored; the server emails
 * it to the shop and forgets it.
 */

/**
 * Calibration, not arbitrary: the shop has to read a reference number off what
 * arrives. Lower these only after looking at a real receipt at the new size.
 */
const MAX_EDGE = 2000;
const MAX_BYTES = 1_000_000;
/** Refuse before decoding: a huge image can take the tab down with it. */
const MAX_FILE = 20_000_000;

async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let out = "";
  for (const quality of [0.8, 0.6, 0.45]) {
    out = canvas.toDataURL("image/jpeg", quality);
    // base64 carries three bytes in four characters
    if (out.length * 0.75 <= MAX_BYTES) break;
  }
  if (!out.startsWith("data:image/jpeg")) throw new Error("could not re-encode");
  return out;
}

export function PaymentProof({
  orderNumber,
  method,
}: {
  orderNumber: string;
  /** what they said they paid with, so the shop's email can say it */
  method?: string;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const take = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_FILE) {
      setError("That image is enormous. Please send it to us on Instagram instead.");
      return;
    }
    try {
      setImage(await shrink(file));
    } catch {
      setImage(null);
      setError("We couldn't read that image. Please send it to us on Instagram instead.");
    }
  };

  const send = async () => {
    if (!image || status === "sending") return;
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/payment-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, method }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        setError(json.message ?? "That didn't go through. Please try once more.");
        setStatus("idle");
        return;
      }
    } catch {
      setError("That didn't go through. Please try once more, or send it on Instagram.");
      setStatus("idle");
      return;
    }
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div className="clay-sm flex items-start gap-3 bg-sage-100 p-4" role="status">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-600 text-cream-50">
          <IconCheck className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display font-bold text-ink-800">We&apos;ve got your screenshot ♡</p>
          <p className="mt-0.5 font-sans text-sm text-ink-600">
            We&apos;ll check the transfer by hand and confirm your order. Sent the wrong one?{" "}
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="font-bold text-sage-700 underline">
              Message us on Instagram
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void take(e.dataTransfer.files?.[0]);
        }}
        className={`stitch flex flex-col items-center gap-2 p-4 text-center transition ${
          dragging ? "border-sage-700 bg-sage-100" : "bg-paper"
        }`}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="The payment screenshot you picked"
            className="max-h-44 w-auto rounded-xl border border-taupe-300"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-200 text-taupe-500">
            <IconCamera className="h-5 w-5" />
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void take(e.target.files?.[0] ?? undefined);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-display text-[0.95rem] font-semibold text-sage-700 underline"
        >
          {image ? "Pick a different photo" : "Choose your screenshot"}
        </button>
        <p className="font-sans text-xs text-ink-400">
          {image ? "Looks right? Send it over." : "or drop it here · we never ask for your PIN or OTP"}
        </p>
      </div>

      {error && (
        <p className="mt-2 font-sans text-sm font-bold text-rose-600" role="alert">
          {error}
        </p>
      )}

      <Button
        onClick={send}
        disabled={!image || status === "sending"}
        aria-disabled={!image || status === "sending"}
        className="mt-3 w-full"
      >
        {status === "sending" ? "Sending…" : "Send screenshot"}
      </Button>
    </div>
  );
}
