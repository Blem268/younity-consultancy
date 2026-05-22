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
      .from("client_documents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientProfile.id)
      .in("status", ["Requested", "Pending"]),
    supabase
      .from("client_documents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientProfile.id)
      .in("status", ["Submitted", "Received"]),
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

  const dashboardCards = [
    {
      title: "Active Requests",
      value: String(activeRequestsResult.count ?? 0),
      href: "/client/requests",
    },
    {
      title: "Documents Needed",
      value: String(documentsNeededResult.count ?? 0),
      href: "/client/documents",
    },
    {
      title: "Submitted Documents",
      value: String(submittedDocumentsResult.count ?? 0),
      href: "/client/documents",
    },
    {
      title: "Invoices",
      value: String(invoicesResult.count ?? 0),
      href: "/client/requests",
    },
  ];

  const quickActions = [
    {
      label: "Submit New Request",
      href: "/client/requests/new",
      primary: true,
    },
    {
      label: "Document Library",
      href: "/client/documents",
      primary: false,
    },
    {
      label: "View Requests",
      href: "/client/requests",
      primary: false,
    },
    {
      label: "Update Profile",
      href: "/client/profile",
      primary: false,
    },
  ];

  const recentUpdates = recentUpdatesResult.data ?? [];

  if (activeRequestsResult.error) {
    console.error("Active requests count failed:", activeRequestsResult.error);
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
            {clientProfile.company || "Company not provided"} |{" "}
            {clientProfile.email} | Signed in as {user.email}
          </>
        }
      />

      <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            prefetch={false}
            className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:border-teal-300 hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-600">{card.title}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {card.value}
            </p>
            <p className="mt-4 text-sm font-semibold text-teal-700">
              View details
            </p>
          </Link>
        ))}
      </section>

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Quick Actions
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start common client portal tasks from one place.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) =>
            action.primary ? (
              <PrimaryButtonLink key={action.href} href={action.href}>
                {action.label}
              </PrimaryButtonLink>
            ) : (
              <SecondaryButtonLink key={action.href} href={action.href}>
                {action.label}
              </SecondaryButtonLink>
            )
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Recent Updates
        </h2>

        {recentUpdates.length ? (
          <div className="mt-5 divide-y divide-slate-200">
            {recentUpdates.map((update) => (
              <article key={update.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {update.title}
                  </h3>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    {formatUpdateDate(update.created_at)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {update.message}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No recent updates yet." />
        )}
      </Card>
    </PortalPage>
  );
}
