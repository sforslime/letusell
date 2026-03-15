import { ProductCard } from "./product-card";
import type { Product, ProductCategory } from "@/types/database.types";

interface ProductSectionProps {
  category: ProductCategory | null;
  items: Product[];
  vendor: { id: string; name: string; slug: string };
}

export function ProductSection({ category, items, vendor }: ProductSectionProps) {
  const available = items.filter((i) => i.is_available);
  if (available.length === 0) return null;

  return (
    <section>
      {category && (
        <h2 id={`cat-${category.id}`} className="mb-4 text-lg font-bold text-gray-900">
          {category.name}
        </h2>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {available.map((item) => (
          <ProductCard key={item.id} item={item} vendor={vendor} />
        ))}
      </div>
    </section>
  );
}
