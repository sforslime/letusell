import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSubaccount } from "@/lib/paystack/subaccount";

async function getVendor(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const admin = getSupabaseAdminClient();
  const { data: { user } } = await admin.auth.getUser(authHeader.slice(7));
  if (!user) return null;
  const { data: vendor } = await admin.from("vendors").select("id, name").eq("owner_id", user.id).single();
  return vendor ?? null;
}

export async function GET(req: NextRequest) {
  const vendor = await getVendor(req);
  if (!vendor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("vendor_payout_info")
    .select("*")
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  return NextResponse.json({ payout: data ?? null });
}

export async function POST(req: NextRequest) {
  const vendor = await getVendor(req);
  if (!vendor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    bank_code: string;
    account_number: string;
    account_name: string;
    settlement_bank: string;
    percentage_charge?: number;
  };

  if (!body.bank_code || !body.account_number || !body.account_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let subaccountCode: string | null = null;
  let subaccountId: string | null = null;

  try {
    const result = await createSubaccount({
      businessName: vendor.name,
      settlementBank: body.bank_code,
      accountNumber: body.account_number,
      percentageCharge: body.percentage_charge ?? 0,
    });
    subaccountCode = result.subaccount_code;
    subaccountId = String(result.id);
  } catch (err) {
    console.error("Paystack subaccount creation failed:", err);
    // Store info even if subaccount creation fails — vendor can retry
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("vendor_payout_info")
    .upsert(
      {
        vendor_id: vendor.id,
        bank_code: body.bank_code,
        account_number: body.account_number,
        account_name: body.account_name,
        settlement_bank: body.settlement_bank ?? null,
        percentage_charge: body.percentage_charge ?? 0,
        paystack_subaccount_code: subaccountCode,
        paystack_subaccount_id: subaccountId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "vendor_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ payout: data, subaccountCode });
}
