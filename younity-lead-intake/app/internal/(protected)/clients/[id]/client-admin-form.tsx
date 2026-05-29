"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const preferredContactOptions = [
  "Email",
  "Phone Call",
  "WhatsApp",
  "No Preference",
];

export function ClientAdminForm({
  clientId,
  fullName,
  phone,
  company,
  preferredContactMethod,
  zohoLeadId,
  zohoContactId,
  driveFolderUrl,
}: {
  clientId: string;
  fullName: string;
  phone: string | null;
  company: string | null;
  preferredContactMethod: string | null;
  zohoLeadId: string | null;
  zohoContactId: string | null;
  driveFolderUrl: string | null;
}) {
  const router = useRouter();
  const [fullNameValue, setFullNameValue] = useState(fullName);
  const [phoneValue, setPhoneValue] = useState(phone || "");
  const [companyValue, setCompanyValue] = useState(company || "");
  const [preferredContactValue, setPreferredContactValue] = useState(
    preferredContactMethod || "No Preference"
  );
  const [zohoLeadIdValue, setZohoLeadIdValue] = useState(zohoLeadId || "");
  const [zohoContactIdValue, setZohoContactIdValue] = useState(zohoContactId || "");
  const [driveFolderUrlValue, setDriveFolderUrlValue] = useState(driveFolderUrl || "");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const response = await fetch(`/api/internal/clients/${clientId}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullNameValue,
        phone: phoneValue,
        company: companyValue,
        preferredContactMethod: preferredContactValue,
        zohoLeadId: zohoLeadIdValue,
        zohoContactId: zohoContactIdValue,
        driveFolderUrl: driveFolderUrlValue,
      }),
    });
    const result = (await response.json()) as { message?: string };

    setMessage(result.message || "Client profile updated.");
    setIsError(!response.ok);
    setIsSubmitting(false);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <label className="block text-sm font-medium text-slate-800">
        Full Name
        <input
          value={fullNameValue}
          onChange={(event) => setFullNameValue(event.target.value)}
          required
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-800">
          Phone
          <input
            value={phoneValue}
            onChange={(event) => setPhoneValue(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Company
          <input
            value={companyValue}
            onChange={(event) => setCompanyValue(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-800">
        Preferred Contact Method
        <select
          value={preferredContactValue}
          onChange={(event) => setPreferredContactValue(event.target.value)}
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
            value={zohoLeadIdValue}
            onChange={(event) => setZohoLeadIdValue(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Zoho Contact ID
          <input
            value={zohoContactIdValue}
            onChange={(event) => setZohoContactIdValue(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-800">
        Google Drive folder URL
        <input
          type="url"
          value={driveFolderUrlValue}
          onChange={(event) => setDriveFolderUrlValue(event.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        />
      </label>

      <div aria-live="polite" className={isError ? "text-red-700" : "text-[#244285]"}>
        {message ? <p className="text-sm font-medium">{message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-xl bg-[#244285] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Updating..." : "Update Client"}
      </button>
    </form>
  );
}
