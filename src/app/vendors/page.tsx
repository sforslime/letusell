import { Suspense } from "react";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { VendorCard } from "@/components/vendor/vendor-card";
import { VendorCardSkeleton } from "@/components/vendor/vendor-card-skeleton";
import { SearchBar } from "@/components/marketplace/search-bar";
import { CategoryPills } from "@/components/marketplace/category-pills";
import type { Vendor } from "@/types/database.types";

export const metadata: Metadata = { title: "All Vendors" };
export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

async function VendorList({ q, category }: { q?: string; category?: string }) {
  const supabase = await getSupabaseServerClient();
  let query = supabase
    .from("vendors")
    .select("*")
    .eq("is_approved", true)
    .eq("is_active", true)
    .order("rating", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (q) {
    // Find vendor IDs that have matching menu items
    const { data: matchingItems } = await supabase
      .from("menu_items")
      .select("vendor_id")
      .ilike("name", `%${q}%`)
      .eq("is_available", true);

    const vendorIdsFromItems = [...new Set((matchingItems ?? []).map((i) => i.vendor_id))];

    if (vendorIdsFromItems.length > 0) {
      // Vendors matching by name OR having a matching menu item
      query = query.or(`name.ilike.%${q}%,id.in.(${vendorIdsFromItems.join(",")})`);
    } else {
      query = query.ilike("name", `%${q}%`);
    }
  }

  const { data: vendors } = await query;

  if (!vendors?.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-2xl">😕</p>
        <p className="mt-2 font-medium text-gray-700">No vendors found</p>
        <p className="mt-1 text-sm text-gray-500">Try a different search or category</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((v) => (
        <VendorCard key={v.id} vendor={v as Vendor} />
      ))}
    </div>
  );
}

export default async function VendorsPage({ searchParams }: PageProps) {
  const { q, category } = await searchParams;

  return (
    <div className="min-h-screen">
      <Header />
      {/* Page header */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Campus vendors</h1>
          <p className="mt-1 text-gray-500">Browse and order from vendors across campus</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 max-w-lg">
              <Suspense>
                <SearchBar placeholder="Search vendors or products..." />
              </Suspense>
            </div>
          </div>
          <div className="mt-3">
            <Suspense>
              <CategoryPills />
            </Suspense>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <VendorCardSkeleton key={i} />)}
            </div>
          }
        >
          <VendorList q={q} category={category} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
