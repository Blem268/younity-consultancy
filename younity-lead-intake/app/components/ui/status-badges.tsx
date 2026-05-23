import type { ReactNode } from "react";

export type BadgeTone =
  | "slate"
  | "blue"
  | "accent"
  | "amber"
  | "green"
  | "red";

const toneClasses: Record<BadgeTone, string> = {
  slate: "border-slate-200 bg-slate-100 text-slate-700",
  blue: "border-[#244285]/20 bg-[#244285]/10 text-[#244285]",
  accent: "border-[#50A9C0]/30 bg-[#50A9C0]/10 text-[#244285]",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  green: "border-green-200 bg-green-50 text-green-800",
  red: "border-red-200 bg-red-50 text-red-800",
};

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

function normalize(value: ReactNode) {
  return String(value || "").toLowerCase();
}

export function getStatusTone(value: ReactNode): BadgeTone {
  const status = normalize(value);

  if (
    status.includes("rejected") ||
    status.includes("overdue") ||
    status.includes("error") ||
    status.includes("failed") ||
    status.includes("critical")
  ) {
    return "red";
  }

  if (
    status.includes("waiting") ||
    status.includes("pending") ||
    status.includes("requested") ||
    status.includes("needs") ||
    status.includes("warning") ||
    status.includes("draft")
  ) {
    return "amber";
  }

  if (
    status.includes("approved") ||
    status.includes("paid") ||
    status.includes("completed") ||
    status.includes("complete") ||
    status.includes("received") ||
    status.includes("resolved")
  ) {
    return "green";
  }

  if (
    status.includes("submitted") ||
    status.includes("new") ||
    status.includes("sent")
  ) {
    return "blue";
  }

  if (
    status.includes("progress") ||
    status.includes("review") ||
    status.includes("billing") ||
    status.includes("retryable")
  ) {
    return "accent";
  }

  return "slate";
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return <Badge tone={getStatusTone(children)}>{children}</Badge>;
}

export function RequestStatusBadge({ status }: { status: string }) {
  return <StatusBadge>{status}</StatusBadge>;
}

export function DocumentStatusBadge({ status }: { status: string }) {
  return <StatusBadge>{status}</StatusBadge>;
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  return <StatusBadge>{status}</StatusBadge>;
}

export function TaskCompletionBadge({ completed }: { completed: boolean }) {
  return (
    <Badge tone={completed ? "green" : "amber"}>
      {completed ? "Completed" : "Action available"}
    </Badge>
  );
}
