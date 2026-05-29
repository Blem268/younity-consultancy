/**
 * Deletes all client requests, documents, invoices, and related updates.
 * Keeps clients and admin accounts. Requires .env.local with Supabase keys.
 *
 * Usage: node --env-file=.env.local scripts/reset-workflow-data.mjs
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function deleteAll(table, label) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .not("id", "is", null);

  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }

  console.log(`Deleted ${count ?? 0} row(s) from ${table}`);
}

async function main() {
  console.log("Resetting client workflow data (requests, documents, invoices, updates)…");

  await deleteAll("client_updates", "Updates");
  await deleteAll("client_documents", "Documents");
  await deleteAll("client_invoices", "Invoices");
  await deleteAll("client_requests", "Requests");

  const { error: errorsCleanupError, count: errorsCount } = await supabase
    .from("workflow_errors")
    .delete({ count: "exact" })
    .or("related_request_id.not.is.null,related_client_id.not.is.null");

  if (errorsCleanupError) {
    console.warn(`Workflow errors cleanup skipped: ${errorsCleanupError.message}`);
  } else {
    console.log(`Deleted ${errorsCount ?? 0} related workflow error(s)`);
  }

  console.log("Done. Clients and admin accounts were not changed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
