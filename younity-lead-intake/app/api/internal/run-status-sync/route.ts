import { NextResponse } from "next/server";
import { runClickUpStatusSync } from "@/lib/internal/sync";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { rateLimit } from "@/lib/security/rateLimit";
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

  return { error: null, userEmail };
}

export async function POST() {
  const { error, userEmail } = await assertInternalAdmin();

  if (error) {
    return error;
  }

  const rateLimitResult = await rateLimit({
    key: `internal-sync:${userEmail}`,
    limit: 10,
    windowSeconds: 10 * 60,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        message: "Too many sync attempts. Please wait before running another sync.",
      },
      { status: 429 }
    );
  }

  try {
    const result = await runClickUpStatusSync();
    return NextResponse.json(result);
  } catch (syncError) {
    console.error("Status sync failed:", syncError);
    await logWorkflowError({
      source: "internal-sync.status",
      severity: "error",
      message: "Manual ClickUp status sync failed.",
      context: {
        error: syncError,
        adminEmail: userEmail,
      },
    });
    return NextResponse.json(
      { message: "Status sync failed." },
      { status: 500 }
    );
  }
}
