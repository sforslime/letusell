import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

const VENDOR_ROUTES = ["/dashboard/vendor"];
const ADMIN_ROUTES = ["/dashboard/admin"];
const AUTH_ROUTES = ["/auth/login", "/auth/signup"];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isVendorRoute = VENDOR_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isProfileRoute = pathname.startsWith("/profile");

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect authenticated-only routes
  if ((isVendorRoute || isAdminRoute || isProfileRoute) && !user) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based protection for dashboard routes
  if ((isVendorRoute || isAdminRoute) && user) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "user";

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isVendorRoute && role !== "vendor" && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
