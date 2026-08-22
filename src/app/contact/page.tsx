"use client";

import { useState } from "react";
import { Button, Eyebrow, Field, inputClass, Section } from "@/components/ui";
import { FolkDivider, ProductArt } from "@/components/illustrations";
import { IconCheck } from "@/components/icons";
import { SITE } from "@/content/site";

export default function ContactPage() {
  const [values, setValues] = useState({ name: "", email: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setErrors({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (res.ok) {
        setState("sent");
      } else if (json.fieldErrors) {
        setErrors(json.fieldErrors);
        setState("idle");
      } else {
        setServerMessage(json.message ?? "Something went wrong. Please try again.");
        setState("error");
      }
    } catch {
      setServerMessage("We couldn't send that just now. Please try again.");
      setState("error");
    }
  };

  return (
    <div className="pb-nav">
      <Section className="pt-10">
        <div className="mx-auto max-w-xl">
          <div className="mb-7 text-center">
            <Eyebrow className="mb-2">Say hello</Eyebrow>
            <h1 className="text-3xl font-bold sm:text-4xl">Write to the shop</h1>
            <p className="mx-auto mt-2 max-w-[46ch] font-sans text-[0.95rem] text-ink-600">
              Custom requests, order questions, or just to tell us what six books made
              you. We read everything.
            </p>
          </div>

          {state === "sent" ? (
            <div className="clay p-8 text-center" role="status">
              <div className="mx-auto flex h-14 w-14 animate-pop items-center justify-center rounded-full bg-sage-600 text-cream-50">
                <IconCheck className="h-7 w-7" />
              </div>
              <h2 className="mt-3 font-display text-xl font-bold">Sent, thank you!</h2>
              <p className="mt-1 font-sans text-[0.95rem] text-ink-600">
                Your note is in our inbox. We reply to everything, usually within a
                couple of days.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="clay space-y-4 p-6">
              <Field label="Your name" htmlFor="contact-name" error={errors.name}>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                  autoComplete="name"
                  className={`${inputClass} ${errors.name ? "!border-rose-500" : ""}`}
                />
              </Field>
              <Field label="Email address" htmlFor="contact-email" error={errors.email}>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  autoComplete="email"
                  className={`${inputClass} ${errors.email ? "!border-rose-500" : ""}`}
                />
              </Field>
              <Field
                label="Your message"
                htmlFor="contact-message"
                error={errors.message}
                hint="If it's about an order, include the LB- order number."
              >
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  maxLength={4000}
                  value={values.message}
                  onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                  className={`${inputClass} resize-y ${errors.message ? "!border-rose-500" : ""}`}
                />
              </Field>
              {/* honeypot: hidden from real visitors */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="contact-website">Leave this empty</label>
                <input
                  id="contact-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.website}
                  onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))}
                />
              </div>
              {state === "error" && (
                <p className="stitch bg-blush-100/60 p-3 font-sans text-sm font-bold text-rose-700" role="alert">
                  {serverMessage}{" "}
                  <a className="underline" href={`mailto:${SITE.contactEmail}`}>
                    Or email us directly.
                  </a>
                </p>
              )}
              <Button type="submit" disabled={state === "sending"} className="w-full !py-3.5">
                {state === "sending" ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}

          <div className="mt-8 flex items-center justify-center gap-3 text-center">
            <ProductArt kind="keychain-acrylic" title="" className="h-14 w-14 opacity-80" />
            <p className="font-sans text-sm text-ink-600">
              Prefer email? We're at{" "}
              <a href={`mailto:${SITE.contactEmail}`} className="font-bold text-sage-700 underline">
                {SITE.contactEmail}
              </a>
            </p>
          </div>
          <FolkDivider className="mx-auto mt-8 h-6 w-52 opacity-80" />
        </div>
      </Section>
    </div>
  );
}
