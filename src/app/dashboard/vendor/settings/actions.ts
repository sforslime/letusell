"use server";

import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  description: z.string().max(500).optional(),
  location_text: z.string().max(200).optional(),
  phone: z
    .string()
    .regex(/^(\+?[\d\s\-()]{7,20})?$/, "Invalid phone number")
    .optional(),
  opens_at: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:MM")
    .or(z.literal(""))
    .optional(),
  closes_at: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:MM")
    .or(z.literal(""))
    .optional(),
  avg_prep_time: z.coerce.number().int().min(1).max(120),
  min_order: z.coerce.number().min(0),
});

export async function saveVendorSettings(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Confirm role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor") {
    return { error: "Unauthorized" };
  }

  // Confirm vendor ownership
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!vendor) {
    return { error: "Vendor not found" };
  }

  const raw = {
    description: formData.get("description") ?? "",
    location_text: formData.get("location_text") ?? "",
    phone: formData.get("phone") ?? "",
    opens_at: formData.get("opens_at") ?? "",
    closes_at: formData.get("closes_at") ?? "",
    avg_prep_time: formData.get("avg_prep_time"),
    min_order: formData.get("min_order"),
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `${first.path.join(".")}: ${first.message}` };
  }

  const { avg_prep_time, min_order, opens_at, closes_at, ...rest } = parsed.data;

  const { error } = await supabase
    .from("vendors")
    .update({
      ...rest,
      avg_prep_time,
      min_order,
      opens_at: opens_at || null,
      closes_at: closes_at || null,
    })
    .eq("id", vendor.id);

  if (error) {
    return { error: "Failed to save settings" };
  }

  return { success: true };
}
