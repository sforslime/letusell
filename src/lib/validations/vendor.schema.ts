import { z } from "zod";

export const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name is required"),
  description: z.string().max(1000).optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  location_text: z.string().min(2, "Location is required"),
  phone: z.string().optional().or(z.literal("")),
  avg_prep_time: z.number().int().min(5).max(120).default(15),
  min_order: z.number().min(0).default(0),
  opens_at: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  closes_at: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;
