import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your LetuSell account to shop from campus vendors.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left — branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-brand-500 to-brand-800 p-12 text-white">
        <Link href="/">
          <div className="relative h-10 w-48 overflow-hidden">
            <Image src="/logo.png" alt="LetuSell" fill className="object-cover object-center brightness-0 invert" />
          </div>
        </Link>
        <div>
          <p className="text-4xl font-bold leading-tight">&ldquo;Campus shopping, your way.&rdquo;</p>
          <p className="mt-4 text-white/70">Shop from your favourite campus brands and pick up when it&apos;s ready.</p>
        </div>
        <p className="text-sm text-white/50">© 2026 LetuSell</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 block lg:hidden">
            <div className="relative h-9 w-40 overflow-hidden">
              <Image src="/logo.png" alt="LetuSell" fill className="object-cover object-center" />
            </div>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account to continue</p>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-5 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign up free
            </Link>
          </p>
          <p className="mt-3 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
              Continue browsing as guest →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
