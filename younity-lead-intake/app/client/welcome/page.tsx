import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  phone: string | null;
  company: string | null;
  preferred_contact_method: string | null;
};

const welcomeSteps = [
  {
    title: "Complete your profile",
    description: "Add your company, phone number, and preferred contact method.",
    href: "/client/profile",
    cta: "Update Profile",
  },
  {
    title: "Submit your first request",
    description: "Tell us what you need help with so we can begin work.",
    href: "/client/requests/new",
    cta: "Submit Request",
  },
  {
    title: "Review documents and updates",
    description:
      "Upload requested files and check Updates when the team shares progress.",
    href: "/client/documents",
    cta: "Open Documents",
  },
];

export default async function ClientWelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id, full_name, phone, company, preferred_contact_method")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
  }

  if (!clientProfile) {
    return (
      <PortalPage narrow>
        <PageHeader
          title="Welcome to your portal"
          description={`Signed in as ${user.email}`}
        />

        <Card className="mt-8 border-amber-200 bg-amber-50">
          <p className="text-sm leading-6 text-slate-700">
            Your portal profile has not been set up yet. Please contact Younity
            Consultancy.
          </p>
          <div className="mt-5">
            <SecondaryButtonLink href="/contact">Contact Younity</SecondaryButtonLink>
          </div>
        </Card>
      </PortalPage>
    );
  }

  const [
    requestCountResult,
    documentsNeededResult,
    uploadedDocumentsResult,
  ] = await Promise.all([
    supabase
      .from("client_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientProfile.id),
    supabase
      .from("client_documents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientProfile.id)
      .in("status", ["Requested", "Needs Replacement"]),
    supabase
      .from("client_documents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientProfile.id)
      .in("status", ["Submitted", "Received", "Under Review", "Approved", "Rejected"]),
  ]);

  const profileComplete = Boolean(
    clientProfile.phone &&
      clientProfile.company &&
      clientProfile.preferred_contact_method
  );
  const requestCount = requestCountResult.count ?? 0;
  const documentsNeededCount = documentsNeededResult.count ?? 0;
  const uploadedDocumentCount = uploadedDocumentsResult.count ?? 0;

  const checklist = [
    { label: "Profile completed", complete: profileComplete },
    { label: "First request submitted", complete: requestCount > 0 },
    {
      label: "Documents uploaded",
      complete: documentsNeededCount === 0 && uploadedDocumentCount > 0,
    },
    {
      label: "Contact preference added",
      complete: Boolean(clientProfile.preferred_contact_method),
    },
  ];
  const completedCount = checklist.filter((item) => item.complete).length;
  const isFullyOnboarded = completedCount === checklist.length;

  return (
    <PortalPage narrow>
      <PageHeader
        eyebrow={
          <BackLinks links={[{ href: "/client/dashboard", label: "Back to Dashboard" }]} />
        }
        title={`Welcome, ${clientProfile.full_name}`}
        description="Your calm workspace for requests, documents, updates, and support."
      />

      <Card className="mt-8 overflow-hidden border-[#50A9C0]/30 bg-gradient-to-br from-white via-white to-[#50A9C0]/12">
        <p className="text-sm font-black uppercase tracking-[0.12em] text-[#244285]">
          Getting started
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-[#06111f]">
          {isFullyOnboarded
            ? "You are set up and ready to go"
            : `${completedCount} of ${checklist.length} setup steps complete`}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {isFullyOnboarded
            ? "Your portal profile is in good shape. Use the dashboard to see what needs attention day to day."
            : "Complete these steps so the Younity team has what they need to support you smoothly."}
        </p>

        <div className="mt-5 grid gap-3">
          {checklist.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3"
            >
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  item.complete
                    ? "bg-[#50A9C0] text-[#06111f]"
                    : "bg-white text-slate-500 ring-1 ring-slate-200"
                }`}
              >
                {item.complete ? "OK" : ""}
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <PrimaryButtonLink href="/client/dashboard">
            Go to Dashboard
          </PrimaryButtonLink>
        </div>
      </Card>

      {!isFullyOnboarded ? (
        <section className="mt-6 grid gap-4">
          {welcomeSteps.map((step) => (
            <Card key={step.title}>
              <h3 className="text-lg font-black tracking-tight text-[#06111f]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
              <div className="mt-4">
                <Link
                  href={step.href}
                  prefetch={false}
                  className="text-sm font-black text-[#244285] transition hover:text-[#06111f]"
                >
                  {step.cta} →
                </Link>
              </div>
            </Card>
          ))}
        </section>
      ) : null}

      <Card className="mt-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          What you can do here
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li>Track request status and operational progress.</li>
          <li>Upload and open documents securely.</li>
          <li>Read updates from the Younity team.</li>
          <li>Reach support when you need help.</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <SecondaryButtonLink href="/client/resources">Resources</SecondaryButtonLink>
          <SecondaryButtonLink href="/client/support">Support</SecondaryButtonLink>
        </div>
      </Card>
    </PortalPage>
  );
}
