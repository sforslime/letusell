"use client";

import { useState } from "react";
import { StorefrontProductCard } from "@/components/product/storefront-product-card";
import type { Product, ProductCategory } from "@/types/database.types";

interface StorefrontProductsProps {
  products: Product[];
  categories: ProductCategory[];
  vendor: { id: string; name: string; slug: string };
}

type Tab = "all" | "featured" | string;

export function StorefrontProducts({ products, categories, vendor }: StorefrontProductsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [visibleCount, setVisibleCount] = useState(8);

  const featuredItems = products.filter((p) => p.is_featured);

  function getFilteredProducts(): Product[] {
    if (activeTab === "all") return products;
    if (activeTab === "featured") return featuredItems;
    return products.filter((p) => p.category_id === activeTab);
  }

  const filtered = getFilteredProducts();
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "featured", label: "Featured" },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setVisibleCount(8);
            }}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Popular Items — only on "All" tab */}
      {activeTab === "all" && featuredItems.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Popular Items</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featuredItems.slice(0, 4).map((item) => (
              <StorefrontProductCard key={item.id} item={item} vendor={vendor} />
            ))}
          </div>
        </div>
      )}

      {/* Explore Products */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {activeTab === "all"
            ? "Explore Products"
            : activeTab === "featured"
            ? "Featured"
            : (categories.find((c) => c.id === activeTab)?.name ?? "Products")}
        </h2>

        {visible.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">No products in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((item) => (
              <StorefrontProductCard key={item.id} item={item} vendor={vendor} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setVisibleCount((v) => v + 8)}
              className="rounded-full border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
