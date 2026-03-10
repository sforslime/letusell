import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { email, orderId } = await req.json();

  if (!email || !orderId) {
    return NextResponse.json({ error: "Email and order ID required" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, customer_email, status, payment_status, amount_kobo, pickup_time, created_at")
    .eq("id", orderId)
    .eq("customer_email", email.toLowerCase())
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
