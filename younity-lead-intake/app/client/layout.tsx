import { ClientPortalShell } from "./portal-shell";

export default function ClientPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientPortalShell>{children}</ClientPortalShell>;
}
