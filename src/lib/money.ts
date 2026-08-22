/** All prices are stored as integer centavos (PHP) to avoid float drift. */
export type Cents = number;

export const CURRENCY = "PHP" as const;

export function formatMoney(cents: Cents): string {
  return (cents / 100).toLocaleString("en-PH", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 2,
  });
}

/** Formats a price range like "₱349.00 to ₱379.00", or a single price when equal. */
export function formatRange(min: Cents, max: Cents): string {
  if (min === max) return formatMoney(min);
  return `${formatMoney(min)} to ${formatMoney(max)}`;
}
