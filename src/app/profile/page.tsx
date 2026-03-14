import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { formatNGN, koboToNaira } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { Star, ShoppingBag, TrendingUp, ArrowRight, Package } from "lucide-react";
import type { OrderStatus } from "@/types/database.types";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  }
  return email[0].toUpperCase();
}

function getLoyaltyTier(points: number): { tier: string; next: string; nextAt: number; color: string } {
  if (points >= 500) return { tier: "Gold", next: "Max tier", nextAt: 500, color: "text-yellow-600" };
  if (points >= 100) return { tier: "Silver", next: "Gold", nextAt: 500, color: "text-gray-500" };
  return { tier: "Bronze", next: "Silver", nextAt: 100, color: "text-orange-700" };
}

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/profile");

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, loyalty_points, created_at")
      .eq("id", user.id)
      .single(),

    supabase
      .from("orders")
      .select(`
        id, status, amount_kobo, pickup_time, created_at,
        vendors(name, slug),
        order_items(id)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const loyaltyPoints = profile?.loyalty_points ?? 0;
  const { tier, next, nextAt, color } = getLoyaltyTier(loyaltyPoints);
  const tierProgress = Math.min((loyaltyPoints / nextAt) * 100, 100);

  const paidOrders = orders?.filter((o) => o.status !== "awaiting_payment" && o.status !== "cancelled") ?? [];
  const totalSpent = paidOrders.reduce((sum, o) => sum + koboToNaira(o.amount_kobo), 0);
  const initials = getInitials(profile?.full_name ?? null, user.email ?? "?");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

          {/* ── Left sidebar ────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Avatar + identity */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-xl font-extrabold text-white shadow-md shadow-brand-500/25">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold text-gray-900">
                    {profile?.full_name ?? "Your Profile"}
                  </h1>
                  <p className="truncate text-sm text-gray-500">{user.email}</p>
                  {profile?.created_at && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      Member since {formatDate(profile.created_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-center">
                <div className="flex justify-center mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
                    <Package className="h-4.5 w-4.5 text-brand-600" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{paidOrders.length}</p>
                <p className="text-xs text-gray-500">Orders placed</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-center">
                <div className="flex justify-center mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
                    <TrendingUp className="h-4.5 w-4.5 text-brand-600" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">
                  {totalSpent >= 1000 ? `₦${(totalSpent / 1000).toFixed(1)}k` : formatNGN(totalSpent)}
                </p>
                <p className="text-xs text-gray-500">Total spent</p>
              </div>
            </div>

            {/* Loyalty points */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-50">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <span className="font-semibold text-gray-900">Loyalty points</span>
                </div>
                <span className={`text-xs font-bold uppercase tracking-wide ${color}`}>{tier}</span>
              </div>

              <p className="text-3xl font-extrabold text-gray-900">{loyaltyPoints}</p>
              <p className="mt-0.5 text-xs text-gray-400">Earn 1 point per ₦100 spent</p>

              {loyaltyPoints < 500 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{loyaltyPoints} pts</span>
                    <span>{nextAt} pts → {next}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-brand-500 transition-all"
                      style={{ width: `${tierProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Account settings */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">Account settings</h2>
              <ProfileEditForm
                fullName={profile?.full_name ?? null}
                phone={profile?.phone ?? null}
              />
            </div>
          </div>

          {/* ── Right: Order history ─────────────────────────────── */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Order history</h2>
              <span className="text-sm text-gray-400">{orders?.length ?? 0} orders</span>
            </div>

            {(!orders || orders.length === 0) ? (
              <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white py-20 text-center shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50">
                  <ShoppingBag className="h-8 w-8 text-gray-300" />
                </div>
                <p className="mt-4 font-semibold text-gray-700">No orders yet</p>
                <p className="mt-1 text-sm text-gray-400">Your order history will appear here</p>
                <Link
                  href="/vendors"
                  className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 hover:bg-brand-600 transition-colors"
                >
                  Browse vendors <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order) => {
                  const vendor = order.vendors as unknown as { name: string; slug: string } | null;
                  const itemCount = Array.isArray(order.order_items) ? order.order_items.length : 0;
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="group block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-brand-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                              {vendor?.name ?? "—"}
                            </p>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                            <span>#{order.id.slice(-6).toUpperCase()}</span>
                            <span>·</span>
                            <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                            <span>·</span>
                            <span>{formatDate(order.created_at)}</span>
                          </div>
                        </div>
                        <OrderStatusBadge status={order.status as OrderStatus} />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                        <span className="text-sm font-bold text-gray-900">
                          {formatNGN(koboToNaira(order.amount_kobo))}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          View order <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
