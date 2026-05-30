import Link from "next/link";
import { PublicPageShell } from "@/app/components/site/public-page-shell";

export default function AboutPage() {
  return (
    <PublicPageShell>
      <section className="bg-[#06111f] px-6 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#50A9C0]">
            About Younity
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            A consulting partner for clarity, consistency, and calm execution.
          </h1>
          <p className="mt-5 text-base leading-8 text-white/75">
            Younity Consultancy supports growing businesses with practical
            back-office and advisory services. We focus on making operations
            work feel organized, transparent, and manageable — especially when
            teams are busy and details matter.
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-[#50A9C0]" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Based in Antigua, West Indies · Serving regional and international clients
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#06111f]">
              What we believe
            </h2>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <li>
                Clients should always know what is happening and what is needed
                from them.
              </li>
              <li>
                Good operations support reduces noise, not adds to it.
              </li>
              <li>
                Technology should feel helpful — the portal exists to make work
                clearer, not more complicated.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[#50A9C0]/20 bg-gradient-to-br from-white via-white to-[#50A9C0]/10 p-6 sm:p-8">
            <h2 className="text-2xl font-black tracking-tight text-[#06111f]">
              How we work with clients
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Every engagement starts with understanding your request, then moves
              into a managed workflow with status updates, document requests,
              and a dedicated portal workspace.
            </p>
            <Link
              href="/process"
              className="mt-6 inline-flex text-sm font-black text-[#244285] transition hover:text-[#06111f]"
            >
              See our process →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f9fc]">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
                Our story
              </p>
              <h2 className="text-2xl font-black tracking-tight text-[#06111f]">
                Built on the belief that operations should feel manageable.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Younity was founded to give growing businesses the kind of
                back-office support that is usually only available to larger
                organizations — responsive, structured, and delivered by real
                people who care about getting the details right.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                We combine operational discipline with clear communication so
                clients always know what is happening, what is needed next, and
                where to find it.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
                  Who we work with
                </p>
                <h2 className="text-2xl font-black tracking-tight text-[#06111f]">
                  Small and growing businesses that need a steady partner.
                </h2>
              </div>
              <ul className="space-y-3">
                {[
                  "Business owners managing rapid growth",
                  "Teams that need reliable back-office support",
                  "Founders who want a calm, organized operation",
                  "Businesses navigating compliance and tax requirements",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 text-[#50A9C0]" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm leading-6 text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 lg:px-8">
        <div className="rounded-3xl bg-[#50A9C0] p-8 text-[#06111f] sm:p-10">
          <h2 className="text-2xl font-black tracking-tight">
            Ready to start a conversation?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#06111f]/75">
            Whether you are exploring support for the first time or returning as
            a client, we are here to help you take the next step.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#06111f] px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white"
            >
              Contact Younity
            </Link>
            <Link
              href="/client/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#06111f]/20 bg-white/40 px-6 py-3 text-sm font-black uppercase tracking-[0.08em]"
            >
              Client Portal
            </Link>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
