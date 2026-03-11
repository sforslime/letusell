"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ArrowLeft } from "lucide-react";

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

  return (
    <aside className="hidden w-60 flex-shrink-0 border-r border-gray-100 bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-gray-100 px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-8 w-32 overflow-hidden">
            <Image
              src="/logo.png"
              alt={title}
              fill
              className="object-cover object-center"
            />
          </div>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
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
    </aside>
  );
}
