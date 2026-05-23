import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/validators/leadSchema";
import { appendLeadToSheet } from "@/lib/integrations/googleSheets";
import { createClickUpLeadTask } from "@/lib/integrations/clickup";
import {
  createZohoLead,
  updateZohoLeadIntegrationStatus,
} from "@/lib/integrations/zoho";
import {
  sendLeadNotificationEmail,
  sendClientConfirmationEmail,
} from "@/lib/integrations/email";
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

  let clickUpTaskId = "";
  let clickUpTaskUrl = "";
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
    integrationErrors.push("Zoho lead creation failed.");
  }

  try {
    console.log("Creating ClickUp task...");

    const clickUpTask = await createClickUpLeadTask({
      lead,
    });

    clickUpTaskId = clickUpTask.id;
    clickUpTaskUrl = clickUpTask.url || "";
  } catch (error) {
    console.error("ClickUp task creation failed:", error);
    integrationErrors.push("ClickUp task creation failed.");
  }

  try {
    console.log("Appending lead to Google Sheet...");

    await appendLeadToSheet({
      lead,
      clickUpTaskId,
      status: integrationErrors.length ? "Partial Success" : "Received",
    });

    console.log("Google Sheet log successful.");
  } catch (error) {
    console.error("Google Sheet log failed:", error);
    integrationErrors.push("Google Sheet log failed.");
  }

  try {
    console.log("Sending lead email notification...");

    await sendLeadNotificationEmail({
      lead,
      zohoLeadId,
      clickUpTaskId,
      clickUpTaskUrl,
    });

    console.log("Email notification sent.");
  } catch (error) {
    console.error("Email notification failed:", error);
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
    integrationErrors.push("Client confirmation email failed.");
  }

  try {
    console.log("Sending internal WhatsApp lead notification...");

    await sendInternalWhatsAppLeadNotification({
      lead,
      zohoLeadId,
      clickUpTaskId,
    });

    whatsappNotificationSent = true;

    console.log("WhatsApp notification sent.");
  } catch (error) {
    console.error("WhatsApp notification failed:", error);
    integrationErrors.push("WhatsApp notification failed.");
  }

  try {
    console.log("Updating Zoho integration status...");

    await updateZohoLeadIntegrationStatus({
      zohoLeadId,
      clickUpTaskId,
      whatsappNotificationSent,
      clientConfirmationSent,
      integrationStatus: integrationErrors.length ? "Partial Success" : "Complete",
      integrationErrorLog: integrationErrors.join(" | "),
    });

    console.log("Zoho integration status updated.");
  } catch (error) {
    console.error("Zoho integration status update failed:", error);
    integrationErrors.push("Zoho integration status update failed.");
  }

  if (integrationErrors.length) {
    console.error("Lead intake partial failure:", {
      zohoLeadId,
      clickUpTaskId,
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
