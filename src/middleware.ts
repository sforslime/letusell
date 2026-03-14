import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session — wrapped to handle "lock stolen" AbortError from
  // concurrent requests (Next.js parallel rendering / prefetching).
  // If the lock is stolen, the other request refreshed the token — treat as unauthenticated.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    if (!(err instanceof Error && err.name === "AbortError")) throw err;
  }

  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const isProfileRoute = pathname === "/profile";
  const isVendorDashboard = pathname.startsWith("/dashboard/vendor");
  const isAdminDashboard = pathname.startsWith("/dashboard/admin");
  const isProtected = isProfileRoute || isVendorDashboard || isAdminDashboard;

  if (isProtected && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based protection
  if (user && (isVendorDashboard || isAdminDashboard)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (isAdminDashboard && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isVendorDashboard && role !== "vendor" && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/profile",
    "/dashboard/:path*",
  ],
};
