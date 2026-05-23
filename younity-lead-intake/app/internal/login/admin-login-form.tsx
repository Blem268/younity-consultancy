"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { brand } from "@/app/components/ui/brand";

export function AdminLoginForm() {
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
      setErrorMessage("Unable to sign in with those credentials.");
      setIsSubmitting(false);
      return;
    }

    router.push("/internal");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06111f] px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#50A9C033,transparent_30%),radial-gradient(circle_at_80%_10%,#24428555,transparent_35%)]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8">
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
                INTERNAL
              </p>
            </div>
          </div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#50A9C0]">
            Admin access
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Younity Admin Login
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Sign in with an authorized admin account to manage internal
            Younity operations.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="admin-email" className={brand.label}>
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className={brand.input}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className={brand.label}>
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className={brand.input}
              />
            </div>

            {errorMessage ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className={brand.primaryButton}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
