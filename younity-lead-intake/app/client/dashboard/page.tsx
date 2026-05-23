import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  EmptyState,
  PageHeader,
  PortalPage,
  PrimaryButtonLink,
  SecondaryButtonLink,
} from "../portal-ui";
import { brand } from "@/app/components/ui/brand";

type ClientProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferred_contact_method: string | null;
};

type ClientUpdate = {
  id: string;
  title: string;
  message: string;
  created_at: string | null;
};

function friendlyPortalText(value: string) {
  return value
    .replaceAll("client_requests", "requests")
    .replaceAll("Client Requests", "Requests")
    .replaceAll("client requests", "requests")
    .replaceAll("sync", "update")
    .replaceAll("Sync", "Update")
    .replaceAll("billing fields", "profile details")
    .replaceAll("Billing fields", "Profile details");
}

function formatUpdateDate(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, company, preferred_contact_method")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
  }

  if (!clientProfile) {
    return (
      <PortalPage>
        <PageHeader
          title="Welcome to your Younity Client Portal"
          description={`Signed in as ${user.email}`}
        />

        <Card className="mt-8 border-amber-200 bg-amber-50">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Portal Profile Pending
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Your portal profile has not been set up yet. Please contact Younity
            Consultancy.
          </p>
        </Card>
      </PortalPage>
    );
  }

  const [
    activeRequestsResult,
    allRequestsResult,
    documentsNeededResult,
    submittedDocumentsResult,
    invoicesResult,
    recentUpdatesResult,
  ] = await Promise.all([
    supabase
      .from("client_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientProfile.id)
      .neq("status", "Completed")
      .neq("status", "Closed"),
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
    supabase
      .from("client_invoices")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientProfile.id)
      .neq("status", "Paid")
      .neq("status", "Cancelled"),
    supabase
      .from("client_updates")
      .select("id, title, message, created_at")
      .eq("client_id", clientProfile.id)
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<ClientUpdate[]>(),
  ]);

  const activeRequestCount = activeRequestsResult.count ?? 0;
  const allRequestCount = allRequestsResult.count ?? 0;
  const documentsNeededCount = documentsNeededResult.count ?? 0;
  const uploadedDocumentCount = submittedDocumentsResult.count ?? 0;
  const profileComplete = Boolean(
    clientProfile.phone &&
      clientProfile.company &&
      clientProfile.preferred_contact_method
  );
  const recentUpdates = recentUpdatesResult.data ?? [];
  const primaryNextStep =
    documentsNeededCount > 0
      ? {
          title: "Documents needed",
          message:
            "Please upload the requested documents so we can continue your work.",
          buttonLabel: "Upload Documents",
          href: "/client/documents",
        }
      : activeRequestCount > 0
        ? {
            title: "Your request is in progress",
            message:
              "You can check the latest status or view updates from Younity.",
            buttonLabel: "View Requests",
            href: "/client/requests",
          }
        : {
            title: "Start your first request",
            message:
              "Tell us what you need help with and we’ll guide you from there.",
            buttonLabel: "Start New Request",
            href: "/client/requests/new",
          };
  const actionCards = [
    {
      title: "Your Requests",
      value: String(activeRequestCount),
      helper:
        activeRequestCount === 1
          ? "1 request is currently active."
          : `${activeRequestCount} requests are currently active.`,
      buttonLabel: "View Requests",
      href: "/client/requests",
      primary: false,
    },
    {
      title: "Documents We Need",
      value: String(documentsNeededCount),
      helper:
        documentsNeededCount === 1
          ? "1 document needs your attention."
          : `${documentsNeededCount} documents need your attention.`,
      buttonLabel: "Upload Documents",
      href: "/client/documents",
      primary: documentsNeededCount > 0,
    },
    {
      title: "Uploaded Documents",
      value: String(uploadedDocumentCount),
      helper:
        uploadedDocumentCount === 1
          ? "1 document has been uploaded."
          : `${uploadedDocumentCount} documents have been uploaded.`,
      buttonLabel: "View Documents",
      href: "/client/documents",
      primary: false,
    },
    {
      title: "Your Profile",
      value: profileComplete ? "Complete" : "Needs review",
      helper: profileComplete
        ? "Your contact details are ready."
        : "Add your company, phone, and contact preference.",
      buttonLabel: "Update Profile",
      href: "/client/profile",
      primary: !profileComplete,
    },
  ];
  const onboardingItems = [
    {
      label: "Profile completed",
      complete: profileComplete,
    },
    {
      label: "First request submitted",
      complete: allRequestCount > 0,
    },
    {
      label: "Documents uploaded",
      complete: documentsNeededCount === 0 && uploadedDocumentCount > 0,
    },
    {
      label: "Contact preference added",
      complete: Boolean(clientProfile.preferred_contact_method),
    },
  ];
  const completedOnboardingItems = onboardingItems.filter(
    (item) => item.complete
  ).length;

  if (activeRequestsResult.error) {
    console.error("Active requests count failed:", activeRequestsResult.error);
  }

  if (allRequestsResult.error) {
    console.error("All requests count failed:", allRequestsResult.error);
  }

  if (documentsNeededResult.error) {
    console.error("Documents needed count failed:", documentsNeededResult.error);
  }

  if (submittedDocumentsResult.error) {
    console.error(
      "Submitted documents count failed:",
      submittedDocumentsResult.error
    );
  }

  if (invoicesResult.error) {
    console.error("Invoices count failed:", invoicesResult.error);
  }

  if (recentUpdatesResult.error) {
    console.error("Recent updates lookup failed:", recentUpdatesResult.error);
  }

  return (
    <PortalPage>
      <PageHeader
        title={`Welcome back, ${clientProfile.full_name}`}
        description={
          <>
            {clientProfile.company ? `${clientProfile.company}. ` : ""}
            Here’s what needs your attention today.
          </>
        }
      />

      <Card className="mt-8 overflow-hidden border-[#50A9C0]/30 bg-gradient-to-br from-white via-white to-[#50A9C0]/12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.12em] text-[#244285]">
              Next step
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-[#06111f] sm:text-3xl">
              {primaryNextStep.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
              {primaryNextStep.message}
            </p>
          </div>
          <PrimaryButtonLink href={primaryNextStep.href}>
            {primaryNextStep.buttonLabel}
          </PrimaryButtonLink>
        </div>
      </Card>

      <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {actionCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            prefetch={false}
            className={`${brand.statCard} flex min-h-64 flex-col justify-between`}
          >
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                {card.title}
              </span>
              <span className="mt-4 block text-4xl font-black tracking-tight text-[#06111f]">
                {card.value}
              </span>
              <span className="mt-3 block text-sm leading-6 text-slate-600">
                {card.helper}
              </span>
            </span>
            <span
              className={`mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-black uppercase tracking-[0.08em] transition ${
                card.primary
                  ? "bg-[#244285] text-white"
                  : "border border-[#06111f]/15 bg-white text-[#06111f]"
              }`}
            >
              {card.buttonLabel}
            </span>
          </Link>
        ))}
      </section>

      <Card>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Recent Updates
        </h2>

        {recentUpdates.length ? (
          <div className="mt-5 divide-y divide-slate-200">
            {recentUpdates.map((update) => (
              <article key={update.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {friendlyPortalText(update.title)}
                  </h3>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    {formatUpdateDate(update.created_at)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {friendlyPortalText(update.message)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No updates yet."
            description="When Younity posts an update, it will appear here."
          />
        )}
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Getting Started
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {completedOnboardingItems} of {onboardingItems.length} steps
              complete.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {onboardingItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
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
      </Card>

      <Card className="mt-6 border-[#50A9C0]/25 bg-[#50A9C0]/10 shadow-none">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Need help?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Contact Younity Consultancy if you need assistance using the portal.
        </p>
        <div className="mt-5">
          <SecondaryButtonLink href="/contact">Contact Younity</SecondaryButtonLink>
        </div>
      </Card>
    </PortalPage>
  );
}
