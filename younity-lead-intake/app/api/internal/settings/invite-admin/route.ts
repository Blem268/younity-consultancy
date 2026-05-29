import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = new Set(["admin", "super_admin"]);

type InviteAdminBody = {
  fullName?: unknown;
  email?: unknown;
  role?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const { isSuperAdmin, errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  if (!isSuperAdmin) {
    return NextResponse.json(
      { message: "Only super admins can invite new admin users." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as InviteAdminBody;
  const fullName = getString(body.fullName);
  const email = getString(body.email).toLowerCase();
  const role = getString(body.role) || "admin";

  if (!fullName) {
    return NextResponse.json(
      { message: "Full name is required." },
      { status: 400 }
    );
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { message: "A valid email address is required." },
      { status: 400 }
    );
  }

  if (!allowedRoles.has(role)) {
    return NextResponse.json(
      { message: "Role must be 'admin' or 'super_admin'." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createAdminClient();

  // Check for existing admin record
  const { data: existingAdmin, error: existingError } = await supabaseAdmin
    .from("internal_admins")
    .select("id")
    .eq("email", email)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    console.error("invite-admin duplicate check failed:", {
      message: existingError.message,
      code: existingError.code,
    });
    return NextResponse.json(
      { message: "Could not verify admin record. Please try again." },
      { status: 500 }
    );
  }

  if (existingAdmin) {
    return NextResponse.json(
      { message: "An admin with this email already exists." },
      { status: 409 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Step 1 — Send portal invite (creates Supabase auth user)
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { full_name: fullName },
      redirectTo: siteUrl ? `${siteUrl}/internal/login` : undefined,
    }
  );

  if (inviteError) {
    const alreadyExists = inviteError.message.toLowerCase().includes("already");
    console.error("invite-admin auth invite failed:", {
      message: inviteError.message,
      alreadyExists,
    });

    if (!alreadyExists) {
      return NextResponse.json(
        { message: "Invite email could not be sent. Please try again." },
        { status: 500 }
      );
    }
    // If user already exists in auth, continue and create the admin record
  }

  // Step 2 — Create internal_admins record
  const { error: insertError } = await supabaseAdmin
    .from("internal_admins")
    .insert({ email, full_name: fullName, role });

  if (insertError) {
    console.error("invite-admin insert failed:", {
      message: insertError.message,
      code: insertError.code,
    });

    if (insertError.code === "23505") {
      return NextResponse.json(
        { message: "An admin with this email already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Admin record could not be created." },
      { status: 500 }
    );
  }

  const inviteSent = !!inviteData?.user;

  return NextResponse.json({
    success: true,
    inviteSent,
    message: inviteSent
      ? `Admin account created and invite sent to ${email}.`
      : `Admin record created. The invite email may not have been sent — the address may already have a portal account.`,
  });
}
