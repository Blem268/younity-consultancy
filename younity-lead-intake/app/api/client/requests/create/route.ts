import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createClickUpPortalRequestTask } from "@/lib/integrations/clickup";
import { sendPortalRequestNotificationEmail } from "@/lib/integrations/email";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { rateLimit } from "@/lib/security/rateLimit";
import { sendInternalWhatsAppPortalRequestNotification } from "@/lib/integrations/whatsapp";

const allowedServices = new Set([
  "Bookkeeping Services",
  "Payroll Services",
  "General Administration",
  "HR Support",
  "Strategic Management & Advisory",
  "Tax Services",
  "Compliance Services",
  "Other",
]);

const allowedUrgencies = new Set(["Low", "Normal", "High"]);
const allowedContactMethods = new Set([
  "Email",
  "Phone Call",
  "WhatsApp",
  "No Preference",
]);

type ClientProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
};

type RequestBody = {
  service?: unknown;
  message?: unknown;
  preferredContactMethod?: unknown;
  urgency?: unknown;
  // Accepted for older clients only. The current request form does not use this.
  billingNotes?: unknown;
};

type InsertedRequest = {
  id: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const rateLimitResult = await rateLimit({
    key: `client-request-create:${user.id}`,
    limit: 10,
    windowSeconds: 60 * 60,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        message:
          "Too many requests submitted. Please wait before submitting another request.",
      },
      { status: 429 }
    );
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, company")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
    return NextResponse.json(
      { message: "Unable to verify your portal profile." },
      { status: 500 }
    );
  }

  if (!clientProfile) {
    return NextResponse.json(
      { message: "Portal profile has not been set up." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const service = getString(body.service);
  const message = getString(body.message);
  const preferredContactMethod =
    getString(body.preferredContactMethod) || "No Preference";
  const urgency = getString(body.urgency) || "Normal";

  if (!service) {
    return NextResponse.json(
      { message: "Service is required." },
      { status: 400 }
    );
  }

  if (!message) {
    return NextResponse.json(
      { message: "Message is required." },
      { status: 400 }
    );
  }

  if (!allowedServices.has(service)) {
    return NextResponse.json(
      { message: "Selected service is not valid." },
      { status: 400 }
    );
  }

  if (!allowedUrgencies.has(urgency)) {
    return NextResponse.json(
      { message: "Selected urgency is not valid." },
      { status: 400 }
    );
  }

  if (!allowedContactMethods.has(preferredContactMethod)) {
    return NextResponse.json(
      { message: "Selected contact method is not valid." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createAdminClient();
  const { data: insertedRequest, error: requestInsertError } =
    await supabaseAdmin
      .from("client_requests")
      .insert({
        client_id: clientProfile.id,
        service,
        status: "Submitted",
        message,
        source: "Client Portal",
        billing_type: "To Be Reviewed",
        estimated_fee: null,
        deposit_required: null,
        amount_paid: 0,
        balance_due: null,
        invoice_status: "Not Ready",
      })
      .select("id")
      .single<InsertedRequest>();

  if (requestInsertError) {
    console.error("Client request insert failed:", {
      message: requestInsertError.message,
      code: requestInsertError.code,
    });
    await logWorkflowError({
      source: "client-request-create.supabase",
      severity: "error",
      message: "Client request insert failed.",
      context: {
        error: requestInsertError,
        service,
        urgency,
      },
      relatedClientId: clientProfile.id,
    });
    return NextResponse.json(
      { message: "Request could not be submitted." },
      { status: 500 }
    );
  }

  const warnings: string[] = [];
  let clickUpTaskId = "";

  try {
    const clickUpTask = await createClickUpPortalRequestTask({
      clientName: clientProfile.full_name,
      clientEmail: clientProfile.email,
      clientPhone: clientProfile.phone,
      company: clientProfile.company,
      service,
      message,
      preferredContactMethod,
      urgency,
      portalRequestId: insertedRequest.id,
    });

    clickUpTaskId = clickUpTask.id;

    const { error: clickUpUpdateError } = await supabaseAdmin
      .from("client_requests")
      .update({
        clickup_task_id: clickUpTask.id,
      })
      .eq("id", insertedRequest.id)
      .eq("client_id", clientProfile.id);

    if (clickUpUpdateError) {
      console.error("Client request ClickUp task update failed:", {
        message: clickUpUpdateError.message,
        code: clickUpUpdateError.code,
      });
      await logWorkflowError({
        source: "client-request-create.clickup-id-save",
        severity: "warning",
        message: "ClickUp task ID could not be saved to the portal request.",
        context: {
          error: clickUpUpdateError,
          clickUpTaskId: clickUpTask.id,
          service,
        },
        relatedClientId: clientProfile.id,
        relatedRequestId: insertedRequest.id,
      });
      warnings.push("ClickUp task ID could not be saved to the portal request.");
    }
  } catch (error) {
    console.error("ClickUp portal request task creation failed:", error);
    await logWorkflowError({
      source: "client-request-create.clickup",
      severity: "error",
      message: "ClickUp portal request task creation failed.",
      context: {
        error,
        service,
        urgency,
      },
      relatedClientId: clientProfile.id,
      relatedRequestId: insertedRequest.id,
    });
    warnings.push("Internal task creation needs review.");
  }

  const timelineEntries = [
    {
      client_id: clientProfile.id,
      request_id: insertedRequest.id,
      title: "Request submitted",
      message: "Your request has been submitted and is now under review.",
      created_by: "Younity Consultancy",
    },
  ];

  if (!clickUpTaskId) {
    timelineEntries.push({
      client_id: clientProfile.id,
      request_id: insertedRequest.id,
      title: "Request received",
      message: "Your request was received. Our team will review it shortly.",
      created_by: "Younity Consultancy",
    });
  }

  const { error: updateInsertError } = await supabaseAdmin
    .from("client_updates")
    .insert(timelineEntries);

  if (updateInsertError) {
    console.error("Client request timeline insert failed:", {
      message: updateInsertError.message,
      code: updateInsertError.code,
    });
    await logWorkflowError({
      source: "client-request-create.timeline",
      severity: "warning",
      message: "Client request timeline insert failed.",
      context: {
        error: updateInsertError,
        service,
      },
      relatedClientId: clientProfile.id,
      relatedRequestId: insertedRequest.id,
    });
    warnings.push("Portal timeline update could not be saved.");
  }

  const notificationInput = {
    clientName: clientProfile.full_name,
    clientEmail: clientProfile.email,
    clientPhone: clientProfile.phone,
    company: clientProfile.company,
    service,
    urgency,
    preferredContactMethod,
    message,
    portalRequestId: insertedRequest.id,
    clickUpTaskId,
  };

  try {
    await sendPortalRequestNotificationEmail(notificationInput);
  } catch (error) {
    console.error("Portal request email notification failed:", error);
    await logWorkflowError({
      source: "client-request-create.email",
      severity: "warning",
      message: "Portal request email notification failed.",
      retryable: true,
      retryStatus: "ready",
      context: {
        error,
        retryType: "resend_email",
        retryPayload: {
          emailKind: "portal_request_notification",
          input: notificationInput,
        },
        service,
        clickUpTaskId,
      },
      relatedClientId: clientProfile.id,
      relatedRequestId: insertedRequest.id,
    });
    warnings.push("Email notification needs review.");
  }

  try {
    await sendInternalWhatsAppPortalRequestNotification(notificationInput);
  } catch (error) {
    console.error("Portal request WhatsApp notification failed:", error);
    await logWorkflowError({
      source: "client-request-create.whatsapp",
      severity: "warning",
      message: "Portal request WhatsApp notification failed.",
      retryable: true,
      retryStatus: "ready",
      context: {
        error,
        retryType: "twilio_whatsapp",
        retryPayload: {
          whatsappKind: "portal_request_notification",
          input: notificationInput,
        },
        service,
        clickUpTaskId,
      },
      relatedClientId: clientProfile.id,
      relatedRequestId: insertedRequest.id,
    });
    warnings.push("WhatsApp notification needs review.");
  }

  return NextResponse.json({
    success: true,
    message: "Request submitted successfully.",
    requestId: insertedRequest.id,
    clickUpTaskId,
    ...(warnings.length ? { warnings } : {}),
  });
}
