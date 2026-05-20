"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setIsError(false);
    setIsSubmitting(true);

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
      message?: string;
      requestId?: string;
      warnings?: string[];
    };

    if (!response.ok) {
      setStatusMessage(result.message || "Request submission failed.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    setStatusMessage(result.message || "Request submitted successfully.");

    if (result.requestId) {
      router.replace(`/client/requests/${result.requestId}`);
    } else {
      router.replace("/client/requests");
    }

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
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
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
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
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
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
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
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
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
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        />
      </div>

      <div aria-live="polite" className={isError ? "text-red-700" : "text-teal-700"}>
        {statusMessage ? (
          <p className="text-sm font-medium">{statusMessage}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
