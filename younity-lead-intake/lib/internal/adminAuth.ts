import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isStaleRefreshTokenError } from "@/lib/supabase/authErrors";

type InternalAdminResult =
  | {
      user: User;
      isAdmin: true;
    }
  | {
      user: User;
      isAdmin: false;
    };

export function getAllowedInternalAdminEmails() {
  return (process.env.INTERNAL_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isInternalAdminEmail(email: string | null | undefined) {
  const allowedEmails = getAllowedInternalAdminEmails();
  const userEmail = email?.toLowerCase() || "";

  return allowedEmails.length > 0 && allowedEmails.includes(userEmail);
}

export async function requireInternalAdmin(): Promise<InternalAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (isStaleRefreshTokenError(error)) {
    redirect("/internal/login");
  }

  if (!user) {
    redirect("/internal/login");
  }

  if (!isInternalAdminEmail(user.email)) {
    return {
      user,
      isAdmin: false,
    };
  }

  return {
    user,
    isAdmin: true,
  };
}

type InternalAdminApiResult =
  | {
      user: User;
      errorResponse: null;
    }
  | {
      user: null;
      errorResponse: NextResponse;
    };

export async function getInternalAdminUser(): Promise<InternalAdminApiResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (isStaleRefreshTokenError(error)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      ),
    };
  }

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      ),
    };
  }

  if (!isInternalAdminEmail(user.email)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { message: "Forbidden." },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    errorResponse: null,
  };
}
