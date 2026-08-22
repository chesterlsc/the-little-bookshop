"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function DevPayButtons({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (outcome: "paid" | "failed" | "cancelled") => {
    setBusy(outcome);
    await fetch("/api/dev/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, outcome }),
    });
    const from = outcome === "cancelled" ? "cancel" : "provider";
    router.push(`/checkout/result?order=${encodeURIComponent(orderNumber)}&from=${from}`);
  };

  return (
    <div className="mt-5 grid gap-2">
      <Button onClick={() => act("paid")} disabled={busy !== null}>
        {busy === "paid" ? "Simulating…" : "Simulate successful payment"}
      </Button>
      <Button variant="blush" onClick={() => act("failed")} disabled={busy !== null}>
        Simulate failed payment
      </Button>
      <Button variant="quiet" onClick={() => act("cancelled")} disabled={busy !== null}>
        Cancel and go back
      </Button>
    </div>
  );
}
