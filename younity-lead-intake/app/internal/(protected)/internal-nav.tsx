"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const internalNavItems = [
  { label: "Dashboard", href: "/internal" },
  { label: "Clients", href: "/internal/clients" },
  { label: "Onboarding", href: "/internal/onboarding" },
  { label: "Requests", href: "/internal/requests" },
  { label: "Documents", href: "/internal/documents" },
  { label: "Sync Controls", href: "/internal/sync" },
  { label: "Workflow Errors", href: "/internal/errors" },
  { label: "Logout", href: "/internal/logout" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/internal") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InternalNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Internal navigation" className="overflow-x-auto">
      <div className="flex min-w-max gap-2 pb-1">
        {internalNavItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-xl px-3 py-2 text-sm font-black uppercase tracking-[0.08em] transition ${
                isActive
                  ? "bg-[#50A9C0] text-[#06111f] shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-[#50A9C0]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
