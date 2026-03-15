import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ShoppingBag, Search, Clock, Star } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { VendorCard } from "@/components/vendor/vendor-card";
import { VendorCardSkeleton } from "@/components/vendor/vendor-card-skeleton";
import { CategoryPills } from "@/components/marketplace/category-pills";
import { SearchBar } from "@/components/marketplace/search-bar";
import { siteConfig } from "@/config/site";
import { CyclingWord } from "@/components/ui/cycling-word";
import { HomeAnimations } from "@/components/home/home-animations";
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
        <div key={vendor.id} className="vendor-card-animate">
          <VendorCard vendor={vendor as Vendor} />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HomeAnimations />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 px-4 py-20 text-white sm:px-6 sm:py-28">
          {/* Decorative circles */}
          <div className="hero-circle-1 pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
          <div className="hero-circle-2 pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />
          <div className="hero-circle-3 pointer-events-none absolute right-1/4 top-10 h-40 w-40 rounded-full bg-brand-400/30" />

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="hero-badge mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20 backdrop-blur-sm">
              <ShoppingBag className="h-3.5 w-3.5" />
              {siteConfig.universityName}
            </div>
            <h1 className="hero-heading text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Campus <CyclingWord /><br />
              <span className="text-brand-200">ordered your way</span>
            </h1>
            <p className="hero-sub mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/75">
              Browse campus vendors, order online, and pick up when it&apos;s ready. Fast, easy, cashless.
            </p>

            {/* Search bar */}
            <div className="hero-search mx-auto mt-8 max-w-xl">
              <Suspense>
                <SearchBar
                  className="shadow-2xl"
                  placeholder="Search for jollof rice, burgers, drinks..."
                />
              </Suspense>
            </div>

            {/* Stats row */}
            <div className="hero-stats mt-8 flex items-center justify-center gap-6 text-sm text-white/70">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-brand-200 text-brand-200" /> Top-rated vendors</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Ready in minutes</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1.5"><ShoppingBag className="h-4 w-4" /> No delivery fees</span>
            </div>
          </div>
        </section>

        {/* Categories strip */}
        <section className="sticky top-16 z-30 border-b border-gray-100 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Suspense>
              <CategoryPills />
            </Suspense>
          </div>
        </section>

        {/* Featured Vendors */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="vendors-heading mb-7 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Top vendors</h2>
              <p className="mt-1 text-sm text-gray-500">Highly rated on campus right now</p>
            </div>
            <Link
              href="/vendors"
              className="flex items-center gap-1.5 rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-100 transition-colors"
            >
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <VendorCardSkeleton key={i} />)}
              </div>
            }
          >
            <FeaturedVendors />
          </Suspense>
        </section>

        {/* How it works */}
        <section className="bg-gradient-to-b from-gray-50 to-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="how-heading mb-12 text-center">
              <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
              <p className="mt-2 text-gray-500">Order campus food in three simple steps</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { icon: <Search className="h-6 w-6" />, step: "1", title: "Browse vendors", desc: "Explore all food vendors on campus and browse their full menus." },
                { icon: <ShoppingBag className="h-6 w-6" />, step: "2", title: "Place your order", desc: "Add items to cart, choose your pickup time, and pay securely online." },
                { icon: <Clock className="h-6 w-6" />, step: "3", title: "Pick it up", desc: "Get notified the moment your order is ready. Walk in and grab it!" },
              ].map((item, i) => (
                <div key={i} className="how-card relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/25">
                    {item.icon}
                  </div>
                  <div className="absolute right-4 top-4 text-xs font-bold text-gray-200">{item.step}</div>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="cta-banner rounded-3xl bg-gradient-to-r from-brand-500 to-brand-700 p-8 text-white sm:p-12">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h3 className="text-2xl font-bold">Ready to order?</h3>
                <p className="mt-1 text-white/75">Explore all vendors and find your next meal on campus.</p>
              </div>
              <Link
                href="/vendors"
                className="flex-shrink-0 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-brand-600 shadow-sm transition-transform hover:scale-105"
              >
                Browse vendors <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
