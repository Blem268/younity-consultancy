import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  portalResources,
  resourceCategoryTone,
} from "@/lib/content/portal-resources";
import { PortalClientHeader } from "../portal-client-header";
import { brand } from "@/app/components/ui/brand";

export default async function ClientResourcesPage() {
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
    .maybeSingle<{ id: string; full_name: string }>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
  }

  if (!clientProfile) {
    return (
      <div className="resources-page flex min-h-screen flex-col">
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
    <div className="resources-page flex min-h-screen flex-col">
      <PortalClientHeader fullName={clientProfile.full_name} />

      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="res-fade-up flex items-start justify-between gap-4">
            <div>
              <Link
                href="/client/dashboard"
                prefetch={false}
                className="text-sm font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
              >
                ← Dashboard
              </Link>
              <h1 className="mt-3 text-[20px] font-medium tracking-tight text-[#06111f]">
                Resources
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">
                Helpful guides and references for working with Younity.
              </p>
            </div>
            <Link
              href="/client/documents"
              prefetch={false}
              className="mt-1 shrink-0 rounded-xl border border-[#06111f]/15 bg-white px-4 py-2 text-sm font-medium text-[#06111f] transition-colors duration-150 hover:border-[#06111f]/25"
            >
              Document Library
            </Link>
          </div>

          {portalResources.length ? (
            <div
              className="res-fade-up grid gap-4 sm:grid-cols-2"
              style={{ animationDelay: "40ms" }}
            >
              {portalResources.map((resource) => (
                <div
                  key={resource.id}
                  className="res-card flex h-full flex-col rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5 transition-colors duration-150"
                >
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${resourceCategoryTone[resource.category]}`}
                  >
                    {resource.category}
                  </span>
                  <h2 className="mt-4 text-[15px] font-medium tracking-tight text-[#06111f]">
                    {resource.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    {resource.description}
                  </p>
                  {resource.href ? (
                    <Link
                      href={resource.href}
                      prefetch={false}
                      className="mt-4 text-sm font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
                    >
                      Open resource →
                    </Link>
                  ) : (
                    <p className="mt-4 text-xs font-medium text-slate-400">
                      Reference material — ask support for details
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="res-fade-up rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-8 text-center"
              style={{ animationDelay: "40ms" }}
            >
              <p className="text-sm font-medium text-slate-600">
                No resources are available yet.
              </p>
              <Link
                href="/client/support"
                prefetch={false}
                className="mt-4 inline-flex rounded-xl bg-[#244285] px-4 py-2 text-sm font-medium text-white"
              >
                Contact Support
              </Link>
            </div>
          )}

          <div
            className="res-fade-up rounded-xl border-[0.5px] border-[#50A9C0]/25 bg-[#50A9C0]/10 p-5"
            style={{ animationDelay: "80ms" }}
          >
            <h2 className="text-[14px] font-medium text-[#06111f]">
              Looking for your files?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Private documents uploaded for your requests are stored separately
              in the document library, not in this reference section.
            </p>
            <Link
              href="/client/documents"
              prefetch={false}
              className="mt-4 inline-flex rounded-xl bg-[#244285] px-4 py-2 text-sm font-medium text-white"
            >
              Open Document Library
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
