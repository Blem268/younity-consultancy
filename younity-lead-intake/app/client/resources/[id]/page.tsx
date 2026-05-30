import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  portalResources,
  resourceCategoryTone,
} from "@/lib/content/portal-resources";
import { PortalClientHeader } from "../../portal-client-header";
import { brand } from "@/app/components/ui/brand";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResourceDetailPage({ params }: PageProps) {
  const { id } = await params;

  const resource = portalResources.find((r) => r.id === id);

  if (!resource || !resource.content) {
    notFound();
  }

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

  return (
    <div className="resources-page flex min-h-screen flex-col">
      <PortalClientHeader fullName={clientProfile?.full_name} />

      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <div>
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
                href="/client/resources"
                prefetch={false}
                className="font-medium text-[#244285] transition-colors duration-150 hover:text-[#06111f]"
              >
                Resources
              </Link>
            </div>
            <h1 className="mt-3 text-[20px] font-medium tracking-tight text-[#06111f]">
              {resource.title}
            </h1>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${resourceCategoryTone[resource.category]}`}
              >
                {resource.category}
              </span>
            </div>
          </div>

          <div className="space-y-6 rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-5">
            {resource.content.map((block, index) => {
              if (block.type === "paragraph") {
                return (
                  <p key={index} className="text-sm leading-7 text-slate-700">
                    {block.text}
                  </p>
                );
              }

              if (block.type === "list") {
                return (
                  <ul key={index} className="space-y-3">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#50A9C0]"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-sm leading-6 text-slate-700">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              }

              if (block.type === "steps") {
                return (
                  <ol key={index} className="space-y-4">
                    {block.items.map((step, stepIndex) => (
                      <li
                        key={step.title}
                        className="grid grid-cols-[2rem_1fr] gap-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#50A9C0]/15 text-sm font-medium text-[#244285]">
                          {stepIndex + 1}
                        </div>
                        <div className="pt-1">
                          <p className="text-sm font-medium text-[#06111f]">
                            {step.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {step.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
