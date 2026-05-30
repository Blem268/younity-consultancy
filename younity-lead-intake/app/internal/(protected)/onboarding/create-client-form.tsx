"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const preferredContactOptions = [
  "Email",
  "Phone Call",
  "WhatsApp",
  "No Preference",
];

const INPUT =
  "mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25";

export function CreateClientForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setInviteSent(false);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/internal/onboarding/create-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        company: formData.get("company"),
        preferredContactMethod: formData.get("preferredContactMethod"),
        zohoLeadId: formData.get("zohoLeadId"),
        zohoContactId: formData.get("zohoContactId"),
      }),
    });

    const result = (await response.json()) as {
      message?: string;
      inviteSent?: boolean;
    };

    setMessage(result.message || "An unexpected error occurred.");
    setIsError(!response.ok);
    setInviteSent(result.inviteSent === true);
    setIsSubmitting(false);

    if (response.ok) {
      event.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-800">
          Full name <span className="text-red-500">*</span>
          <input name="fullName" required className={INPUT} />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Email address <span className="text-red-500">*</span>
          <input name="email" type="email" required className={INPUT} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-800">
          Phone
          <input name="phone" className={INPUT} />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Company
          <input name="company" className={INPUT} />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-800">
        Preferred contact method
        <select name="preferredContactMethod" defaultValue="No Preference" className={INPUT}>
          {preferredContactOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-800">
          Zoho Lead ID
          <input name="zohoLeadId" className={INPUT} placeholder="Optional" />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Zoho Contact ID
          <input name="zohoContactId" className={INPUT} placeholder="Optional" />
        </label>
      </div>

      {message ? (
        <div
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : inviteSent
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-xl bg-[#244285] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Creating..." : "Create client + send invite"}
      </button>

      <p className="text-xs text-slate-500">
        A portal invite email will be sent automatically to the client's address.
        They can set their password and access their portal immediately.
      </p>
    </form>
  );
}
