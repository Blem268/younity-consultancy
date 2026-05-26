import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import {
  CLICKUP_CLIENT_REQUESTS_LIST_ID,
  CLICKUP_CLIENT_REQUESTS_LIST_NAME,
  CLICKUP_CLIENT_REQUESTS_LIST_PATH,
  CLICKUP_CUSTOM_FIELDS,
  CLICKUP_REQUEST_STATUSES,
} from "@/lib/clickup/setup";
import { AccessDenied, InternalPage } from "../internal-ui";
import { SyncButtons } from "./sync-buttons";

export default async function InternalSyncPage() {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Younity Internal Sync Controls" />;
  }

  const configuredListId = process.env.CLICKUP_LIST_ID || "";
  const webhookSecretConfigured = Boolean(process.env.CLICKUP_WEBHOOK_SECRET);

  return (
    <InternalPage
      active="sync"
      title="Younity Internal Sync Controls"
      description="Manage ClickUp webhook automation and run manual sync fallbacks without exposing internal secrets in the browser."
    >
      <section className="py-8">
        <SyncButtons />
      </section>
      <section className="pb-8">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            ClickUp Setup Checklist
          </h2>
          <div className="mt-5 grid gap-4 text-sm text-slate-700 lg:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-950">Expected list</p>
              <p className="mt-1">{CLICKUP_CLIENT_REQUESTS_LIST_NAME}</p>
              <p className="mt-1 font-mono text-xs">{CLICKUP_CLIENT_REQUESTS_LIST_PATH}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Configured list ID</p>
              <p className="mt-1 font-mono text-xs">
                {configuredListId || "CLICKUP_LIST_ID is not configured"}
              </p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  configuredListId === CLICKUP_CLIENT_REQUESTS_LIST_ID
                    ? "text-green-700"
                    : "text-amber-700"
                }`}
              >
                Expected {CLICKUP_CLIENT_REQUESTS_LIST_ID}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Webhook secret</p>
              <p className={webhookSecretConfigured ? "mt-1 text-green-700" : "mt-1 text-amber-700"}>
                {webhookSecretConfigured
                  ? "CLICKUP_WEBHOOK_SECRET is configured."
                  : "CLICKUP_WEBHOOK_SECRET is missing."}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Safe setup endpoint</p>
              <p className="mt-1 font-mono text-xs">
                /api/internal/clickup/setup-check
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Required statuses
              </p>
              <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                {CLICKUP_REQUEST_STATUSES.map((status) => (
                  <li key={status}>{status}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Required custom fields
              </p>
              <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                {CLICKUP_CUSTOM_FIELDS.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </InternalPage>
  );
}
