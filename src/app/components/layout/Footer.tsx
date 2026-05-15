import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Clients", href: "/clients" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[#06111f] px-6 py-10 text-white">
      <div className="container-custom flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logos/younity-logo1.png"
            alt="Younity Consultancy Logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-md object-contain"
          />

          <div>
            <div className="text-lg font-black tracking-wide">YOUNITY</div>
            <div className="text-xs tracking-[0.3em] text-white/60">
              CONSULTANCY
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap gap-5 text-sm text-white/70">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[#50A9C0]">
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="text-sm text-white/50">
          © 2026 Younity Consultancy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}