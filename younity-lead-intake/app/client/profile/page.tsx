import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BackLinks,
  Card,
  PageHeader,
  PortalPage,
} from "../portal-ui";
import { ProfileForm } from "./profile-form";

type ClientProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferred_contact_method: string | null;
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-200 py-4 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm leading-6 text-slate-800">
        {value}
      </dd>
    </div>
  );
}

export default async function ClientProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select(
      "id, full_name, email, phone, company, preferred_contact_method, created_at"
    )
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
  }

  if (!clientProfile) {
    return (
      <PortalPage>
        <PageHeader
          eyebrow={
            <BackLinks links={[{ href: "/client/dashboard", label: "Back to Dashboard" }]} />
          }
          title="Profile"
          description={`Signed in as ${user.email}`}
        />

        <Card className="mt-8 border-amber-200 bg-amber-50">
          <p className="text-sm leading-6 text-slate-700">
            Your portal profile has not been set up yet. Please contact Younity
            Consultancy.
          </p>
        </Card>
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <PageHeader
        eyebrow={
          <BackLinks
            links={[
              { href: "/client/requests", label: "View Requests" },
              { href: "/client/documents", label: "Upload Documents" },
            ]}
          />
        }
        title="Profile"
        description="View and update your client portal contact information."
      />

      <section className="grid gap-6 py-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Current Details
            </h2>
            <dl className="mt-4">
              <InfoRow label="Full Name" value={clientProfile.full_name} />
              <InfoRow label="Email" value={clientProfile.email} />
              <InfoRow
                label="Phone"
                value={clientProfile.phone || "Not provided"}
              />
              <InfoRow
                label="Company"
                value={clientProfile.company || "Not provided"}
              />
              <InfoRow
                label="Preferred Contact Method"
                value={clientProfile.preferred_contact_method || "No Preference"}
              />
              <InfoRow
                label="Created Date"
                value={formatDate(clientProfile.created_at)}
              />
            </dl>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Account Info
            </h2>
            <dl className="mt-4">
              <InfoRow label="Auth Email" value={user.email || "Not available"} />
              <InfoRow label="Portal Profile ID" value={clientProfile.id} />
              <InfoRow
                label="Account Management"
                value="Managed by Younity Consultancy"
              />
            </dl>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Update Contact Information
          </h2>
          <ProfileForm
            fullName={clientProfile.full_name}
            email={clientProfile.email}
            phone={clientProfile.phone}
            company={clientProfile.company}
            preferredContactMethod={clientProfile.preferred_contact_method}
          />
        </Card>
      </section>
    </PortalPage>
  );
}
