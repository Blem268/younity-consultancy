import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getAllowedAdminEmails() {
  return (process.env.INTERNAL_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function assertInternalAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  }

  const allowedEmails = getAllowedAdminEmails();
  const userEmail = user.email?.toLowerCase() || "";

  if (!allowedEmails.length || !allowedEmails.includes(userEmail)) {
    return { error: NextResponse.json({ message: "Forbidden." }, { status: 403 }) };
  }

  return { error: null };
}

export async function POST() {
  const { error } = await assertInternalAdmin();

  if (error) {
    return error;
  }

  const syncSecret = process.env.INTERNAL_SYNC_SECRET;

  if (!syncSecret) {
    return NextResponse.json(
      { message: "Internal sync is not configured." },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const syncUrl = new URL("/api/internal/sync-clickup-billing", siteUrl);
  const response = await fetch(syncUrl, {
    method: "POST",
    headers: {
      "x-internal-sync-secret": syncSecret,
    },
  });
  const result = await response.json();

  return NextResponse.json(result, { status: response.status });
}
