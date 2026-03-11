import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing order ID" }, { status: 400 });

  const admin = getSupabaseAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select(`
      id, user_id, status, payment_status, amount_kobo, pickup_time,
      customer_name, customer_email, notes, created_at,
      order_items (id, item_name, item_price, quantity, subtotal, notes),
      vendors (id, name, slug, logo_url, location_text)
    `)
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
