"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-[#50A9C0]/20 bg-gradient-to-r from-[#06111f] via-[#071a33] to-[#06111f] shadow-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
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

        <nav aria-label="Website navigation" className="hidden sm:block">
          <div className="flex gap-1">
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

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white/80 transition hover:bg-white/10 hover:text-[#50A9C0] sm:hidden"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-white/10 bg-[#06111f] px-4 pb-4 sm:hidden"
        >
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              const isPortal = link.href === "/client/login";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.08em] transition ${
                    isPortal
                      ? "bg-[#50A9C0] text-[#06111f]"
                      : active
                        ? "bg-white/10 text-[#50A9C0]"
                        : "text-white/80 hover:bg-white/10 hover:text-[#50A9C0]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
