import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getAllowedAdminEmails() {
  return (process.env.INTERNAL_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function getInternalAdminEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      email: null,
      error: NextResponse.json({ message: "Unauthorized." }, { status: 401 }),
    };
  }

  const userEmail = user.email?.toLowerCase() || "";
  const allowedEmails = getAllowedAdminEmails();

  if (!allowedEmails.length || !allowedEmails.includes(userEmail)) {
    return {
      email: null,
      error: NextResponse.json({ message: "Forbidden." }, { status: 403 }),
    };
  }

  return { email: userEmail, error: null };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const errorId = typeof id === "string" ? id.trim() : "";

  if (!errorId || !isUuid(errorId)) {
    return NextResponse.json({ message: "Invalid error ID." }, { status: 400 });
  }

  const { email, error } = await getInternalAdminEmail();

  if (error) {
    return error;
  }

  const supabaseAdmin = createAdminClient();
  const { data, error: updateError } = await supabaseAdmin
    .from("workflow_errors")
    .update({
      resolved: false,
      resolved_at: null,
      reopened_at: new Date().toISOString(),
      reopened_by: email,
    })
    .eq("id", errorId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateError) {
    console.error("Workflow error reopen failed:", {
      message: updateError.message,
      code: updateError.code,
    });
    return NextResponse.json(
      { message: "Error could not be reopened." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Error not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Error reopened.",
  });
}
