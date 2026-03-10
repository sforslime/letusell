import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generatePickupSlots } from "@/lib/utils/date";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const admin = getSupabaseAdminClient();
  const { data: vendor } = await admin
    .from("vendors")
    .select("opens_at, closes_at, avg_prep_time")
    .eq("slug", slug)
    .single();

  if (!vendor?.opens_at || !vendor?.closes_at) {
    // Vendor has no hours set — offer default slots
    const slots = generatePickupSlots("08:00", "22:00", vendor?.avg_prep_time ?? 15);
    return NextResponse.json({ slots });
  }

  const slots = generatePickupSlots(
    vendor.opens_at,
    vendor.closes_at,
    vendor.avg_prep_time
  );

  return NextResponse.json({ slots });
}
