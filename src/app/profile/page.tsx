import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";
import { formatPickupTime } from "@/lib/utils/date";
import { Star } from "lucide-react";
import type { OrderStatus } from "@/types/database.types";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, loyalty_points")
    .eq("id", user.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, status, amount_kobo, pickup_time, created_at,
      vendors(name, slug)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Profile card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-6">
          <h1 className="text-xl font-bold text-gray-900">{profile?.full_name ?? "Your Profile"}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-100">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{profile?.loyalty_points ?? 0}</p>
              <p className="text-xs text-gray-500">Loyalty points</p>
            </div>
          </div>
        </div>

        {/* Order history */}
        <h2 className="mb-4 text-lg font-bold text-gray-900">Order History</h2>
        {(!orders || orders.length === 0) ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400">
            <p>No orders yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const vendor = order.vendors as unknown as { name: string; slug: string } | null;
              return (
                <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{vendor?.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">#{order.id.slice(-6).toUpperCase()}</p>
                    </div>
                    <OrderStatusBadge status={order.status as OrderStatus} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-gray-900">{formatNGN(koboToNaira(order.amount_kobo))}</span>
                    {order.pickup_time && (
                      <span className="text-xs text-gray-500">{formatPickupTime(order.pickup_time)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
