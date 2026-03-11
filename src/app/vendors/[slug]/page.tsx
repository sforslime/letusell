import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { VendorStatusBadge } from "@/components/vendor/vendor-status-badge";
import { MenuSection } from "@/components/menu/menu-section";
import { MapPin, Clock, Star, Phone } from "lucide-react";
import Image from "next/image";
import type { Vendor, MenuItem, MenuItemCategory } from "@/types/database.types";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("vendors")
    .select("slug")
    .eq("is_approved", true)
    .eq("is_active", true);
  return (data ?? []).map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("name, description, location_text")
    .eq("slug", slug)
    .single();

  if (!vendor) return { title: "Vendor not found" };

  return {
    title: vendor.name,
    description: vendor.description ?? `Order from ${vendor.name} on campus`,
    openGraph: {
      title: vendor.name,
      description: vendor.description ?? `Order from ${vendor.name}`,
    },
  };
}

export default async function VendorStorefront({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("slug", slug)
    .eq("is_approved", true)
    .single();

  if (!vendor) notFound();

  // Fetch menu items and categories
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("vendor_id", vendor.id)
    .eq("is_available", true)
    .order("sort_order");

  const { data: categories } = await supabase
    .from("menu_item_categories")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("sort_order");

  const vendorSummary = { id: vendor.id, name: vendor.name, slug: vendor.slug };

  // Group items by category
  const uncategorized = (menuItems ?? []).filter((i) => !i.category_id);
  const byCategory = (categories ?? []).map((cat) => ({
    category: cat as MenuItemCategory,
    items: (menuItems ?? []).filter((i) => i.category_id === cat.id) as MenuItem[],
  }));

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: vendor.name,
    description: vendor.description,
    address: { "@type": "PostalAddress", streetAddress: vendor.location_text },
    telephone: vendor.phone,
    servesCuisine: vendor.category,
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main>
        {/* Banner with vendor identity overlaid at bottom */}
        <div className="relative h-52 w-full bg-gradient-to-br from-brand-500 to-brand-800 sm:h-64">
          {vendor.banner_url && (
            <Image
              src={vendor.banner_url}
              alt={vendor.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
          {/* Gradient overlay — stronger at bottom for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Vendor name + logo inside banner, anchored to bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 sm:px-6">
            <div className="mx-auto max-w-4xl flex items-end gap-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-lg">
                {vendor.logo_url ? (
                  <Image src={vendor.logo_url} alt={`${vendor.name} logo`} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🍽️</div>
                )}
              </div>
              <div className="pb-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">{vendor.name}</h1>
                  <VendorStatusBadge vendor={vendor as Vendor} />
                </div>
                {vendor.description && (
                  <p className="mt-0.5 text-sm text-white/70 line-clamp-1">{vendor.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info strip */}
        <div className="border-b border-gray-100 bg-white shadow-sm">
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500">
              {vendor.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-700">{vendor.rating.toFixed(1)}</span>
                  <span>({vendor.review_count} reviews)</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                ~{vendor.avg_prep_time} min prep
              </span>
              {vendor.location_text && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {vendor.location_text}
                </span>
              )}
              {vendor.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {vendor.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6">
          {byCategory.length === 0 && uncategorized.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-lg font-medium">No menu items available yet.</p>
              <p className="mt-1 text-sm">Check back soon.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {byCategory.map(({ category, items }) => (
                <MenuSection
                  key={category.id}
                  category={category}
                  items={items}
                  vendor={vendorSummary}
                />
              ))}
              {uncategorized.length > 0 && (
                <MenuSection
                  category={null}
                  items={uncategorized as MenuItem[]}
                  vendor={vendorSummary}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
