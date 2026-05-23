import crypto from "crypto";
import { NextResponse } from "next/server";
import { syncClickUpRequestByTaskId } from "@/lib/internal/sync";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ClickUpWebhookPayload = {
  event?: string;
  webhook_id?: string;
  task_id?: string;
  task?: {
    id?: string;
  };
  history_items?: Array<{
    id?: string;
  }>;
};

function safeJson(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

function normalizeSignature(signature: string) {
  return signature.includes("=") ? signature.split("=").pop() || "" : signature;
}

function verifyClickUpSignature(rawBody: string, signature: string | null) {
  const secret = process.env.CLICKUP_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const providedSignature = normalizeSignature(signature);

  try {
    const expected = Buffer.from(expectedSignature, "hex");
    const provided = Buffer.from(providedSignature, "hex");

    return (
      expected.length === provided.length &&
      crypto.timingSafeEqual(expected, provided)
    );
  } catch {
    return false;
  }
}

function extractTaskId(payload: ClickUpWebhookPayload) {
  return payload.task_id || payload.task?.id || null;
}

function extractEventKey(payload: ClickUpWebhookPayload) {
  const historyItemId = payload.history_items?.find((item) => item.id)?.id;

  if (!payload.webhook_id || !historyItemId) {
    return null;
  }

  return `${payload.webhook_id}:${historyItemId}`;
}

async function reserveEventKey({
  eventKey,
  eventName,
  clickUpTaskId,
}: {
  eventKey: string;
  eventName: string | null;
  clickUpTaskId: string | null;
}) {
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("clickup_webhook_events").insert({
    event_key: eventKey,
    event_name: eventName,
    clickup_task_id: clickUpTaskId,
  });

  if (!error) {
    return "reserved" as const;
  }

  if (error.code === "23505") {
    return "duplicate" as const;
  }

  await logWorkflowError({
    source: "webhook.clickup.idempotency",
    severity: "error",
    message: "ClickUp webhook idempotency insert failed.",
    context: {
      error,
      eventName,
      clickUpTaskId,
      hasEventKey: Boolean(eventKey),
    },
  });
  throw new Error("Webhook idempotency check failed.");
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyClickUpSignature(rawBody, signature)) {
    await logWorkflowError({
      source: "webhook.clickup.signature",
      severity: "warning",
      message: "ClickUp webhook signature verification failed.",
      context: {
        hasSignature: Boolean(signature),
        hasWebhookSecret: Boolean(process.env.CLICKUP_WEBHOOK_SECRET),
      },
    });
    return safeJson({ success: false, message: "Unauthorized." }, 401);
  }

  let payload: ClickUpWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as ClickUpWebhookPayload;
  } catch (error) {
    await logWorkflowError({
      source: "webhook.clickup.parse",
      severity: "warning",
      message: "ClickUp webhook payload could not be parsed.",
      context: { error },
    });
    return safeJson({ success: false, message: "Invalid payload." }, 400);
  }

  const eventName = payload.event || null;
  const clickUpTaskId = extractTaskId(payload);
  const eventKey = extractEventKey(payload);

  try {
    if (eventKey) {
      const idempotencyResult = await reserveEventKey({
        eventKey,
        eventName,
        clickUpTaskId,
      });

      if (idempotencyResult === "duplicate") {
        return safeJson({
          success: true,
          message: "Webhook already processed.",
        });
      }
    } else {
      await logWorkflowError({
        source: "webhook.clickup.idempotency-missing",
        severity: "info",
        message: "ClickUp webhook idempotency key was unavailable.",
        context: {
          eventName,
          clickUpTaskId,
          hasWebhookId: Boolean(payload.webhook_id),
          historyItemCount: payload.history_items?.length || 0,
        },
      });
    }

    if (!eventName?.startsWith("task") || !clickUpTaskId) {
      return safeJson({
        success: true,
        message: "Webhook ignored.",
      });
    }

    const result = await syncClickUpRequestByTaskId(clickUpTaskId);

    if (!result.found) {
      return safeJson({
        success: true,
        message: "No linked request found.",
      });
    }

    return safeJson({
      success: true,
      message: "Webhook processed.",
      statusChanged: result.statusChanged,
      billingChanged: result.billingChanged,
      warnings: result.warnings,
    });
  } catch (error) {
    await logWorkflowError({
      source: "webhook.clickup.processing",
      severity: "error",
      message: "ClickUp webhook processing failed.",
      context: {
        error,
        eventName,
        clickUpTaskId,
        hasEventKey: Boolean(eventKey),
      },
    });
    return safeJson({ success: false, message: "Webhook processing failed." }, 500);
  }
}
