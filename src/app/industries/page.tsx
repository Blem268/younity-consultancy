const industries = [
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Retail & Consumer",
  "Public Sector",
  "Technology",
];

export default function IndustriesPage() {
  return (
    <main className="bg-white pt-20">
      <section className="bg-[#06111f] px-6 py-28 text-white">
        <div className="container-custom">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#50A9C0]">
            Industries
          </p>

          <h1 className="max-w-3xl text-5xl font-black leading-tight">
            Sector Expertise for Complex Business Environments
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            We support organizations across regulated, competitive, and
            fast-changing industries with practical strategies and measurable
            execution.
          </p>
        </div>
      </section>

      <section className="section-padding bg-[#f6f9fc]">
        <div className="container-custom grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <div
              key={industry}
              className="rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="mb-6 h-14 w-14 rounded-2xl bg-[#50A9C0]/15" />

              <h2 className="text-2xl font-black text-[#06111f]">
                {industry}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Strategic advisory and operational support tailored to the
                challenges, risks, and opportunities within this sector.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}