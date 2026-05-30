"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INPUT =
  "mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#06111f] outline-none transition focus:border-[#50A9C0] focus:ring-2 focus:ring-[#50A9C0]/25";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // On mount, read the access_token + refresh_token from the URL hash
  // and exchange them for a live session before the form is usable.
  useEffect(() => {
    const supabase = createClient();

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setMessage("Your invite link has expired. Please contact Younity to be re-invited.");
            setIsError(true);
          } else {
            setSessionReady(true);
            // Clean the tokens out of the URL bar without triggering a reload
            window.history.replaceState(null, "", window.location.pathname);
          }
        });
    } else {
      // No tokens in hash — check if there's already a session (e.g. page refresh)
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setSessionReady(true);
        } else {
          setMessage("Your invite link has expired or is invalid. Please contact Younity to be re-invited.");
          setIsError(true);
        }
      });
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setIsError(true);
      return;
    }

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      setIsError(true);
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message ?? "Password could not be set. Please try again.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    router.push("/client/welcome");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f9fc] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-medium tracking-tight text-[#06111f]">
            Younity<span className="text-[#50A9C0]">.</span>
          </p>
          <h1 className="mt-4 text-[18px] font-medium text-[#06111f]">
            Create your password
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Set a password so you can sign in to your client portal anytime.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          {!sessionReady && !isError ? (
            <div className="py-4 text-center text-sm text-slate-500">
              Verifying your invite link…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                New password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  disabled={!sessionReady}
                  className={INPUT}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Confirm password
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  disabled={!sessionReady}
                  className={INPUT}
                />
              </label>

              {message ? (
                <div
                  aria-live="polite"
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    isError
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !sessionReady}
                className="w-full rounded-xl bg-[#244285] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-400"
              >
                {isSubmitting ? "Setting password…" : "Set password & continue"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Need help?{" "}
          <a
            href="mailto:info@younity-consultancy.com"
            className="text-[#244285] hover:text-[#06111f]"
          >
            Contact Younity
          </a>
        </p>
      </div>
    </div>
  );
}
