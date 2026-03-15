import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Clock, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNGN } from "@/lib/utils/currency";
import type { Vendor } from "@/types/database.types";

interface VendorCardProps {
  vendor: Vendor;
}

function isVendorOpen(vendor: Vendor): boolean {
  if (!vendor.opens_at || !vendor.closes_at) return true;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = vendor.opens_at.split(":").map(Number);
  const [ch, cm] = vendor.closes_at.split(":").map(Number);
  return current >= oh * 60 + om && current < ch * 60 + cm;
}

const categoryLabels: Record<string, string> = {
  food_drinks: "Food & Drinks",
  fashion: "Fashion",
  beauty: "Beauty & Wellness",
  accessories: "Accessories",
  stationery: "Books & Stationery",
  electronics: "Electronics & Tech",
  services: "Services",
  other: "Other",
  // legacy values
  local_food: "Food & Drinks",
  fast_food: "Food & Drinks",
  snacks: "Food & Drinks",
  drinks: "Food & Drinks",
  pastries: "Food & Drinks",
};

export function VendorCard({ vendor }: VendorCardProps) {
  const open = isVendorOpen(vendor);

  return (
    <Link href={`/vendors/${vendor.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        {/* Banner */}
        <div className="relative h-44 w-full bg-gradient-to-br from-brand-100 to-brand-200 overflow-hidden">
          {vendor.banner_url ? (
            <Image
              src={vendor.banner_url}
              alt={vendor.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Store className="h-12 w-12 text-brand-300 opacity-60" />
            </div>
          )}
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute right-3 top-3">
            <Badge variant={open ? "success" : "outline"}>
              {open ? "Open" : "Closed"}
            </Badge>
          </div>
          {/* Logo overlapping the banner */}
          {vendor.logo_url && (
            <div className="absolute bottom-3 left-3 h-10 w-10 overflow-hidden rounded-xl border-2 border-white shadow-md">
              <Image
                src={vendor.logo_url}
                alt={`${vendor.name} logo`}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
              {vendor.name}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
              {categoryLabels[vendor.category] ?? vendor.category}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {vendor.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-700">{vendor.rating.toFixed(1)}</span>
                <span className="text-gray-400">({vendor.review_count})</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {vendor.avg_prep_time} min
            </span>
            {vendor.location_text && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                <span className="truncate">{vendor.location_text}</span>
              </span>
            )}
          </div>

          {vendor.min_order > 0 && (
            <p className="mt-2.5 text-xs text-gray-400 border-t border-gray-50 pt-2.5">
              Min. order: <span className="font-medium text-gray-600">{formatNGN(vendor.min_order)}</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
