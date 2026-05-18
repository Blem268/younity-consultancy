import FadeIn from "./components/animations/FadeIn";

const services = [
  "Strategy & Advisory",
  "Performance Improvement",
  "Digital Transformation",
  "Change Management",
];

const industries = [
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Retail & Consumer",
  "Public Sector",
  "Technology",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white pt-24">
      <section className="relative overflow-hidden bg-[#06111f] px-5 py-24 text-white md:px-6 md:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#50A9C033,transparent_30%),radial-gradient(circle_at_80%_10%,#24428555,transparent_35%)]" />

        <div className="container-custom relative z-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <FadeIn>
            <div>
              <p className="mb-6 text-sm font-black uppercase tracking-[0.35em] text-[#50A9C0]">
                Strategic Growth & Transformation
              </p>

              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl md:text-7xl">
                Uniting Strategy, Innovation, and Execution.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                Younity Consultancy helps organizations solve complex business
                challenges, accelerate transformation, and convert strategy into
                measurable enterprise value.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-5">
                <a href="/services" className="btn-primary">
                  Explore Services
                </a>

                <a href="/contact" className="btn-outline">
                  Book Consultation
                </a>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="relative">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
                <div className="grid gap-5">
                  <div className="rounded-3xl bg-white/10 p-6">
                    <p className="text-sm uppercase tracking-[0.25em] text-[#50A9C0]">
                      Growth Readiness
                    </p>
                    <div className="mt-5 h-3 rounded-full bg-white/10">
                      <div className="h-3 w-[82%] rounded-full bg-[#50A9C0]" />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="rounded-3xl bg-[#244285] p-6">
                      <h3 className="text-4xl font-black">50+</h3>
                      <p className="mt-2 text-white/70">Clients Served</p>
                    </div>

                    <div className="rounded-3xl bg-[#50A9C0] p-6 text-[#06111f]">
                      <h3 className="text-4xl font-black">150+</h3>
                      <p className="mt-2 font-semibold">Projects Delivered</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-xl font-black">
                      Strategy → Execution → Results
                    </h3>
                    <p className="mt-3 text-white/65">
                      A practical consulting model designed for measurable
                      operational and strategic outcomes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom grid gap-16 lg:grid-cols-2">
          <FadeIn>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
                About Younity
              </p>

              <h2 className="text-4xl font-black leading-tight text-[#06111f]">
                A consulting partner built for clarity, alignment, and
                measurable progress.
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div>
              <p className="text-lg leading-8 text-slate-600">
                We bring together strategic insight, operational discipline, and
                collaborative execution to help organizations move from
                uncertainty to confident action.
              </p>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Our work is grounded in partnership, accountability, and a focus
                on practical outcomes that create lasting value.
              </p>

              <a href="/about" className="mt-8 inline-flex font-black text-[#244285]">
                Learn More →
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-padding bg-[#f6f9fc]">
        <div className="container-custom">
          <FadeIn>
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
                Services
              </p>

              <h2 className="text-4xl font-black text-[#06111f]">
                Focused solutions for transformation, performance, and growth.
              </h2>
            </div>
          </FadeIn>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => (
              <FadeIn key={service} delay={index * 0.08}>
                <a
                  href="/services"
                  className="block h-full rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-2 hover:shadow-xl sm:p-8"
                >
                  <div className="mb-8 h-14 w-14 rounded-2xl bg-[#50A9C0]/15" />
                  <h3 className="text-lg font-black text-[#06111f] sm:text-xl">
                    {service}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:mt-4 sm:text-base">
                    Practical advisory and execution support designed to improve
                    clarity, performance, and long-term value.
                  </p>
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#06111f] text-white">
        <div className="container-custom grid gap-16 lg:grid-cols-2">
          <FadeIn>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
                Industries
              </p>

              <h2 className="text-4xl font-black leading-tight">
                Strategic support across complex business environments.
              </h2>

              <p className="mt-6 text-lg leading-8 text-white/70">
                We serve organizations navigating change, complexity, regulation,
                growth, and operational pressure.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            {industries.map((industry, index) => (
              <FadeIn key={industry} delay={index * 0.06}>
                <a
                  href="/industries"
                  className="block rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-black transition hover:-translate-y-1 hover:border-[#50A9C0] hover:bg-white/10 sm:p-6 sm:text-base"
                >
                  {industry}
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#50A9C0] px-6 py-20 text-[#06111f]">
        <FadeIn>
          <div className="container-custom flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                Ready to move from strategy to execution?
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-[#06111f]/75 sm:text-lg">
                Let’s discuss how Younity Consultancy can support your next
                phase of growth.
              </p>
            </div>

            <a
  href="/contact"
  className="inline-flex items-center justify-center rounded-xl bg-[#06111f] px-8 py-4 text-center text-sm font-black uppercase tracking-wide text-white transition hover:bg-white hover:text-[#06111f] sm:text-base"
>
  Contact Us Today
</a>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}