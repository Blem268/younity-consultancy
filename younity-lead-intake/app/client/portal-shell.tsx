"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { brand } from "@/app/components/ui/brand";
import { PortalNav } from "./portal-nav";

/** Pages that supply their own full-page chrome (dark header + nav via PortalClientHeader). */
function usesStandalonePortalChrome(pathname: string) {
  if (
    pathname === "/client/login" ||
    pathname === "/client/set-password" ||
    pathname === "/client/dashboard" ||
    pathname === "/client/requests" ||
    pathname === "/client/requests/new" ||
    pathname === "/client/invoices" ||
    pathname === "/client/documents" ||
    pathname === "/client/profile" ||
    pathname === "/client/resources" ||
    pathname === "/client/welcome" ||
    pathname === "/client/support" ||
    pathname === "/client/updates"
  ) {
    return true;
  }

  if (pathname.startsWith("/client/resources/")) {
    return true;
  }

  return /^\/client\/requests\/[^/]+$/.test(pathname);
}

export function ClientPortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/client/login";
  const isStandaloneChrome = usesStandalonePortalChrome(pathname);

  if (isLoginPage || isStandaloneChrome) {
    return (
      <section className="min-h-screen bg-[#f6f9fc] text-[#06111f]">
        {children}
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f6f9fc] text-[#06111f]">
      <header className={`sticky top-0 z-20 ${brand.shellHeader}`}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/client/dashboard"
            prefetch={false}
            className="flex w-fit items-center gap-3"
          >
            <Image
              src="/younity-logo.png"
              alt="Younity Consultancy Logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
            <span className="leading-tight">
              <span className="block text-[15px] font-medium tracking-wide text-white">
                Younity
              </span>
              <span className="block text-[10px] font-medium tracking-[0.2em] text-white/60">
                Client Portal
              </span>
            </span>
          </Link>

          <PortalNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </section>
  );
}
