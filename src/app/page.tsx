import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { VendorCard } from "@/components/vendor/vendor-card";
import { VendorCardSkeleton } from "@/components/vendor/vendor-card-skeleton";
import { CategoryPills } from "@/components/marketplace/category-pills";
import { SearchBar } from "@/components/marketplace/search-bar";
import { siteConfig } from "@/config/site";
import type { Vendor } from "@/types/database.types";

export const revalidate = 300; // ISR every 5 minutes

async function FeaturedVendors() {
  const supabase = await getSupabaseServerClient();
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .eq("is_approved", true)
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .limit(6);

  if (!vendors?.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor as Vendor} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-16 text-white sm:px-6 sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <ShoppingBag className="h-4 w-4" />
              {siteConfig.universityName}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Campus food,
              <br />
              <span className="text-brand-200">ordered your way</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
              Browse your favourite campus vendors, order online, and pick up when it's ready. Fast, easy, cashless.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/vendors"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-brand-600 shadow-sm transition-transform hover:scale-105"
              >
                Browse vendors <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Search in hero */}
            <div className="mx-auto mt-8 max-w-lg">
              <Suspense>
                <SearchBar className="shadow-lg" placeholder="Search for jollof rice, burgers, drinks..." />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Suspense>
              <CategoryPills />
            </Suspense>
          </div>
        </section>

        {/* Featured Vendors */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Top vendors</h2>
              <p className="mt-1 text-sm text-gray-500">Highly rated on campus</p>
            </div>
            <Link
              href="/vendors"
              className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <VendorCardSkeleton key={i} />)}
              </div>
            }
          >
            <FeaturedVendors />
          </Suspense>
        </section>

        {/* How it works */}
        <section className="bg-white px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">How it works</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                { step: "01", title: "Browse vendors", desc: "Explore campus food vendors and their menus in one place." },
                { step: "02", title: "Place your order", desc: "Add items to cart, choose your pickup time, and pay securely online." },
                { step: "03", title: "Pick it up", desc: "Get notified when your order is ready. Walk in and grab it!" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
                    <span className="text-lg font-bold text-brand-600">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
