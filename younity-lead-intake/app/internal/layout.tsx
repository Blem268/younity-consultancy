import type { ReactNode } from "react";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { InternalNav } from "./internal-nav";

export default async function InternalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireInternalAdmin();

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="border-b border-teal-900/10 pb-6">
          <InternalNav />
        </header>
        {admin.isAdmin ? (
          children
        ) : (
          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm leading-6 text-slate-600">
              You do not have access to this internal page.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
