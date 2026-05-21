"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type RequestOption = {
  id: string;
  service: string;
  status: string;
};

export const documentTypes = [
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

export function UploadForm({
  requests,
  initialRequestId,
  fixedRequestId,
  compact = false,
}: {
  requests: RequestOption[];
  initialRequestId?: string;
  fixedRequestId?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState(documentTypes[0]);
  const [requestId, setRequestId] = useState(fixedRequestId || initialRequestId || "");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const formData = new FormData();
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setMessage("Please choose a file to upload.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    formData.append("file", file);
    formData.append("documentType", documentType);
    formData.append("requestId", fixedRequestId || requestId);
    formData.append("notes", notes);

    const response = await fetch("/api/client/documents/upload", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as {
      message?: string;
    };

    if (!response.ok) {
      setMessage(result.message || "Document upload failed.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    setMessage(result.message || "Document uploaded successfully.");
    setNotes("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "mt-4 space-y-4" : "mt-5 space-y-5"}>
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
          {documentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {fixedRequestId ? null : (
        <div>
          <label
            htmlFor="requestId"
            className="block text-sm font-medium text-slate-800"
          >
            Related Request
          </label>
          <select
            id="requestId"
            name="requestId"
            value={requestId}
            onChange={(event) => setRequestId(event.target.value)}
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          >
            <option value="">General / Not linked to a request</option>
            {requests.map((request) => (
              <option key={request.id} value={request.id}>
                {request.service} ({request.status})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-slate-800">
          File
        </label>
        <input
          ref={fileInputRef}
          id="file"
          name="file"
          type="file"
          required
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-slate-800"
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        />
      </div>

      <div aria-live="polite" className={isError ? "text-red-700" : "text-teal-700"}>
        {message ? <p className="text-sm font-medium">{message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Uploading..." : "Upload Document"}
      </button>
    </form>
  );
}
