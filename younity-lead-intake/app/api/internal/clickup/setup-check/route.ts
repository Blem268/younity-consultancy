import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import {
  CLICKUP_CLIENT_REQUESTS_LIST_ID,
  CLICKUP_CLIENT_REQUESTS_LIST_NAME,
  CLICKUP_CLIENT_REQUESTS_LIST_PATH,
  CLICKUP_CUSTOM_FIELDS,
  CLICKUP_REQUEST_STATUSES,
  CLICKUP_REQUIRED_ENV_VARS,
} from "@/lib/clickup/setup";

export const runtime = "nodejs";

export async function GET() {
  const { errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  const configuredListId = process.env.CLICKUP_LIST_ID || "";
  const env = Object.fromEntries(
    CLICKUP_REQUIRED_ENV_VARS.map((name) => [name, Boolean(process.env[name])])
  );

  return NextResponse.json({
    success: true,
    list: {
      expectedName: CLICKUP_CLIENT_REQUESTS_LIST_NAME,
      expectedPath: CLICKUP_CLIENT_REQUESTS_LIST_PATH,
      expectedId: CLICKUP_CLIENT_REQUESTS_LIST_ID,
      configuredId: configuredListId || null,
      matchesExpectedId: configuredListId === CLICKUP_CLIENT_REQUESTS_LIST_ID,
    },
    env,
    statuses: CLICKUP_REQUEST_STATUSES,
    customFields: CLICKUP_CUSTOM_FIELDS,
  });
}
