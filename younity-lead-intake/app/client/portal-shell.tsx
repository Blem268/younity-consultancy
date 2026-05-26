"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { brand } from "@/app/components/ui/brand";

const navigationLinks = [
  { label: "Dashboard", href: "/client/dashboard" },
  { label: "Requests", href: "/client/requests" },
  { label: "Documents", href: "/client/documents" },
  { label: "Updates", href: "/client/updates" },
  { label: "Resources", href: "/client/resources" },
  { label: "Support", href: "/client/support" },
  { label: "Profile", href: "/client/profile" },
  { label: "Logout", href: "/client/logout" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/client/requests") {
    return (
      pathname === href ||
      (pathname.startsWith("/client/requests/") &&
        pathname !== "/client/requests/new")
    );
  }

  if (href === "/client/dashboard") {
    return pathname === href || pathname === "/client/welcome";
  }

  return pathname === href;
}

export function ClientPortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/client/login";

  if (isLoginPage) {
    return (
      <section className="min-h-screen bg-[#f6f9fc] text-[#06111f]">
        {children}
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f6f9fc] text-[#06111f]">
      <header className={`sticky top-0 z-20 ${brand.shellHeader}`}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/client/dashboard" prefetch={false} className="flex w-fit items-center gap-3">
              <Image
                src="/younity-logo.png"
                alt="Younity Consultancy Logo"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                priority
              />
              <span className="leading-tight">
                <span className="block text-lg font-black tracking-wide text-white">
                  YOUNITY
                </span>
                <span className="block text-xs font-bold tracking-[0.3em] text-white/80">
                  CLIENT PORTAL
                </span>
              </span>
            </Link>
          </div>

          <nav aria-label="Client portal navigation" className="-mx-1 overflow-x-auto">
            <div className="flex min-w-max gap-1 px-1 pb-1">
              {navigationLinks.map((link) => {
                const active = isActivePath(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-xl px-3 py-2 text-sm font-black uppercase tracking-[0.08em] transition ${
                      active
                        ? "bg-[#50A9C0] text-[#06111f] shadow-sm"
                        : "text-white/80 hover:bg-white/10 hover:text-[#50A9C0]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </section>
  );
}
