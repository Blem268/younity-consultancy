import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import {
  ACTIVE_REQUEST_STATUS_NOT_IN,
  BILLING_PHASE_REQUEST_STATUSES,
  isBillingPhaseRequestStatus,
} from "@/lib/requestWorkflow";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  clientLabel,
  formatMoney,
  InternalPage,
  logInternalQueryError,
  StatusBadge,
  formatDateTime,
} from "../internal-ui";

// ─── Data types ────────────────────────────────────────────────────────────────

type PaidInvoice = {
  amount: number | string | null;
  created_at: string | null;
};

type RequestRow = {
  client_id: string | null;
  service: string;
  status: string;
  created_at: string | null;
  clients: {
    full_name: string | null;
    company: string | null;
  } | null;
};

type RecentRequest = {
  id: string;
  service: string;
  status: string;
  created_at: string | null;
  clients: {
    full_name: string | null;
    company: string | null;
  } | null;
};

// ─── Data helpers ──────────────────────────────────────────────────────────────

function buildMonthlyRevenue(invoices: PaidInvoice[]) {
  const now = new Date();
  const months: Record<string, number> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = 0;
  }

  for (const inv of invoices) {
    if (!inv.created_at) continue;
    const d = new Date(inv.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in months) {
      months[key] += Number(inv.amount ?? 0);
    }
  }

  return Object.entries(months).map(([key, value]) => {
    const [year, month] = key.split("-");
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en", {
      month: "short",
    });
    return { label, value };
  });
}

function buildServiceDistribution(requests: RequestRow[]) {
  const counts: Record<string, number> = {};
  for (const req of requests) {
    counts[req.service] = (counts[req.service] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([label, value]) => ({ label, value }));
}

function buildTopClients(requests: RequestRow[]) {
  const map = new Map<string, { label: string; count: number }>();
  for (const req of requests) {
    const clientId = req.client_id ?? "__unknown__";
    const label = req.clients ? clientLabel(req.clients) : "Unknown";
    const existing = map.get(clientId);
    if (existing) {
      existing.count++;
    } else {
      map.set(clientId, { label, count: 1 });
    }
  }
  return [...map.entries()]
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8)
    .map(([id, { label, count }]) => ({ id, label, count }));
}

// ─── Chart components (pure SVG, server-renderable) ────────────────────────────

function MonthlyRevenueChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const chartH = 100;
  const barW = 38;
  const gap = 14;
  const pad = 8;
  const totalW = data.length * (barW + gap) - gap + pad * 2;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${chartH + 28}`}
      className="w-full"
      aria-label="Monthly revenue bar chart"
      role="img"
    >
      {data.map((d, i) => {
        const bh = Math.max((d.value / max) * chartH, d.value > 0 ? 5 : 0);
        const x = pad + i * (barW + gap);
        const y = chartH - bh;
        const isCurrent = i === data.length - 1;

        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={bh || 2}
              fill={isCurrent ? "#244285" : "#50A9C0"}
              fillOpacity={d.value === 0 ? 0.25 : 1}
              rx={4}
            />
            <text
              x={x + barW / 2}
              y={chartH + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
            >
              {d.label}
            </text>
            {d.value > 0 ? (
              <text
                x={x + barW / 2}
                y={Math.max(y - 5, 10)}
                textAnchor="middle"
                fontSize={9}
                fill="#475569"
              >
                {d.value >= 1000
                  ? `$${(d.value / 1000).toFixed(1)}k`
                  : `$${Math.round(d.value)}`}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function ServiceDistribution({
  data,
  total,
}: {
  data: { label: string; value: number }[];
  total: number;
}) {
  return (
    <div className="space-y-3">
      {data.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="max-w-[68%] truncate text-sm font-medium text-slate-700">
                {item.label}
              </span>
              <span className="flex-shrink-0 text-xs text-slate-500">
                {item.value} · {pct}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-[#50A9C0]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Analytics" />;
  }

  const supabaseAdmin = createAdminClient();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [
    paidInvoicesResult,
    completedCountResult,
    openCountResult,
    allRequestsResult,
    recentRequestsResult,
  ] = await Promise.all([
    // Paid invoices for revenue + monthly chart
    supabaseAdmin
      .from("client_invoices")
      .select("amount, created_at")
      .eq("status", "Paid")
      .returns<PaidInvoice[]>(),

    // Completed requests count
    supabaseAdmin
      .from("client_requests")
      .select("id", { count: "exact", head: true })
      .in("status", [...BILLING_PHASE_REQUEST_STATUSES]),

    // Open requests count
    supabaseAdmin
      .from("client_requests")
      .select("id", { count: "exact", head: true })
      .not("status", "in", ACTIVE_REQUEST_STATUS_NOT_IN),

    // All requests for service distribution + top clients
    supabaseAdmin
      .from("client_requests")
      .select("client_id, service, status, created_at, clients(full_name, company)")
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<RequestRow[]>(),

    // Recent requests for activity feed
    supabaseAdmin
      .from("client_requests")
      .select("id, service, status, created_at, clients(full_name, company)")
      .not("status", "in", ACTIVE_REQUEST_STATUS_NOT_IN)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<RecentRequest[]>(),
  ]);

  // Log errors
  if (paidInvoicesResult.error) logInternalQueryError("Analytics paid invoices", paidInvoicesResult.error);
  if (completedCountResult.error) logInternalQueryError("Analytics completed count", completedCountResult.error);
  if (openCountResult.error) logInternalQueryError("Analytics open count", openCountResult.error);
  if (allRequestsResult.error) logInternalQueryError("Analytics all requests", allRequestsResult.error);
  if (recentRequestsResult.error) logInternalQueryError("Analytics recent requests", recentRequestsResult.error);

  const paidInvoices = paidInvoicesResult.data ?? [];
  const allRequests = allRequestsResult.data ?? [];
  const recentRequests = recentRequestsResult.data ?? [];

  // Derived metrics
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0);
  const completedCount = completedCountResult.count ?? 0;
  const openCount = openCountResult.count ?? 0;

  const activeClientIds = new Set(
    allRequests
      .filter((r) => !isBillingPhaseRequestStatus(r.status))
      .map((r) => r.client_id)
      .filter(Boolean)
  );

  const monthlyRevenue = buildMonthlyRevenue(paidInvoices);
  const serviceDistribution = buildServiceDistribution(allRequests);
  const serviceTotal = serviceDistribution.reduce((s, d) => s + d.value, 0);
  const topClients = buildTopClients(allRequests);

  const kpis = [
    {
      label: "Revenue collected",
      value: formatMoney(totalRevenue),
      sub: "Paid invoices · all time",
    },
    {
      label: "Active clients",
      value: activeClientIds.size.toString(),
      sub: "With open requests",
    },
    {
      label: "Requests completed",
      value: completedCount.toString(),
      sub: "Completed or closed · all time",
    },
    {
      label: "Open requests",
      value: openCount.toString(),
      sub: "Currently in workflow",
    },
  ];

  return (
    <InternalPage
      active="analytics"
      title="Analytics"
      description="Revenue, service demand, and workflow activity across the client base."
    >
      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[10px] border border-slate-200/80 bg-white px-5 py-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {kpi.label}
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-[#06111f]">
              {kpi.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Monthly revenue */}
        <div className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#06111f]">
                Monthly revenue
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">Paid invoices · last 6 months</p>
            </div>
            <Link
              href="/internal/billing"
              prefetch={false}
              className="text-xs font-semibold text-[#244285] transition hover:text-[#06111f]"
            >
              View billing →
            </Link>
          </div>
          {paidInvoices.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No paid invoices recorded yet.
            </p>
          ) : (
            <MonthlyRevenueChart data={monthlyRevenue} />
          )}
        </div>

        {/* Service distribution */}
        <div className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#06111f]">
              Services by demand
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Request count · all time
            </p>
          </div>
          {serviceDistribution.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No request data yet.
            </p>
          ) : (
            <ServiceDistribution data={serviceDistribution} total={serviceTotal} />
          )}
        </div>
      </div>

      {/* Tables row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top clients */}
        <div className="rounded-[10px] border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-[#06111f]">Top clients</h2>
            <p className="mt-0.5 text-xs text-slate-500">By total request volume</p>
          </div>
          {topClients.length === 0 ? (
            <p className="px-5 py-6 text-xs text-slate-400">No client data yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {topClients.map((client, index) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span className="w-5 flex-shrink-0 text-center text-xs font-black text-slate-300">
                    {index + 1}
                  </span>
                  <Link
                    href={`/internal/clients?search=${encodeURIComponent(client.label)}`}
                    prefetch={false}
                    className="flex-1 truncate text-sm font-semibold text-[#244285] transition hover:text-[#06111f]"
                  >
                    {client.label}
                  </Link>
                  <span className="flex-shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {client.count} request{client.count === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-[10px] border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#06111f]">
                Recent requests
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">Latest workflow activity</p>
            </div>
            <Link
              href="/internal/requests"
              prefetch={false}
              className="text-xs font-semibold text-[#244285] transition hover:text-[#06111f]"
            >
              View all →
            </Link>
          </div>
          {recentRequests.length === 0 ? (
            <p className="px-5 py-6 text-xs text-slate-400">No recent activity.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRequests.map((req) => (
                <Link
                  key={req.id}
                  href={`/internal/requests/${req.id}`}
                  prefetch={false}
                  className="flex items-start gap-3 px-5 py-3 transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#06111f]">
                      {req.service}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {req.clients ? clientLabel(req.clients) : "Unknown client"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDateTime(req.created_at)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    <StatusBadge>{req.status}</StatusBadge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </InternalPage>
  );
}
