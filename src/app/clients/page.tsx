const clientStats = [
  {
    number: "50+",
    label: "Clients Served",
  },
  {
    number: "150+",
    label: "Projects Delivered",
  },
  {
    number: "98%",
    label: "Client Satisfaction",
  },
  {
    number: "6",
    label: "Industries Supported",
  },
];

const testimonials = [
  {
    name: "Global Financial Firm",
    quote:
      "Younity Consultancy provided strategic clarity and operational improvements that significantly accelerated our transformation initiatives.",
  },
  {
    name: "Healthcare Organization",
    quote:
      "Their collaborative approach and industry expertise helped us navigate complex organizational challenges with confidence.",
  },
  {
    name: "Technology Enterprise",
    quote:
      "The team delivered measurable impact through practical execution and innovative thinking.",
  },
];

export default function ClientsPage() {
  return (
    <main className="bg-white pt-20">
      {/* HERO */}
      <section className="bg-[#06111f] px-6 py-28 text-white">
        <div className="container-custom">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#50A9C0]">
            Our Clients
          </p>

          <h1 className="max-w-3xl text-5xl font-black leading-tight">
            Trusted by Organizations Focused on Growth and Transformation
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            We partner with ambitious organizations to solve critical business
            challenges and deliver sustainable results.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="section-padding bg-[#f6f9fc]">
        <div className="container-custom grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {clientStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl bg-white p-10 text-center shadow-sm"
            >
              <h2 className="text-5xl font-black text-[#50A9C0]">
                {stat.number}
              </h2>

              <p className="mt-4 text-lg font-medium text-slate-600">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#50A9C0]">
              Client Testimonials
            </p>

            <h2 className="text-4xl font-black text-[#06111f]">
              What Our Clients Say
            </h2>
          </div>

          <div className="mt-20 grid gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-3xl border border-slate-200 p-8 shadow-sm"
              >
                <p className="text-lg leading-8 text-slate-600">
                  "{testimonial.quote}"
                </p>

                <div className="mt-8">
                  <h3 className="text-xl font-black text-[#06111f]">
                    {testimonial.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#50A9C0] px-6 py-20 text-white">
        <div className="container-custom flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-4xl font-black">
              Let’s Build Something Exceptional Together
            </h2>

            <p className="mt-4 max-w-2xl text-lg text-white/85">
              Discover how Younity Consultancy can help your organization unlock
              new opportunities and sustainable growth.
            </p>
          </div>

          <a
            href="/contact"
            className="rounded-md bg-[#06111f] px-8 py-4 font-bold uppercase tracking-wide text-white transition hover:brightness-110"
          >
            Contact Us
          </a>
        </div>
      </section>
    </main>
  );
}