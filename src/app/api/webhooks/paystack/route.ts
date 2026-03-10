import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackSignature } from "@/lib/paystack/verify";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const rawBody = await req.text();

  // Always return 200 quickly to prevent Paystack retries
  // Verify signature first
  if (!verifyPaystackSignature(rawBody, signature)) {
    console.warn("Invalid Paystack webhook signature");
    return NextResponse.json({ received: false }, { status: 401 });
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  // Only handle successful charges
  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const { reference, amount: paidAmountKobo } = event.data as {
    reference: string;
    amount: number;
  };

  if (!reference) {
    return NextResponse.json({ received: true });
  }

  const admin = getSupabaseAdminClient();

  // Fetch the order by paystack_reference
  const { data: order } = await admin
    .from("orders")
    .select("id, amount_kobo, payment_status, user_id")
    .eq("paystack_reference", reference)
    .single();

  if (!order) {
    console.error(`Webhook: Order not found for reference ${reference}`);
    return NextResponse.json({ received: true });
  }

  // Idempotency: skip if already paid
  if (order.payment_status === "paid") {
    return NextResponse.json({ received: true });
  }

  // Verify amount matches
  if (paidAmountKobo < order.amount_kobo) {
    console.error(
      `Webhook: Amount mismatch for ${reference}. Expected ${order.amount_kobo}, got ${paidAmountKobo}`
    );
    await admin
      .from("orders")
      .update({ payment_status: "failed", status: "cancelled" })
      .eq("id", order.id);
    return NextResponse.json({ received: true });
  }

  // Confirm the order
  await admin
    .from("orders")
    .update({ payment_status: "paid", status: "confirmed" })
    .eq("id", order.id);

  // Award loyalty points (100 kobo = 1 naira = 1 point per ₦100 spent)
  if (order.user_id) {
    const points = Math.floor(paidAmountKobo / 10_000); // 1 point per ₦100
    if (points > 0) {
      await admin.rpc("increment_loyalty_points", {
        user_id: order.user_id,
        points,
      });
    }
  }

  console.log(`Order ${order.id} confirmed. Amount: ${paidAmountKobo} kobo`);
  return NextResponse.json({ received: true });
}
