import Link from "next/link";
import { supportChannels } from "@/lib/content/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#50A9C0]/15 bg-[#06111f] text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
            Younity Consultancy
          </p>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
            Practical business support for bookkeeping, payroll, administration,
            HR, tax, compliance, and advisory needs.
          </p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
            Explore
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/#services"
                className="text-white/75 transition hover:text-[#50A9C0]"
              >
                Services
              </Link>
            </li>
            <li>
              <Link
                href="/process"
                className="text-white/75 transition hover:text-[#50A9C0]"
              >
                Our Process
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-white/75 transition hover:text-[#50A9C0]"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-white/75 transition hover:text-[#50A9C0]"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
            Client Access
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/client/login"
                className="text-white/75 transition hover:text-[#50A9C0]"
              >
                Client Portal Login
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${supportChannels.email}`}
                className="break-all text-white/75 transition hover:text-[#50A9C0]"
              >
                {supportChannels.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} Younity Consultancy. All rights reserved.</p>
          <p>{supportChannels.hours}</p>
        </div>
      </div>
    </footer>
  );
}
