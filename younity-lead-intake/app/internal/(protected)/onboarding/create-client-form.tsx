"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const preferredContactOptions = [
  "Email",
  "Phone Call",
  "WhatsApp",
  "No Preference",
];

export function CreateClientForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
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
      clientId?: string;
    };

    setMessage(
      result.clientId
        ? `${result.message || "Client profile created."} ID: ${result.clientId}`
        : result.message || "Client profile could not be created."
    );
    setIsError(!response.ok);
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
          Full Name
          <input
            name="fullName"
            required
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-800">
          Phone
          <input
            name="phone"
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Company
          <input
            name="company"
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-800">
        Preferred Contact Method
        <select
          name="preferredContactMethod"
          defaultValue="No Preference"
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        >
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
          <input
            name="zohoLeadId"
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Zoho Contact ID
          <input
            name="zohoContactId"
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
      </div>

      <div aria-live="polite" className={isError ? "text-red-700" : "text-[#244285]"}>
        {message ? <p className="text-sm font-medium">{message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-xl bg-[#244285] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Creating..." : "Create Client Profile"}
      </button>
    </form>
  );
}
