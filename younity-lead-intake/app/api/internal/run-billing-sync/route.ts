import { NextResponse } from "next/server";
import { runClickUpBillingSync } from "@/lib/internal/sync";
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
    const result = await runClickUpBillingSync();
    return NextResponse.json(result);
  } catch (syncError) {
    console.error("Billing sync failed:", syncError);
    await logWorkflowError({
      source: "internal-sync.billing",
      severity: "error",
      message: "Manual ClickUp billing sync failed.",
      context: {
        error: syncError,
        adminEmail: userEmail,
      },
    });
    return NextResponse.json(
      { message: "Billing sync failed." },
      { status: 500 }
    );
  }
}
