import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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

  const { user, errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  const adminEmail = user.email?.toLowerCase() || user.id;

  const supabaseAdmin = createAdminClient();
  const { data, error: updateError } = await supabaseAdmin
    .from("workflow_errors")
    .update({
      resolved: false,
      resolved_at: null,
      reopened_at: new Date().toISOString(),
      reopened_by: adminEmail,
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
