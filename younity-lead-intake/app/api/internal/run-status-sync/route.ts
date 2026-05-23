import { NextResponse } from "next/server";
import { runClickUpStatusSync } from "@/lib/internal/sync";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST() {
  const { user, errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  const userEmail = user.email?.toLowerCase() || user.id;

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
