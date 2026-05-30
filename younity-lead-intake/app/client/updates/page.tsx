import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatPortalDate,
  friendlyPortalText,
} from "@/lib/client/portal-text";
import { PortalClientHeader } from "../portal-client-header";
import { brand } from "@/app/components/ui/brand";

type ClientProfile = {
  id: string;
  full_name: string;
};

type ClientUpdate = {
  id: string;
  title: string;
  message: string;
  created_at: string | null;
  request_id: string | null;
  client_requests: {
    service: string;
  } | null;
};

export default async function ClientUpdatesPage() {
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
      <div className="updates-page flex min-h-screen flex-col">
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

  const { data: updates, error: updatesError } = await supabase
    .from("client_updates")
    .select(
      "id, title, message, created_at, request_id, client_requests(service)"
    )
    .eq("client_id", clientProfile.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ClientUpdate[]>();

  if (updatesError) {
    console.error("Client updates lookup failed:", updatesError);
  }

  const clientUpdates = updates ?? [];

  return (
    <div className="updates-page flex min-h-screen flex-col">
      <PortalClientHeader fullName={clientProfile.full_name} />

      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="updates-fade-up flex items-start justify-between gap-4">
            <div>
              <Link
                href="/client/dashboard"
                prefetch={false}
                className="text-sm font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
              >
                ← Dashboard
              </Link>
              <h1 className="mt-3 text-[20px] font-medium tracking-tight text-[#06111f]">
                Updates
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">
                Messages and progress notes shared by the Younity team.
              </p>
            </div>
            <Link
              href="/client/support"
              prefetch={false}
              className="mt-1 inline-flex shrink-0 rounded-xl bg-[#244285] px-4 py-2 text-sm font-medium text-white"
            >
              Get Support
            </Link>
          </div>

          {clientUpdates.length ? (
            <div
              className="updates-fade-up space-y-4"
              style={{ animationDelay: "40ms" }}
            >
              {clientUpdates.map((update) => (
                <div
                  key={update.id}
                  className="rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-[14px] font-medium text-slate-950">
                        {friendlyPortalText(update.title)}
                      </h2>
                      {update.client_requests?.service ? (
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Related to:{" "}
                          {friendlyPortalText(update.client_requests.service)}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-xs font-medium text-slate-400">
                      {formatPortalDate(update.created_at)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {friendlyPortalText(update.message)}
                  </p>
                  {update.request_id ? (
                    <div className="mt-4">
                      <Link
                        href={`/client/requests/${update.request_id}`}
                        prefetch={false}
                        className="text-sm font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
                      >
                        View related request →
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="updates-fade-up rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-8 text-center"
              style={{ animationDelay: "40ms" }}
            >
              <p className="text-sm font-medium text-slate-600">
                No updates yet.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                When Younity posts an update about your requests or documents,
                it will appear here.
              </p>
              <Link
                href="/client/requests/new"
                prefetch={false}
                className="mt-4 inline-flex rounded-xl bg-[#244285] px-4 py-2 text-sm font-medium text-white"
              >
                Submit Request
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
