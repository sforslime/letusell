import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z
    .number()
    .min(50, "Minimum price is ₦50")
    .max(100_000, "Maximum price is ₦100,000"),
  category_id: z.string().optional().or(z.literal("")),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  sort_order: z.number().int().min(0),
});

export type ProductFormValues = z.infer<typeof productSchema>;
