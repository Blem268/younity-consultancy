import FadeIn from "./components/animations/FadeIn";

export default function Home() {
  return (
    <main className="min-h-screen bg-white pt-20">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#06111f] px-6 py-32 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#24428533,transparent_35%)]" />

        <div className="container-custom relative z-10 grid items-center gap-16 lg:grid-cols-2">
          <FadeIn>
            <div>
              <p className="mb-6 text-sm font-bold uppercase tracking-[0.35em] text-[#50A9C0]">
                Strategic Growth & Transformation
              </p>

              <h1 className="max-w-2xl text-5xl font-black leading-tight md:text-7xl">
                Solutions That Unite{" "}
                <span className="text-[#50A9C0]">Vision</span> With Value
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-white/75">
                Younity Consultancy partners with organizations to solve
                high-impact business challenges through strategic insight,
                operational excellence, and future-ready innovation.
              </p>

              <div className="mt-10 flex flex-wrap gap-5">
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
            <div className="relative hidden lg:flex lg:justify-center">
              <div className="relative h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#50A9C0]/30 to-[#244285]/20 blur-3xl" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="rounded-2xl bg-[#244285] p-8" />
                    <div className="rounded-2xl bg-[#50A9C0] p-8" />
                    <div className="rounded-2xl bg-white/10 p-8" />
                    <div className="rounded-2xl border border-[#50A9C0] bg-transparent p-8" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="section-padding bg-white">
        <div className="container-custom grid gap-16 lg:grid-cols-2">
          <FadeIn>
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#50A9C0]">
                About Us
              </p>

              <h2 className="text-4xl font-black leading-tight text-[#06111f]">
                Your Partner in Strategic Transformation
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                We combine deep industry expertise with innovative thinking to
                help organizations navigate change, improve performance, and
                accelerate long-term growth.
              </p>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Our approach is collaborative, data-driven, and tailored to each
                client’s unique operational and strategic objectives.
              </p>

              <div className="mt-10">
                <a href="/about" className="btn-primary">
                  Learn More
                </a>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                "Client Focused",
                "Results Driven",
                "Integrity First",
                "Innovative Thinking",
              ].map((title) => (
                <div
                  key={title}
                  className="rounded-3xl border border-slate-200 p-8 shadow-sm"
                >
                  <h3 className="text-xl font-bold text-[#06111f]">
                    {title}
                  </h3>

                  <p className="mt-4 leading-7 text-slate-600">
                    Strategic consulting solutions focused on measurable impact
                    and sustainable growth.
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section-padding bg-[#f6f9fc]">
        <div className="container-custom">
          <FadeIn>
            <div className="text-center">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#50A9C0]">
                Our Services
              </p>

              <h2 className="text-4xl font-black text-[#06111f]">
                Expertise That Drives Growth
              </h2>
            </div>
          </FadeIn>

          <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Strategy & Advisory",
              "Performance Improvement",
              "Digital Transformation",
              "Change Management",
            ].map((service, index) => (
              <FadeIn key={service} delay={index * 0.1}>
                <div className="rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl">
                  <div className="mb-6 h-14 w-14 rounded-2xl bg-[#50A9C0]/15" />

                  <h3 className="text-xl font-bold text-[#06111f]">
                    {service}
                  </h3>

                  <p className="mt-4 leading-7 text-slate-600">
                    Helping organizations unlock operational efficiency,
                    strategic clarity, and scalable growth.
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="section-padding bg-[#06111f] text-white">
        <div className="container-custom grid gap-16 lg:grid-cols-2">
          <FadeIn>
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#50A9C0]">
                Industries We Serve
              </p>

              <h2 className="text-4xl font-black leading-tight">
                Deep Expertise Across Key Sectors
              </h2>

              <p className="mt-6 text-lg leading-8 text-white/70">
                We support organizations across complex, highly regulated, and
                fast-moving industries with tailored strategic solutions.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              "Financial Services",
              "Healthcare",
              "Manufacturing",
              "Retail & Consumer",
              "Public Sector",
              "Technology",
            ].map((industry, index) => (
              <FadeIn key={industry} delay={index * 0.08}>
                <a
                  href="/industries"
                  className="block rounded-2xl border border-white/10 bg-white/5 p-6 font-bold transition hover:-translate-y-1 hover:border-[#50A9C0] hover:bg-white/10"
                >
                  {industry}
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#50A9C0] px-6 py-16 text-white">
        <FadeIn>
          <div className="container-custom flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-black">
                Ready to Unlock Your Business Potential?
              </h2>

              <p className="mt-3 text-white/85">
                Let’s start a conversation about your next phase of growth.
              </p>
            </div>

            <a
              href="/contact"
              className="rounded-md bg-[#06111f] px-7 py-4 font-bold uppercase tracking-wide text-white transition hover:brightness-110"
            >
              Contact Us Today
            </a>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}