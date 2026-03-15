import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  vendor_name: z.string().min(2, "Brand name must be at least 2 characters"),
  category: z.enum(["local_food", "fast_food", "snacks", "drinks", "pastries", "other"]),
  description: z.string().max(1000).optional(),
  location_text: z.string().min(2, "Location is required"),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const { full_name, email, password, vendor_name, category, description, location_text, phone } =
    parsed.data;

  const admin = getSupabaseAdminClient();

  // Get university_id
  const { data: universities } = await admin.from("universities").select("id").limit(1);
  const university_id = universities?.[0]?.id;
  if (!university_id) {
    return NextResponse.json({ error: "Platform not configured" }, { status: 500 });
  }

  // Create auth user — email_confirm: false so they still verify via email link
  const { data: userData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name },
    email_confirm: false,
  });

  if (authError) {
    const msg = authError.message.includes("already registered")
      ? "An account with this email already exists."
      : authError.message;
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const userId = userData.user.id;

  // Build unique slug
  const baseSlug = slugify(vendor_name) || "vendor";
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const { data: existing } = await admin
      .from("vendors")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  // Create vendor (pending approval)
  const { data: vendor, error: vendorError } = await admin
    .from("vendors")
    .insert({
      university_id,
      owner_id: userId,
      name: vendor_name,
      slug,
      description: description || null,
      category,
      location_text,
      phone: phone || null,
      is_approved: false,
      is_active: true,
    })
    .select("id")
    .single();

  if (vendorError) {
    // Roll back the created user to avoid orphaned accounts
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Failed to create vendor application" }, { status: 500 });
  }

  // Create default menu
  await admin.from("menus").insert({ vendor_id: vendor.id, name: "Menu" });

  return NextResponse.json({ success: true });
}
