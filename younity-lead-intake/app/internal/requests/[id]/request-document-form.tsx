"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const documentTypes = [
  "Bank Statement",
  "Payroll Document",
  "Tax Document",
  "Company Registration",
  "Invoice/Receipt",
  "ID Document",
  "Employee List",
  "Financial Report",
  "Other",
];

export function RequestDocumentForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [documentType, setDocumentType] = useState(documentTypes[0]);
  const [messageValue, setMessageValue] = useState("");
  const [required, setRequired] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const response = await fetch(
      `/api/internal/requests/${requestId}/request-document`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType, message: messageValue, required }),
      }
    );
    const result = (await response.json()) as { message?: string };

    setMessage(result.message || "Document request added.");
    setIsError(!response.ok);
    setIsSubmitting(false);

    if (response.ok) {
      setMessageValue("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <label className="block text-sm font-medium text-slate-800">
        Document Type
        <select
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value)}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        >
          {documentTypes.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-slate-800">
        Message
        <textarea
          value={messageValue}
          onChange={(event) => setMessageValue(event.target.value)}
          rows={4}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <input
          type="checkbox"
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
        />
        Required document
      </label>

      <div aria-live="polite" className={isError ? "text-red-700" : "text-teal-700"}>
        {message ? <p className="text-sm font-medium">{message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Requesting..." : "Request Document"}
      </button>
    </form>
  );
}
