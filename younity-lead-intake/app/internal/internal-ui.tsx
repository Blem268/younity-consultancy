import Link from "next/link";
import type { ReactNode } from "react";

const internalNavItems = [
  { label: "Dashboard", href: "/internal", key: "dashboard" },
  { label: "Clients", href: "/internal/clients", key: "clients" },
  { label: "Requests", href: "/internal/requests", key: "requests" },
  { label: "Documents", href: "/internal/documents", key: "documents" },
  { label: "Sync Controls", href: "/internal/sync", key: "sync" },
  { label: "Workflow Errors", href: "/internal/errors", key: "errors" },
];

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

export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
      {children}
    </span>
  );
}

export function MutedBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

export function AccessDenied({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="border-b border-teal-900/10 pb-8">
          <InternalNav active="dashboard" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Younity Consultancy
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
        </header>
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-6 text-slate-600">
            You do not have access to this internal page.
          </p>
        </section>
      </div>
    </main>
  );
}

export function InternalNav({ active }: { active: InternalNavKey }) {
  return (
    <nav aria-label="Internal navigation" className="overflow-x-auto">
      <div className="flex min-w-max gap-2">
        {internalNavItems.map((item) => {
          const isActive = item.key === active;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-700 hover:bg-teal-50 hover:text-teal-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function InternalPage({
  active,
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
    <main className="min-h-screen bg-[#f7faf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="border-b border-teal-900/10 pb-8">
          <InternalNav active={active} />
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
        </header>
        {children}
      </div>
    </main>
  );
}

export function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-teal-900/20 bg-teal-50/40 p-5">
      <p className="text-sm font-semibold text-slate-950">{children}</p>
    </div>
  );
}
