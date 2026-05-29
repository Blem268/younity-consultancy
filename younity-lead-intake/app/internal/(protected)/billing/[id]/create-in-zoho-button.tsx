"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateInZohoButton({
  invoiceId,
  zohoConfigured,
}: {
  invoiceId: string;
  zohoConfigured: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  if (!zohoConfigured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
        <p className="text-xs font-semibold text-amber-800">
          Zoho Books not configured
        </p>
        <p className="mt-0.5 text-xs text-amber-700">
          Add ZOHO_BOOKS_* env vars to enable.
        </p>
      </div>
    );
  }

  async function handleCreate() {
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    const response = await fetch(`/api/internal/invoices/${invoiceId}/create-in-zoho`, {
      method: "POST",
    });

    const result = (await response.json()) as {
      message?: string;
      zohoInvoiceNumber?: string;
    };

    setMessage(result.message ?? "An unexpected error occurred.");
    setIsError(!response.ok);
    setIsLoading(false);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      {message ? (
        <p
          className={`text-xs font-medium ${
            isError ? "text-red-600" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}
      <button
        onClick={handleCreate}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#06111f] px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isLoading ? (
          "Creating..."
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5Z"
                fill="currentColor"
                opacity="0.9"
              />
              <path
                d="M2 17l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Create invoice in Zoho Books
          </>
        )}
      </button>
    </div>
  );
}
