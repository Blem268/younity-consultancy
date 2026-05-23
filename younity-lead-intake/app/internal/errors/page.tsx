import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  AdminCard,
  Badge,
  EmptyCard,
  InternalPage,
  StatusBadge,
} from "../internal-ui";
import { ErrorActions } from "./error-actions";

type WorkflowErrorRecord = {
  id: string;
  source: string;
  severity: string;
  message: string;
  context: unknown;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string | null;
  retryable: boolean;
  retry_status: string | null;
  retry_attempts: number;
  last_retry_at: string | null;
  last_retry_by: string | null;
  last_retry_message: string | null;
};

type PageProps = {
  searchParams: Promise<{
    unresolved?: string | string[];
    status?: string | string[];
    source?: string | string[];
    severity?: string | string[];
    retryable?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function redactUnsafeContext(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactUnsafeContext);
  }

  if (value && typeof value === "object") {
    const redacted: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      if (/token|secret|password|key|authorization|cookie|credential/i.test(key)) {
        redacted[key] = "[redacted]";
      } else {
        redacted[key] = redactUnsafeContext(entry);
      }
    }

    return redacted;
  }

  if (typeof value === "string") {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [redacted]")
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email redacted]");
  }

  return value;
}

function prettyContext(context: unknown) {
  if (!context) {
    return "";
  }

  return JSON.stringify(redactUnsafeContext(context), null, 2);
}

export default async function InternalErrorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const legacyUnresolvedOnly = getSearchParam(params.unresolved) === "true";
  const statusFilter = getSearchParam(params.status) || (legacyUnresolvedOnly ? "open" : "all");
  const sourceFilter = getSearchParam(params.source).trim();
  const severityFilter = getSearchParam(params.severity).trim();
  const retryableFilter = getSearchParam(params.retryable).trim();
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Workflow Errors" />;
  }

  const supabaseAdmin = createAdminClient();
  let query = supabaseAdmin
    .from("workflow_errors")
    .select(
      "id, source, severity, message, context, resolved, resolved_at, resolved_by, resolution_note, created_at, retryable, retry_status, retry_attempts, last_retry_at, last_retry_by, last_retry_message"
    );

  if (statusFilter === "open") {
    query = query.eq("resolved", false);
  }

  if (statusFilter === "resolved") {
    query = query.eq("resolved", true);
  }

  if (sourceFilter) {
    query = query.ilike("source", `%${sourceFilter}%`);
  }

  if (severityFilter) {
    query = query.eq("severity", severityFilter);
  }

  if (retryableFilter === "yes") {
    query = query.eq("retryable", true);
  }

  if (retryableFilter === "no") {
    query = query.eq("retryable", false);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<WorkflowErrorRecord[]>();
  const workflowErrors = data ?? [];

  if (error) {
    console.error("Workflow errors lookup failed:", {
      message: error.message,
      code: error.code,
    });
  }

  return (
    <InternalPage
      active="errors"
      title="Workflow Errors"
      description="Latest sanitized workflow errors for internal production review, retry, and resolution."
    >
      <form className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[0.8fr_1fr_0.8fr_0.8fr_auto]">
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Status
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          >
            <option value="open">Unresolved only</option>
            <option value="resolved">Resolved only</option>
            <option value="all">All</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Source contains
          <input
            name="source"
            defaultValue={sourceFilter}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            placeholder="lead-intake, clickup, sync..."
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Severity
          <select
            name="severity"
            defaultValue={severityFilter}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          >
            <option value="">Any severity</option>
            <option value="critical">critical</option>
            <option value="error">error</option>
            <option value="warning">warning</option>
            <option value="info">info</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Retryable
          <select
            name="retryable"
            defaultValue={retryableFilter}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          >
            <option value="">Any</option>
            <option value="yes">Retryable</option>
            <option value="no">Manual only</option>
          </select>
        </label>
        <button
          type="submit"
          className="self-end rounded-md bg-[#244285] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Filter
        </button>
      </form>

      <section className="py-8">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">
              Unable to load workflow errors right now.
            </p>
          </div>
        ) : null}

        {!error && workflowErrors.length ? (
          <div className="space-y-4">
            {workflowErrors.map((workflowError) => {
              const context = prettyContext(workflowError.context);

              return (
                <article
                  key={workflowError.id}
                  className=""
                >
                  <AdminCard>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge>{workflowError.severity}</StatusBadge>
                        <Badge tone={workflowError.resolved ? "green" : "amber"}>
                          {workflowError.resolved ? "Resolved" : "Open"}
                        </Badge>
                        {workflowError.retryable ? (
                          <Badge tone="accent">Retryable</Badge>
                        ) : (
                          <Badge tone="slate">Manual only</Badge>
                        )}
                      </div>
                      <h2 className="mt-3 text-base font-semibold text-slate-950">
                        {workflowError.message}
                      </h2>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {workflowError.source}
                      </p>
                      {workflowError.resolved_at || workflowError.resolved_by ? (
                        <p className="mt-2 text-sm text-slate-600">
                          Resolved{" "}
                          {workflowError.resolved_at
                            ? formatDate(workflowError.resolved_at)
                            : ""}
                          {workflowError.resolved_by
                            ? ` by ${workflowError.resolved_by}`
                            : ""}
                        </p>
                      ) : null}
                      {workflowError.resolution_note ? (
                        <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                          {workflowError.resolution_note}
                        </p>
                      ) : null}
                      <div className="mt-3 grid gap-1 text-sm text-slate-600">
                        <p>
                          Retry status:{" "}
                          <span className="font-medium text-slate-800">
                            {workflowError.retry_status || "Not attempted"}
                          </span>
                        </p>
                        <p>
                          Retry attempts:{" "}
                          <span className="font-medium text-slate-800">
                            {workflowError.retry_attempts}
                          </span>
                        </p>
                        {workflowError.last_retry_at ||
                        workflowError.last_retry_by ? (
                          <p>
                            Last retry{" "}
                            {workflowError.last_retry_at
                              ? formatDate(workflowError.last_retry_at)
                              : ""}
                            {workflowError.last_retry_by
                              ? ` by ${workflowError.last_retry_by}`
                              : ""}
                          </p>
                        ) : null}
                        {workflowError.last_retry_message ? (
                          <p className="rounded-md border border-slate-200 bg-slate-50 p-3 leading-6 text-slate-700">
                            {workflowError.last_retry_message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatDate(workflowError.created_at)}
                    </p>
                  </div>

                  {context ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-[#244285]">
                        View sanitized context
                      </summary>
                      <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                        {context}
                      </pre>
                    </details>
                  ) : null}

                  <ErrorActions
                    errorId={workflowError.id}
                    resolved={workflowError.resolved}
                    retryable={workflowError.retryable}
                  />
                  </AdminCard>
                </article>
              );
            })}
          </div>
        ) : null}

        {!error && !workflowErrors.length ? (
          <EmptyCard>No workflow errors found for the selected filters.</EmptyCard>
        ) : null}
      </section>
    </InternalPage>
  );
}
