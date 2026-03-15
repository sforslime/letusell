"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const categories = siteConfig.categories.filter((c) => c.value !== "all");

const schema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
    vendor_name: z.string().min(2, "Brand name must be at least 2 characters"),
    category: z.enum(["local_food", "fast_food", "snacks", "drinks", "pastries", "other"]),
    description: z.string().max(1000).optional().or(z.literal("")),
    location_text: z.string().min(2, "Location on campus is required"),
    phone: z
      .string()
      .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

export function VendorApplyForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "other" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const res = await fetch("/api/vendors/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        vendor_name: values.vendor_name,
        category: values.category,
        description: values.description || undefined,
        location_text: values.location_text,
        phone: values.phone || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">Application submitted!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Check your inbox for a verification email and click the link to confirm your account.
          Once verified, our team will review your application and approve your vendor profile.
        </p>
        <p className="mt-4 text-xs text-gray-400">
          You&apos;ll be able to log in and set up your menu after approval.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Account section */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
          Your account
        </h2>
        <div className="flex flex-col gap-3">
          <Input
            label="Full name"
            placeholder="Jane Doe"
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />
          </div>
        </div>
      </div>

      {/* Brand section */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
          Your brand
        </h2>
        <div className="flex flex-col gap-3">
          <Input
            label="Brand / business name"
            placeholder="Mama Buka Kitchen"
            error={errors.vendor_name?.message}
            {...register("vendor_name")}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register("category")}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
              <option value="other">Other</option>
            </select>
            {errors.category && (
              <p className="text-xs text-red-500">{errors.category.message}</p>
            )}
          </div>

          <Textarea
            label="Description (optional)"
            placeholder="Tell students what you sell, your specialty, or anything that makes your brand unique…"
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Location on campus"
              placeholder="Block A, Main Square"
              error={errors.location_text?.message}
              {...register("location_text")}
            />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="08012345678"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
        Submit application
      </Button>
    </form>
  );
}
