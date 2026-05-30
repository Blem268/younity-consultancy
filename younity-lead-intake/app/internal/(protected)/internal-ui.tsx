import type { ReactNode } from "react";
import {
  Badge,
  type BadgeTone,
  DocumentStatusBadge as SharedDocumentStatusBadge,
  getStatusTone,
  InvoiceStatusBadge as SharedInvoiceStatusBadge,
  StatusBadge as SharedStatusBadge,
} from "@/app/components/ui/status-badges";

export type InternalNavKey =
  | "board"
  | "clients"
  | "documents"
  | "billing"
  | "analytics"
  | "settings"
  // Legacy keys kept for backward compatibility
  | "dashboard"
  | "onboarding"
  | "requests"
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

export { Badge };

export function StatusBadge({ children }: { children: ReactNode }) {
  return <SharedStatusBadge>{children}</SharedStatusBadge>;
}

export function InvoiceStatusBadge({ children }: { children: ReactNode }) {
  return <SharedInvoiceStatusBadge status={String(children)} />;
}

export function DocumentStatusBadge({ children }: { children: ReactNode }) {
  return <SharedDocumentStatusBadge status={String(children)} />;
}

export function MutedBadge({ children }: { children: ReactNode }) {
  return <Badge tone="slate">{children}</Badge>;
}

export function WorkflowSeverityBadge({ severity }: { severity: string }) {
  const tone = getStatusTone(severity) as BadgeTone;

  return <Badge tone={tone}>{severity}</Badge>;
}

export function AccessDenied({ title }: { title: string }) {
  return (
    <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-5">
      <h1 className="text-xl font-black tracking-tight text-[#06111f]">{title}</h1>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        You do not have access to this internal page.
      </p>
    </div>
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
      <header className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#06111f]">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-shrink-0 flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto bg-[#f6f9fc] px-6 py-6">
        {children}
      </div>
    </>
  );
}

export function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[#50A9C0]/30 bg-[#50A9C0]/5 p-6">
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
    <article
      className={`rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
    >
      {title || actions ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-base font-semibold tracking-tight text-[#06111f]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-shrink-0 flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className={title || actions ? "mt-4" : ""}>{children}</div>
    </article>
  );
}
