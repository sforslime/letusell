import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generatePickupSlots } from "@/lib/utils/date";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Optional ?date=YYYY-MM-DD query param (defaults to today)
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const requestedDate = dateParam ?? new Date().toISOString().slice(0, 10);

  const admin = getSupabaseAdminClient();
  const { data: vendor } = await admin
    .from("vendors")
    .select("id, opens_at, closes_at, avg_prep_time")
    .eq("slug", slug)
    .single();

  if (!vendor) {
    return NextResponse.json({ slots: [] });
  }

  // Check special closure for this date
  const { data: closure } = await admin
    .from("vendor_special_closures")
    .select("id")
    .eq("vendor_id", vendor.id)
    .eq("closure_date", requestedDate)
    .maybeSingle();

  if (closure) {
    return NextResponse.json({ slots: [], closed: true, reason: "Special closure" });
  }

  // day_of_week: 0=Mon, 6=Sun (matching our migration)
  const dayOfWeek = (new Date(requestedDate).getDay() + 6) % 7;

  const { data: dayHours } = await admin
    .from("vendor_hours")
    .select("opens_at, closes_at, is_closed")
    .eq("vendor_id", vendor.id)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (dayHours) {
    if (dayHours.is_closed || !dayHours.opens_at || !dayHours.closes_at) {
      return NextResponse.json({ slots: [], closed: true });
    }
    const slots = generatePickupSlots(dayHours.opens_at, dayHours.closes_at, vendor.avg_prep_time);
    return NextResponse.json({ slots });
  }

  // Fall back to vendor.opens_at/closes_at or defaults
  if (!vendor.opens_at || !vendor.closes_at) {
    const slots = generatePickupSlots("08:00", "22:00", vendor.avg_prep_time ?? 15);
    return NextResponse.json({ slots });
  }

  const slots = generatePickupSlots(vendor.opens_at, vendor.closes_at, vendor.avg_prep_time);
  return NextResponse.json({ slots });
}
