export default function ContactPage() {
  return (
    <main className="bg-white pt-20">
      <section className="bg-[#06111f] px-6 py-28 text-white">
        <div className="container-custom">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#50A9C0]">
            Contact Us
          </p>

          <h1 className="max-w-3xl text-5xl font-black leading-tight">
            Let’s Discuss Your Next Phase of Growth
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            Connect with Younity Consultancy to explore how we can support your
            strategy, operations, and transformation goals.
          </p>
        </div>
      </section>

      <section className="section-padding bg-[#f6f9fc]">
        <div className="container-custom grid gap-12 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-[#06111f]">
              Send Us a Message
            </h2>

            <form className="mt-8 grid gap-5">
              <input
                type="text"
                placeholder="Full Name"
                className="rounded-xl border border-slate-200 px-5 py-4 outline-none focus:border-[#50A9C0]"
              />

              <input
                type="email"
                placeholder="Email Address"
                className="rounded-xl border border-slate-200 px-5 py-4 outline-none focus:border-[#50A9C0]"
              />

              <input
                type="text"
                placeholder="Company"
                className="rounded-xl border border-slate-200 px-5 py-4 outline-none focus:border-[#50A9C0]"
              />

              <textarea
                placeholder="How can we help?"
                rows={6}
                className="rounded-xl border border-slate-200 px-5 py-4 outline-none focus:border-[#50A9C0]"
              />

              <button type="button" className="btn-primary w-fit">
                Submit Inquiry
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-[#06111f] p-8 text-white">
            <h2 className="text-3xl font-black">Get in Touch</h2>

            <div className="mt-8 grid gap-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#50A9C0]">
                  Email
                </p>
                <p className="mt-2 text-white/75">info@younityconsultancy.com</p>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#50A9C0]">
                  Location
                </p>
                <p className="mt-2 text-white/75">United States</p>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#50A9C0]">
                  Consultation
                </p>
                <p className="mt-2 text-white/75">
                  Schedule a discovery call to discuss your business objectives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
