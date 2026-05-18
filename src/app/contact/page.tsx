"use client";

import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Something went wrong.");
      }

      setStatus({
        type: "success",
        message: "Your inquiry has been submitted successfully.",
      });

      setFormData({
        name: "",
        email: "",
        company: "",
        message: "",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Failed to send inquiry. Please try again.",
      });
    }

    setLoading(false);
  };

  return (
    <main className="bg-white pt-24">
      <section className="bg-[#06111f] px-6 py-28 text-white">
        <div className="container-custom">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
            Contact Us
          </p>

          <h1 className="max-w-3xl text-5xl font-black leading-tight">
            Let’s Discuss Your Next Phase of Growth
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            Connect with Younity Consultancy to explore how we can support your
            strategy, operations, and transformation initiatives.
          </p>
        </div>
      </section>

      <section className="section-padding bg-[#f6f9fc]">
        <div className="container-custom grid gap-12 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-10 shadow-sm">
            <h2 className="text-3xl font-black text-[#06111f]">
              Send Us a Message
            </h2>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-xl border border-slate-200 px-5 py-4 outline-none transition focus:border-[#50A9C0]"
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="rounded-xl border border-slate-200 px-5 py-4 outline-none transition focus:border-[#50A9C0]"
              />

              <input
                type="text"
                name="company"
                placeholder="Company"
                value={formData.company}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-5 py-4 outline-none transition focus:border-[#50A9C0]"
              />

              <textarea
                name="message"
                placeholder="How can we help?"
                rows={6}
                value={formData.message}
                onChange={handleChange}
                required
                className="rounded-xl border border-slate-200 px-5 py-4 outline-none transition focus:border-[#50A9C0]"
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-fit disabled:opacity-50"
              >
                {loading ? "Sending..." : "Submit Inquiry"}
              </button>

              {status.type && (
                <div
                  className={`rounded-xl p-4 text-sm font-semibold ${
                    status.type === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {status.message}
                </div>
              )}
            </form>
          </div>

          <div className="rounded-3xl bg-[#06111f] p-10 text-white">
            <h2 className="text-3xl font-black">Get in Touch</h2>

            <div className="mt-10 grid gap-8">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#50A9C0]">
                  Email
                </p>

                <p className="mt-3 text-lg text-white/75">
                  info@younityconsultancy.com
                </p>
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#50A9C0]">
                  Consultation
                </p>

                <p className="mt-3 text-lg text-white/75">
                  Schedule a discovery call to discuss your strategic and
                  operational objectives.
                </p>
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#50A9C0]">
                  Response Time
                </p>

                <p className="mt-3 text-lg text-white/75">
                  We typically respond within 1 business day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}