import Link from "next/link";
import type { ReactNode } from "react";
import { brand } from "./brand";

const variants = {
  primary: brand.primaryButton,
  accent: brand.accentButton,
  secondary: brand.secondaryButton,
  danger: brand.dangerButton,
};

export function ActionButtonLink({
  href,
  children,
  variant = "accent",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
