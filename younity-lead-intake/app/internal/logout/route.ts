import { NextResponse, type NextRequest } from "next/server";
import {
  clearSupabaseAuthCookies,
  isStaleRefreshTokenError,
} from "@/lib/supabase/authErrors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error && !isStaleRefreshTokenError(error)) {
      console.error("Internal sign out failed:", {
        message: error.message,
        code: error.code,
      });
    }
  } catch (error) {
    if (!isStaleRefreshTokenError(error)) {
      console.error("Internal sign out threw unexpectedly.");
    }
  }

  return clearSupabaseAuthCookies(
    request,
    NextResponse.redirect(new URL("/internal/login", request.url))
  );
}
