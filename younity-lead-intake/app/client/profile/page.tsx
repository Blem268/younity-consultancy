import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalClientHeader } from "../portal-client-header";
import { brand } from "@/app/components/ui/brand";
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
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3.5 last:border-b-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-800">{value}</dd>
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
      <div className="profile-page flex min-h-screen flex-col">
        <PortalClientHeader />
        <div className={`${brand.pageBackground} flex-1 p-6`}>
          <div className="mx-auto w-full max-w-6xl">
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

  return (
    <div className="profile-page flex min-h-screen flex-col">
      <PortalClientHeader fullName={clientProfile.full_name} />

      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="profile-fade-up">
            <Link
              href="/client/dashboard"
              prefetch={false}
              className="text-sm font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-3 text-[20px] font-medium tracking-tight text-[#06111f]">
              Profile
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              View and update your contact information.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div
              className="profile-fade-up space-y-4"
              style={{ animationDelay: "40ms" }}
            >
              <div className="rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5">
                <h2 className="text-[14px] font-medium text-[#06111f]">
                  Current Details
                </h2>
                <dl className="mt-3">
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
                    label="Preferred Contact"
                    value={
                      clientProfile.preferred_contact_method || "No Preference"
                    }
                  />
                  <InfoRow
                    label="Member Since"
                    value={formatDate(clientProfile.created_at)}
                  />
                </dl>
              </div>

              <div className="rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5">
                <h2 className="text-[14px] font-medium text-[#06111f]">
                  Account
                </h2>
                <dl className="mt-3">
                  <InfoRow
                    label="Login Email"
                    value={user.email || "Not available"}
                  />
                  <InfoRow
                    label="Account Management"
                    value="Managed by Younity Consultancy"
                  />
                </dl>
              </div>
            </div>

            <div
              className="profile-fade-up rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5"
              style={{ animationDelay: "80ms" }}
            >
              <h2 className="text-[14px] font-medium text-[#06111f]">
                Update Contact Information
              </h2>
              <ProfileForm
                fullName={clientProfile.full_name}
                email={clientProfile.email}
                phone={clientProfile.phone}
                company={clientProfile.company}
                preferredContactMethod={clientProfile.preferred_contact_method}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
