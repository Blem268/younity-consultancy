"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Dashboard", href: "/client/dashboard" },
  { label: "Requests", href: "/client/requests" },
  { label: "Invoices", href: "/client/invoices" },
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

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Client portal navigation" className="-mx-1 overflow-x-auto">
      <div className="flex min-w-max gap-1 px-1 pb-1">
        {navLinks.map((link) => {
          const active = isActivePath(pathname, link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ${
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
  );
}
