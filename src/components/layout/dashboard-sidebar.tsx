"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ArrowLeft, Menu, X } from "lucide-react";

interface SidebarLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface DashboardSidebarProps {
  links: SidebarLink[];
  title: string;
  vendorName?: string;
}

export function DashboardSidebar({ links, title, vendorName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = (
    <>
      <nav className="flex flex-col gap-1 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}

        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to site
        </Link>
      </nav>

      {vendorName && (
        <div className="mt-auto border-t border-gray-100 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">{vendorName}</p>
              <p className="text-xs text-gray-400">Vendor</p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-gray-100 px-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-32 overflow-hidden">
              <Image src="/logo.png" alt={title} fill className="object-cover object-center" />
            </div>
          </Link>
        </div>
        {navLinks}
      </aside>

      {/* Mobile top bar */}
      <div className="flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4 md:hidden">
        <Link href="/">
          <div className="relative h-7 w-28 overflow-hidden">
            <Image src="/logo.png" alt={title} fill className="object-cover object-center" />
          </div>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-gray-100 bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
              <Link href="/" onClick={() => setOpen(false)}>
                <div className="relative h-7 w-28 overflow-hidden">
                  <Image src="/logo.png" alt={title} fill className="object-cover object-center" />
                </div>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navLinks}
          </aside>
        </div>
      )}
    </>
  );
}
