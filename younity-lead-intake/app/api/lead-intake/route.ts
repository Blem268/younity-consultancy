import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/validators/leadSchema";
import {
  createZohoLead,
  updateZohoLeadIntegrationStatus,
} from "@/lib/integrations/zoho";
import {
  sendLeadNotificationEmail,
  sendClientConfirmationEmail,
} from "@/lib/integrations/email";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { getRateLimitIdentifier, rateLimit } from "@/lib/security/rateLimit";
import { sendInternalWhatsAppLeadNotification } from "@/lib/integrations/whatsapp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    body &&
    typeof body === "object" &&
    "companyWebsite" in body &&
    typeof body.companyWebsite === "string" &&
    body.companyWebsite.trim()
  ) {
    return NextResponse.json({
      success: true,
      message: "Your request was received successfully.",
    });
  }

  const rateLimitResult = await rateLimit({
    key: `lead-intake:${getRateLimitIdentifier(request)}`,
    limit: 5,
    windowSeconds: 10 * 60,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please wait a few minutes and try again.",
      },
      { status: 429 }
    );
  }

  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Please check the form and try again.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const lead = parsed.data;

  let zohoLeadId = "";
  let whatsappNotificationSent = false;
  let clientConfirmationSent = false;

  const integrationErrors: string[] = [];

  try {
    console.log("Creating Zoho lead...");

    const zohoResult = await createZohoLead({
      fullName: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      serviceRequested: lead.service,
      message: lead.message,
      preferredContactMethod:
        typeof body?.preferredContactMethod === "string"
          ? body.preferredContactMethod
          : "No Preference",
      natureOfBusiness:
        typeof body?.natureOfBusiness === "string" ? body.natureOfBusiness : "",
      websiteFormId: "website-lead-form",
      sourcePage: "/contact",
    });

    zohoLeadId = zohoResult?.data?.[0]?.details?.id || "";
  } catch (error) {
    console.error("Zoho lead creation failed:", error);
    await logWorkflowError({
      source: "lead-intake.zoho",
      severity: "error",
      message: "Zoho lead creation failed.",
      context: {
        error,
        leadEmail: lead.email,
        service: lead.service,
      },
    });
    integrationErrors.push("Zoho lead creation failed.");
  }

  try {
    console.log("Sending lead email notification...");

    await sendLeadNotificationEmail({
      lead,
      zohoLeadId,
    });

    console.log("Email notification sent.");
  } catch (error) {
    console.error("Email notification failed:", error);
    await logWorkflowError({
      source: "lead-intake.email",
      severity: "warning",
      message: "Lead notification email failed.",
      retryable: true,
      retryStatus: "ready",
      context: {
        error,
        retryType: "resend_email",
        retryPayload: {
          emailKind: "lead_notification",
          input: {
            lead,
            zohoLeadId,
          },
        },
        leadEmail: lead.email,
        service: lead.service,
      },
    });
    integrationErrors.push("Email notification failed.");
  }

  try {
    console.log("Sending client confirmation email...");

    await sendClientConfirmationEmail({
      lead,
    });

    clientConfirmationSent = true;

    console.log("Client confirmation email sent.");
  } catch (error) {
    console.error("Client confirmation email failed:", error);
    await logWorkflowError({
      source: "lead-intake.client-email",
      severity: "warning",
      message: "Client confirmation email failed.",
      retryable: true,
      retryStatus: "ready",
      context: {
        error,
        retryType: "resend_email",
        retryPayload: {
          emailKind: "client_confirmation",
          input: {
            lead,
          },
        },
        leadEmail: lead.email,
        service: lead.service,
      },
    });
    integrationErrors.push("Client confirmation email failed.");
  }

  try {
    console.log("Sending internal WhatsApp lead notification...");

    await sendInternalWhatsAppLeadNotification({
      lead,
      zohoLeadId,
    });

    whatsappNotificationSent = true;

    console.log("WhatsApp notification sent.");
  } catch (error) {
    console.error("WhatsApp notification failed:", error);
    await logWorkflowError({
      source: "lead-intake.whatsapp",
      severity: "warning",
      message: "Internal WhatsApp lead notification failed.",
      retryable: true,
      retryStatus: "ready",
      context: {
        error,
        retryType: "twilio_whatsapp",
        retryPayload: {
          whatsappKind: "lead_notification",
          input: {
            lead,
            zohoLeadId,
          },
        },
        leadEmail: lead.email,
        service: lead.service,
      },
    });
    integrationErrors.push("WhatsApp notification failed.");
  }

  try {
    console.log("Updating Zoho integration status...");

    await updateZohoLeadIntegrationStatus({
      zohoLeadId,
      whatsappNotificationSent,
      clientConfirmationSent,
      integrationStatus: integrationErrors.length ? "Partial Success" : "Complete",
      integrationErrorLog: integrationErrors.join(" | "),
    });

    console.log("Zoho integration status updated.");
  } catch (error) {
    console.error("Zoho integration status update failed:", error);
    await logWorkflowError({
      source: "lead-intake.zoho-status",
      severity: "warning",
      message: "Zoho lead integration status update failed.",
      context: {
        error,
        zohoLeadId,
        integrationErrorCount: integrationErrors.length,
      },
    });
    integrationErrors.push("Zoho integration status update failed.");
  }

  if (integrationErrors.length) {
    console.error("Lead intake partial failure:", {
      zohoLeadId,
      integrationErrorCount: integrationErrors.length,
    });
  }

  return NextResponse.json({
    success: !integrationErrors.length,
    message: integrationErrors.length
      ? "Your request was received, but one or more internal follow-up steps need review."
      : "Your request was received successfully. A confirmation email has been sent.",
    lead: {
      name: lead.name,
      email: lead.email,
      service: lead.service,
    },
    warnings: integrationErrors.length
      ? ["One or more internal follow-up steps need review."]
      : undefined,
  });
}
