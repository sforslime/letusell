import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Badge } from "@/components/ui/badge";
import { adminDashboardLinks } from "@/config/nav";
import { formatDate } from "@/lib/utils/date";
import { LayoutDashboard, Store, ShoppingBag, BarChart2, ExternalLink } from "lucide-react";
import { NewVendorButton } from "@/components/admin/new-vendor-button";

export const metadata: Metadata = { title: "Vendor Management" };
export const dynamic = "force-dynamic";

const navLinks = adminDashboardLinks.map((link, i) => ({
  ...link,
  icon: [
    <LayoutDashboard key={0} className="h-4 w-4" />,
    <Store key={1} className="h-4 w-4" />,
    <ShoppingBag key={2} className="h-4 w-4" />,
    <BarChart2 key={3} className="h-4 w-4" />,
  ][i],
}));

const categoryLabels: Record<string, string> = {
  food_drinks: "Food & Drinks",
  fashion: "Fashion",
  beauty: "Beauty & Wellness",
  accessories: "Accessories",
  stationery: "Books & Stationery",
  electronics: "Electronics & Tech",
  services: "Services",
  other: "Other",
  local_food: "Food & Drinks",
  fast_food: "Food & Drinks",
  snacks: "Food & Drinks",
  drinks: "Food & Drinks",
  pastries: "Food & Drinks",
};

async function approveVendor(vendorId: string, ownerId: string | null) {
  "use server";
  const admin = getSupabaseAdminClient();
  await admin.from("vendors").update({ is_approved: true }).eq("id", vendorId);
  if (ownerId) {
    await admin.from("profiles").update({ role: "vendor" }).eq("id", ownerId);
  }
  revalidatePath("/dashboard/admin/vendors");
}

async function rejectVendor(vendorId: string) {
  "use server";
  const admin = getSupabaseAdminClient();
  await admin.from("vendors").update({ is_active: false }).eq("id", vendorId);
  revalidatePath("/dashboard/admin/vendors");
}

export default async function AdminVendorsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const admin = getSupabaseAdminClient();
  const { data: vendors } = await admin
    .from("vendors")
    .select("id, name, slug, category, location_text, is_approved, is_active, owner_id, created_at")
    .order("is_approved", { ascending: true })
    .order("created_at", { ascending: false });

  const pending = (vendors ?? []).filter((v) => !v.is_approved && v.is_active);
  const approved = (vendors ?? []).filter((v) => v.is_approved);
  const rejected = (vendors ?? []).filter((v) => !v.is_approved && !v.is_active);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar links={navLinks} title="Admin" />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Vendors</h1>
            <p className="mt-1 text-sm text-gray-500">{vendors?.length ?? 0} total vendors</p>
          </div>
          <NewVendorButton />
        </div>

        {/* Summary pills */}
        <div className="mb-6 flex flex-wrap gap-3">
          {[
            { label: "Pending", count: pending.length, color: "bg-amber-100 text-amber-800" },
            { label: "Approved", count: approved.length, color: "bg-green-100 text-green-800" },
            { label: "Rejected", count: rejected.length, color: "bg-red-100 text-red-800" },
          ].map((s) => (
            <span key={s.label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.color}`}>
              {s.count} {s.label}
            </span>
          ))}
        </div>

        {/* Pending section — shown prominently */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Awaiting Approval
            </h2>
            <div className="flex flex-col gap-3">
              {pending.map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{vendor.name}</p>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {categoryLabels[vendor.category] ?? vendor.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {vendor.location_text ?? "No location"} · Applied {formatDate(vendor.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={approveVendor.bind(null, vendor.id, vendor.owner_id)}>
                      <button
                        type="submit"
                        className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectVendor.bind(null, vendor.id)}>
                      <button
                        type="submit"
                        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 transition-colors hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All vendors table */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">All Vendors</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(vendors ?? []).map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{vendor.name}</p>
                      <p className="text-xs text-gray-400">/{vendor.slug}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {categoryLabels[vendor.category] ?? vendor.category}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{vendor.location_text ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      {vendor.is_approved ? (
                        <Badge variant="success">Approved</Badge>
                      ) : vendor.is_active ? (
                        <Badge variant="warning">Pending</Badge>
                      ) : (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{formatDate(vendor.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/vendors/${vendor.slug}`}
                          target="_blank"
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </Link>
                        {!vendor.is_approved && vendor.is_active && (
                          <form action={approveVendor.bind(null, vendor.id, vendor.owner_id)}>
                            <button type="submit" className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100">
                              Approve
                            </button>
                          </form>
                        )}
                        {(vendor.is_approved || (!vendor.is_approved && vendor.is_active)) && (
                          <form action={rejectVendor.bind(null, vendor.id)}>
                            <button type="submit" className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-600">
                              {vendor.is_approved ? "Remove" : "Reject"}
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!vendors || vendors.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">No vendors yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
