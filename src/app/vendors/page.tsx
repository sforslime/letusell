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
    query = query.ilike("name", `%${q}%`);
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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Food vendors</h1>
        <p className="mt-1 text-sm text-gray-500">Order from vendors across campus</p>

        <div className="mt-5 flex flex-col gap-4">
          <Suspense>
            <SearchBar placeholder="Search vendors or dishes..." />
          </Suspense>
          <Suspense>
            <CategoryPills />
          </Suspense>
        </div>

        <div className="mt-6">
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <VendorCardSkeleton key={i} />)}
              </div>
            }
          >
            <VendorList q={q} category={category} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
