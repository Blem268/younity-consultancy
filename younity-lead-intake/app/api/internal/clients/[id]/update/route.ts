import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedContactMethods = new Set([
  "Email",
  "Phone Call",
  "WhatsApp",
  "No Preference",
]);

type ClientUpdateBody = {
  fullName?: unknown;
  phone?: unknown;
  company?: unknown;
  preferredContactMethod?: unknown;
  zohoLeadId?: unknown;
  zohoContactId?: unknown;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getOptionalString(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "string" ? value.trim() || null : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  const { id } = await params;
  const clientId = typeof id === "string" ? id.trim() : "";

  if (!clientId || !isUuid(clientId)) {
    return NextResponse.json({ message: "Invalid client ID." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as ClientUpdateBody;
  const preferredContactMethod = getOptionalString(body.preferredContactMethod);

  if (
    preferredContactMethod &&
    !allowedContactMethods.has(preferredContactMethod)
  ) {
    return NextResponse.json(
      { message: "Selected contact method is not valid." },
      { status: 400 }
    );
  }

  const updates: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };
  const fieldMap = {
    full_name: getOptionalString(body.fullName),
    phone: getOptionalString(body.phone),
    company: getOptionalString(body.company),
    preferred_contact_method: preferredContactMethod,
    zoho_lead_id: getOptionalString(body.zohoLeadId),
    zoho_contact_id: getOptionalString(body.zohoContactId),
  };

  for (const [field, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      updates[field] = value;
    }
  }

  if (updates.full_name === null) {
    return NextResponse.json(
      { message: "Full name is required." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createAdminClient();
  const { data, error: updateError } = await supabaseAdmin
    .from("clients")
    .update(updates)
    .eq("id", clientId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateError) {
    console.error("Internal client update failed:", {
      message: updateError.message,
      code: updateError.code,
    });
    await logWorkflowError({
      source: "internal_client_update",
      message: "Client profile update failed.",
      context: {
        error: updateError,
        clientId,
        updatedFields: Object.keys(updates),
      },
      relatedClientId: clientId,
    });
    return NextResponse.json(
      { message: "Client profile could not be updated." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Client not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Client profile updated.",
  });
}
