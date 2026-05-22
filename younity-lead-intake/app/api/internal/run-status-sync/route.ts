import { NextResponse } from "next/server";
import { runClickUpStatusSync } from "@/lib/internal/sync";
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

  try {
    const result = await runClickUpStatusSync();
    return NextResponse.json(result);
  } catch (syncError) {
    console.error("Status sync failed:", syncError);
    return NextResponse.json(
      { message: "Status sync failed." },
      { status: 500 }
    );
  }
}
