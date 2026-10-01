"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GIFT_CARD_AMOUNTS, GIFT_CARD_SLUG } from "@/lib/catalog";
import { giftCardFriendEmail } from "@/lib/email/templates";
import { EMAIL_RE, GIFT_NAME_MAX, GIFT_NOTE_MAX, giftExpiry, suggestEmail, type GiftCardRecord, type GiftDelivery } from "@/lib/gift-card-types";
import { SITE } from "@/content/site";
import { useCart } from "./cart-context";
import { GiftCardBack, GiftCardFront } from "./gift-card-art";
import { IconCheck, IconX } from "./icons";
import { Button, Field, inputClass, Section } from "./ui";

/**
 * The gift card page: the card itself, an amount, and who it is for.
 *
 * On a phone the first screen is the whole decision — card, amount, recipient —
 * and the one button rides in a tray above the bottom bar, so it is never
 * behind anything and never off screen. A desktop has room to put the button
 * in the column instead.
 */

const HOW = [
  ["Pick and pay", "Choose ₱500, ₱1,000 or ₱2,000. Pay by GCash or MariBank."],
  ["We make the card", "Once we've checked your payment, the code appears on your order page. We email it and send it on Instagram too."],
  ["They shop", "They type the code at checkout. Anything left stays on the card for next time."],
] as const;

const SMALL_PRINT = [
  "Good for 12 months from the day you buy it.",
  "Use it over more than one order.",
  "It can't be refunded or swapped for cash.",
  "It can't be used to buy another gift card.",
];

/** A chip that looks picked the way the card art's own amount box looks stamped. */
function Chip({ picked, onPick, children }: { picked: boolean; onPick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={picked}
      onClick={onPick}
      className={`flex min-h-[50px] flex-1 items-center justify-center gap-1.5 rounded-2xl px-2 font-display text-[1.02rem] font-bold transition ${
        picked
          ? "border-[2.5px] border-ink-800 bg-cream-50 text-ink-900 shadow-[0_4px_0_var(--color-ink-800)]"
          : "border-[1.5px] border-taupe-300 bg-cream-50 text-ink-600 hover:border-brown-500"
      }`}
    >
      {picked && <IconCheck className="h-4 w-4 shrink-0" />}
      {children}
    </button>
  );
}

export function GiftCardPage() {
  const { addLine, openDrawer } = useCart();
  const [amount, setAmount] = useState(GIFT_CARD_AMOUNTS[1]);
  const [delivery, setDelivery] = useState<GiftDelivery>("self");
  const [toName, setToName] = useState("");
  const [fromName, setFromName] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [note, setNote] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [added, setAdded] = useState(false);
  const [preview, setPreview] = useState(false);
  // the sample pops up the first time "to a friend" is picked, and not again:
  // after that it is behind its own button, with their own words in it
  const [sawSample, setSawSample] = useState(false);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPreview(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [preview]);

  const pickFriend = () => {
    setDelivery("friend");
    if (!sawSample) {
      setSawSample(true);
      setPreview(true);
    }
  };

  const friend = delivery === "friend";
  const who = toName.trim() || "your friend";
  const email = toEmail.trim();
  const emailError = !friend
    ? undefined
    : !email
      ? `Add ${toName.trim() ? `${toName.trim()}'s` : "your friend's"} email so we know where to send it.`
      : !EMAIL_RE.test(email)
        ? "That email address doesn't look right."
        : undefined;
  const suggestion = friend ? suggestEmail(email) : undefined;

  // the card leans towards the pointer; the lean is a CSS variable, so moving
  // the mouse never re-renders anything
  const tilt = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--tilt-y", `${(((e.clientX - box.left) / box.width) * 2 - 1).toFixed(3)}`);
    e.currentTarget.style.setProperty("--tilt-x", `${(1 - ((e.clientY - box.top) / box.height) * 2).toFixed(3)}`);
  };
  const settle = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--tilt-y", "0");
    e.currentTarget.style.setProperty("--tilt-x", "0");
  };

  const add = () => {
    if (emailError) {
      setShowErrors(true);
      document.getElementById("gift-to-email")?.focus();
      return;
    }
    addLine({
      type: "product",
      slug: GIFT_CARD_SLUG,
      variantId: String(amount.price / 100),
      qty: 1,
      gift: friend
        ? { delivery, toName: toName.trim(), fromName: fromName.trim(), toEmail: email.toLowerCase(), note: note.trim() }
        : { delivery },
    });
    setAdded(true);
    setShowErrors(false);
    window.setTimeout(() => setAdded(false), 1800);
    openDrawer();
  };

  const addLabel = added ? "Added to your basket" : `Add to basket · ${amount.label}`;

  // nothing typed yet: show the design with someone else's names in it, and say so
  const sampleOnly = !toName.trim() && !fromName.trim() && !note.trim();

  /** The email the friend will get, with a stand-in code: the real one is made once the card is paid for. */
  const previewHtml = () => {
    const now = new Date();
    const to = sampleOnly ? "Ana" : toName.trim();
    const from = sampleOnly ? "Maria" : fromName.trim();
    const sample: GiftCardRecord = {
      id: 0,
      order_number: "",
      token: "",
      amount: amount.price,
      balance: amount.price,
      code: "LBGC-XXXX-XXXX",
      delivery: "friend",
      to_name: to || null,
      from_name: from || null,
      to_email: email || null,
      note: sampleOnly ? "Happy birthday! Go get that arched shelf." : note.trim() || null,
      created_at: now.toISOString(),
      issued_at: now.toISOString(),
      expires_at: giftExpiry(now).toISOString(),
      emailed_at: null,
      emails_sent: 0,
    };
    // the mail points at the live site; the preview reads the same files from here
    return giftCardFriendEmail(sample, from || "You", "/shop").html.replaceAll(SITE.url, "");
  };

  return (
    <div className="gift-page">
      <Section className="pt-4 lg:pt-6">
        <div className="grid gap-3 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* ── the card ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <nav aria-label="Breadcrumb" className="font-sans text-sm text-ink-600">
                <ol className="flex items-center gap-1.5">
                  <li>
                    <Link href="/shop" className="hover:underline">
                      Shop
                    </Link>
                  </li>
                  <li aria-hidden>›</li>
                  <li aria-current="page" className="font-bold text-ink-800">
                    Gift card
                  </li>
                </ol>
              </nav>
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                aria-pressed={flipped}
                className="btn btn-quiet !min-h-[36px] !px-3 !py-1 text-[0.82rem]"
              >
                <span aria-hidden>↻</span> Turn it over
              </button>
            </div>

            <div className="gift-stage px-1.5" onPointerMove={tilt} onPointerLeave={settle}>
              <div className="gift-card3d">
               <div className={`gift-flip ${flipped ? "is-flipped" : ""}`}>
                {/* a new key per amount replays the half-turn */}
                <div key={amount.price} className="gift-face gift-swap">
                  <GiftCardFront
                    price={amount.price}
                    toName={friend ? toName : undefined}
                    fromName={friend ? fromName : undefined}
                    sizes="(min-width:1024px) 46vw, 94vw"
                    eager
                  />
                </div>
                <div className="gift-face gift-face-back" aria-hidden={!flipped}>
                  <GiftCardBack
                    toName={friend ? toName : undefined}
                    fromName={friend ? fromName : undefined}
                    sizes="(min-width:1024px) 46vw, 94vw"
                  />
                </div>
               </div>
              </div>
              <span aria-hidden className="gift-shadow" />
            </div>
          </div>

          {/* ── the choices ── */}
          <div>
            <h1 className="font-display text-[1.9rem] font-bold leading-none text-ink-900 sm:text-4xl">Gift card</h1>
            <p className="story-line mt-1.5 text-[1.02rem] text-ink-600">Let them pick their own tiny shelf.</p>

            <p id="gift-amount" className="mb-1.5 mt-3 font-sans text-sm font-bold text-ink-800">
              Pick an amount
            </p>
            <div role="radiogroup" aria-labelledby="gift-amount" className="flex gap-2">
              {GIFT_CARD_AMOUNTS.map((a) => (
                <Chip key={a.price} picked={a.price === amount.price} onPick={() => { setAmount(a); setFlipped(false); }}>
                  {a.label}
                </Chip>
              ))}
            </div>

            <p id="gift-who" className="mb-1.5 mt-3 font-sans text-sm font-bold text-ink-800">
              Who should we send it to?
            </p>
            <div role="radiogroup" aria-labelledby="gift-who" className="flex gap-2">
              <Chip picked={!friend} onPick={() => setDelivery("self")}>
                Send it to me
              </Chip>
              <Chip picked={friend} onPick={pickFriend}>
                Send it to a friend
              </Chip>
            </div>

            {!friend ? (
              <p className="mt-3 font-sans text-[0.92rem] leading-relaxed text-ink-600">
                We email the card to you and send it on Instagram. Forward it whenever you like.
              </p>
            ) : (
              <div className="stitch mt-4 bg-cream-50 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="To" htmlFor="gift-to">
                    <input
                      id="gift-to"
                      value={toName}
                      onChange={(e) => setToName(e.target.value)}
                      maxLength={GIFT_NAME_MAX}
                      autoComplete="off"
                      placeholder="Ana"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="From" htmlFor="gift-from">
                    <input
                      id="gift-from"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      maxLength={GIFT_NAME_MAX}
                      autoComplete="given-name"
                      placeholder="Maria"
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label="Your friend's email"
                    htmlFor="gift-to-email"
                    error={showErrors ? emailError : undefined}
                    className="col-span-2"
                  >
                    <input
                      id="gift-to-email"
                      type="email"
                      inputMode="email"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="ana@example.com"
                      aria-invalid={showErrors && emailError ? true : undefined}
                      className={`${inputClass} ${showErrors && emailError ? "!border-rose-500" : ""}`}
                    />
                    {suggestion && (
                      <button
                        type="button"
                        onClick={() => setToEmail(suggestion)}
                        className="btn-link mt-1.5 font-sans text-sm"
                      >
                        Did you mean {suggestion}?
                      </button>
                    )}
                  </Field>
                  <Field label="A short note (optional)" htmlFor="gift-note" className="col-span-2">
                    <textarea
                      id="gift-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={GIFT_NOTE_MAX}
                      rows={2}
                      placeholder="Happy birthday! Go get that arched shelf."
                      className={`${inputClass} resize-y`}
                    />
                    <span className="mt-1 block text-right font-sans text-xs text-ink-400">
                      {note.length} / {GIFT_NOTE_MAX}
                    </span>
                  </Field>
                </div>

                <div className="mt-1 flex items-center gap-3">
                  <span className="block w-[150px] shrink-0">
                    <GiftCardFront price={amount.price} toName={toName} fromName={fromName} sizes="150px" />
                  </span>
                  <p className="story-line text-[0.86rem] leading-snug text-ink-600">
                    The names write onto the card as you type.
                  </p>
                </div>

                <p className="mt-3 font-sans text-[0.9rem] leading-relaxed text-ink-600">
                  We email {who} as soon as we&apos;ve checked your payment. You get a copy, and the code shows on your
                  order page too.
                </p>
                <Button variant="quiet" onClick={() => setPreview(true)} className="mt-3 !min-h-[40px] text-[0.9rem]">
                  See the email {who} gets
                </Button>
              </div>
            )}

            {/* a desktop has room for the button in the column */}
            <div className="mt-6 hidden lg:block">
              <Button onClick={add} className="btn-lg w-full">
                {addLabel}
              </Button>
              <p className="mt-2 text-center font-sans text-sm text-ink-600">Digital card. No shipping fee.</p>
            </div>

            <h2 className="mt-8 font-display text-xl font-bold">How it works</h2>
            <ol className="mt-3 space-y-3">
              {HOW.map(([title, body], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink-800 bg-cream-50 font-display font-bold">
                    {i + 1}
                  </span>
                  <p className="font-sans text-[0.95rem] leading-relaxed text-ink-600">
                    <span className="font-display font-bold text-ink-900">{title}.</span> {body}
                  </p>
                </li>
              ))}
            </ol>

            <div className="stitch mt-6 bg-cream-100 p-4">
              <h2 className="font-display text-[1.05rem] font-bold">The small print, kindly</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-sans text-[0.92rem] leading-relaxed text-ink-600">
                {SMALL_PRINT.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* the tray: one button, always above the bottom bar */}
      <div className="gift-tray lg:hidden">
        <Button onClick={add} className="btn-lg w-full">
          {addLabel}
        </Button>
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[88] flex items-center justify-center bg-ink-900/55 p-3"
          role="dialog"
          aria-modal="true"
          aria-label={sampleOnly ? "A sample of the email your friend gets" : `The email ${who} gets`}
          onClick={() => setPreview(false)}
        >
          <div className="clay flex max-h-full w-full max-w-[620px] flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-brown-500/12 px-4 py-3">
              <p className="font-display font-bold">
                {sampleOnly ? "Here's the email your friend gets" : `The email ${who} gets`}
              </p>
              <button
                type="button"
                onClick={() => setPreview(false)}
                aria-label="Close the preview"
                className="rounded-full p-2 text-ink-600 transition hover:bg-cream-200"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <p className="px-4 pt-2 font-sans text-xs text-ink-600">
              {sampleOnly
                ? "This is a sample, with Ana and Maria standing in. Yours will carry your own names and note."
                : "The code here is a stand-in. The real one is made once we've checked your payment."}
            </p>
            <iframe title="Email preview" srcDoc={previewHtml()} sandbox="" className="h-[60vh] w-full" />
            <div className="border-t border-brown-500/12 p-3">
              <Button onClick={() => setPreview(false)} className="w-full" autoFocus>
                {sampleOnly ? "Lovely, let me fill it in" : "Looks good"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
