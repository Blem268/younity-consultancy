import { getClickUpTaskBillingFields, getClickUpTaskStatus } from "@/lib/integrations/clickup";
import { createAdminClient } from "@/lib/supabase/admin";
import { logWorkflowError } from "@/lib/internal/workflowErrors";

type ClientRequestStatusRecord = {
  id: string;
  client_id: string;
  service: string;
  status: string;
  clickup_task_id: string | null;
};

type ClientRequestBillingRecord = ClientRequestStatusRecord & {
  billing_type: string | null;
  estimated_fee: number | null;
  deposit_required: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  invoice_status: string | null;
  zoho_books_invoice_id: string | null;
};

type BillingUpdate = {
  billing_type: string | null;
  estimated_fee: number | null;
  deposit_required: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  invoice_status: string | null;
  zoho_books_invoice_id: string | null;
  updated_at: string;
};

type SyncError = {
  requestId: string;
  clickUpTaskId?: string;
  message: string;
};

export type SyncResult = {
  success: true;
  checked: number;
  updated: number;
  skipped: number;
  errors: SyncError[];
};

function valuesDiffer(left: string | number | null, right: string | number | null) {
  return left !== right;
}

export async function runClickUpStatusSync(): Promise<SyncResult> {
  console.log("ClickUp status sync started.");

  const supabaseAdmin = createAdminClient();
  const { data: requests, error: requestsError } = await supabaseAdmin
    .from("client_requests")
    .select("id, client_id, service, status, clickup_task_id")
    .not("clickup_task_id", "is", null)
    .neq("status", "Completed")
    .neq("status", "Closed")
    .limit(50)
    .returns<ClientRequestStatusRecord[]>();

  if (requestsError) {
    console.error("ClickUp status sync query failed:", {
      message: requestsError.message,
      code: requestsError.code,
    });
    await logWorkflowError({
      source: "sync.status.query",
      severity: "error",
      message: "ClickUp status sync request query failed.",
      context: {
        error: requestsError,
      },
    });
    throw new Error("Unable to load requests for sync.");
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
      const clickUpTask = await getClickUpTaskStatus(clientRequest.clickup_task_id);

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
        console.error("Supabase request status update failed:", {
          message: updateError.message,
          code: updateError.code,
        });
        await logWorkflowError({
          source: "sync.status.update",
          severity: "error",
          message: "Supabase request status update failed.",
          context: {
            error: updateError,
            oldStatus,
            newStatus,
            clickUpTaskId: clientRequest.clickup_task_id,
          },
          relatedClientId: clientRequest.client_id,
          relatedRequestId: clientRequest.id,
        });
        throw new Error("Supabase request status update failed.");
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
        console.error("Supabase status timeline insert failed:", {
          message: timelineError.message,
          code: timelineError.code,
        });
        await logWorkflowError({
          source: "sync.status.timeline",
          severity: "warning",
          message: "Supabase status timeline insert failed.",
          context: {
            error: timelineError,
            oldStatus,
            newStatus,
            clickUpTaskId: clientRequest.clickup_task_id,
          },
          relatedClientId: clientRequest.client_id,
          relatedRequestId: clientRequest.id,
        });
        throw new Error("Supabase status timeline insert failed.");
      }

      updated += 1;
      console.log(
        `ClickUp status sync updated request ${clientRequest.id}: ${oldStatus} -> ${newStatus}`
      );
    } catch (error) {
      const message = "Status sync failed for this request.";

      console.error(
        `ClickUp status sync error for request ${clientRequest.id}:`,
        error instanceof Error ? error.message : "Unknown sync error."
      );
      await logWorkflowError({
        source: "sync.status.request",
        severity: "warning",
        message: "ClickUp status sync failed for a request.",
        context: {
          error,
          clickUpTaskId: clientRequest.clickup_task_id,
          service: clientRequest.service,
        },
        relatedClientId: clientRequest.client_id,
        relatedRequestId: clientRequest.id,
      });

      errors.push({
        requestId: clientRequest.id,
        clickUpTaskId: clientRequest.clickup_task_id,
        message,
      });
    }
  }

  return {
    success: true,
    checked,
    updated,
    skipped,
    errors,
  };
}

export async function runClickUpBillingSync(): Promise<SyncResult> {
  console.log("ClickUp billing sync started.");

  const supabaseAdmin = createAdminClient();
  const { data: requests, error: requestsError } = await supabaseAdmin
    .from("client_requests")
    .select(
      "id, client_id, service, status, clickup_task_id, billing_type, estimated_fee, deposit_required, amount_paid, balance_due, invoice_status, zoho_books_invoice_id"
    )
    .not("clickup_task_id", "is", null)
    .neq("status", "Completed")
    .neq("status", "Closed")
    .limit(50)
    .returns<ClientRequestBillingRecord[]>();

  if (requestsError) {
    console.error("ClickUp billing sync query failed:", {
      message: requestsError.message,
      code: requestsError.code,
    });
    await logWorkflowError({
      source: "sync.billing.query",
      severity: "error",
      message: "ClickUp billing sync request query failed.",
      context: {
        error: requestsError,
      },
    });
    throw new Error("Unable to load requests for billing sync.");
  }

  const syncRequests = requests ?? [];
  console.log(`ClickUp billing sync found ${syncRequests.length} records.`);

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
      const billingFields = await getClickUpTaskBillingFields(
        clientRequest.clickup_task_id
      );

      const nextBilling = {
        billing_type: billingFields.billingType ?? null,
        estimated_fee: billingFields.estimatedFee ?? null,
        deposit_required: billingFields.depositRequired ?? null,
        amount_paid: billingFields.amountPaid ?? null,
        balance_due: billingFields.balanceDue ?? null,
        invoice_status: billingFields.invoiceStatus ?? null,
        zoho_books_invoice_id: billingFields.invoiceId ?? null,
      };

      const hasChanges =
        valuesDiffer(clientRequest.billing_type, nextBilling.billing_type) ||
        valuesDiffer(clientRequest.estimated_fee, nextBilling.estimated_fee) ||
        valuesDiffer(clientRequest.deposit_required, nextBilling.deposit_required) ||
        valuesDiffer(clientRequest.amount_paid, nextBilling.amount_paid) ||
        valuesDiffer(clientRequest.balance_due, nextBilling.balance_due) ||
        valuesDiffer(clientRequest.invoice_status, nextBilling.invoice_status) ||
        valuesDiffer(
          clientRequest.zoho_books_invoice_id,
          nextBilling.zoho_books_invoice_id
        );

      if (!hasChanges) {
        skipped += 1;
        continue;
      }

      const updatePayload: BillingUpdate = {
        ...nextBilling,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabaseAdmin
        .from("client_requests")
        .update(updatePayload)
        .eq("id", clientRequest.id);

      if (updateError) {
        console.error("Supabase billing update failed:", {
          message: updateError.message,
          code: updateError.code,
        });
        await logWorkflowError({
          source: "sync.billing.update",
          severity: "error",
          message: "Supabase billing update failed.",
          context: {
            error: updateError,
            clickUpTaskId: clientRequest.clickup_task_id,
            service: clientRequest.service,
          },
          relatedClientId: clientRequest.client_id,
          relatedRequestId: clientRequest.id,
        });
        throw new Error("Supabase billing update failed.");
      }

      const { error: timelineError } = await supabaseAdmin
        .from("client_updates")
        .insert({
          client_id: clientRequest.client_id,
          request_id: clientRequest.id,
          title: "Billing information updated",
          message: "Billing information for your request has been updated.",
          created_by: "Younity Consultancy",
        });

      if (timelineError) {
        console.error("Supabase billing timeline insert failed:", {
          message: timelineError.message,
          code: timelineError.code,
        });
        await logWorkflowError({
          source: "sync.billing.timeline",
          severity: "warning",
          message: "Supabase billing timeline insert failed.",
          context: {
            error: timelineError,
            clickUpTaskId: clientRequest.clickup_task_id,
            service: clientRequest.service,
          },
          relatedClientId: clientRequest.client_id,
          relatedRequestId: clientRequest.id,
        });
        throw new Error("Supabase billing timeline insert failed.");
      }

      updated += 1;
      console.log(
        `ClickUp billing sync updated request ${clientRequest.id} (${clientRequest.service}).`
      );
    } catch (error) {
      const message = "Billing sync failed for this request.";

      console.error(
        `ClickUp billing sync error for request ${clientRequest.id}:`,
        error instanceof Error ? error.message : "Unknown billing sync error."
      );
      await logWorkflowError({
        source: "sync.billing.request",
        severity: "warning",
        message: "ClickUp billing sync failed for a request.",
        context: {
          error,
          clickUpTaskId: clientRequest.clickup_task_id,
          service: clientRequest.service,
        },
        relatedClientId: clientRequest.client_id,
        relatedRequestId: clientRequest.id,
      });

      errors.push({
        requestId: clientRequest.id,
        clickUpTaskId: clientRequest.clickup_task_id,
        message,
      });
    }
  }

  return {
    success: true,
    checked,
    updated,
    skipped,
    errors,
  };
}
