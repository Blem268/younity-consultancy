"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicPageShell } from "@/app/components/site/public-page-shell";
import { brand } from "@/app/components/ui/brand";
import { siteServices, supportChannels } from "@/lib/content/site-content";

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
    <PublicPageShell className="min-h-screen bg-[#f6f9fc] pt-24 text-[#06111f]">
      <section className="bg-[#06111f] px-6 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#50A9C0]">
            Contact
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Start your request
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Submit your details and our team will review your request, create
            your client file, and contact you with the next step.
          </p>
          <p className="mt-4 text-sm text-white/60">
            Already a client?{" "}
            <Link
              href="/client/login"
              className="font-black text-[#50A9C0] transition hover:text-white"
            >
              Sign in to the portal
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-start">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <form onSubmit={handleSubmit} className="grid gap-5">
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
                {siteServices.map((service) => (
                  <option key={service.title} value={service.title}>
                    {service.title}
                  </option>
                ))}
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
                Request received. Our team will review your details and contact
                you shortly.
              </p>
            )}

            {status === "error" && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {errorMessage}
              </p>
            )}
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-black text-[#06111f]">
              Prefer to reach us directly?
            </h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#50A9C0]/15 text-[#244285]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Email</p>
                  <a href={`mailto:${supportChannels.email}`} className="mt-0.5 break-all text-sm font-semibold text-[#244285] transition hover:text-[#06111f]">
                    {supportChannels.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#50A9C0]/15 text-[#244285]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.44 2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.9-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Phone / WhatsApp</p>
                  <a href={`tel:${supportChannels.phone}`} className="mt-0.5 text-sm font-semibold text-[#244285] transition hover:text-[#06111f]">
                    {supportChannels.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#50A9C0]/15 text-[#244285]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Hours</p>
                  <p className="mt-0.5 text-sm text-slate-700">{supportChannels.hours}</p>
                  <p className="mt-1 text-xs text-slate-500">{supportChannels.responseTime}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#50A9C0]/30 bg-[#50A9C0]/8 p-5">
            <p className="text-sm leading-6 text-slate-700">
              Already a client?{" "}
              <Link href="/client/login" className="font-black text-[#244285] transition hover:text-[#06111f]">
                Sign in to the portal
              </Link>{" "}
              to submit requests directly.
            </p>
          </div>
        </div>

        </div>
      </section>
    </PublicPageShell>
  );
}
