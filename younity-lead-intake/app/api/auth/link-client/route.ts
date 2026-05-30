import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/link-client
 *
 * Called after the auth confirm page establishes a session.
 * Ensures clients.user_id is linked to the current auth user.
 * Safe to call multiple times — no-ops if already linked.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  const { data: clientRow, error: lookupError } = await supabaseAdmin
    .from("clients")
    .select("id, user_id")
    .eq("email", user.email ?? "")
    .maybeSingle<{ id: string; user_id: string | null }>();

  if (lookupError) {
    console.error("link-client lookup failed:", lookupError.message);
    return NextResponse.json({ message: "Lookup failed." }, { status: 500 });
  }

  if (!clientRow) {
    // No client profile for this email — admin may not have created it yet.
    return NextResponse.json({ linked: false, reason: "no_profile" });
  }

  if (clientRow.user_id === user.id) {
    // Already linked — nothing to do.
    return NextResponse.json({ linked: true, reason: "already_linked" });
  }

  const { error: updateError } = await supabaseAdmin
    .from("clients")
    .update({ user_id: user.id })
    .eq("id", clientRow.id);

  if (updateError) {
    console.error("link-client update failed:", updateError.message);
    return NextResponse.json({ message: "Link failed." }, { status: 500 });
  }

  return NextResponse.json({ linked: true, reason: "linked_now" });
}
