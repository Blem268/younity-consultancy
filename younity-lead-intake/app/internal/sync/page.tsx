import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SyncButtons } from "./sync-buttons";

function getAllowedAdminEmails() {
  return (process.env.INTERNAL_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export default async function InternalSyncPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const allowedEmails = getAllowedAdminEmails();
  const userEmail = user.email?.toLowerCase() || "";

  if (!allowedEmails.length) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        <header className="border-b border-slate-200 pb-8">
          <Link
            href="/client/dashboard"
            className="text-sm font-semibold text-teal-700 transition hover:text-teal-900"
          >
            Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Younity Internal Sync Controls
          </h1>
        </header>
        <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm leading-6 text-slate-700">
            Internal admin access is not configured.
          </p>
        </section>
      </main>
    );
  }

  if (!allowedEmails.includes(userEmail)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        <header className="border-b border-slate-200 pb-8">
          <Link
            href="/client/dashboard"
            className="text-sm font-semibold text-teal-700 transition hover:text-teal-900"
          >
            Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Younity Internal Sync Controls
          </h1>
        </header>
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-6 text-slate-600">
            You do not have access to this internal page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
      <header className="border-b border-slate-200 pb-8">
        <Link
          href="/client/dashboard"
          className="text-sm font-semibold text-teal-700 transition hover:text-teal-900"
        >
          Back to Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Younity Internal Sync Controls
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Run manual ClickUp syncs without exposing internal secrets in the
          browser.
        </p>
      </header>

      <section className="py-8">
        <SyncButtons />
      </section>
    </main>
  );
}
