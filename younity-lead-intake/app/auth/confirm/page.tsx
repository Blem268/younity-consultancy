"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Universal auth confirmation page.
 *
 * Handles both token formats Supabase may send:
 *   1. PKCE code  — ?code=XXXX   (newer Supabase projects / sign-in flows)
 *   2. Hash tokens — #access_token=...&refresh_token=...  (invite / magic link)
 *
 * After establishing a session it calls /api/auth/link-client to ensure
 * clients.user_id is linked, then routes:
 *   - invite / recovery → /client/set-password
 *   - everything else  → /client/dashboard
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Verifying your link…");

  useEffect(() => {
    const supabase = createClient();

    async function confirm() {
      const code = searchParams.get("code");
      const typeParam = searchParams.get("type") ?? "";

      let userId: string | null = null;
      let authType = typeParam;

      if (code) {
        // PKCE flow — exchange one-time code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.session) {
          setStatus("This link has expired or is invalid. Please contact Younity to be re-invited.");
          return;
        }
        userId = data.session.user.id;
      } else {
        // Implicit / hash flow — read tokens from URL fragment
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const hashType = params.get("type") ?? "";

        if (!accessToken || !refreshToken) {
          setStatus("This link has expired or is invalid. Please contact Younity to be re-invited.");
          return;
        }

        if (!authType) authType = hashType;

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error || !data.session) {
          setStatus("This link has expired or is invalid. Please contact Younity to be re-invited.");
          return;
        }

        userId = data.session.user.id;
        // Clean tokens out of the URL bar
        window.history.replaceState(null, "", window.location.pathname);
      }

      // Link clients.user_id server-side (non-fatal if it fails)
      try {
        await fetch("/api/auth/link-client", { method: "POST" });
      } catch {
        // Non-fatal
      }

      // Route based on auth type
      const isNewUser = authType === "invite" || authType === "recovery";
      router.replace(isNewUser ? "/client/set-password" : "/client/dashboard");
    }

    confirm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f9fc] px-4">
      <div className="w-full max-w-sm text-center">
        <p className="text-2xl font-medium tracking-tight text-[#06111f]">
          Younity<span className="text-[#50A9C0]">.</span>
        </p>
        <p className="mt-6 text-sm text-slate-600">{status}</p>
        {status.includes("expired") || status.includes("invalid") ? (
          <a
            href="/client/login"
            className="mt-4 inline-block text-sm font-medium text-[#244285] hover:text-[#06111f]"
          >
            Back to login
          </a>
        ) : (
          <div className="mx-auto mt-4 h-1 w-16 overflow-hidden rounded-full bg-slate-200">
            <div className="animate-[progress_1.5s_ease-in-out_infinite] h-full w-8 rounded-full bg-[#50A9C0]" />
          </div>
        )}
      </div>
    </div>
  );
}
