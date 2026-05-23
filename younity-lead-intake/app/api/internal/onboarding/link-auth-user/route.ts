import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

type LinkAuthUserBody = {
  clientId?: unknown;
  authUserId?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(request: Request) {
  const { errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => ({}))) as LinkAuthUserBody;
  const clientId = getString(body.clientId);
  const authUserId = getString(body.authUserId);

  if (!isUuid(clientId)) {
    return NextResponse.json({ message: "Invalid client ID." }, { status: 400 });
  }

  if (!isUuid(authUserId)) {
    return NextResponse.json(
      { message: "Invalid Auth User ID." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createAdminClient();
  const { data, error: updateError } = await supabaseAdmin
    .from("clients")
    .update({
      user_id: authUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateError) {
    console.error("Internal onboarding auth link failed:", {
      message: updateError.message,
      code: updateError.code,
    });
    return NextResponse.json(
      { message: "Client profile could not be linked." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Client not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Client profile linked to Auth user.",
  });
}
