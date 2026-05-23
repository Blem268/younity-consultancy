"use client";

import { useState } from "react";
import Link from "next/link";
import { brand } from "@/app/components/ui/brand";

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
    <main className="min-h-screen bg-[#f6f9fc] text-[#06111f]">
      <section className="bg-[#06111f] px-6 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0] transition hover:text-white"
          >
            Younity Consultancy
          </Link>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Start your request
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Submit your details and our team will review your request, create your client file,
            and contact you with the next step.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
      <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0] transition hover:text-[#244285]"
        >
          Contact Form
        </Link>

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
            <label className={brand.label}>
              Full Name *
              <input
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={brand.input}
                placeholder="Jane Doe"
              />
            </label>

            <label className={brand.label}>
              Email *
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={brand.input}
                placeholder="jane@example.com"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className={brand.label}>
              Phone / WhatsApp
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className={brand.input}
                placeholder="+1 268 000 0000"
              />
            </label>

            <label className={brand.label}>
              Company
              <input
                value={form.company}
                onChange={(event) => updateField("company", event.target.value)}
                className={brand.input}
                placeholder="Company name"
              />
            </label>
          </div>

          <label className={brand.label}>
            Service Needed *
            <select
              required
              value={form.service}
              onChange={(event) => updateField("service", event.target.value)}
              className={brand.input}
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

          <label className={brand.label}>
            Message *
            <textarea
              required
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              className={`${brand.input} min-h-36`}
              placeholder="Tell us what you need help with..."
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`${brand.primaryButton} w-full sm:w-fit`}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>

          {status === "success" && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Request received. Our team will review your details and contact you shortly.
            </p>
          )}

          {status === "error" && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {errorMessage}
            </p>
          )}
        </form>
      </div>
      </section>
    </main>
  );
}
