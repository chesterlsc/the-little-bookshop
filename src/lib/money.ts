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
