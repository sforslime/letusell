import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function getVendorId(slug: string): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("vendors")
    .select("id")
    .eq("slug", slug)
    .single();
  return data?.id ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ following: false, count: 0 });

  const vendorId = await getVendorId(slug);
  if (!vendorId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: follow }, { count }] = await Promise.all([
    supabase
      .from("vendor_follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("vendor_id", vendorId)
      .maybeSingle(),
    supabase
      .from("vendor_follows")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId),
  ]);

  return NextResponse.json({ following: !!follow, count: count ?? 0 });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendorId = await getVendorId(slug);
  if (!vendorId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase
    .from("vendor_follows")
    .upsert({ user_id: user.id, vendor_id: vendorId }, { onConflict: "user_id,vendor_id" });

  return NextResponse.json({ following: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendorId = await getVendorId(slug);
  if (!vendorId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase
    .from("vendor_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("vendor_id", vendorId);

  return NextResponse.json({ following: false });
}
