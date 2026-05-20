import { NextResponse } from "next/server";
import { getClickUpTaskStatus } from "@/lib/integrations/clickup";
import { createAdminClient } from "@/lib/supabase/admin";

type ClientRequestRecord = {
  id: string;
  client_id: string;
  service: string;
  status: string;
  clickup_task_id: string | null;
};

type SyncError = {
  requestId: string;
  clickUpTaskId?: string;
  message: string;
};

export async function POST(request: Request) {
  console.log("ClickUp status sync started.");

  const syncSecret = process.env.INTERNAL_SYNC_SECRET;
  const requestSecret = request.headers.get("x-internal-sync-secret");

  if (!syncSecret || requestSecret !== syncSecret) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();
  const { data: requests, error: requestsError } = await supabaseAdmin
    .from("client_requests")
    .select("id, client_id, service, status, clickup_task_id")
    .not("clickup_task_id", "is", null)
    .neq("status", "Completed")
    .neq("status", "Closed")
    .limit(50)
    .returns<ClientRequestRecord[]>();

  if (requestsError) {
    console.error(
      "ClickUp status sync query failed:",
      JSON.stringify(requestsError, null, 2)
    );
    return NextResponse.json(
      { message: "Unable to load requests for sync." },
      { status: 500 }
    );
  }

  const syncRequests = requests ?? [];
  console.log(`ClickUp status sync found ${syncRequests.length} records.`);

  let checked = 0;
  let updated = 0;
  let skipped = 0;
  const errors: SyncError[] = [];

  for (const clientRequest of syncRequests) {
    checked += 1;

    if (!clientRequest.clickup_task_id) {
      skipped += 1;
      continue;
    }

    try {
      const clickUpTask = await getClickUpTaskStatus(
        clientRequest.clickup_task_id
      );

      if (clickUpTask.status === clientRequest.status) {
        skipped += 1;
        continue;
      }

      const oldStatus = clientRequest.status;
      const newStatus = clickUpTask.status;
      const now = new Date().toISOString();

      const { error: updateError } = await supabaseAdmin
        .from("client_requests")
        .update({
          status: newStatus,
          updated_at: now,
        })
        .eq("id", clientRequest.id);

      if (updateError) {
        throw new Error(
          `Supabase request status update failed: ${JSON.stringify(updateError)}`
        );
      }

      const { error: timelineError } = await supabaseAdmin
        .from("client_updates")
        .insert({
          client_id: clientRequest.client_id,
          request_id: clientRequest.id,
          title: "Request status updated",
          message: `Your request status changed from ${oldStatus} to ${newStatus}.`,
          created_by: "Younity Consultancy",
        });

      if (timelineError) {
        throw new Error(
          `Supabase status timeline insert failed: ${JSON.stringify(
            timelineError
          )}`
        );
      }

      updated += 1;
      console.log(
        `ClickUp status sync updated request ${clientRequest.id}: ${oldStatus} -> ${newStatus}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown sync error.";

      console.error(
        `ClickUp status sync error for request ${clientRequest.id}:`,
        message
      );

      errors.push({
        requestId: clientRequest.id,
        clickUpTaskId: clientRequest.clickup_task_id,
        message,
      });
    }
  }

  return NextResponse.json({
    success: true,
    checked,
    updated,
    skipped,
    errors,
  });
}
