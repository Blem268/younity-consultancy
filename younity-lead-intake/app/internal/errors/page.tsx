import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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
};

type PageProps = {
  searchParams: Promise<{
    unresolved?: string | string[];
    status?: string | string[];
    source?: string | string[];
    severity?: string | string[];
  }>;
};

function getAllowedAdminEmails() {
  return (process.env.INTERNAL_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

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

function severityClass(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized === "critical") {
    return "border-red-300 bg-red-100 text-red-900";
  }

  if (normalized === "error") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (normalized === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function prettyContext(context: unknown) {
  if (!context) {
    return "";
  }

  return JSON.stringify(context, null, 2);
}

export default async function InternalErrorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const legacyUnresolvedOnly = getSearchParam(params.unresolved) === "true";
  const statusFilter = getSearchParam(params.status) || (legacyUnresolvedOnly ? "open" : "all");
  const sourceFilter = getSearchParam(params.source).trim();
  const severityFilter = getSearchParam(params.severity).trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const allowedEmails = getAllowedAdminEmails();
  const userEmail = user.email?.toLowerCase() || "";

  if (!allowedEmails.length || !allowedEmails.includes(userEmail)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-[#f7faf8] px-6 py-8">
        <header className="border-b border-teal-900/10 pb-8">
          <Link
            href="/client/dashboard"
            className="text-sm font-semibold text-teal-700 transition hover:text-teal-900"
          >
            Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Workflow Errors
          </h1>
        </header>
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-6 text-slate-600">
            You do not have access to this internal page.
          </p>
        </section>
      </main>
    );
  }

  const supabaseAdmin = createAdminClient();
  let query = supabaseAdmin
    .from("workflow_errors")
    .select(
      "id, source, severity, message, context, resolved, resolved_at, resolved_by, resolution_note, created_at"
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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-[#f7faf8] px-6 py-8">
      <header className="border-b border-teal-900/10 pb-8">
        <div className="flex flex-wrap gap-4">
          <Link
            href="/client/dashboard"
            className="text-sm font-semibold text-teal-700 transition hover:text-teal-900"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/internal/sync"
            className="text-sm font-semibold text-teal-700 transition hover:text-teal-900"
          >
            Internal Sync
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Workflow Errors
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Latest sanitized workflow errors for internal production review.
        </p>
      </header>

      <form className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[0.8fr_1fr_0.8fr_auto]">
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
        <button
          type="submit"
          className="self-end rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
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
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClass(
                            workflowError.severity
                          )}`}
                        >
                          {workflowError.severity}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {workflowError.resolved ? "Resolved" : "Open"}
                        </span>
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
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatDate(workflowError.created_at)}
                    </p>
                  </div>

                  {context ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-teal-700">
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
                  />
                </article>
              );
            })}
          </div>
        ) : null}

        {!error && !workflowErrors.length ? (
          <div className="rounded-lg border border-dashed border-teal-900/20 bg-teal-50/40 p-5">
            <p className="text-sm font-semibold text-slate-950">
              No workflow errors found.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
