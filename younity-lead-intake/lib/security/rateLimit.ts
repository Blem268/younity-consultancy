import { createAdminClient } from "@/lib/supabase/admin";

type RateLimitInput = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitResult = {
  success: boolean;
  remaining?: number;
  reset?: number;
};

type RateLimitRpcRow = {
  allowed: boolean;
  current_count: number;
  remaining: number;
  reset_at: string;
};

function getWindowStart(windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(Date.now() / windowMs) * windowMs;

  return new Date(windowStartMs);
}

function getResetEpochSeconds(value: string, fallbackDate: Date) {
  const parsed = Date.parse(value);
  const date = Number.isFinite(parsed) ? new Date(parsed) : fallbackDate;

  return Math.ceil(date.getTime() / 1000);
}

export function getRateLimitIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return firstForwardedIp || request.headers.get("x-real-ip") || "unknown-ip";
}

export async function rateLimit({
  key,
  limit,
  windowSeconds,
}: RateLimitInput): Promise<RateLimitResult> {
  const windowStart = getWindowStart(windowSeconds);
  const resetDate = new Date(windowStart.getTime() + windowSeconds * 1000);

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.rpc("increment_rate_limit", {
      p_key: key,
      p_window_start: windowStart.toISOString(),
      p_window_seconds: windowSeconds,
      p_limit: limit,
    });

    if (error) {
      throw error;
    }

    const rows = Array.isArray(data) ? (data as RateLimitRpcRow[]) : [];
    const result = rows[0];

    if (!result) {
      throw new Error("Rate limit function returned no result.");
    }

    return {
      success: Boolean(result.allowed),
      remaining: Math.max(Number(result.remaining) || 0, 0),
      reset: getResetEpochSeconds(result.reset_at, resetDate),
    };
  } catch (error) {
    console.error("Rate limit storage unavailable:", {
      message:
        error instanceof Error
          ? error.message
          : "Unknown rate limit storage error.",
    });

    return { success: true };
  }
}
