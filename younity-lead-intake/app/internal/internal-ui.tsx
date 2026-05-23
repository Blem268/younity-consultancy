import type { ReactNode } from "react";

export type InternalNavKey =
  | "dashboard"
  | "clients"
  | "requests"
  | "documents"
  | "sync"
  | "errors";

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function formatDateTime(value: string | null) {
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

export function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMoney(value: number | string | null) {
  if (value === null || value === "") {
    return "Not available";
  }

  const amount = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function clientLabel(client: {
  full_name: string | null;
  company: string | null;
}) {
  return client.company || client.full_name || "Client unavailable";
}

export function sanitizeSearchParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] || "" : value || "";

  return rawValue.replace(/[%,]/g, " ").trim().slice(0, 120);
}

export function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export function logInternalQueryError(label: string, error: unknown) {
  if (!error || typeof error !== "object") {
    console.error("Internal query failed:", { label });
    return;
  }

  const maybeError = error as { message?: unknown; code?: unknown };
  console.error("Internal query failed:", {
    label,
    message:
      typeof maybeError.message === "string" ? maybeError.message : undefined,
    code: typeof maybeError.code === "string" ? maybeError.code : undefined,
  });
}

function badgeClass(tone: "teal" | "slate" | "amber" | "red" | "green" | "blue") {
  const tones = {
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
    green: "border-green-200 bg-green-50 text-green-800",
    blue: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return tones[tone];
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "teal" | "slate" | "amber" | "red" | "green" | "blue";
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(
        tone
      )}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ children }: { children: ReactNode }) {
  const value = String(children).toLowerCase();
  const tone =
    value.includes("complete") || value.includes("approved") || value.includes("resolved")
      ? "green"
      : value.includes("hold") || value.includes("needs") || value.includes("warning")
        ? "amber"
        : value.includes("reject") || value.includes("error") || value.includes("failed")
          ? "red"
          : "teal";

  return <Badge tone={tone}>{children}</Badge>;
}

export function InvoiceStatusBadge({ children }: { children: ReactNode }) {
  const value = String(children).toLowerCase();
  const tone =
    value.includes("ready")
      ? "green"
      : value.includes("paid")
        ? "teal"
        : value.includes("overdue") || value.includes("failed")
          ? "red"
          : value.includes("pending") || value.includes("draft")
            ? "amber"
            : "slate";

  return <Badge tone={tone}>{children}</Badge>;
}

export function DocumentStatusBadge({ children }: { children: ReactNode }) {
  return <StatusBadge>{children}</StatusBadge>;
}

export function MutedBadge({ children }: { children: ReactNode }) {
  return <Badge tone="slate">{children}</Badge>;
}

export function AccessDenied({ title }: { title: string }) {
  return (
    <section className="py-8">
      <AdminCard title={title}>
        <p className="text-sm leading-6 text-slate-600">
          You do not have access to this internal page.
        </p>
      </AdminCard>
    </section>
  );
}

export function InternalPage({
  title,
  description,
  children,
  actions,
}: {
  active: InternalNavKey;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <>
      <div className="border-b border-teal-900/10 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Younity Consultancy
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
      {children}
    </>
  );
}

export function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-teal-900/20 bg-teal-50/40 p-5">
      <p className="text-sm font-semibold text-slate-950">{children}</p>
    </div>
  );
}

export function AdminCard({
  title,
  description,
  children,
  actions,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <article className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {title || actions ? (
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={title || actions ? "mt-5" : ""}>{children}</div>
    </article>
  );
}
