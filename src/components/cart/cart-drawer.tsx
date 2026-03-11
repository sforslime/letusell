"use client";

import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { CartItemRow } from "./cart-item-row";
import { CartSummary } from "./cart-summary";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const { items, vendorName, drawerOpen, closeDrawer, getTotal } = useCart();
  const total = getTotal();

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Your cart</h2>
            {vendorName && (
              <p className="text-xs text-gray-400">{vendorName}</p>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50">
                <ShoppingBag className="h-8 w-8 text-gray-300" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500">Your cart is empty</p>
              <p className="mt-1 text-xs text-gray-400">Add items from the menu to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <CartItemRow key={item.menuItemId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 pb-safe">
            <CartSummary subtotal={total} />
            <Link href="/checkout" onClick={closeDrawer}>
              <Button className="mt-3 w-full shadow-sm shadow-brand-500/20" size="lg">
                Proceed to checkout
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
