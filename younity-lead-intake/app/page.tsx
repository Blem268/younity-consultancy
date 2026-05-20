import Link from "next/link";

const services = [
  "Bookkeeping Services",
  "Payroll Services",
  "General Administration",
  "HR Support",
  "Strategic Management & Advisory",
  "Tax Services",
  "Compliance Services",
];

const steps = [
  "Submit your request",
  "We review your needs",
  "Your work is managed through our operations workflow",
  "Clients can track requests and upload documents through the portal",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="w-fit">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Younity Consultancy
            </p>
          </Link>

          <nav
            aria-label="Homepage navigation"
            className="flex flex-wrap gap-2 text-sm font-semibold text-slate-700"
          >
            <a
              href="#services"
              className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Services
            </a>
            <Link
              href="/contact"
              className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Contact
            </Link>
            <Link
              href="/client/login"
              className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Client Portal
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Business operations support
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Business support that keeps your operations moving.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Bookkeeping, payroll, administration, HR, tax, compliance, and
            advisory support for growing businesses.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Request a Service
            </Link>
            <Link
              href="/client/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Client Portal
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Practical support for busy teams
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Younity helps businesses organize essential back-office work,
            coordinate requests, and keep documents and updates moving through a
            clear operations workflow.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {["Reliable records", "Clear follow-up", "Secure portal", "Managed workflow"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section id="services" className="border-y border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Services
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Choose the support you need now, then work with the Younity team
              as your operations needs evolve.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300"
              >
                <h3 className="text-base font-semibold text-slate-950">
                  {service}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              How it works
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A simple intake-to-operations process keeps requests organized
              from first contact through client updates.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <article
                key={step}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-semibold text-teal-700">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-base font-semibold text-slate-950">
                  {step}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-100">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Already working with Younity?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Log in to view your requests, upload documents, and track updates.
            </p>
          </div>
          <Link
            href="/client/login"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open Client Portal
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 text-center lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Ready to get support?
        </h2>
        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Contact Younity
          </Link>
        </div>
      </section>
    </main>
  );
}
