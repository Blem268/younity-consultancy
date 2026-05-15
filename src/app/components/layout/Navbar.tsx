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
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#06111f]/95 backdrop-blur">
      <div className="container-custom flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logos/younity-logo1.png"
            alt="Younity Consultancy Logo"
            width={44}
            height={44}
            className="h-11 w-11 rounded-md object-contain"
          />

          <div className="leading-tight">
            <div className="text-xl font-black tracking-wide text-white">
              YOUNITY
            </div>

            <div className="text-xs font-semibold tracking-[0.32em] text-white/70">
              CONSULTANCY
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:text-[#50A9C0]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/contact"
          className="hidden rounded-md bg-[#50A9C0] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-110 lg:inline-flex"
        >
          Contact Us
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white lg:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-[#06111f] px-6 py-6 lg:hidden">
          <nav className="flex flex-col gap-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="text-sm font-bold uppercase tracking-wide text-white/80"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="mt-2 rounded-md bg-[#50A9C0] px-5 py-3 text-center text-sm font-bold uppercase tracking-wide text-white"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}