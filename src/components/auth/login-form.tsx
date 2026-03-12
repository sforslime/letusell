"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ email, password }: FormValues) {
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>
        <Input
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <Button type="submit" loading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
