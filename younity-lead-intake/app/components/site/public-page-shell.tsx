import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PublicPageShell({
  children,
  className = "min-h-screen bg-white pt-24 text-[#06111f]",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className={className}>{children}</main>
      <SiteFooter />
    </>
  );
}
