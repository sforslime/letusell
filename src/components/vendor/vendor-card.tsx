import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Clock } from "lucide-react";
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
  local_food: "Local Dishes",
  fast_food: "Fast Food",
  snacks: "Snacks",
  drinks: "Drinks",
  pastries: "Pastries",
  other: "Other",
};

export function VendorCard({ vendor }: VendorCardProps) {
  const open = isVendorOpen(vendor);

  return (
    <Link href={`/vendors/${vendor.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* Banner */}
        <div className="relative h-40 w-full bg-gradient-to-br from-brand-100 to-brand-200">
          {vendor.banner_url ? (
            <Image
              src={vendor.banner_url}
              alt={vendor.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-5xl">🍽️</span>
            </div>
          )}
          <div className="absolute right-3 top-3">
            <Badge variant={open ? "success" : "outline"}>
              {open ? "Open" : "Closed"}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                {vendor.name}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {categoryLabels[vendor.category] ?? vendor.category}
              </p>
            </div>
            {vendor.logo_url && (
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100">
                <Image
                  src={vendor.logo_url}
                  alt={`${vendor.name} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
            {vendor.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {vendor.rating.toFixed(1)}
                <span className="text-gray-400">({vendor.review_count})</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {vendor.avg_prep_time} min
            </span>
            {vendor.location_text && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{vendor.location_text}</span>
              </span>
            )}
          </div>

          {vendor.min_order > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              Min. order: {formatNGN(vendor.min_order)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
