import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">{siteConfig.name}</span>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Order campus food — fast, easy, and cashless.
          </p>
          <div className="flex items-center gap-5 text-sm text-gray-500">
            <Link href="/vendors" className="hover:text-gray-800 transition-colors">Vendors</Link>
            <Link href="/auth/login" className="hover:text-gray-800 transition-colors">Sign in</Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {siteConfig.name} · {siteConfig.universityName}
        </p>
      </div>
    </footer>
  );
}
