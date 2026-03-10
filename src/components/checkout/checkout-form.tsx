"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validations/checkout.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PickupTimeSelector } from "./pickup-time-selector";

interface CheckoutFormProps {
  vendorSlug: string;
  onSubmit: (values: CheckoutFormValues) => void;
  isSubmitting: boolean;
  children: React.ReactNode; // Payment button slot
}

export function CheckoutForm({ vendorSlug, onSubmit, isSubmitting, children }: CheckoutFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  const pickupTime = watch("pickupTime");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Your details</h2>
        <div className="flex flex-col gap-3">
          <Input
            label="Full name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Phone number (optional)"
            type="tel"
            placeholder="08012345678"
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Pickup time</h2>
        <PickupTimeSelector
          vendorSlug={vendorSlug}
          value={pickupTime}
          onChange={(v) => setValue("pickupTime", v, { shouldValidate: true })}
        />
        {errors.pickupTime && (
          <p className="mt-1 text-xs text-red-500">{errors.pickupTime.message}</p>
        )}
      </div>

      <div>
        <Textarea
          label="Order notes (optional)"
          placeholder="Allergies, special requests..."
          error={errors.notes?.message}
          {...register("notes")}
        />
      </div>

      <div className="mt-2">{children}</div>
    </form>
  );
}
