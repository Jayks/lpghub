import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * proxy.ts — Next.js 16 route guard (replaces middleware.ts).
 *
 * Strategy:
 *  1. Re-hydrate the Supabase session from cookies on every matched request.
 *     This keeps the access token fresh (Supabase rotates it server-side).
 *  2. Unauthenticated → redirect to /login.
 *  3. Wrong role for a protected area → redirect to persona home.
 *
 * Role cookie (lpghub-role): set by server actions on login; read here for
 * fast routing without a DB call. Not used for security — the Supabase session
 * JWT is the authority; role is enforced again in each page/action.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  // ─── Guard: pass through if Supabase is not yet configured ─────────────────
  // Prevents crashes during initial project setup before .env.local is filled.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propagate any refreshed session cookies to both request and response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() must be called without any early returns before it
  // so the session-refresh side-effect (setAll above) always runs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ─── 1. Require auth on all matched routes ─────────────────────────────────
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── 2. Role-based access ──────────────────────────────────────────────────
  const role = request.cookies.get("lpghub-role")?.value;

  if (pathname.startsWith("/admin") && role !== "admin") {
    const home = role === "delivery_person" ? "/delivery" : "/";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (pathname.startsWith("/delivery") && role !== "delivery_person") {
    const home = role === "admin" ? "/admin" : "/";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Protected customer routes
    "/",
    "/orders/:path*",
    "/payments/:path*",
    // Protected admin routes
    "/admin/:path*",
    "/onboarding/:path*",
    // Protected delivery routes
    "/delivery/:path*",
    // Protected shared
    "/deliveries/:path*",
  ],
};
