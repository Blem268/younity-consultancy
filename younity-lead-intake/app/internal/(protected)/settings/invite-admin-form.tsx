"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const INPUT =
  "mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25";

export function InviteAdminForm() {
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
    const response = await fetch("/api/internal/settings/invite-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        role: formData.get("role"),
      }),
    });

    const result = (await response.json()) as { message?: string };

    setMessage(result.message ?? "An unexpected error occurred.");
    setIsError(!response.ok);
    setIsSubmitting(false);

    if (response.ok) {
      event.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <div className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[#06111f]">Add staff member</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Creates an admin account and sends a login invite to their email.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

        <label className="block text-sm font-medium text-slate-800">
          Role
          <select name="role" defaultValue="admin" className={INPUT}>
            <option value="admin">Admin — can manage clients and requests</option>
            <option value="super_admin">Super admin — full access, can manage staff</option>
          </select>
        </label>

        {message ? (
          <div
            aria-live="polite"
            className={`rounded-lg border px-4 py-3 text-sm ${
              isError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
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
          {isSubmitting ? "Sending invite..." : "Add staff + send invite"}
        </button>
      </form>
    </div>
  );
}
