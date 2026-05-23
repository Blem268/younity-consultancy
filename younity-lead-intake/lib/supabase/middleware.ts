import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  clearSupabaseAuthCookies,
  isStaleRefreshTokenError,
} from "./authErrors";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    const { error } = await supabase.auth.getUser();

    if (isStaleRefreshTokenError(error)) {
      throw error;
    }
  } catch (error) {
    if (!isStaleRefreshTokenError(error)) {
      throw error;
    }

    const pathname = request.nextUrl.pathname;
    const isInternalPath = pathname.startsWith("/internal");
    const isClientPath = pathname.startsWith("/client");
    const isLoginOrLogout =
      pathname === "/internal/login" ||
      pathname === "/internal/logout" ||
      pathname === "/client/login" ||
      pathname === "/client/logout";

    if (isInternalPath && !isLoginOrLogout) {
      return clearSupabaseAuthCookies(
        request,
        NextResponse.redirect(new URL("/internal/login", request.url))
      );
    }

    if (isClientPath && !isLoginOrLogout) {
      return clearSupabaseAuthCookies(
        request,
        NextResponse.redirect(new URL("/client/login", request.url))
      );
    }

    return clearSupabaseAuthCookies(request, supabaseResponse);
  }

  return supabaseResponse;
}
