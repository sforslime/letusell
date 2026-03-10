import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction } from "@/lib/paystack/client";
import { nairaToKobo } from "@/lib/utils/currency";
import { siteConfig } from "@/config/site";
import type { CheckoutInitializeRequest } from "@/types/api.types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutInitializeRequest;
    const { cart, customer, vendorId, pickupTime, notes } = body;

    if (!cart?.length || !customer?.email || !customer?.name || !vendorId || !pickupTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();

    // Validate vendor exists and is approved
    const { data: vendor } = await admin
      .from("vendors")
      .select("id, is_approved, is_active, university_id")
      .eq("id", vendorId)
      .single();

    if (!vendor || !vendor.is_approved || !vendor.is_active) {
      return NextResponse.json({ error: "Vendor unavailable" }, { status: 422 });
    }

    // Validate all cart items and re-price server-side
    const itemIds = cart.map((i) => i.menuItemId);
    const { data: menuItems } = await admin
      .from("menu_items")
      .select("id, name, price, is_available, vendor_id")
      .in("id", itemIds);

    if (!menuItems || menuItems.length !== itemIds.length) {
      return NextResponse.json({ error: "Some items are no longer available" }, { status: 409 });
    }

    // Check all items belong to the vendor and are available
    const unavailable = menuItems.filter(
      (mi) => !mi.is_available || mi.vendor_id !== vendorId
    );
    if (unavailable.length > 0) {
      return NextResponse.json(
        { error: "Some items are unavailable", items: unavailable.map((i) => i.name) },
        { status: 409 }
      );
    }

    // Build item map for fast lookup
    const itemMap = new Map(menuItems.map((mi) => [mi.id, mi]));

    // Calculate total using server-side prices
    let totalNaira = 0;
    const orderItemsPayload = cart.map((cartItem) => {
      const mi = itemMap.get(cartItem.menuItemId)!;
      totalNaira += mi.price * cartItem.quantity;
      return {
        menu_item_id: mi.id,
        item_name: mi.name,
        item_price: mi.price,
        quantity: cartItem.quantity,
        notes: cartItem.notes ?? null,
      };
    });

    const amountKobo = nairaToKobo(totalNaira);

    // Determine user_id if authenticated
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user } } = await admin.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // Create order row
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        university_id: vendor.university_id,
        vendor_id: vendorId,
        user_id: userId,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone ?? null,
        amount_kobo: amountKobo,
        status: "awaiting_payment",
        payment_status: "pending",
        pickup_time: pickupTime,
        notes: notes ?? null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Insert order items
    const { error: itemsError } = await admin.from("order_items").insert(
      orderItemsPayload.map((oi) => ({ ...oi, order_id: order.id }))
    );

    if (itemsError) {
      // Rollback order
      await admin.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: "Failed to save order items" }, { status: 500 });
    }

    // Initialize Paystack transaction
    const callbackUrl = `${siteConfig.url}/checkout/success?order_id=${order.id}`;
    const txn = await initializeTransaction({
      email: customer.email,
      amount: amountKobo,
      reference: order.id,
      callback_url: callbackUrl,
      metadata: { order_id: order.id, customer_name: customer.name },
    });

    // Store Paystack tokens on order
    await admin
      .from("orders")
      .update({
        paystack_reference: txn.reference,
        paystack_access_code: txn.access_code,
      })
      .eq("id", order.id);

    return NextResponse.json({
      orderId: order.id,
      accessCode: txn.access_code,
      reference: txn.reference,
      amount: amountKobo,
    });
  } catch (err) {
    console.error("Checkout init error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
