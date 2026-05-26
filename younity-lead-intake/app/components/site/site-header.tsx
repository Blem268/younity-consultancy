"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/process" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Client Portal", href: "/client/login" },
];

function isActive(pathname: string, href: string) {
  if (href.startsWith("/#")) {
    return pathname === "/";
  }

  return pathname === href;
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-[#50A9C0]/20 bg-gradient-to-r from-[#06111f] via-[#071a33] to-[#06111f] shadow-lg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Link href="/" className="flex w-fit items-center gap-3">
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
              CONSULTANCY
            </span>
          </span>
        </Link>

        <nav
          aria-label="Website navigation"
          className="-mx-1 overflow-x-auto"
        >
          <div className="flex min-w-max gap-1 px-1 pb-1">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);

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
  );
}
