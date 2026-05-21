import { NextResponse } from "next/server";
import { getClickUpTaskProgress } from "@/lib/integrations/clickup";
import { createClient } from "@/lib/supabase/server";

type ClientProfile = {
  id: string;
};

type ClientRequest = {
  id: string;
  clickup_task_id: string | null;
};

type SupabaseLogError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function logSupabaseError(label: string, error: SupabaseLogError | null) {
  console.error(label, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = typeof id === "string" ? id.trim() : "";

  if (!requestId || !isUuid(requestId)) {
    return NextResponse.json(
      { success: false, message: "Invalid request ID." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    logSupabaseError("Client profile lookup failed:", clientProfileError);
    return NextResponse.json(
      { success: false, message: "Unable to verify your portal profile." },
      { status: 500 }
    );
  }

  if (!clientProfile) {
    return NextResponse.json(
      { success: false, message: "Portal profile has not been set up." },
      { status: 403 }
    );
  }

  const { data: clientRequest, error: requestError } = await supabase
    .from("client_requests")
    .select("id, clickup_task_id")
    .eq("id", requestId)
    .eq("client_id", clientProfile.id)
    .maybeSingle<ClientRequest>();

  if (requestError) {
    logSupabaseError("Client request task lookup failed:", requestError);
    return NextResponse.json(
      { success: false, message: "Unable to load task progress." },
      { status: 500 }
    );
  }

  if (!clientRequest) {
    return NextResponse.json(
      { success: false, message: "Request not found." },
      { status: 404 }
    );
  }

  if (!clientRequest.clickup_task_id) {
    return NextResponse.json({
      success: true,
      linked: false,
      parentTaskId: null,
      parentTaskName: null,
      parentStatus: null,
      items: [],
      progressPercent: 0,
      message: "No operational task has been linked yet.",
    });
  }

  try {
    const progressData = await getClickUpTaskProgress(clientRequest.clickup_task_id);

    return NextResponse.json({
      success: true,
      linked: true,
      ...progressData,
    });
  } catch (error) {
    console.error("ClickUp task progress lookup failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load work progress right now.",
      },
      { status: 500 }
    );
  }
}
