"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { documentTypes } from "../../documents/upload-form";

const serviceOptions = [
  "Bookkeeping Services",
  "Payroll Services",
  "General Administration",
  "HR Support",
  "Strategic Management & Advisory",
  "Tax Services",
  "Compliance Services",
  "Other",
];

const preferredContactOptions = [
  "Email",
  "Phone Call",
  "WhatsApp",
  "No Preference",
];

const urgencyOptions = ["Low", "Normal", "High"];

export function RequestForm() {
  const router = useRouter();
  const [service, setService] = useState(serviceOptions[0]);
  const [message, setMessage] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState(
    preferredContactOptions[0]
  );
  const [urgency, setUrgency] = useState("Normal");
  const [billingNotes, setBillingNotes] = useState("");
  const [documentType, setDocumentType] = useState(documentTypes[0]);
  const [documentNotes, setDocumentNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setIsError(false);
    setIsSubmitting(true);
    setCreatedRequestId("");

    const response = await fetch("/api/client/requests/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service,
        message,
        preferredContactMethod,
        urgency,
        billingNotes,
      }),
    });

    const result = (await response.json()) as {
      success?: boolean;
      message?: string;
      requestId?: string;
      clickUpTaskId?: string;
      warnings?: string[];
    };

    if (!response.ok) {
      setStatusMessage(result.message || "Request submission failed.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    const uploadFile = fileInputRef.current?.files?.[0];

    if (result.requestId) {
      if (uploadFile) {
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("documentType", documentType);
        formData.append("requestId", result.requestId);
        formData.append("notes", documentNotes);

        const uploadResponse = await fetch("/api/client/documents/upload", {
          method: "POST",
          body: formData,
        });
        const uploadResult = (await uploadResponse.json().catch(() => ({}))) as {
          message?: string;
        };

        if (!uploadResponse.ok) {
          setStatusMessage(
            `Request was created, but document upload failed. You can upload it from the request detail page.${
              uploadResult.message ? ` ${uploadResult.message}` : ""
            }`
          );
          setIsError(true);
          setIsSubmitting(false);
          setCreatedRequestId(result.requestId);
          router.refresh();
          return;
        }
      }

      router.replace(`/client/requests/${result.requestId}`);
      router.refresh();
      return;
    }

    router.replace("/client/requests");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <label htmlFor="service" className="block text-sm font-medium text-slate-800">
          Service
        </label>
        <select
          id="service"
          name="service"
          value={service}
          onChange={(event) => setService(event.target.value)}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        >
          {serviceOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-800">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          required
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="preferredContactMethod"
            className="block text-sm font-medium text-slate-800"
          >
            Preferred Contact Method
          </label>
          <select
            id="preferredContactMethod"
            name="preferredContactMethod"
            value={preferredContactMethod}
            onChange={(event) => setPreferredContactMethod(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          >
            {preferredContactOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="urgency" className="block text-sm font-medium text-slate-800">
            Urgency
          </label>
          <select
            id="urgency"
            name="urgency"
            value={urgency}
            onChange={(event) => setUrgency(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          >
            {urgencyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="billingNotes"
          className="block text-sm font-medium text-slate-800"
        >
          Billing Notes
        </label>
        <textarea
          id="billingNotes"
          name="billingNotes"
          value={billingNotes}
          onChange={(event) => setBillingNotes(event.target.value)}
          rows={4}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        />
      </div>

      <fieldset className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-950">
          Optional Document
        </legend>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Add a supporting file now and it will be linked to this request.
        </p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
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
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
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
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-[#244285] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="documentNotes"
            className="block text-sm font-medium text-slate-800"
          >
            Document Notes
          </label>
          <textarea
            id="documentNotes"
            name="documentNotes"
            value={documentNotes}
            onChange={(event) => setDocumentNotes(event.target.value)}
            rows={3}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </div>
      </fieldset>

      <div aria-live="polite" className={isError ? "text-red-700" : "text-[#244285]"}>
        {statusMessage ? (
          <p className="text-sm font-medium">{statusMessage}</p>
        ) : null}
        {createdRequestId ? (
          <Link
            href={`/client/requests/${createdRequestId}`}
            prefetch={false}
            className="mt-2 inline-flex text-sm font-semibold text-[#244285] transition hover:text-[#06111f]"
          >
            View request details
          </Link>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-xl bg-[#244285] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
