import { NextResponse, type NextRequest } from "next/server";

const staleRefreshTokenPatterns = [
  "refresh_token_not_found",
  "invalid refresh token",
  "refresh token not found",
];

export function isStaleRefreshTokenError(error: unknown) {
  if (!error) {
    return false;
  }

  const values: string[] = [];

  if (typeof error === "string") {
    values.push(error);
  }

  if (error instanceof Error) {
    values.push(error.message, error.name);
  }

  if (typeof error === "object") {
    const maybeError = error as {
      code?: unknown;
      error?: unknown;
      message?: unknown;
      name?: unknown;
      status?: unknown;
    };

    for (const value of [
      maybeError.code,
      maybeError.error,
      maybeError.message,
      maybeError.name,
      maybeError.status,
    ]) {
      if (typeof value === "string" || typeof value === "number") {
        values.push(String(value));
      }
    }
  }

  const searchable = values.join(" ").toLowerCase();

  return staleRefreshTokenPatterns.some((pattern) =>
    searchable.includes(pattern)
  );
}

export function isSupabaseAuthCookieName(name: string) {
  return name.startsWith("sb-") && name.includes("auth-token");
}

export function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse
) {
  for (const cookie of request.cookies.getAll()) {
    if (isSupabaseAuthCookieName(cookie.name)) {
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
      });
    }
  }

  return response;
}
