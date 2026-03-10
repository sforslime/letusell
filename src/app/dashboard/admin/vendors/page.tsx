import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { adminDashboardLinks } from "@/config/nav";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Vendor Management" };

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
    .select("id, name, category, location_text, is_approved, is_active, owner_id, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar links={adminDashboardLinks} title="Admin" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">{vendors?.length ?? 0} total vendors</p>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(vendors ?? []).map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{vendor.name}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{vendor.category.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-gray-500">{vendor.location_text ?? "—"}</td>
                  <td className="px-4 py-3">
                    {vendor.is_approved ? (
                      <Badge variant="success">Approved</Badge>
                    ) : vendor.is_active ? (
                      <Badge variant="warning">Pending</Badge>
                    ) : (
                      <Badge variant="destructive">Rejected</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!vendor.is_approved && vendor.is_active && (
                      <div className="flex gap-2">
                        <form action={approveVendor.bind(null, vendor.id, vendor.owner_id)}>
                          <button
                            type="submit"
                            className="rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={rejectVendor.bind(null, vendor.id)}>
                          <button
                            type="submit"
                            className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    )}
                    {vendor.is_approved && (
                      <form action={rejectVendor.bind(null, vendor.id)}>
                        <button
                          type="submit"
                          className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-red-100 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
