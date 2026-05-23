import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

type ResolveBody = {
  resolutionNote?: unknown;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(
  request: Request,
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

  const body = (await request.json().catch(() => ({}))) as ResolveBody;
  const resolutionNote =
    typeof body.resolutionNote === "string"
      ? body.resolutionNote.trim().slice(0, 1000)
      : "";

  const supabaseAdmin = createAdminClient();
  const { data, error: updateError } = await supabaseAdmin
    .from("workflow_errors")
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: adminEmail,
      resolution_note: resolutionNote || null,
    })
    .eq("id", errorId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateError) {
    console.error("Workflow error resolve failed:", {
      message: updateError.message,
      code: updateError.code,
    });
    return NextResponse.json(
      { message: "Error could not be marked as resolved." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Error not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Error marked as resolved.",
  });
}
