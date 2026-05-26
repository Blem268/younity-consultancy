import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  portalResources,
  resourceCategoryTone,
} from "@/lib/content/portal-resources";
import {
  BackLinks,
  Card,
  EmptyState,
  PageHeader,
  PortalPage,
  PrimaryButtonLink,
  SecondaryButtonLink,
} from "../portal-ui";

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
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

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
          title="Resources"
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
          <BackLinks links={[{ href: "/client/dashboard", label: "Back to Dashboard" }]} />
        }
        title="Resources"
        description="Helpful guides and references for working with Younity. Uploaded files remain in your document library."
        actions={
          <SecondaryButtonLink href="/client/documents">
            Document Library
          </SecondaryButtonLink>
        }
      />

      <section className="py-8">
        {portalResources.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {portalResources.map((resource) => (
              <Card key={resource.id} className="flex h-full flex-col">
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${resourceCategoryTone[resource.category]}`}
                >
                  {resource.category}
                </span>
                <h2 className="mt-4 text-lg font-black tracking-tight text-[#06111f]">
                  {resource.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  {resource.description}
                </p>
                {resource.href ? (
                  <Link
                    href={resource.href}
                    prefetch={false}
                    className="mt-4 text-sm font-black text-[#244285] transition hover:text-[#06111f]"
                  >
                    Open resource →
                  </Link>
                ) : (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Reference material — ask support for details
                  </p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="No resources are available yet."
              action={
                <PrimaryButtonLink href="/client/support">
                  Contact Support
                </PrimaryButtonLink>
              }
            />
          </Card>
        )}
      </section>

      <Card className="border-[#50A9C0]/25 bg-[#50A9C0]/10 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Looking for your files?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Private documents uploaded for your requests are stored separately in
          the document library, not in this reference section.
        </p>
        <div className="mt-4">
          <PrimaryButtonLink href="/client/documents">
            Open Document Library
          </PrimaryButtonLink>
        </div>
      </Card>
    </PortalPage>
  );
}
