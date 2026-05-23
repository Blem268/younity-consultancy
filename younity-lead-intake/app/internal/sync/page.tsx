import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { InternalNav } from "../internal-ui";
import { SyncButtons } from "./sync-buttons";

export default async function InternalSyncPage() {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-[#f7faf8] px-6 py-8">
        <header className="border-b border-teal-900/10 pb-8">
          <InternalNav active="sync" />
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-[#f7faf8] px-6 py-8">
      <header className="border-b border-teal-900/10 pb-8">
        <InternalNav active="sync" />
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
