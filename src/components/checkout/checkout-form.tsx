"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validations/checkout.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PickupTimeSelector } from "./pickup-time-selector";

interface CheckoutFormProps {
  vendorSlug: string;
  onSubmit: (values: CheckoutFormValues) => void;
  isSubmitting: boolean;
  children: React.ReactNode;
}

export function CheckoutForm({ vendorSlug, onSubmit, isSubmitting, children }: CheckoutFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <h2 className="mb-3 text-base font-bold text-gray-900">Your details</h2>
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
        <h2 className="mb-3 text-base font-bold text-gray-900">Pickup time</h2>
        <Controller
          control={control}
          name="pickupTime"
          render={({ field }) => (
            <PickupTimeSelector
              vendorSlug={vendorSlug}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.pickupTime && (
          <p className="mt-1.5 text-xs text-red-500">{errors.pickupTime.message}</p>
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
