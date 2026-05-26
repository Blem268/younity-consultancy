import Link from "next/link";
import { PublicPageShell } from "@/app/components/site/public-page-shell";
import { processSteps } from "@/lib/content/site-content";

export default function ProcessPage() {
  return (
    <PublicPageShell>
      <section className="bg-[#06111f] px-6 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#50A9C0]">
            Our Process
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            From first request to ongoing support
          </h1>
          <p className="mt-5 text-base leading-8 text-white/75">
            Younity uses a structured intake and operations workflow so nothing
            gets lost between email, documents, and delivery. Clients stay
            informed through the portal at every stage.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 lg:px-8">
        <div className="grid gap-6">
          {processSteps.map((step, index) => (
            <article
              key={step.title}
              className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:grid-cols-[auto_1fr] sm:items-start sm:p-8"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#50A9C0]/15 text-lg font-black text-[#244285]">
                {index + 1}
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-[#06111f]">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f6f9fc]">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[#06111f]">
                Inside the client portal
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Once your profile is set up, the portal becomes your workspace
                for requests, documents, updates, and support.
              </p>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-slate-700">
              <li className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                Submit and track service requests with clear statuses.
              </li>
              <li className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                Upload documents when the team requests them.
              </li>
              <li className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                Read updates and progress notes from Younity.
              </li>
              <li className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                Update your profile and preferred contact method.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 text-center lg:px-8">
        <h2 className="text-2xl font-black tracking-tight text-[#06111f]">
          Start with a request
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          New clients can reach out through our contact form. Existing clients
          can log in to submit requests directly.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#50A9C0] px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#06111f]"
          >
            Contact Younity
          </Link>
          <Link
            href="/client/login"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#06111f]/15 px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#06111f]"
          >
            Client Portal Login
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
