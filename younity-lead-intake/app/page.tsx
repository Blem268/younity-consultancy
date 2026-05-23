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
    <main className="min-h-screen bg-white pt-24 text-[#06111f]">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-[#50A9C0]/20 bg-gradient-to-r from-[#06111f] via-[#071a33] to-[#06111f] shadow-lg">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="w-fit">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
              Younity Consultancy
            </p>
          </Link>

          <nav
            aria-label="Homepage navigation"
            className="flex flex-wrap gap-2 text-sm font-black uppercase tracking-[0.08em] text-white/80"
          >
            <a
              href="#services"
              className="rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-[#50A9C0]"
            >
              Services
            </a>
            <Link
              href="/contact"
              className="rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-[#50A9C0]"
            >
              Contact
            </Link>
            <Link
              href="/client/login"
              className="rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-[#50A9C0]"
            >
              Client Portal
            </Link>
          </nav>
        </div>
      </header>

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
            advisory support for growing businesses.
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
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
          <h2 className="text-xl font-black tracking-tight text-white">
            Practical support for busy teams
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Younity helps businesses organize essential back-office work,
            coordinate requests, and keep documents and updates moving through a
            clear operations workflow.
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
        </div>
        </div>
      </section>

      <section id="services" className="bg-[#f6f9fc]">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
              Services
            </p>
            <h2 className="text-3xl font-black tracking-tight text-[#06111f]">
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
                className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-5 h-12 w-12 rounded-2xl bg-[#50A9C0]/15" />
                <h3 className="text-base font-black text-[#06111f]">
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
            <h2 className="text-3xl font-black tracking-tight text-[#06111f]">
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
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#50A9C0]">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-base font-black text-[#06111f]">
                  {step}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#50A9C0] text-[#06111f]">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              Already working with Younity?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
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
        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#50A9C0] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#06111f] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Contact Younity
          </Link>
        </div>
      </section>
    </main>
  );
}
