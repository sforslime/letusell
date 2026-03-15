import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { VendorStatusBadge } from "@/components/vendor/vendor-status-badge";
import { StickyCartBar } from "@/components/vendor/sticky-cart-bar";
import { StorefrontProducts } from "@/components/vendor/storefront-products";
import { MapPin, Clock, Star, Package, Store, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "@/components/vendor/follow-button";
import type { Vendor, Product, ProductCategory } from "@/types/database.types";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ReviewWithProfile {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
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

  const [{ data: products }, { data: categories }, { data: reviews }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("vendor_id", vendor.id)
      .eq("is_available", true)
      .order("sort_order"),
    supabase
      .from("product_categories")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("sort_order"),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, profiles(full_name)")
      .eq("vendor_id", vendor.id)
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const vendorSummary = { id: vendor.id, name: vendor.name, slug: vendor.slug };
  const typedReviews = (reviews ?? []) as unknown as ReviewWithProfile[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: vendor.name,
    description: vendor.description,
    address: { "@type": "PostalAddress", streetAddress: vendor.location_text },
    telephone: vendor.phone,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main>
        {/* Banner */}
        <div className="relative h-56 w-full bg-gradient-to-br from-brand-500 to-brand-800 sm:h-72 mt-6">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        </div>

        {/* Vendor Identity */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-4 pb-5">
              {/* Logo */}
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                {vendor.logo_url ? (
                  <Image src={vendor.logo_url} alt={`${vendor.name} logo`} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-100">
                    <Store className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Name + actions */}
              <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between pb-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{vendor.name}</h1>
                    <VendorStatusBadge vendor={vendor as Vendor} />
                  </div>
                  {vendor.description && (
                    <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{vendor.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <FollowButton slug={vendor.slug} />
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {vendor.location_text ?? "Campus"}
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                ~{vendor.avg_prep_time} mins prep
              </div>
              {vendor.rating > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-700">{vendor.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({vendor.review_count})</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                <Package className="h-3.5 w-3.5 text-gray-400" />
                {(products ?? []).length} items
              </div>
            </div>
          </div>
        </div>

        {/* Products section (client) */}
        <StorefrontProducts
          products={(products ?? []) as Product[]}
          categories={(categories ?? []) as ProductCategory[]}
          vendor={vendorSummary}
        />

        {/* About section */}
        <section className="bg-white border-t border-gray-100 mt-2">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">About {vendor.name}</h2>
                {vendor.description ? (
                  <p className="mt-3 text-gray-600 leading-relaxed">{vendor.description}</p>
                ) : (
                  <p className="mt-3 text-gray-400">No description available.</p>
                )}
                <div className="mt-6 flex flex-wrap gap-6">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Date(vendor.created_at).getFullYear()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Founded</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{vendor.review_count}+</p>
                    <p className="text-xs text-gray-500 mt-0.5">Reviews</p>
                  </div>
                  {vendor.rating > 0 && (
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{vendor.rating.toFixed(1)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Rating</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 lg:h-64">
                {vendor.banner_url && (
                  <Image
                    src={vendor.banner_url}
                    alt={vendor.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Reviews section */}
        <section className="mx-auto max-w-6xl px-4 py-12 pb-28 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            <Link
              href="/orders/lookup"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Write a review
            </Link>
          </div>

          {typedReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
              <p className="text-sm">Be the first to leave a review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {typedReviews.map((review) => {
                const name = review.profiles?.full_name ?? "Customer";
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div key={review.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                        <p className="text-xs text-gray-400">{timeAgo(review.created_at)}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                    {review.comment && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-3">{review.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <StickyCartBar vendorId={vendor.id} />
      <Footer />
    </div>
  );
}
