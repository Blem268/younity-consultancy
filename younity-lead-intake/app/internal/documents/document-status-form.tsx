"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const documentStatusOptions = [
  "Submitted",
  "Received",
  "Under Review",
  "Approved",
  "Rejected",
  "Needs Replacement",
];

export function DocumentStatusForm({
  documentId,
  currentStatus,
}: {
  documentId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const response = await fetch(`/api/internal/documents/${documentId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    const result = (await response.json()) as { message?: string };

    setMessage(result.message || "Document status updated.");
    setIsError(!response.ok);
    setIsSubmitting(false);

    if (response.ok) {
      setNote("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        Review Status
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        >
          {documentStatusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        Client Note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        />
      </label>
      <div
        aria-live="polite"
        className={isError ? "text-xs font-medium text-red-700" : "text-xs font-medium text-teal-700"}
      >
        {message ? <p>{message}</p> : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-fit items-center justify-center rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Saving..." : "Save Status"}
      </button>
    </form>
  );
}
