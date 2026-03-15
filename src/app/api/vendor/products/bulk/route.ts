import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const admin = getSupabaseAdminClient();

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await admin
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!vendor) return NextResponse.json({ error: "No vendor account" }, { status: 403 });

  const body = await req.json() as { ids: string[]; is_available: boolean };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "No item IDs provided" }, { status: 400 });
  }

  const { error } = await admin
    .from("products")
    .update({ is_available: body.is_available })
    .in("id", body.ids)
    .eq("vendor_id", vendor.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ updated: body.ids.length });
}
