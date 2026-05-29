"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export const requestStatusOptions = [
  "Submitted",
  "Under Review",
  "Waiting on Documents",
  "In Progress",
  "Internal Review",
  "Waiting on Client",
  "Ready for Billing",
  "Completed",
  "Closed",
] as const;

export function RequestStatusForm({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = requestStatusOptions.includes(
    currentStatus as (typeof requestStatusOptions)[number]
  )
    ? [...requestStatusOptions]
    : [currentStatus, ...requestStatusOptions];

  async function handleChange(nextStatus: string) {
    if (nextStatus === status || isSubmitting) {
      return;
    }

    const previousStatus = status;
    setStatus(nextStatus);
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const response = await fetch(`/api/internal/requests/${requestId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const result = (await response.json()) as { message?: string };

    setMessage(result.message || "Status updated.");
    setIsError(!response.ok);
    setIsSubmitting(false);

    if (response.ok) {
      if (nextStatus === "Completed" || nextStatus === "Complete") {
        router.push("/internal/billing");
        router.refresh();
        return;
      }
      router.refresh();
    } else {
      setStatus(previousStatus);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        Status
      </label>
      <select
        value={status}
        disabled={isSubmitting}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {isSubmitting ? (
        <span className="text-xs text-slate-500">Saving…</span>
      ) : null}
      {message ? (
        <p
          className={`text-xs font-medium ${isError ? "text-red-600" : "text-emerald-700"}`}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
