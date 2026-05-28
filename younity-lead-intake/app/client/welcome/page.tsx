import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalClientHeader } from "../portal-client-header";
import { brand } from "@/app/components/ui/brand";
import { splitName } from "@/lib/client/portal-profile";

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
      <div className="welcome-page flex min-h-screen flex-col">
        <PortalClientHeader />
        <div className={`${brand.pageBackground} flex-1 p-6`}>
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-900">
                Your portal profile has not been set up yet. Please contact
                Younity Consultancy.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [requestCountResult, documentsNeededResult, uploadedDocumentsResult] =
    await Promise.all([
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

  const { firstName } = splitName(clientProfile.full_name);

  return (
    <div className="welcome-page flex min-h-screen flex-col">
      <PortalClientHeader fullName={clientProfile.full_name} />

      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="welcome-fade-up">
            <Link
              href="/client/dashboard"
              prefetch={false}
              className="text-sm font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-3 text-[20px] font-medium tracking-tight text-[#06111f]">
              Welcome, {firstName}
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Your workspace for requests, documents, updates, and support.
            </p>
          </div>

          <div
            className="welcome-fade-up overflow-hidden rounded-xl border-[0.5px] border-[#50A9C0]/30 bg-gradient-to-br from-white via-white to-[#50A9C0]/10 p-5"
            style={{ animationDelay: "40ms" }}
          >
            <p className="text-xs font-medium tracking-[0.1em] text-[#244285]">
              Getting started
            </p>
            <h2 className="mt-2 text-[17px] font-medium tracking-tight text-[#06111f]">
              {isFullyOnboarded
                ? "You are set up and ready to go"
                : `${completedCount} of ${checklist.length} setup steps complete`}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isFullyOnboarded
                ? "Your portal profile is in good shape. Use the dashboard to see what needs attention day to day."
                : "Complete these steps so the Younity team has what they need to support you smoothly."}
            </p>

            <div className="mt-4 grid gap-2">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      item.complete
                        ? "bg-[#50A9C0] text-[#06111f]"
                        : "bg-white ring-1 ring-slate-200"
                    }`}
                  >
                    {item.complete ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : null}
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Link
                href="/client/dashboard"
                prefetch={false}
                className="inline-flex rounded-xl bg-[#244285] px-5 py-2.5 text-sm font-medium text-white"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          {!isFullyOnboarded ? (
            <div
              className="welcome-fade-up grid gap-3"
              style={{ animationDelay: "80ms" }}
            >
              {welcomeSteps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5"
                >
                  <h3 className="text-[14px] font-medium text-[#06111f]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                  <div className="mt-3">
                    <Link
                      href={step.href}
                      prefetch={false}
                      className="text-sm font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
                    >
                      {step.cta} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div
            className="welcome-fade-up rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5"
            style={{ animationDelay: "120ms" }}
          >
            <h2 className="text-[14px] font-medium text-[#06111f]">
              What you can do here
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>Track request status and operational progress.</li>
              <li>Upload and open documents securely.</li>
              <li>Read updates from the Younity team.</li>
              <li>Reach support when you need help.</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/client/resources"
                prefetch={false}
                className="inline-flex rounded-xl border border-[#06111f]/15 bg-white px-4 py-2 text-sm font-medium text-[#06111f] transition-colors duration-150 hover:border-[#06111f]/25"
              >
                Resources
              </Link>
              <Link
                href="/client/support"
                prefetch={false}
                className="inline-flex rounded-xl border border-[#06111f]/15 bg-white px-4 py-2 text-sm font-medium text-[#06111f] transition-colors duration-150 hover:border-[#06111f]/25"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
