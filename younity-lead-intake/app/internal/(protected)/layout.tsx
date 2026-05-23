import type { ReactNode } from "react";
import Image from "next/image";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { brand } from "@/app/components/ui/brand";
import { InternalNav } from "./internal-nav";

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
    <main className="min-h-screen bg-[#f6f9fc] px-4 py-6 text-[#06111f] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className={`sticky top-0 z-20 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${brand.shellHeader}`}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex items-center gap-3">
              <Image
                src="/younity-logo.png"
                alt="Younity Consultancy Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
              <div className="leading-tight">
                <p className="text-base font-black tracking-wide text-white">
                  YOUNITY
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">
                  INTERNAL
                </p>
              </div>
            </div>
            <InternalNav />
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
