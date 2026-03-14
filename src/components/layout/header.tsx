"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, User, Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useRouter } from "next/navigation";

export function Header() {
  const { getItemCount, openDrawer } = useCart();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const itemCount = mounted ? getItemCount() : 0;

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-9 w-40 overflow-hidden">
              <Image src="/logo.png" alt={siteConfig.name} fill className="object-cover object-center" priority />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/vendors" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Vendors
            </Link>
            {user && profile?.role === "vendor" && (
              <Link href="/dashboard/vendor" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            )}
            {user && profile?.role === "admin" && (
              <Link href="/dashboard/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Admin
              </Link>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart button — opens drawer */}
            <Button variant="ghost" size="icon" className="relative" onClick={openDrawer} aria-label="Open cart">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Button>

            {/* Auth */}
            {user ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link href="/profile">
                  <Button variant="ghost" size="icon" aria-label="My profile">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Link href="/auth/login" className="hidden md:block">
                <Button size="sm" className="shadow-sm shadow-brand-500/20">Sign in</Button>
              </Link>
            )}

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              <Link href="/vendors" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>
                Vendors
              </Link>
              {user && profile?.role === "vendor" && (
                <Link href="/dashboard/vendor" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
              {user && profile?.role === "admin" && (
                <Link href="/dashboard/admin" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              )}
              {user ? (
                <>
                  <Link href="/profile" className="text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <button
                    className="text-left text-sm font-medium text-red-500"
                    onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="text-sm font-medium text-brand-600" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
    </header>
  );
}
