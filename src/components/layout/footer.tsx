import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center">
              <div className="relative h-8 w-36 overflow-hidden">
                <Image src="/logo.png" alt={siteConfig.name} fill className="object-cover object-center" />
              </div>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Campus food ordering made simple. Browse, order, and pick up — no cash needed.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Platform</p>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <Link href="/vendors" className="hover:text-brand-600 transition-colors">Browse vendors</Link>
              <Link href="/auth/signup" className="hover:text-brand-600 transition-colors">Create account</Link>
              <Link href="/auth/login" className="hover:text-brand-600 transition-colors">Sign in</Link>
              <Link href="/help" className="hover:text-brand-600 transition-colors">Help & Contact</Link>
            </div>
          </div>

          {/* University */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Campus</p>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <span>{siteConfig.universityName}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Active campus
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p className="text-xs text-gray-400">Built for campus communities</p>
        </div>
      </div>
    </footer>
  );
}
