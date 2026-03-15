"use client";

import Image from "next/image";
import { Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { formatNGN } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { ProductModal } from "./product-modal";
import type { Product } from "@/types/database.types";

interface ProductCardProps {
  item: Product;
  vendor: { id: string; name: string; slug: string };
}

export function ProductCard({ item, vendor }: ProductCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!item.is_available) return null;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="group flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors truncate">
              {item.name}
            </h3>
            {item.is_featured && (
              <Badge variant="default" className="flex-shrink-0 text-[10px]">Featured</Badge>
            )}
          </div>
          {item.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
          )}
          <p className="mt-2 font-semibold text-gray-900">{formatNGN(item.price)}</p>
        </div>

        <div className="relative flex-shrink-0">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-gray-100">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingBag className="h-7 w-7 text-gray-300" />
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 shadow">
            <Plus className="h-3.5 w-3.5 text-white" />
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
