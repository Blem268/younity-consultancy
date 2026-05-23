import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "./admin-login-form";
import { isInternalAdminEmail } from "@/lib/internal/adminAuth";
import { createClient } from "@/lib/supabase/server";

export default async function InternalLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isInternalAdminEmail(user.email)) {
    redirect("/internal");
  }

  if (user) {
    return (
      <main className="min-h-screen bg-[#f6f9fc] px-6 py-12 text-[#06111f]">
        <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#244285]">
            Access denied
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#06111f]">
            Younity Admin Login
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            You do not have access to this internal area.
          </p>
          <Link
            href="/internal/logout"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#244285]/20 bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#244285] transition hover:-translate-y-0.5 hover:border-[#50A9C0] hover:text-[#06111f]"
          >
            Sign out
          </Link>
        </section>
      </main>
    );
  }

  return <AdminLoginForm />;
}
