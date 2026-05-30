import type { ReactNode } from "react";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { InternalSidebar } from "./internal-sidebar";

export const dynamic = "force-dynamic";

export default async function InternalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return (
      <main className="min-h-screen bg-[#f6f9fc] px-4 py-12 text-[#06111f] sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#244285]">
            Access denied
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#06111f]">
            Internal area
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            You do not have access to this internal area.
          </p>
        </section>
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-[#06111f]">
      <InternalSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
