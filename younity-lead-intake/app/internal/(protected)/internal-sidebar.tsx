"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const workspaceNav = [
  { label: "Board", href: "/internal" },
  { label: "Clients", href: "/internal/clients" },
  { label: "Documents", href: "/internal/documents" },
  { label: "Billing", href: "/internal/billing" },
];

const teamNav = [
  { label: "Analytics", href: "/internal/analytics" },
  { label: "Settings", href: "/internal/settings" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/internal") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={isActive ? "page" : undefined}
      className={`block rounded-lg px-3 py-2 text-sm transition ${
        isActive
          ? "bg-[#50A9C0]/15 font-medium text-[#50A9C0]"
          : "font-normal text-white/40 hover:bg-white/5 hover:text-white/70"
      }`}
    >
      {label}
    </Link>
  );
}

export function InternalSidebar() {
  return (
    <aside
      aria-label="Internal navigation"
      className="flex h-screen w-[200px] flex-shrink-0 flex-col bg-[#071a33]"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <Image
          src="/younity-logo.png"
          alt="Younity Consultancy"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          priority
        />
        <div className="leading-tight">
          <p className="text-sm font-black tracking-wide text-white">YOUNITY</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
            INTERNAL
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="mb-5">
          <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
            Workspace
          </p>
          <div className="space-y-0.5">
            {workspaceNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
            Team
          </p>
          <div className="space-y-0.5">
            {teamNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#244285]">
            <span className="text-xs font-black text-white">JO</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white/80">Jonette</p>
          </div>
        </div>
        <Link
          href="/internal/logout"
          prefetch={false}
          className="mt-1 block rounded-lg px-3 py-2 text-sm text-white/40 transition hover:bg-white/5 hover:text-white/70"
        >
          Log out
        </Link>
      </div>
    </aside>
  );
}
