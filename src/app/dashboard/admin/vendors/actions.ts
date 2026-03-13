"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface CreateVendorState {
  error?: string;
  success?: boolean;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-|-$/g, "");
}

export async function createVendor(
  _prev: CreateVendorState,
  formData: FormData
): Promise<CreateVendorState> {
  const name = (formData.get("name") as string)?.trim();
  const slugInput = (formData.get("slug") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || "other";
  const description = (formData.get("description") as string)?.trim() || null;
  const location_text = (formData.get("location_text") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const opens_at = (formData.get("opens_at") as string)?.trim() || null;
  const closes_at = (formData.get("closes_at") as string)?.trim() || null;
  const avg_prep_time = parseInt(formData.get("avg_prep_time") as string) || 15;
  const owner_email = (formData.get("owner_email") as string)?.trim() || null;

  if (!name) return { error: "Vendor name is required." };

  const admin = getSupabaseAdminClient();

  // Get university_id
  const { data: universities } = await admin.from("universities").select("id").limit(1);
  const university_id = universities?.[0]?.id;
  if (!university_id) return { error: "No university found. Set one up first." };

  // Build unique slug
  let baseSlug = slugInput ? slugify(slugInput) : slugify(name);
  if (!baseSlug) baseSlug = "vendor";

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

  // Resolve owner_id from email if provided
  let owner_id: string | null = null;
  if (owner_email) {
    const { data: { users } } = await admin.auth.admin.listUsers();
    const match = users.find((u) => u.email === owner_email);
    if (!match) return { error: `No account found for ${owner_email}.` };
    owner_id = match.id;
  }

  // Create vendor (pre-approved since admin is creating it)
  const { data: vendor, error: vendorErr } = await admin
    .from("vendors")
    .insert({
      university_id,
      owner_id,
      name,
      slug,
      description,
      category,
      location_text,
      phone,
      opens_at: opens_at || null,
      closes_at: closes_at || null,
      avg_prep_time,
      is_approved: true,
      is_active: true,
    })
    .select("id")
    .single();

  if (vendorErr) return { error: vendorErr.message };

  // Create default menu
  await admin.from("menus").insert({ vendor_id: vendor.id, name: "Menu" });

  // Promote owner role to vendor
  if (owner_id) {
    await admin.from("profiles").update({ role: "vendor" }).eq("id", owner_id);
  }

  revalidatePath("/dashboard/admin/vendors");
  return { success: true };
}
