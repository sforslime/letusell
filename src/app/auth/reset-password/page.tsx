"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ["confirm"],
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ password }: FormValues) {
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/auth/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block">
          <div className="relative h-9 w-40 overflow-hidden">
            <Image src="/logo.png" alt="LetuSell" fill className="object-cover object-center" />
          </div>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
        <p className="mt-1 text-sm text-gray-500">Choose a new password for your account.</p>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              error={errors.confirm?.message}
              {...register("confirm")}
            />
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" loading={isSubmitting} className="w-full">
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
