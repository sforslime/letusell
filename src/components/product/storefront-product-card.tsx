"use client";

import Image from "next/image";
import { Heart, ShoppingBag, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { formatNGN } from "@/lib/utils/currency";
import { ProductModal } from "./product-modal";
import type { Product } from "@/types/database.types";

interface StorefrontProductCardProps {
  item: Product;
  vendor: { id: string; name: string; slug: string };
}

export function StorefrontProductCard({ item, vendor }: StorefrontProductCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="group flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Image */}
        <div
          className="relative aspect-square w-full bg-gray-100 cursor-pointer overflow-hidden"
          onClick={() => setModalOpen(true)}
        >
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
          )}
          {/* Decorative heart */}
          <button
            type="button"
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            aria-hidden="true"
          >
            <Heart className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 p-3 gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="text-left"
          >
            <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
              {item.name}
            </p>
          </button>
          <div className="flex items-center justify-between gap-2 mt-auto">
            <span className="text-sm font-bold text-brand-600">{formatNGN(item.price)}</span>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-brand-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
      </div>

      <ProductModal
        item={item}
        vendor={vendor}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
