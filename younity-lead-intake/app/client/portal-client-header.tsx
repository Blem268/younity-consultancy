import Link from "next/link";
import Image from "next/image";
import { getInitials, splitName } from "@/lib/client/portal-profile";
import { brand } from "@/app/components/ui/brand";
import { PortalNav } from "./portal-nav";

export function PortalClientHeader({ fullName }: { fullName?: string }) {
  const displayName = fullName ? splitName(fullName).displayName : null;
  const initials = fullName ? getInitials(fullName) : null;

  return (
    <header className={`sticky top-0 z-20 ${brand.shellHeader}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/client/dashboard"
            prefetch={false}
            className="flex items-center gap-3"
          >
            <Image
              src="/younity-logo.png"
              alt="Younity Consultancy"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
            <span className="leading-tight">
              <span className="block text-[15px] font-medium tracking-wide text-white">
                Younity
              </span>
              <span className="block text-[10px] font-medium tracking-[0.2em] text-white/60">
                Client Portal
              </span>
            </span>
          </Link>

          {displayName ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-[40vw] truncate text-sm text-white/80 sm:block">
                {displayName}
              </span>
              <Link
                href="/client/updates"
                prefetch={false}
                aria-label="Updates"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-[#50A9C0]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-[17px] w-[17px]"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 4a4 4 0 0 0-4 4v2.2c0 .8-.3 1.6-.8 2.2L5.8 14.5A1 1 0 0 0 6.7 16h10.6a1 1 0 0 0 .9-1.5l-1.4-2.1a3.7 3.7 0 0 1-.8-2.2V8a4 4 0 0 0-4-4z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 17a2 2 0 0 0 4 0"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#50A9C0]/20 text-xs font-semibold text-white ring-1 ring-white/20"
              >
                {initials}
              </span>
            </div>
          ) : null}
        </div>

        <PortalNav />
      </div>
    </header>
  );
}
