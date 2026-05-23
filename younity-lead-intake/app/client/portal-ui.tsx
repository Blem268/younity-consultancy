import type { ReactNode } from "react";
import Link from "next/link";
import { ActionButtonLink } from "@/app/components/ui/action-button";
import { brand } from "@/app/components/ui/brand";
import {
  DocumentStatusBadge,
  InvoiceStatusBadge,
  RequestStatusBadge,
} from "@/app/components/ui/status-badges";

export function PortalPage({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return <div className={narrow ? "mx-auto max-w-4xl" : undefined}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-[#50A9C0]/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
        <h1 className="text-3xl font-black tracking-tight text-[#06111f] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`${brand.card} ${brand.cardPadding} ${className}`}
    >
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={brand.empty}>
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function BackLinks({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          prefetch={false}
          className="text-sm font-black text-[#244285] transition hover:text-[#06111f]"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function PrimaryButtonLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <ActionButtonLink href={href} variant="accent">
      {children}
    </ActionButtonLink>
  );
}

export function SecondaryButtonLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <ActionButtonLink href={href} variant="secondary">
      {children}
    </ActionButtonLink>
  );
}

export function getInvoiceStatus(value: string | null | undefined) {
  return value || "Not Ready";
}

export { DocumentStatusBadge, InvoiceStatusBadge, RequestStatusBadge };
