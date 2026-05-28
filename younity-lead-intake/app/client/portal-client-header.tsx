import Link from "next/link";
import { getInitials, splitName } from "@/lib/client/portal-profile";

export function PortalClientHeader({ fullName }: { fullName?: string }) {
  const displayName = fullName ? splitName(fullName).displayName : null;
  const initials = fullName ? getInitials(fullName) : null;

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b-[0.5px] border-[#06111f]/10 bg-white px-6">
      <Link
        href="/client/dashboard"
        prefetch={false}
        className="text-[15px] font-medium tracking-tight text-[#06111f]"
      >
        Younity<span className="text-[#50A9C0]">.</span>
      </Link>

      {displayName ? (
        <div className="flex items-center gap-3">
          <span className="max-w-[40vw] truncate text-sm text-[#06111f] sm:max-w-none">
            {displayName}
          </span>
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#244285] transition hover:bg-[#f6f9fc]"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
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
          </button>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#244285] text-xs font-medium text-white"
          >
            {initials}
          </span>
        </div>
      ) : null}
    </header>
  );
}
