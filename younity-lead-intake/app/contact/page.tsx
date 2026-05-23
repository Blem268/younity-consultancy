"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  companyWebsite: string;
  service: string;
  message: string;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  companyWebsite: "",
  service: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/lead-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          source: "Website Contact Form",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setForm(initialFormState);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
          Younity Consultancy
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Start your request
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-600">
          Submit your details and our team will review your request, create your client file,
          and contact you with the next step.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <label className="sr-only" aria-hidden="true">
            Company website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.companyWebsite}
              onChange={(event) =>
                updateField("companyWebsite", event.target.value)
              }
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Full Name *
              <input
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
                placeholder="Jane Doe"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Email *
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
                placeholder="jane@example.com"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Phone / WhatsApp
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
                placeholder="+1 268 000 0000"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Company
              <input
                value={form.company}
                onChange={(event) => updateField("company", event.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
                placeholder="Company name"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-bold">
            Service Needed *
            <select
              required
              value={form.service}
              onChange={(event) => updateField("service", event.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
            >
              <option value="">Select a service</option>
              <option value="Bookkeeping Services">Bookkeeping Services</option>
              <option value="Payroll Services">Payroll Services</option>
              <option value="General Administration">General Administration</option>
              <option value="HR Support">HR Support</option>
              <option value="Strategic Management & Advisory">
                Strategic Management & Advisory
              </option>
              <option value="Tax Services">Tax Services</option>
              <option value="Compliance Services">Compliance Services</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Message *
            <textarea
              required
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              className="min-h-36 rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-slate-900"
              placeholder="Tell us what you need help with..."
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-slate-950 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>

          {status === "success" && (
            <p className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Request received. Our team will review your details and contact you shortly.
            </p>
          )}

          {status === "error" && (
            <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800">
              {errorMessage}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
