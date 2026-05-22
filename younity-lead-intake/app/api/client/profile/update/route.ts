import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedContactMethods = new Set([
  "Email",
  "Phone Call",
  "WhatsApp",
  "No Preference",
]);

type ClientProfile = {
  id: string;
};

type ProfileUpdateBody = {
  fullName?: unknown;
  phone?: unknown;
  company?: unknown;
  preferredContactMethod?: unknown;
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

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id")
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

  const body = (await request.json().catch(() => ({}))) as ProfileUpdateBody;
  const fullName = getString(body.fullName);
  const phone = getString(body.phone);
  const company = getString(body.company);
  const preferredContactMethod =
    getString(body.preferredContactMethod) || "No Preference";

  if (!fullName) {
    return NextResponse.json(
      { message: "Full name is required." },
      { status: 400 }
    );
  }

  if (!allowedContactMethods.has(preferredContactMethod)) {
    return NextResponse.json(
      { message: "Selected contact method is not valid." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      full_name: fullName,
      phone: phone || null,
      company: company || null,
      preferred_contact_method: preferredContactMethod,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientProfile.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Client profile update failed:", {
      message: updateError.message,
      code: updateError.code,
    });
    return NextResponse.json(
      { message: "Profile could not be updated." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Profile updated successfully.",
  });
}
