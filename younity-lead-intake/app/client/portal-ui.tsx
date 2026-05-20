import type { ReactNode } from "react";
import Link from "next/link";

export function PortalPage({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return <div className={narrow ? "mx-auto max-w-4xl" : undefined}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function BackLinks({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm font-semibold text-teal-700 transition hover:text-teal-900"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function PrimaryButtonLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}

export function SecondaryButtonLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-100"
    >
      {children}
    </Link>
  );
}

function statusBadgeClass(status: string, kind: "request" | "invoice" | "document") {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("overdue") ||
    normalized.includes("cancelled") ||
    normalized.includes("canceled")
  ) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (
    normalized.includes("billing") ||
    normalized.includes("drafted") ||
    normalized.includes("sent") ||
    normalized.includes("progress") ||
    normalized.includes("review")
  ) {
    return kind === "invoice"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : "border-teal-200 bg-teal-50 text-teal-800";
  }

  if (
    normalized.includes("partial") ||
    normalized.includes("pending") ||
    normalized.includes("requested")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (
    normalized.includes("paid") ||
    normalized.includes("completed") ||
    normalized.includes("closed") ||
    normalized.includes("received") ||
    normalized.includes("submitted")
  ) {
    return "border-green-200 bg-green-50 text-green-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function StatusBadge({
  status,
  kind,
}: {
  status: string;
  kind: "request" | "invoice" | "document";
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
        status,
        kind
      )}`}
    >
      {status}
    </span>
  );
}

export function getInvoiceStatus(value: string | null | undefined) {
  return value || "Not Ready";
}

export function RequestStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} kind="request" />;
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} kind="invoice" />;
}

export function DocumentStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} kind="document" />;
}
