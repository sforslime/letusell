import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing order ID" }, { status: 400 });

  const admin = getSupabaseAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, paystack_reference, amount_kobo, payment_status, user_id")
    .eq("id", id)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Already confirmed — return current state
  if (order.payment_status === "paid") {
    return NextResponse.json({ status: "paid" });
  }

  if (!order.paystack_reference) {
    return NextResponse.json({ status: order.payment_status });
  }

  // Ask Paystack directly
  let txn;
  try {
    txn = await verifyTransaction(order.paystack_reference);
  } catch {
    return NextResponse.json({ status: order.payment_status });
  }

  if (txn.status !== "success") {
    return NextResponse.json({ status: order.payment_status });
  }

  // Amount check
  if (txn.amount < order.amount_kobo) {
    await admin
      .from("orders")
      .update({ payment_status: "failed", status: "cancelled" })
      .eq("id", order.id);
    return NextResponse.json({ status: "failed" });
  }

  // Confirm the order
  await admin
    .from("orders")
    .update({ payment_status: "paid", status: "confirmed" })
    .eq("id", order.id);

  // Award loyalty points
  if (order.user_id) {
    const points = Math.floor(order.amount_kobo / 10_000);
    if (points > 0) {
      await admin.rpc("increment_loyalty_points", {
        user_id: order.user_id,
        points,
      });
    }
  }

  return NextResponse.json({ status: "paid" });
}
