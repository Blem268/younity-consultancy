import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedContactMethods = new Set([
  "Email",
  "Phone Call",
  "WhatsApp",
  "No Preference",
]);

type CreateClientBody = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  preferredContactMethod?: unknown;
  zohoLeadId?: unknown;
  zohoContactId?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(value: unknown) {
  const text = getString(value);
  return text || null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const { errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as CreateClientBody;
  const fullName = getString(body.fullName);
  const email = getString(body.email).toLowerCase();
  const preferredContactMethod =
    getString(body.preferredContactMethod) || "No Preference";

  if (!fullName) {
    return NextResponse.json(
      { message: "Full name is required." },
      { status: 400 }
    );
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { message: "A valid email is required." },
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
  const { data: existingClient, error: existingClientError } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("email", email)
    .maybeSingle<{ id: string }>();

  if (existingClientError) {
    console.error("Internal onboarding duplicate lookup failed:", {
      message: existingClientError.message,
      code: existingClientError.code,
    });
    return NextResponse.json(
      { message: "Client profile could not be created." },
      { status: 500 }
    );
  }

  if (existingClient) {
    return NextResponse.json(
      { message: "A client profile with this email already exists." },
      { status: 409 }
    );
  }

  const { data: createdClient, error: insertError } = await supabaseAdmin
    .from("clients")
    .insert({
      full_name: fullName,
      email,
      phone: getOptionalString(body.phone),
      company: getOptionalString(body.company),
      preferred_contact_method: preferredContactMethod,
      zoho_lead_id: getOptionalString(body.zohoLeadId),
      zoho_contact_id: getOptionalString(body.zohoContactId),
      user_id: null,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError) {
    console.error("Internal onboarding client create failed:", {
      message: insertError.message,
      code: insertError.code,
    });

    if (insertError.code === "23505") {
      return NextResponse.json(
        { message: "A client profile with this email already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Client profile could not be created." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    clientId: createdClient.id,
    message: "Client profile created.",
  });
}
