/**
 * Gift card guesses per address, shared by the two doors a code can be tried
 * at: the checkout's "Use card" preview, and placing an order with a code.
 *
 * A code is eight characters from thirty-one (about 850 billion), so this is
 * not what keeps a card safe. It is what makes guessing not worth starting.
 * ponytail: in-memory and per instance, like the signup throttle. Move it into
 * the database if a card is ever actually guessed.
 */
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 12;

export function giftGuessThrottled(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear(); // never let a flood grow the map unbounded
  return hits.length > PER_WINDOW;
}

export const GIFT_SLOW = "That's a lot of tries. Give it a few minutes, or message us on Instagram.";
