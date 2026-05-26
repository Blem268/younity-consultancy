export const CLICKUP_CLIENT_REQUESTS_LIST_ID = "901713882310";

export const CLICKUP_CLIENT_REQUESTS_LIST_NAME = "Client Requests";

export const CLICKUP_CLIENT_REQUESTS_LIST_PATH =
  "Client Services -> Services -> Client Requests";

export const CLICKUP_REQUEST_STATUSES = [
  "Submitted",
  "Under Review",
  "Waiting on Documents",
  "In Progress",
  "Internal Review",
  "Waiting on Client",
  "Ready for Billing",
  "Completed",
  "Closed",
] as const;

export const CLICKUP_CUSTOM_FIELD = {
  portalRequestId: "Portal Request ID",
  clientName: "Client Name",
  clientEmail: "Client Email",
  clientPhone: "Client Phone",
  company: "Company",
  serviceRequested: "Service Requested",
  preferredContactMethod: "Preferred Contact Method",
  urgency: "Urgency",
  source: "Source",
  documentStatus: "Document Status",
  integrationStatus: "Integration Status",
  billingType: "Billing Type",
  estimatedFee: "Estimated Fee",
  depositRequired: "Deposit Required",
  amountPaid: "Amount Paid",
  balanceDue: "Balance Due",
  invoiceStatus: "Invoice Status",
  invoiceId: "Invoice ID",
} as const;

export const CLICKUP_CUSTOM_FIELDS = Object.values(CLICKUP_CUSTOM_FIELD);

export const CLICKUP_REQUIRED_ENV_VARS = [
  "CLICKUP_API_TOKEN",
  "CLICKUP_LIST_ID",
  "CLICKUP_TEAM_ID",
  "CLICKUP_WEBHOOK_SECRET",
] as const;
