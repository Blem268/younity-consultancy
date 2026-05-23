"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type UnlinkedClientOption = {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
};

export function LinkAuthUserForm({
  unlinkedClients,
}: {
  unlinkedClients: UnlinkedClientOption[];
}) {
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
    const response = await fetch("/api/internal/onboarding/link-auth-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: formData.get("clientId"),
        authUserId: formData.get("authUserId"),
      }),
    });
    const result = (await response.json()) as { message?: string };

    setMessage(result.message || "Client profile linked.");
    setIsError(!response.ok);
    setIsSubmitting(false);

    if (response.ok) {
      event.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm leading-6 text-slate-600">
        Create the user in Supabase Authentication first, then paste the Auth
        User ID here.
      </p>

      <label className="block text-sm font-medium text-slate-800">
        Client
        {unlinkedClients.length ? (
          <select
            name="clientId"
            required
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          >
            <option value="">Select an unlinked client</option>
            {unlinkedClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name} - {client.email}
                {client.company ? ` - ${client.company}` : ""}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="clientId"
            required
            placeholder="Client UUID"
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        )}
      </label>

      <label className="block text-sm font-medium text-slate-800">
        Auth User ID
        <input
          name="authUserId"
          required
          placeholder="Supabase Auth user UUID"
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
        {isSubmitting ? "Linking..." : "Link Auth User"}
      </button>
    </form>
  );
}
