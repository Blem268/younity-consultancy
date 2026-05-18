"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Clients", href: "/clients" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-[#50A9C0]/20 bg-[#06111f] shadow-lg">
      <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between px-5 lg:h-24 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 lg:gap-4">
          <Image
            src="/younity-logo.png"
            alt="Younity Consultancy Logo"
            width={58}
            height={58}
            className="h-11 w-11 shrink-0 object-contain lg:h-14 lg:w-14"
          />

          <div className="min-w-0 leading-tight">
            <div className="text-xl font-black tracking-wide text-white lg:text-2xl">
              YOUNITY
            </div>
            <div className="text-xs font-bold tracking-[0.28em] text-white/80 lg:text-sm lg:tracking-[0.35em]">
              CONSULTANCY
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-base font-black uppercase tracking-[0.12em] text-white transition hover:text-[#50A9C0]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/contact"
          className="hidden items-center justify-center rounded-xl bg-[#50A9C0] px-8 py-4 text-base font-black uppercase tracking-[0.12em] text-white shadow-md transition hover:bg-white hover:text-[#06111f] xl:inline-flex"
        >
          Contact Us
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white xl:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={30} /> : <Menu size={30} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-[#06111f] px-6 py-6 xl:hidden">
          <nav className="flex flex-col gap-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="text-base font-black uppercase tracking-wide text-white"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="mt-2 rounded-md bg-[#50A9C0] px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-[#06111f]"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}