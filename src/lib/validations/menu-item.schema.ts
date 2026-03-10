import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z
    .number({ invalid_type_error: "Enter a valid price" })
    .min(50, "Minimum price is ₦50")
    .max(100_000, "Maximum price is ₦100,000"),
  category_id: z.string().uuid().optional().or(z.literal("")),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
});

export type MenuItemFormValues = z.infer<typeof menuItemSchema>;
