/** Request statuses that leave operational views (board, requests list) and live under Billing. */

export const BILLING_PHASE_REQUEST_STATUSES = [
  "Completed",
  "Complete",   // legacy value written by Cursor — kept for backward compat
  "Closed",
] as const;

/** Supabase `.not("status", "in", …)` filter for active operational requests. */
export const ACTIVE_REQUEST_STATUS_NOT_IN =
  '("Completed","Complete","Closed")';

export function isBillingPhaseRequestStatus(status: string) {
  return (BILLING_PHASE_REQUEST_STATUSES as readonly string[]).includes(status);
}
