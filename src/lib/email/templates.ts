import type { OrderSnapshot } from "../checkout";
import { formatMoney } from "../money";
import { INSTAGRAM_HANDLE, PAYMENT_METHODS } from "@/content/site";
import type { Mail } from "./types";

/**
 * Brand-styled order emails. Everything here comes from the verified order
 * snapshot; no card data ever exists on our side to leak.
 */

const wrap = (title: string, body: string) => `<!doctype html>
<html><body style="margin:0;padding:24px;background:#fbf6eb;font-family:Verdana,Geneva,sans-serif;color:#43362a;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="text-align:center;font-size:20px;font-weight:800;margin:0 0 2px;">The Little Bookshop</p>
    <p style="text-align:center;font-size:11px;letter-spacing:2px;margin:0 0 18px;color:#93826d;">MINIATURES FOR BOOK LOVERS</p>
    <div style="background:#f9f3e3;border:1.5px solid #e2d5bf;border-radius:20px;padding:22px;">
      <h1 style="font-size:18px;margin:0 0 12px;">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;font-size:11px;color:#93826d;margin:16px 0 0;">Sent with love (and very small books).</p>
  </div>
</body></html>`;

const row = (label: string, value: string) =>
  `<tr><td style="padding:3px 10px 3px 0;font-size:12px;color:#93826d;vertical-align:top;white-space:nowrap;">${label}</td><td style="padding:3px 0;font-size:13px;">${value}</td></tr>`;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function itemsHtml(snapshot: OrderSnapshot): string {
  return snapshot.items
    .map((item) => {
      const titles = item.titles?.length
        ? `<ol style="margin:6px 0 0;padding-left:18px;font-size:12px;color:#6a5a48;">${item.titles
            .map((t) => `<li>${esc(t.title)}${t.author ? `, ${esc(t.author)}` : ""}</li>`)
            .join("")}</ol>`
        : "";
      const notes = item.notes
        ? `<p style="margin:6px 0 0;font-size:12px;font-style:italic;color:#6a5a48;">“${esc(item.notes)}”</p>`
        : "";
      return `<div style="border:1.5px dashed #b7a183;border-radius:14px;padding:12px;margin:0 0 10px;background:#fbf6eb;">
        <p style="margin:0;font-size:14px;font-weight:800;">${esc(item.name)} <span style="float:right;">${formatMoney(item.lineTotal)}</span></p>
        <p style="margin:2px 0 0;font-size:12px;color:#6a5a48;">Qty ${item.qty} · ${formatMoney(item.unitPrice)} each</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6a5a48;">${item.details.map(esc).join("<br>")}</p>
        ${titles}${notes}
      </div>`;
    })
    .join("");
}

function totalsHtml(snapshot: OrderSnapshot): string {
  return `<table style="width:100%;margin-top:6px;border-top:1.5px solid #e2d5bf;padding-top:8px;">
    ${row("Subtotal", formatMoney(snapshot.subtotal))}
    ${row("Shipping", formatMoney(snapshot.shipping))}
    ${row("<strong>Total</strong>", `<strong>${formatMoney(snapshot.total)}</strong> ${snapshot.currency}`)}
  </table>`;
}

function customerHtml(snapshot: OrderSnapshot): string {
  const c = snapshot.customer;
  const address = [c.address1, `Brgy. ${c.barangay}`, `${c.city}, ${c.province} ${c.postalCode}`]
    .filter(Boolean)
    .map(esc)
    .join("<br>");
  return `<table style="width:100%;">
    ${row("Name", esc(c.fullName))}
    ${row("Mobile", esc(c.phone))}
    ${row("Email", esc(c.email))}
    ${c.instagram ? row("Instagram", `@${esc(c.instagram)}`) : ""}
    ${row("Ship to", address)}
    ${c.addressNotes ? row("Address notes", esc(c.addressNotes)) : ""}
    ${c.orderNotes ? row("Order notes", esc(c.orderNotes)) : ""}
  </table>`;
}

export function businessOrderEmail(
  to: string,
  orderNumber: string,
  snapshot: OrderSnapshot,
  paymentReference: string,
  placedAt: string,
): Mail {
  const body = `
    <table style="width:100%;margin-bottom:10px;">
      ${row("Order", `<strong>${orderNumber}</strong>`)}
      ${row("Placed", esc(placedAt))}
      ${row("Payment", `<strong>${esc(paymentReference)}</strong> — manual transfer, verify the screenshot on Instagram`)}
    </table>
    <h2 style="font-size:14px;margin:14px 0 8px;">Customer</h2>
    ${customerHtml(snapshot)}
    <h2 style="font-size:14px;margin:14px 0 8px;">Items</h2>
    ${itemsHtml(snapshot)}
    ${totalsHtml(snapshot)}`;
  return {
    to,
    subject: `🧺 New order ${orderNumber} · ${formatMoney(snapshot.total)}`,
    html: wrap(`New order ${orderNumber}`, body),
    text: `New order ${orderNumber}. Total ${formatMoney(snapshot.total)}. Status: ${paymentReference}. Watch for the transfer + screenshot.`,
  };
}

export function customerOrderEmail(
  orderNumber: string,
  snapshot: OrderSnapshot,
  orderUrl: string,
): Mail {
  const first = snapshot.customer.fullName.trim().split(/\s+/)[0] || "friend";
  const body = `
    <p style="font-size:13px;margin:0 0 12px;">Hi ${esc(first)}, we've saved your order. One step left: send the exact total by GCash or MariBank, then send us the screenshot on Instagram so we can confirm it.</p>
    <table style="width:100%;margin-bottom:10px;">
      ${row("Order number", `<strong>${orderNumber}</strong>`)}
      ${row("Status", "Awaiting payment")}
      ${row("Payment details", `<a href="${orderUrl}" style="color:#75845c;">${orderUrl}</a>`)}
    </table>
    <h2 style="font-size:14px;margin:14px 0 8px;">Your tiny things</h2>
    ${itemsHtml(snapshot)}
    ${totalsHtml(snapshot)}
    <h2 style="font-size:14px;margin:16px 0 8px;">How to pay</h2>
    <p style="font-size:13px;margin:0 0 10px;">Send exactly <strong>${formatMoney(snapshot.total)}</strong> to either account below, then send the screenshot and your order number to <strong>@${INSTAGRAM_HANDLE}</strong> on Instagram.</p>
    <table style="width:100%;">
      ${PAYMENT_METHODS.map((m) => row(esc(m.numberLabel), `<strong style="font-size:15px;">${esc(m.number)}</strong>`)).join("")}
    </table>
    <p style="font-size:12px;color:#6a5a48;margin-top:10px;">We will never ask for your OTP, PIN, or banking password.</p>
    <p style="font-size:12px;color:#6a5a48;margin-top:12px;">Your order is not confirmed until we've checked your payment screenshot. If anything above isn't right, just reply to this email.</p>`;
  return {
    to: snapshot.customer.email,
    subject: `Your Little Bookshop order ${orderNumber} — how to pay 📚`,
    html: wrap("Your little order is almost ours", body),
    text: [
      `Thanks for your order ${orderNumber}!`,
      `Total to send: ${formatMoney(snapshot.total)}`,
      ...PAYMENT_METHODS.map((m) => `${m.numberLabel}: ${m.number}`),
      `Send your screenshot and order number to @${INSTAGRAM_HANDLE} on Instagram.`,
      `Payment page: ${orderUrl}`,
    ].join("\n"),
  };
}

export function contactEmail(to: string, name: string, fromEmail: string, message: string): Mail {
  return {
    to,
    subject: `📮 Message from ${name} · the website contact form`,
    html: wrap(
      "New message from the contact form",
      `<table style="width:100%;">${row("From", `${esc(name)} &lt;${esc(fromEmail)}&gt;`)}</table>
       <p style="font-size:13px;white-space:pre-wrap;">${esc(message)}</p>`,
    ),
    text: `From ${name} <${fromEmail}>: ${message}`,
  };
}
