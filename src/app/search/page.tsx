import { Suspense } from "react";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchBar } from "@/components/marketplace/search-bar";
import { SearchResultCard } from "@/components/search/search-result-card";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search" };
}

async function SearchResults({ q }: { q: string }) {
  const supabase = await getSupabaseServerClient();

  const { data: items } = await supabase
    .from("menu_items")
    .select("*, vendor:vendors!inner(id, name, slug, logo_url, is_approved, is_active)")
    .ilike("name", `%${q}%`)
    .eq("is_available", true)
    .order("name");

  const filtered = (items ?? []).filter(
    (i) => (i.vendor as { is_approved: boolean; is_active: boolean }).is_approved &&
            (i.vendor as { is_active: boolean }).is_active
  );

  if (!filtered.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-gray-700">No results for &ldquo;{q}&rdquo;</p>
        <p className="mt-1 text-sm text-gray-500">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((item) => {
        const vendor = item.vendor as { id: string; name: string; slug: string };
        return (
          <SearchResultCard key={item.id} item={item} vendor={vendor} />
        );
      })}
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;

  return (
    <div className="min-h-screen">
      <Header />

      <section className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {q ? `Results for "${q}"` : "Search"}
          </h1>
          <div className="mt-4 max-w-lg">
            <Suspense>
              <SearchBar placeholder="Search for jollof rice, burgers, drinks..." />
            </Suspense>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {q ? (
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            }
          >
            <SearchResults q={q} />
          </Suspense>
        ) : (
          <p className="py-20 text-center text-gray-500">Enter a search term above to find menu items.</p>
        )}
      </main>

      <Footer />
    </div>
  );
}
