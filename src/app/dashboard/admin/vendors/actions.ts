"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface CreateVendorState {
  error?: string;
  success?: boolean;
}

const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required.").max(100),
  slug: z.string().max(100).optional(),
  category: z.enum(["food_drinks", "fashion", "beauty", "accessories", "stationery", "electronics", "services", "other"]).default("other"),
  description: z.string().max(500).optional(),
  location_text: z.string().max(200).optional(),
  phone: z.string().regex(/^\+?[\d\s()-]{7,20}$/, "Invalid phone number.").optional().or(z.literal("")),
  opens_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM).").optional().or(z.literal("")),
  closes_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM).").optional().or(z.literal("")),
  avg_prep_time: z.coerce.number().int().min(1).max(120).default(15),
  owner_email: z.string().email("Invalid email address.").optional().or(z.literal("")),
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

export async function createVendor(
  _prev: CreateVendorState,
  formData: FormData
): Promise<CreateVendorState> {
  const raw = {
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim() || undefined,
    category: (formData.get("category") as string)?.trim() || "other",
    description: (formData.get("description") as string)?.trim() || undefined,
    location_text: (formData.get("location_text") as string)?.trim() || undefined,
    phone: (formData.get("phone") as string)?.trim() || "",
    opens_at: (formData.get("opens_at") as string)?.trim() || "",
    closes_at: (formData.get("closes_at") as string)?.trim() || "",
    avg_prep_time: formData.get("avg_prep_time") as string,
    owner_email: (formData.get("owner_email") as string)?.trim() || "",
  };

  const parsed = createVendorSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, category, avg_prep_time } = parsed.data;
  const slugInput = parsed.data.slug;
  const description = parsed.data.description || null;
  const location_text = parsed.data.location_text || null;
  const phone = parsed.data.phone || null;
  const opens_at = parsed.data.opens_at || null;
  const closes_at = parsed.data.closes_at || null;
  const owner_email = parsed.data.owner_email || null;

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
