export default function AboutPage() {
  return (
    <main className="bg-white pt-20">
      <section className="bg-[#06111f] px-6 py-28 text-white">
        <div className="container-custom">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#50A9C0]">
            About Us
          </p>

          <h1 className="max-w-3xl text-5xl font-black leading-tight">
            Built on Partnership. Driven by Purpose.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            Younity Consultancy helps organizations transform vision into
            measurable value through strategic advisory, operational excellence,
            and collaborative execution.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Our Mission",
              text: "To deliver impactful consulting that helps organizations solve challenges and unlock lasting value.",
            },
            {
              title: "Our Vision",
              text: "To be a trusted partner for organizations seeking strategic clarity and sustainable growth.",
            },
            {
              title: "Our Values",
              text: "Integrity, collaboration, excellence, accountability, and client-centered results.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-2xl font-black text-[#06111f]">{item.title}</h2>
              <p className="mt-4 leading-7 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}