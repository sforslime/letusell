"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ShoppingBag } from "lucide-react";

interface SidebarLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface DashboardSidebarProps {
  links: SidebarLink[];
  title: string;
}

export function DashboardSidebar({ links, title }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 flex-shrink-0 border-r border-gray-100 bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-gray-100 px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">{title}</span>
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
      </nav>
    </aside>
  );
}
