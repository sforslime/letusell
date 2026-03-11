import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^(\+?234|0)[789]\d{9}$/, "Enter a valid Nigerian phone number")
    .optional()
    .or(z.literal("")),
  pickupTime: z.string({ error: "Please select a pickup time" }).min(1, "Please select a pickup time"),
  notes: z.string().max(300, "Notes must be under 300 characters").optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
