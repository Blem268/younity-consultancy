import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalClientHeader } from "../../portal-client-header";
import { brand } from "@/app/components/ui/brand";
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
      <div className="req-new flex min-h-screen flex-col">
        <PortalClientHeader />
        <div className={`${brand.pageBackground} flex-1 p-6`}>
          <div className="mx-auto w-full max-w-2xl">
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
    <div className="req-new flex min-h-screen flex-col">
      <PortalClientHeader fullName={clientProfile.full_name} />

      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <div className="new-fade-up">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link
                href="/client/dashboard"
                prefetch={false}
                className="font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
              >
                Dashboard
              </Link>
              <span>/</span>
              <Link
                href="/client/requests"
                prefetch={false}
                className="font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
              >
                Requests
              </Link>
              <span>/</span>
              <span className="text-slate-600">New</span>
            </div>
            <h1 className="mt-3 text-[20px] font-medium tracking-tight text-[#06111f]">
              Submit a Request
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Tell us what you need and the Younity team will review your
              request.
            </p>
          </div>

          <div
            className="new-fade-up rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5"
            style={{ animationDelay: "40ms" }}
          >
            <h2 className="text-[14px] font-medium text-[#06111f]">
              Request Details
            </h2>
            <RequestForm />
          </div>
        </div>
      </div>
    </div>
  );
}
