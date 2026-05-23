"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AddClientUpdateForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const response = await fetch(`/api/internal/requests/${requestId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message: messageValue }),
    });
    const result = (await response.json()) as { message?: string };

    setMessage(result.message || "Client update added.");
    setIsError(!response.ok);
    setIsSubmitting(false);

    if (response.ok) {
      setTitle("");
      setMessageValue("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <label className="block text-sm font-medium text-slate-800">
        Update title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        />
      </label>

      <label className="block text-sm font-medium text-slate-800">
        Update message
        <textarea
          value={messageValue}
          onChange={(event) => setMessageValue(event.target.value)}
          rows={5}
          required
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
        {isSubmitting ? "Adding..." : "Add Client Update"}
      </button>
    </form>
  );
}
