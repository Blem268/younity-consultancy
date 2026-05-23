import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { registerClickUpWebhook } from "@/lib/integrations/clickup";

export const runtime = "nodejs";

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/+$/, "");
}

export async function POST() {
  const { user, errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_SITE_URL is required before registering a webhook." },
      { status: 400 }
    );
  }

  const endpoint = `${normalizeSiteUrl(siteUrl)}/api/webhooks/clickup`;

  try {
    const result = await registerClickUpWebhook({ endpoint });

    console.log("ClickUp webhook registered.", {
      webhookId: result.webhookId,
      endpoint,
      secretReturned: result.secretReturned,
    });

    return NextResponse.json({
      success: true,
      message: result.secretReturned
        ? "ClickUp webhook registered. ClickUp returned a signing secret, but this route does not expose secrets in browser responses; store the ClickUp signing secret in CLICKUP_WEBHOOK_SECRET through a secure deployment workflow before relying on deliveries."
        : "ClickUp webhook registered.",
      webhookId: result.webhookId,
      endpoint,
      events: ["taskUpdated", "taskStatusUpdated"],
      secretReturned: result.secretReturned,
    });
  } catch (error) {
    await logWorkflowError({
      source: "internal.clickup-webhook.register",
      severity: "error",
      message: "ClickUp webhook registration failed.",
      context: {
        error,
        adminEmail: user.email,
        endpoint,
      },
    });

    return NextResponse.json(
      { message: "ClickUp webhook registration failed." },
      { status: 500 }
    );
  }
}
