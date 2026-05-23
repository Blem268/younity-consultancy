"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { brand } from "@/app/components/ui/brand";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/client/dashboard");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06111f] px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#50A9C033,transparent_30%),radial-gradient(circle_at_80%_10%,#24428555,transparent_35%)]" />
      <div className="w-full max-w-md">
        <div className="relative z-10 mb-8">
          <div className="mb-6 flex items-center gap-4">
            <Image
              src="/younity-logo.png"
              alt="Younity Consultancy Logo"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
              priority
            />
            <div>
              <p className="text-xl font-black tracking-wide text-white">
                YOUNITY
              </p>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">
                CONSULTANCY
              </p>
            </div>
          </div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
            Client Portal
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Secure client access
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Sign in to review requests, documents, updates, and billing
            information shared by the Younity team.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative z-10 rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className={brand.label}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className={`${brand.input} text-base`}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className={brand.label}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className={`${brand.input} text-base`}
              />
            </div>

            <div
              aria-live="polite"
              className="min-h-6 text-sm font-medium text-red-700"
            >
              {errorMessage}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${brand.primaryButton} w-full`}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <footer className="relative z-10 mt-6 flex justify-center">
          <Link
            href="/internal/login"
            prefetch={false}
            className="rounded-xl border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/70 transition hover:border-[#50A9C0]/60 hover:bg-white/10 hover:text-[#50A9C0] focus:outline-none focus:ring-2 focus:ring-[#50A9C0]/50"
          >
            Admin Portal
          </Link>
        </footer>
      </div>
    </main>
  );
}
