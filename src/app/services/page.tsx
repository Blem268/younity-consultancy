const services = [
  "Strategy & Advisory",
  "Performance Improvement",
  "Digital Transformation",
  "Change Management",
  "AI Consulting",
  "Operational Excellence",
];

export default function ServicesPage() {
  return (
    <main className="bg-white pt-20">
      <section className="bg-[#06111f] px-6 py-28 text-white">
        <div className="container-custom">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#50A9C0]">
            Our Services
          </p>

          <h1 className="max-w-3xl text-5xl font-black leading-tight">
            End-to-End Solutions Designed to Drive Growth
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            We help organizations define strategy, improve operations, adopt
            technology, and manage transformation with confidence.
          </p>
        </div>
      </section>

      <section className="section-padding bg-[#f6f9fc]">
        <div className="container-custom grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service}
              className="rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="mb-6 h-14 w-14 rounded-2xl bg-[#50A9C0]/15" />

              <h2 className="text-2xl font-black text-[#06111f]">
                {service}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Tailored consulting support that helps your organization create
                clarity, improve performance, and execute with measurable
                impact.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
