import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  isStaleRefreshTokenError,
  isSupabaseAuthCookieName,
} from "./authErrors";

export async function createClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. Middleware refreshes sessions.
          }
        },
      },
    }
  );

  const getUser = supabase.auth.getUser.bind(supabase.auth);

  supabase.auth.getUser = (async (...args: Parameters<typeof getUser>) => {
    try {
      const result = await getUser(...args);

      if (isStaleRefreshTokenError(result.error)) {
        try {
          cookieStore
            .getAll()
            .filter((cookie) => isSupabaseAuthCookieName(cookie.name))
            .forEach((cookie) => cookieStore.delete(cookie.name));
        } catch {
          // Server Components cannot always clear cookies. Middleware/logouts do.
        }
      }

      return result;
    } catch (error) {
      if (isStaleRefreshTokenError(error)) {
        try {
          cookieStore
            .getAll()
            .filter((cookie) => isSupabaseAuthCookieName(cookie.name))
            .forEach((cookie) => cookieStore.delete(cookie.name));
        } catch {
          // Server Components cannot always clear cookies. Middleware/logouts do.
        }

        return {
          data: { user: null },
          error,
        } as Awaited<ReturnType<typeof getUser>>;
      }

      throw error;
    }
  }) as typeof supabase.auth.getUser;

  return supabase;
}
