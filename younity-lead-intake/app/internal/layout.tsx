import type { ReactNode } from "react";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { brand } from "@/app/components/ui/brand";
import { InternalNav } from "./internal-nav";

export default async function InternalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireInternalAdmin();

  return (
    <main className="min-h-screen bg-[#f6f9fc] px-4 py-6 text-[#06111f] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className={`sticky top-0 z-20 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${brand.shellHeader}`}>
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#50A9C0]">
              Younity Consultancy
            </p>
            <InternalNav />
          </div>
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
