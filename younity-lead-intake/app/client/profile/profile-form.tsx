"use client";

import { useState, type FormEvent } from "react";

const preferredContactOptions = [
  "Email",
  "Phone Call",
  "WhatsApp",
  "No Preference",
];

export function ProfileForm({
  fullName,
  email,
  phone,
  company,
  preferredContactMethod,
}: {
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferredContactMethod: string | null;
}) {
  const [nameValue, setNameValue] = useState(fullName);
  const [phoneValue, setPhoneValue] = useState(phone || "");
  const [companyValue, setCompanyValue] = useState(company || "");
  const [contactMethodValue, setContactMethodValue] = useState(
    preferredContactMethod || "No Preference"
  );
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const response = await fetch("/api/client/profile/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: nameValue,
        phone: phoneValue,
        company: companyValue,
        preferredContactMethod: contactMethodValue,
      }),
    });

    const result = (await response.json()) as {
      message?: string;
    };

    if (!response.ok) {
      setMessage(result.message || "Profile update failed.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    setMessage(result.message || "Profile updated successfully.");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-slate-800"
        >
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          required
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          readOnly
          className="mt-2 block w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-800"
          >
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phoneValue}
            onChange={(event) => setPhoneValue(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </div>

        <div>
          <label
            htmlFor="company"
            className="block text-sm font-medium text-slate-800"
          >
            Company
          </label>
          <input
            id="company"
            name="company"
            type="text"
            value={companyValue}
            onChange={(event) => setCompanyValue(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </div>
      </div>

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
          value={contactMethodValue}
          onChange={(event) => setContactMethodValue(event.target.value)}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        >
          {preferredContactOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite" className={isError ? "text-red-700" : "text-[#244285]"}>
        {message ? <p className="text-sm font-medium">{message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary inline-flex items-center justify-center rounded-xl bg-[#244285] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
