"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const internalNavItems = [
  { label: "Dashboard", href: "/internal" },
  { label: "Clients", href: "/internal/clients" },
  { label: "Requests", href: "/internal/requests" },
  { label: "Documents", href: "/internal/documents" },
  { label: "Sync Controls", href: "/internal/sync" },
  { label: "Workflow Errors", href: "/internal/errors" },
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
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-700 hover:bg-teal-50 hover:text-teal-900"
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
