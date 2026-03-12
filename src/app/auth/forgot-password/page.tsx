"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: FormValues) {
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block">
          <div className="relative h-9 w-40 overflow-hidden">
            <Image src="/logo.png" alt="LetuSell" fill className="object-cover object-center" />
          </div>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {sent ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">Check your inbox</p>
              <p className="mt-1 text-sm text-gray-500">
                A reset link has been sent if that email is registered.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
              <Button type="submit" loading={isSubmitting} className="w-full">
                Send reset link
              </Button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          <Link href="/auth/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
