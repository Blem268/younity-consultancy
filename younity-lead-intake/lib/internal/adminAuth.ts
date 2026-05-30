import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaleRefreshTokenError } from "@/lib/supabase/authErrors";

export type AdminRole = "admin" | "super_admin";

type AdminRecord = {
  email: string;
  role: AdminRole;
  full_name: string | null;
};

type InternalAdminResult =
  | {
      user: User;
      isAdmin: true;
      role: AdminRole;
      isSuperAdmin: boolean;
      fullName: string | null;
    }
  | {
      user: User;
      isAdmin: false;
      role: null;
      isSuperAdmin: false;
      fullName: null;
    };

// Emergency fallback — used only if the database lookup fails
export function getAllowedInternalAdminEmails() {
  return (process.env.INTERNAL_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function lookupAdminRecord(email: string): Promise<AdminRecord | null> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("internal_admins")
      .select("email, role, full_name")
      .eq("email", email.toLowerCase())
      .maybeSingle<AdminRecord>();

    if (error) {
      console.error("Admin table lookup failed:", {
        message: error.message,
        code: error.code,
      });
      return null;
    }

    return data;
  } catch {
    console.error("Admin table lookup threw unexpectedly.");
    return null;
  }
}

async function getUserSafely() {
  const supabase = await createClient();

  try {
    return await supabase.auth.getUser();
  } catch (error) {
    if (isStaleRefreshTokenError(error)) {
      return {
        data: { user: null },
        error,
      } as Awaited<ReturnType<typeof supabase.auth.getUser>>;
    }

    throw error;
  }
}

export async function requireInternalAdmin(): Promise<InternalAdminResult> {
  const {
    data: { user },
    error,
  } = await getUserSafely();

  if (isStaleRefreshTokenError(error)) {
    redirect("/internal/login");
  }

  if (!user) {
    redirect("/internal/login");
  }

  const email = user.email ?? "";

  // Primary check — database
  const adminRecord = await lookupAdminRecord(email);

  if (adminRecord) {
    return {
      user,
      isAdmin: true,
      role: adminRecord.role,
      isSuperAdmin: adminRecord.role === "super_admin",
      fullName: adminRecord.full_name,
    };
  }

  // Emergency fallback — env var (database unavailable or email not in table)
  const fallbackEmails = getAllowedInternalAdminEmails();
  if (fallbackEmails.length > 0 && fallbackEmails.includes(email.toLowerCase())) {
    return {
      user,
      isAdmin: true,
      role: "admin",
      isSuperAdmin: false,
      fullName: null,
    };
  }

  return {
    user,
    isAdmin: false,
    role: null,
    isSuperAdmin: false,
    fullName: null,
  };
}

export async function requireSuperAdmin(): Promise<InternalAdminResult> {
  const result = await requireInternalAdmin();

  if (!result.isAdmin || !result.isSuperAdmin) {
    redirect("/internal");
  }

  return result;
}

// ─── API route helpers ─────────────────────────────────────────────────────────

type InternalAdminApiResult =
  | { user: User; role: AdminRole; isSuperAdmin: boolean; errorResponse: null }
  | { user: null; role: null; isSuperAdmin: false; errorResponse: NextResponse };

export async function getInternalAdminUser(): Promise<InternalAdminApiResult> {
  const {
    data: { user },
    error,
  } = await getUserSafely();

  if (isStaleRefreshTokenError(error) || !user) {
    return {
      user: null,
      role: null,
      isSuperAdmin: false,
      errorResponse: NextResponse.json({ message: "Unauthorized." }, { status: 401 }),
    };
  }

  const email = user.email ?? "";
  const adminRecord = await lookupAdminRecord(email);

  if (adminRecord) {
    return {
      user,
      role: adminRecord.role,
      isSuperAdmin: adminRecord.role === "super_admin",
      errorResponse: null,
    };
  }

  // Fallback
  const fallbackEmails = getAllowedInternalAdminEmails();
  if (fallbackEmails.length > 0 && fallbackEmails.includes(email.toLowerCase())) {
    return {
      user,
      role: "admin",
      isSuperAdmin: false,
      errorResponse: null,
    };
  }

  return {
    user: null,
    role: null,
    isSuperAdmin: false,
    errorResponse: NextResponse.json({ message: "Forbidden." }, { status: 403 }),
  };
}
