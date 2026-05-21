"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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

export function SubtaskActionForm({
  requestId,
  taskItemId,
  type,
}: {
  requestId: string;
  taskItemId: string;
  type: "subtask" | "checklist";
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [documentType, setDocumentType] = useState(documentTypes[0]);
  const [markComplete, setMarkComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setWarnings([]);
    setIsError(false);
    setIsSubmitting(true);

    const formData = new FormData();
    const file = fileInputRef.current?.files?.[0];

    formData.append("type", type);
    formData.append("notes", notes);
    formData.append("documentType", documentType);
    formData.append("markComplete", String(markComplete));

    if (file) {
      formData.append("file", file);
    }

    const response = await fetch(
      `/api/client/requests/${requestId}/tasks/${encodeURIComponent(
        taskItemId
      )}/submit`,
      {
        method: "POST",
        body: formData,
      }
    );
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
      warnings?: string[];
    };

    if (!response.ok) {
      setMessage(result.message || "Task update could not be submitted.");
      setWarnings(result.warnings || []);
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    setMessage(result.message || "Task update submitted successfully.");
    setWarnings(result.warnings || []);
    setNotes("");
    setMarkComplete(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-800">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="documentType"
            className="block text-sm font-medium text-slate-800"
          >
            Document Type
          </label>
          <select
            id="documentType"
            name="documentType"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          >
            {documentTypes.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-slate-800">
            File
          </label>
          <input
            ref={fileInputRef}
            id="file"
            name="file"
            type="file"
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </div>
      </div>

      <label className="flex gap-3 rounded-lg border border-teal-900/10 bg-teal-50/40 p-4 text-sm font-medium text-slate-800">
        <input
          type="checkbox"
          checked={markComplete}
          onChange={(event) => setMarkComplete(event.target.checked)}
          className="mt-1 h-4 w-4 accent-teal-700"
        />
        <span>Mark this task complete</span>
      </label>

      <div aria-live="polite" className={isError ? "text-red-700" : "text-teal-700"}>
        {message ? <p className="text-sm font-medium">{message}</p> : null}
        {warnings.length ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Submitting..." : "Submit Update"}
      </button>
    </form>
  );
}
