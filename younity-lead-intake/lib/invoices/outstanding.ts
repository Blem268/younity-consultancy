/** Invoice statuses that are not fully settled. */
export const OUTSTANDING_INVOICE_STATUS_NOT_IN = '("Paid","Cancelled")';

export function isInvoiceOverdue(
  status: string | null,
  dueDate: string | null,
  today: string
) {
  if (!dueDate) {
    return false;
  }
  if (status === "Paid" || status === "Cancelled") {
    return false;
  }
  return dueDate < today;
}

export function getInvoiceDisplayStatus(
  status: string | null,
  dueDate: string | null,
  today: string
) {
  if (isInvoiceOverdue(status, dueDate, today)) {
    return "Overdue";
  }
  return status ?? "Draft";
}
