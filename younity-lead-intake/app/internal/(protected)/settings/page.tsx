import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  AdminCard,
  EmptyCard,
  formatDateTime,
  InternalPage,
  logInternalQueryError,
  StatusBadge,
} from "../internal-ui";

type PageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

type SettingsTab = "notifications" | "integrations" | "admins" | "errors";

type InternalAdminRecord = {
  id: string;
  email: string;
  created_at: string | null;
};

type WorkflowErrorRecord = {
  id: string;
  created_at: string | null;
  source: string;
  severity: string;
  message: string;
  resolved: boolean;
};

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: "notifications", label: "Notifications" },
  { key: "integrations", label: "Integrations" },
  { key: "admins", label: "Admin users" },
  { key: "errors", label: "Error logs" },
];

const WHATSAPP_NOTIFICATION_EVENTS = [
  "New client request submitted",
  "Document uploaded by client",
  "Request status changed",
  "Invoice marked Ready for Billing",
  "Workflow error logged",
] as const;

const INTEGRATIONS = [
  {
    name: "Zoho CRM",
    initials: "ZC",
    color: "bg-[#244285]",
    status: "Connected" as const,
    description: "Leads and contacts synced from the intake form.",
  },
  {
    name: "Zoho Books",
    initials: "ZB",
    color: "bg-[#06111f]",
    status: "Connected" as const,
    description: "Invoicing and payment tracking.",
  },
  {
    name: "Twilio",
    initials: "TW",
    color: "bg-[#50A9C0]",
    status: "Sandbox" as const,
    description: "WhatsApp notifications for internal events.",
  },
  {
    name: "Resend",
    initials: "RE",
    color: "bg-slate-600",
    status: "Paused" as const,
    description: "Transactional email delivery.",
  },
];

function resolveTab(rawTab: string | undefined): SettingsTab {
  if (
    rawTab === "notifications" ||
    rawTab === "integrations" ||
    rawTab === "admins" ||
    rawTab === "errors"
  ) {
    return rawTab;
  }

  return "notifications";
}

function EnabledBadge() {
  return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      Enabled
    </span>
  );
}

function IntegrationStatusBadge({
  status,
}: {
  status: "Connected" | "Sandbox" | "Paused";
}) {
  const className =
    status === "Connected"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Sandbox"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {status}
    </span>
  );
}

function SettingsSubNav({
  activeTab,
  unresolvedCount,
}: {
  activeTab: SettingsTab;
  unresolvedCount: number;
}) {
  return (
    <nav
      aria-label="Settings sections"
      className="mb-6 flex flex-wrap gap-6 border-b border-slate-200"
    >
      {SETTINGS_TABS.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <Link
            key={item.key}
            href={`/internal/settings?tab=${item.key}`}
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
            className={`pb-3 text-sm transition ${
              isActive
                ? "border-b-2 border-[#244285] font-semibold text-[#244285]"
                : "text-slate-500 hover:text-[#06111f]"
            }`}
          >
            {item.label}
            {item.key === "errors" && unresolvedCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                {unresolvedCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function NotificationsSection() {
  return (
    <AdminCard
      title="WhatsApp Notifications"
      description="Configure which internal events trigger WhatsApp alerts via Twilio. Webhook endpoint: `/api/webhooks/twilio`."
    >
      <ul className="divide-y divide-slate-100">
        {WHATSAPP_NOTIFICATION_EVENTS.map((event) => (
          <li
            key={event}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <span className="text-sm font-medium text-[#06111f]">{event}</span>
            <EnabledBadge />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-6 text-slate-500">
        Twilio is currently in sandbox mode. To enable production WhatsApp
        delivery, complete Meta Business Verification and upgrade to a
        registered number.
      </p>
    </AdminCard>
  );
}

function IntegrationsSection() {
  return (
    <section className="space-y-4">
      <p className="text-sm leading-6 text-slate-600">
        Integration credentials are managed via environment variables. Contact
        your developer to update API keys or OAuth tokens.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
          <article
            key={integration.name}
            className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${integration.color}`}
              >
                {integration.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-[#06111f]">
                    {integration.name}
                  </h3>
                  <IntegrationStatusBadge status={integration.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {integration.description}
                </p>
                <Link
                  href="#"
                  prefetch={false}
                  className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Manage
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminsSection({
  admins,
  queryError,
}: {
  admins: InternalAdminRecord[];
  queryError: boolean;
}) {
  if (queryError) {
    return (
      <p className="text-sm font-semibold text-red-700">
        Unable to load admin users. Check the internal_admins table and try
        again.
      </p>
    );
  }

  if (admins.length === 0) {
    return <EmptyCard>No admin users found.</EmptyCard>;
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-4 py-4 font-medium text-[#06111f]">
                  {admin.email}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {formatDateTime(admin.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm leading-6 text-amber-900">
          Admin access is controlled server-side via the{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
            internal_admins
          </code>{" "}
          table. To add or remove admins, update the table directly in Supabase
          or via a migration.
        </p>
      </div>
    </section>
  );
}

function ErrorsSection({
  errors,
  queryError,
}: {
  errors: WorkflowErrorRecord[];
  queryError: boolean;
}) {
  if (queryError) {
    return (
      <p className="text-sm font-semibold text-red-700">
        Unable to load workflow errors. Check the workflow_errors table and try
        again.
      </p>
    );
  }

  if (errors.length === 0) {
    return (
      <EmptyCard>
        No unresolved workflow errors. The active queue is clear.
      </EmptyCard>
    );
  }

  return (
    <section className="space-y-4">
      <ul className="space-y-3">
        {errors.map((workflowError) => (
          <li
            key={workflowError.id}
            className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge>{workflowError.severity}</StatusBadge>
              <span className="text-sm text-slate-500">
                {formatDateTime(workflowError.created_at)}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#06111f]">
              {workflowError.message}
            </p>
            <p className="mt-1 text-sm text-slate-500">{workflowError.source}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm leading-6 text-slate-600">
        Errors are logged automatically by internal workflows. Manual resolution
        requires a database update (
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
          resolved = true
        </code>
        ).
      </p>
    </section>
  );
}

export default async function InternalSettingsPage({ searchParams }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Settings" />;
  }

  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : (params.tab ?? "notifications");
  const tab = resolveTab(rawTab);

  const supabaseAdmin = createAdminClient();

  const [
    { data: admins, error: adminsError },
    { count: unresolvedCount, error: unresolvedCountError },
    { data: errors, error: errorsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("internal_admins")
      .select("id, email, created_at")
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("workflow_errors")
      .select("*", { count: "exact", head: true })
      .eq("resolved", false),
    supabaseAdmin
      .from("workflow_errors")
      .select("id, created_at, source, severity, message, resolved")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (adminsError) {
    logInternalQueryError("settings.internal_admins", adminsError);
  }

  if (unresolvedCountError) {
    logInternalQueryError("settings.workflow_errors.count", unresolvedCountError);
  }

  if (errorsError) {
    logInternalQueryError("settings.workflow_errors.list", errorsError);
  }

  const adminRecords = (admins ?? []) as InternalAdminRecord[];
  const errorRecords = (errors ?? []) as WorkflowErrorRecord[];
  const unresolvedTotal = unresolvedCount ?? 0;

  return (
    <InternalPage
      active="settings"
      title="Settings"
      description="Notifications, integrations, admin access, and workflow error visibility for the Younity operations backend."
    >
      <SettingsSubNav activeTab={tab} unresolvedCount={unresolvedTotal} />

      {tab === "notifications" ? <NotificationsSection /> : null}
      {tab === "integrations" ? <IntegrationsSection /> : null}
      {tab === "admins" ? (
        <AdminsSection
          admins={adminRecords}
          queryError={Boolean(adminsError)}
        />
      ) : null}
      {tab === "errors" ? (
        <ErrorsSection
          errors={errorRecords}
          queryError={Boolean(errorsError || unresolvedCountError)}
        />
      ) : null}
    </InternalPage>
  );
}
