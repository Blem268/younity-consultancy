import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BackLinks,
  Card,
  PageHeader,
  PortalPage,
} from "../../portal-ui";
import { RequestForm } from "./request-form";

type ClientProfile = {
  id: string;
  full_name: string;
};

export default async function NewClientRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id, full_name")
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
          title="Submit New Request"
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
    <PortalPage narrow>
      <PageHeader
        eyebrow={
          <BackLinks
            links={[
              { href: "/client/dashboard", label: "Back to Dashboard" },
              { href: "/client/requests", label: "Back to Requests" },
            ]}
          />
        }
        title="Submit New Request"
        description="Tell us what you need, and the Younity team will review your request."
      />

      <div className="py-8">
        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Request Details
          </h2>
          <RequestForm />
        </Card>
      </div>
    </PortalPage>
  );
}
