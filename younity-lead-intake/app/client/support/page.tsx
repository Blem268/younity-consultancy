import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supportChannels } from "@/lib/content/site-content";
import {
  BackLinks,
  Card,
  PageHeader,
  PortalPage,
  PrimaryButtonLink,
  SecondaryButtonLink,
} from "../portal-ui";

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
    <PortalPage>
      <PageHeader
        eyebrow={
          <BackLinks links={[{ href: "/client/dashboard", label: "Back to Dashboard" }]} />
        }
        title="Support"
        description="Reach the Younity team, review common questions, and find the fastest way to get help."
      />

      <section className="grid gap-6 py-8 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Contact Younity
          </h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Email
              </dt>
              <dd className="mt-1 break-all">
                <a
                  href={`mailto:${supportChannels.email}`}
                  className="font-semibold text-[#244285] transition hover:text-[#06111f]"
                >
                  {supportChannels.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Phone
              </dt>
              <dd className="mt-1">
                <a
                  href={`tel:${supportChannels.phone.replace(/\s|\(|\)|-/g, "")}`}
                  className="font-semibold text-[#244285] transition hover:text-[#06111f]"
                >
                  {supportChannels.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Office hours
              </dt>
              <dd className="mt-1 text-slate-700">{supportChannels.hours}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Response time
              </dt>
              <dd className="mt-1 text-slate-700">
                {supportChannels.responseTime}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButtonLink href="/contact">Contact Form</PrimaryButtonLink>
            <SecondaryButtonLink href="/">Visit Website</SecondaryButtonLink>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Your contact preferences
          </h2>
          {clientProfile ? (
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Name
                </dt>
                <dd className="mt-1 text-slate-800">{clientProfile.full_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Portal email
                </dt>
                <dd className="mt-1 break-all text-slate-800">
                  {clientProfile.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Phone on file
                </dt>
                <dd className="mt-1 text-slate-800">
                  {clientProfile.phone || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Preferred contact method
                </dt>
                <dd className="mt-1 text-slate-800">
                  {clientProfile.preferred_contact_method || "No preference set"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Your portal profile is not set up yet. Please contact Younity
              Consultancy for assistance.
            </p>
          )}

          {clientProfile ? (
            <div className="mt-6">
              <SecondaryButtonLink href="/client/profile">
                Update Profile
              </SecondaryButtonLink>
            </div>
          ) : null}
        </Card>
      </section>

      <Card>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Common questions
        </h2>
        <div className="mt-5 divide-y divide-slate-200">
          {faqItems.map((item) => (
            <details key={item.question} className="py-4 first:pt-0 last:pb-0">
              <summary className="cursor-pointer text-sm font-semibold text-slate-950">
                {item.question}
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Card>
    </PortalPage>
  );
}
