"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const invoiceStatusOptions = [
  "Not Ready",
  "Ready for Billing",
  "Invoice Drafted",
  "Invoice Sent",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Cancelled",
];

function toInputValue(value: number | string | null) {
  return value === null ? "" : String(value);
}

export function RequestBillingForm({
  requestId,
  billingType,
  estimatedFee,
  depositRequired,
  amountPaid,
  balanceDue,
  invoiceStatus,
  invoiceId,
}: {
  requestId: string;
  billingType: string | null;
  estimatedFee: number | string | null;
  depositRequired: number | string | null;
  amountPaid: number | string | null;
  balanceDue: number | string | null;
  invoiceStatus: string | null;
  invoiceId: string | null;
}) {
  const router = useRouter();
  const [billingTypeValue, setBillingTypeValue] = useState(billingType || "");
  const [estimatedFeeValue, setEstimatedFeeValue] = useState(toInputValue(estimatedFee));
  const [depositRequiredValue, setDepositRequiredValue] = useState(
    toInputValue(depositRequired)
  );
  const [amountPaidValue, setAmountPaidValue] = useState(toInputValue(amountPaid));
  const [balanceDueValue, setBalanceDueValue] = useState(toInputValue(balanceDue));
  const [invoiceStatusValue, setInvoiceStatusValue] = useState(
    invoiceStatus || "Not Ready"
  );
  const [invoiceIdValue, setInvoiceIdValue] = useState(invoiceId || "");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const response = await fetch(`/api/internal/requests/${requestId}/billing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billingType: billingTypeValue,
        estimatedFee: estimatedFeeValue || null,
        depositRequired: depositRequiredValue || null,
        amountPaid: amountPaidValue || null,
        balanceDue: balanceDueValue || null,
        invoiceStatus: invoiceStatusValue,
        invoiceId: invoiceIdValue,
        note: showNote ? note : undefined,
        visibleToClient: showNote,
      }),
    });
    const result = (await response.json()) as { message?: string };

    setMessage(result.message || "Billing update complete.");
    setIsError(!response.ok);
    setIsSubmitting(false);

    if (response.ok) {
      setNote("");
      setShowNote(false);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <label className="block text-sm font-medium text-slate-800">
        Billing Type
        <input
          value={billingTypeValue}
          onChange={(event) => setBillingTypeValue(event.target.value)}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Estimated Fee", estimatedFeeValue, setEstimatedFeeValue],
          ["Deposit Required", depositRequiredValue, setDepositRequiredValue],
          ["Amount Paid", amountPaidValue, setAmountPaidValue],
          ["Balance Due", balanceDueValue, setBalanceDueValue],
        ].map(([label, value, setValue]) => (
          <label key={String(label)} className="block text-sm font-medium text-slate-800">
            {String(label)}
            <input
              type="number"
              step="0.01"
              value={String(value)}
              onChange={(event) =>
                (setValue as (nextValue: string) => void)(event.target.value)
              }
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-800">
          Invoice Status
          <select
            value={invoiceStatusValue}
            onChange={(event) => setInvoiceStatusValue(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          >
            {invoiceStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-800">
          Invoice ID
          <input
            value={invoiceIdValue}
            onChange={(event) => setInvoiceIdValue(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-800">
        Client-visible note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25"
        />
      </label>

      <label className="flex items-start gap-3 text-sm font-medium text-slate-800">
        <input
          type="checkbox"
          checked={showNote}
          onChange={(event) => setShowNote(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#244285]"
        />
        Show note in client timeline
      </label>

      <div aria-live="polite" className={isError ? "text-red-700" : "text-[#244285]"}>
        {message ? <p className="text-sm font-medium">{message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-xl bg-[#244285] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Updating..." : "Update Billing"}
      </button>
    </form>
  );
}
