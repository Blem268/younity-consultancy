import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PKCE auth callback — handles all Supabase email link types:
 *   - invite  → exchange code → link clients.user_id → /client/set-password
 *   - recovery → exchange code → /client/set-password
 *   - signup  → exchange code → /client/dashboard
 *
 * The `code` in the URL is a one-time PKCE code (not a token).
 * It is matched server-side against the code_verifier stored in a cookie,
 * so intercepting the URL alone is useless to an attacker.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type") ?? "";
  const next = searchParams.get("next") ?? "/client/dashboard";

  // No code → send to login
  if (!code) {
    return NextResponse.redirect(`${origin}/client/login?error=missing_code`);
  }

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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("Auth callback code exchange failed:", error?.message);
    return NextResponse.redirect(
      `${origin}/client/login?error=link_expired`
    );
  }

  const authUser = data.user;

  // Link clients.user_id if it isn't set yet.
  // This handles the case where the invite was created before the auth user existed,
  // or where a previous user_id linking attempt failed.
  try {
    const supabaseAdmin = createAdminClient();

    const { data: clientRow } = await supabaseAdmin
      .from("clients")
      .select("id, user_id")
      .eq("email", authUser.email ?? "")
      .maybeSingle<{ id: string; user_id: string | null }>();

    if (clientRow && !clientRow.user_id) {
      await supabaseAdmin
        .from("clients")
        .update({ user_id: authUser.id })
        .eq("id", clientRow.id);
    }
  } catch (linkError) {
    // Non-fatal — the client can still proceed; an admin can fix manually.
    console.error("Auth callback user_id linking failed:", linkError);
  }

  // Decide where to send the user
  const isNewUser =
    type === "invite" ||
    type === "recovery" ||
    next.includes("set-password");

  const destination = isNewUser
    ? `${origin}/client/set-password`
    : `${origin}${next}`;

  return NextResponse.redirect(destination);
}
