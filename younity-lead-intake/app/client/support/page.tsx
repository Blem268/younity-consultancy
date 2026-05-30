import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supportChannels } from "@/lib/content/site-content";
import { PortalClientHeader } from "../portal-client-header";
import { brand } from "@/app/components/ui/brand";

type ClientProfile = {
  id: string;
  full_name: string;
  preferred_contact_method: string | null;
  email: string;
  phone: string | null;
};

const faqItems = [
  {
    question: "How do I submit a new request?",
    answer:
      "Use Submit Request in the portal navigation, describe what you need, and the team will review it.",
  },
  {
    question: "Where do I upload documents?",
    answer:
      "Open Document Library or the related request detail page. Documents requested by Younity appear under Documents Needed.",
  },
  {
    question: "How will I know when something changes?",
    answer:
      "Check Updates in the portal or your dashboard for recent notes from the Younity team.",
  },
  {
    question: "Who do I contact if I am stuck?",
    answer:
      "Use the contact details below or the public contact form. Include your company name and request details.",
  },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-all text-sm text-slate-800">{value}</dd>
    </div>
  );
}

export default async function ClientSupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id, full_name, preferred_contact_method, email, phone")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
  }

  return (
    <div className="support-page flex min-h-screen flex-col">
      <PortalClientHeader fullName={clientProfile?.full_name} />

      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="support-fade-up">
            <Link
              href="/client/dashboard"
              prefetch={false}
              className="text-sm font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-3 text-[20px] font-medium tracking-tight text-[#06111f]">
              Support
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Reach the Younity team, review common questions, and find the
              fastest way to get help.
            </p>
          </div>

          <div
            className="support-fade-up grid gap-5 lg:grid-cols-2"
            style={{ animationDelay: "40ms" }}
          >
            <div className="rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5">
              <h2 className="text-[14px] font-medium text-[#06111f]">
                Contact Younity
              </h2>
              <dl className="mt-4">
                <div className="border-b border-slate-100 py-3">
                  <dt className="text-xs font-medium text-slate-500">Email</dt>
                  <dd className="mt-1 break-all">
                    <a
                      href={`mailto:${supportChannels.email}`}
                      className="text-sm font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
                    >
                      {supportChannels.email}
                    </a>
                  </dd>
                </div>
                <div className="border-b border-slate-100 py-3">
                  <dt className="text-xs font-medium text-slate-500">Phone</dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${supportChannels.phone.replace(/\s|\(|\)|-/g, "")}`}
                      className="text-sm font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
                    >
                      {supportChannels.phone}
                    </a>
                  </dd>
                </div>
                <div className="border-b border-slate-100 py-3">
                  <dt className="text-xs font-medium text-slate-500">
                    Office hours
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">
                    {supportChannels.hours}
                  </dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs font-medium text-slate-500">
                    Response time
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">
                    {supportChannels.responseTime}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  prefetch={false}
                  className="inline-flex rounded-xl bg-[#244285] px-4 py-2 text-sm font-medium text-white"
                >
                  Contact Form
                </Link>
                <Link
                  href="/"
                  prefetch={false}
                  className="inline-flex rounded-xl border border-[#06111f]/15 bg-white px-4 py-2 text-sm font-medium text-[#06111f] transition-colors duration-150 hover:border-[#06111f]/25"
                >
                  Visit Website
                </Link>
              </div>
            </div>

            <div className="rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5">
              <h2 className="text-[14px] font-medium text-[#06111f]">
                Your contact preferences
              </h2>
              {clientProfile ? (
                <>
                  <dl className="mt-4">
                    <InfoRow label="Name" value={clientProfile.full_name} />
                    <InfoRow label="Portal email" value={clientProfile.email} />
                    <InfoRow
                      label="Phone on file"
                      value={clientProfile.phone || "Not provided"}
                    />
                    <InfoRow
                      label="Preferred contact method"
                      value={
                        clientProfile.preferred_contact_method ||
                        "No preference set"
                      }
                    />
                  </dl>
                  <div className="mt-4">
                    <Link
                      href="/client/profile"
                      prefetch={false}
                      className="inline-flex rounded-xl border border-[#06111f]/15 bg-white px-4 py-2 text-sm font-medium text-[#06111f] transition-colors duration-150 hover:border-[#06111f]/25"
                    >
                      Update Profile
                    </Link>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Your portal profile is not set up yet. Please contact Younity
                  Consultancy for assistance.
                </p>
              )}
            </div>
          </div>

          <div
            className="support-fade-up rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5"
            style={{ animationDelay: "80ms" }}
          >
            <h2 className="text-[14px] font-medium text-[#06111f]">
              Common questions
            </h2>
            <div className="mt-4 divide-y divide-slate-100">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <summary className="cursor-pointer text-sm font-medium text-slate-900">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
