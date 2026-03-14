import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Dashboard | LetuSell" },
  robots: { index: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard/vendor");

  return (
    <div className="min-h-screen bg-gray-50 pt-14 md:pt-0">
      {children}
    </div>
  );
}
