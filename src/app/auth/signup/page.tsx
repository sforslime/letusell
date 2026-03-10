import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-brand-500 to-brand-800 p-12 text-white">
        <Link href="/">
          <div className="relative h-10 w-48 overflow-hidden">
            <Image src="/logo.png" alt="LetuSell" fill className="object-cover object-center brightness-0 invert" />
          </div>
        </Link>
        <div>
          <p className="text-4xl font-bold leading-tight">Join campus food ordering today.</p>
          <ul className="mt-6 space-y-3 text-white/80">
            <li className="flex items-center gap-2"><span className="text-orange-300">✓</span> Order from any campus vendor</li>
            <li className="flex items-center gap-2"><span className="text-orange-300">✓</span> Track your orders in real-time</li>
            <li className="flex items-center gap-2"><span className="text-orange-300">✓</span> Earn loyalty points on every order</li>
          </ul>
        </div>
        <p className="text-sm text-white/50">© 2026 LetuSell</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 block lg:hidden">
            <div className="relative h-9 w-40 overflow-hidden">
              <Image src="/logo.png" alt="LetuSell" fill className="object-cover object-center" />
            </div>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">It&apos;s free — earn points on every order</p>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <SignupForm />
          </div>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
