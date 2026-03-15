"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Store } from "lucide-react";
import { formatNGN } from "@/lib/utils/currency";
import { ProductModal } from "@/components/product/product-modal";
import type { Product } from "@/types/database.types";

interface SearchResultCardProps {
  item: Product;
  vendor: { id: string; name: string; slug: string };
}

export function SearchResultCard({ item, vendor }: SearchResultCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md text-left w-full"
      >
        <div className="relative h-44 w-full bg-gray-100 flex-shrink-0">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <Store className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="font-semibold text-gray-900 line-clamp-1">{item.name}</p>
          {item.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
          )}
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="text-sm font-bold text-brand-600">
              {formatNGN(item.price)}
            </span>
            <Link
              href={`/vendors/${vendor.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 hover:underline transition-colors"
            >
              <Store className="h-3 w-3" />
              {vendor.name}
            </Link>
          </div>
        </div>
      </button>

      <ProductModal
        item={item}
        vendor={vendor}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
