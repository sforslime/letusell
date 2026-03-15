"use client";

import { useRef, useState, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Store, ExternalLink, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { saveVendorSettings } from "@/app/dashboard/vendor/settings/actions";
import type { Vendor } from "@/types/database.types";

interface VendorSettingsFormProps {
  vendor: Vendor;
}

export function VendorSettingsForm({ vendor: initialVendor }: VendorSettingsFormProps) {
  const supabase = getSupabaseBrowserClient();
  const [vendor, setVendor] = useState(initialVendor);
  const [togglingActive, setTogglingActive] = useState(false);

  // Image upload state
  const bannerRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(vendor.banner_url);
  const [logoPreview, setLogoPreview] = useState<string | null>(vendor.logo_url);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [formState, formAction, isPending] = useActionState(saveVendorSettings, {});

  async function uploadImage(file: File, type: "logo" | "banner") {
    if (file.size > 3 * 1024 * 1024) {
      return { error: "Image must be under 3 MB" };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { error: "Not authenticated" };
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);

    const res = await fetch("/api/vendor/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Upload failed" };
    }
    return { url: data.url as string };
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerError(null);
    setBannerPreview(URL.createObjectURL(file));
    setBannerUploading(true);
    const result = await uploadImage(file, "banner");
    setBannerUploading(false);
    if ("error" in result) {
      setBannerError(result.error);
      setBannerPreview(vendor.banner_url);
    } else {
      setVendor((v) => ({ ...v, banner_url: result.url }));
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    const result = await uploadImage(file, "logo");
    setLogoUploading(false);
    if ("error" in result) {
      setLogoError(result.error);
      setLogoPreview(vendor.logo_url);
    } else {
      setVendor((v) => ({ ...v, logo_url: result.url }));
    }
  }

  async function toggleActive() {
    setTogglingActive(true);
    const newActive = !vendor.is_active;
    await supabase.from("vendors").update({ is_active: newActive }).eq("id", vendor.id);
    setVendor((v) => ({ ...v, is_active: newActive }));
    setTogglingActive(false);
  }

  return (
    <div className="max-w-lg space-y-5">
      {/* Branding card */}
      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Branding</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Your banner and logo appear on your storefront and vendor card.
          </p>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {/* Banner upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Banner image
            </label>
            <div
              className="relative h-40 w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 transition-colors"
              onClick={() => !bannerUploading && bannerRef.current?.click()}
            >
              {bannerPreview ? (
                <Image
                  src={bannerPreview}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                  unoptimized={bannerPreview.startsWith("blob:")}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-gray-400">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm">Click to upload banner</span>
                  <span className="text-xs">JPG, PNG, WEBP — max 3 MB</span>
                </div>
              )}
              {bannerUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
              {bannerPreview && !bannerUploading && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                  <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900">
                    Click to change
                  </span>
                </div>
              )}
            </div>
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />
            {bannerError && <p className="mt-1 text-xs text-red-500">{bannerError}</p>}
          </div>

          {/* Logo upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Logo
            </label>
            <div className="flex items-center gap-4">
              <div
                className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 transition-colors flex-shrink-0"
                onClick={() => !logoUploading && logoRef.current?.click()}
              >
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    className="object-cover"
                    unoptimized={logoPreview.startsWith("blob:")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                )}
                {logoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                <p className="font-medium text-gray-700">Upload logo</p>
                <p>Square image recommended</p>
                <p>JPG, PNG, WEBP — max 3 MB</p>
              </div>
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            {logoError && <p className="mt-1 text-xs text-red-500">{logoError}</p>}
          </div>
        </div>
      </section>

      {/* Profile form card */}
      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Profile details</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Update your public-facing information that customers see on your storefront.
          </p>
        </div>
        <form action={formAction} className="flex flex-col gap-4 p-6">
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-sm font-semibold text-gray-700">{vendor.name}</p>
            <p className="text-xs text-gray-400">Vendor name can only be changed by an admin</p>
          </div>

          <Textarea
            label="Description"
            name="description"
            defaultValue={vendor.description ?? ""}
            placeholder="Tell customers about your brand..."
          />

          <Input
            label="Location on campus"
            name="location_text"
            defaultValue={vendor.location_text ?? ""}
            placeholder="e.g. Block D Canteen"
          />

          <Input
            label="Phone number"
            name="phone"
            defaultValue={vendor.phone ?? ""}
            placeholder="08012345678"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Opens at" name="opens_at" type="time" defaultValue={vendor.opens_at ?? ""} />
            <Input label="Closes at" name="closes_at" type="time" defaultValue={vendor.closes_at ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Avg. prep time (min)"
              name="avg_prep_time"
              type="number"
              min={5}
              max={120}
              defaultValue={vendor.avg_prep_time}
            />
            <Input
              label="Min. order (₦)"
              name="min_order"
              type="number"
              min={0}
              defaultValue={vendor.min_order}
            />
          </div>

          {formState.error && (
            <p className="text-sm text-red-600">{formState.error}</p>
          )}

          <Button type="submit" loading={isPending} className="w-full">
            {formState.success && !isPending ? "Saved!" : "Save changes"}
          </Button>
        </form>
      </section>

      {/* Open / Closed status card */}
      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Open / Closed status</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Manually control whether customers can place orders right now.
          </p>
        </div>
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${vendor.is_active ? "bg-green-500" : "bg-gray-300"}`}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {vendor.is_active ? "Open for orders" : "Closed"}
              </p>
              <p className="text-xs text-gray-500">
                {vendor.is_active
                  ? "Customers can browse and place orders."
                  : "Your storefront is hidden from customers."}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            loading={togglingActive}
            onClick={toggleActive}
            className={
              vendor.is_active
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none"
                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 shadow-none"
            }
          >
            {vendor.is_active ? "Close store" : "Open store"}
          </Button>
        </div>
      </section>

      {/* Storefront preview card */}
      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Storefront preview</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            See how your store appears to customers on the marketplace.
          </p>
        </div>
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-50 p-2.5">
              <Store className="h-4 w-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{vendor.name}</p>
              <p className="text-xs text-gray-400">/vendors/{vendor.slug}</p>
            </div>
          </div>
          <Link
            href={`/vendors/${vendor.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            View storefront
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
