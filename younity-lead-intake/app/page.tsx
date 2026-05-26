import Link from "next/link";
import { PublicPageShell } from "@/app/components/site/public-page-shell";
import {
  portalHighlights,
  processSteps,
  siteServices,
} from "@/lib/content/site-content";

export default function Home() {
  return (
    <PublicPageShell>
      <section className="relative overflow-hidden bg-[#06111f] px-6 py-20 text-white sm:py-24 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#50A9C033,transparent_30%),radial-gradient(circle_at_80%_10%,#24428555,transparent_35%)]" />
        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-[#50A9C0]">
              Business operations support
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
              Business support that keeps your operations moving.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
              Bookkeeping, payroll, administration, HR, tax, compliance, and
              advisory support for growing businesses — with a calm client portal
              to track requests, documents, and updates.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#50A9C0] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#06111f] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Request a Service
              </Link>
              <Link
                href="/client/login"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Client Portal
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
              {portalHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-bold"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
            <h2 className="text-xl font-black tracking-tight text-white">
              A steady partner for back-office work
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Younity helps businesses organize essential operations work,
              coordinate requests, and keep documents and updates moving through
              a clear, managed workflow.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Reliable records", "Clear follow-up", "Secure portal", "Managed workflow"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white"
                  >
                    {item}
                  </div>
                )
              )}
            </div>
            <Link
              href="/process"
              className="mt-6 inline-flex text-sm font-black text-[#50A9C0] transition hover:text-white"
            >
              See how we work →
            </Link>
          </div>
        </div>
      </section>

      <section id="services" className="bg-[#f6f9fc]">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
              Services
            </p>
            <h2 className="text-3xl font-black tracking-tight text-[#06111f] sm:text-4xl">
              Focused support across your essential operations
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Choose the support you need now, then work with the Younity team
              as your operations needs evolve.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {siteServices.map((service) => (
              <article
                key={service.title}
                className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-5 h-12 w-12 rounded-2xl bg-[#50A9C0]/15" />
                <h3 className="text-base font-black text-[#06111f]">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
              Process
            </p>
            <h2 className="text-3xl font-black tracking-tight text-[#06111f]">
              How it works
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A simple intake-to-operations process keeps requests organized
              from first contact through client updates.
            </p>
            <Link
              href="/process"
              className="mt-6 inline-flex text-sm font-black text-[#244285] transition hover:text-[#06111f]"
            >
              View the full process →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {processSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#50A9C0]">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-base font-black text-[#06111f]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#06111f] px-6 py-14 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
              About Younity
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight">
              Calm, professional support built for real business needs.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
              We combine operational discipline with clear communication so clients
              always know what is happening, what is needed next, and where to
              find it in the portal.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <ul className="space-y-4 text-sm leading-7 text-white/75">
              <li>Human support — not a faceless ticket queue.</li>
              <li>Structured workflows with visible progress.</li>
              <li>Private document handling and secure client access.</li>
            </ul>
            <Link
              href="/about"
              className="mt-6 inline-flex text-sm font-black text-[#50A9C0] transition hover:text-white"
            >
              Learn more about us →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#50A9C0] text-[#06111f]">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              Already working with Younity?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#06111f]/75 sm:text-base">
              Log in to view your requests, upload documents, and track updates.
            </p>
          </div>
          <Link
            href="/client/login"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#06111f] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:brightness-110"
          >
            Open Client Portal
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 text-center lg:px-8">
        <h2 className="text-3xl font-black tracking-tight text-[#06111f]">
          Ready to get support?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Tell us what you need and we will review your request and contact you
          with the next step.
        </p>
        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#50A9C0] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#06111f] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Contact Younity
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
