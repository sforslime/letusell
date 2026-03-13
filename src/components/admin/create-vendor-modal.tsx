"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createVendor } from "@/app/dashboard/admin/vendors/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const categories = siteConfig.categories.filter((c) => c.value !== "all");

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-|-$/g, "");
}

interface CreateVendorModalProps {
  onClose: () => void;
}

export function CreateVendorModal({ onClose }: CreateVendorModalProps) {
  const [state, action, pending] = useActionState(createVendor, {});
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugValue, setSlugValue] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  // Close on success
  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugTouched) {
      setSlugValue(slugify(e.target.value));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">New vendor</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form action={action} className="max-h-[80vh] overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-4">
            <Input
              ref={nameRef}
              label="Vendor name"
              name="name"
              placeholder="Mama Buka Kitchen"
              required
              onChange={handleNameChange}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Slug
                <span className="ml-1 text-xs font-normal text-gray-400">(URL identifier)</span>
              </label>
              <div className="flex h-10 items-center rounded-xl border border-gray-300 bg-white px-3 text-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                <span className="text-gray-400">vendors/</span>
                <input
                  name="slug"
                  value={slugValue}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlugValue(e.target.value);
                  }}
                  className="flex-1 bg-transparent pl-0.5 outline-none placeholder:text-gray-400"
                  placeholder="mama-buka-kitchen"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                defaultValue="other"
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>

            <Textarea
              label="Description"
              name="description"
              placeholder="Short description shown on the storefront…"
              rows={2}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Location"
                name="location_text"
                placeholder="Block A, Main Square"
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                placeholder="+234 800 000 0000"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Opens at"
                name="opens_at"
                type="time"
              />
              <Input
                label="Closes at"
                name="closes_at"
                type="time"
              />
            </div>

            <Input
              label="Avg. prep time (minutes)"
              name="avg_prep_time"
              type="number"
              min={1}
              max={120}
              defaultValue={15}
            />

            <div className="flex flex-col gap-1">
              <Input
                label="Owner email"
                name="owner_email"
                type="email"
                placeholder="vendor@example.com (optional)"
              />
              <p className="text-xs text-gray-400">
                If provided, that account will be linked and promoted to vendor role.
              </p>
            </div>

            {state.error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Create vendor
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
