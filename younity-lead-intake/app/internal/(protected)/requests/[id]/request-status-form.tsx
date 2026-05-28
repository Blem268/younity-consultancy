"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
const statusOptions = [
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
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const response = await fetch(`/api/internal/requests/${requestId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        note: showNote ? note : undefined,
        visibleToClient: showNote,
      }),
    });
    const result = (await response.json()) as { message?: string };

    setMessage(result.message || "Status update complete.");
    setIsError(!response.ok);
    setIsSubmitting(false);

    if (response.ok) {
      setNote("");
      setShowNote(false);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <label className="block text-sm font-medium text-slate-800">
        Status
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-slate-800">
        Client-visible note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        />
      </label>

      <label className="flex items-start gap-3 text-sm font-medium text-slate-800">
        <input
          type="checkbox"
          checked={showNote}
          onChange={(event) => setShowNote(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#244285]"
        />
        Show note in client timeline
      </label>

      <div aria-live="polite" className={isError ? "text-red-700" : "text-[#244285]"}>
        {message ? <p className="text-sm font-medium">{message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-xl bg-[#244285] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Updating..." : "Update Status"}
      </button>
    </form>
  );
}
