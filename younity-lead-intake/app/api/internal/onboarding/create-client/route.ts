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

  // Check for existing client profile
  const { data: existingClient, error: existingClientError } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("email", email)
    .maybeSingle<{ id: string }>();

  if (existingClientError) {
    console.error("Onboarding duplicate lookup failed:", {
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

  // Step 1 — Send portal invite. This creates the Supabase auth user
  // and emails the client a sign-in link.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { full_name: fullName },
      redirectTo: siteUrl ? `${siteUrl}/client/dashboard` : undefined,
    }
  );

  if (inviteError) {
    console.error("Onboarding invite failed:", {
      message: inviteError.message,
    });
    // If the auth user already exists, we still create the client record
    // but flag it so admin knows the invite wasn't sent.
    if (!inviteError.message.toLowerCase().includes("already")) {
      return NextResponse.json(
        { message: "Portal invite could not be sent. Please try again." },
        { status: 500 }
      );
    }
  }

  const authUserId = inviteData?.user?.id ?? null;

  // Step 2 — Create the client profile, linked to the auth user if available
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
      user_id: authUserId,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError) {
    console.error("Onboarding client insert failed:", {
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

  const inviteSent = !!authUserId;

  return NextResponse.json({
    success: true,
    clientId: createdClient.id,
    inviteSent,
    message: inviteSent
      ? `Client profile created and portal invite sent to ${email}.`
      : `Client profile created. The invite email could not be sent — the address may already have a portal account.`,
  });
}
