import type { LeadInput } from "@/lib/validators/leadSchema";

type DocumentUploadCommentInput = {
  clickUpTaskId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  company?: string | null;
  documentType: string;
  fileName: string;
  notes?: string | null;
  requestService?: string | null;
  requestStatus?: string | null;
  documentId?: string;
};

type PortalRequestTaskInput = {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  company?: string | null;
  service: string;
  message: string;
  preferredContactMethod: string;
  urgency: string;
  billingNotes?: string | null;
  portalRequestId: string;
};

type ClickUpTaskResponse = {
  id?: string;
  name?: string;
  status?: {
    status?: string;
  } | string;
  custom_fields?: ClickUpCustomField[];
};

type ClickUpCustomFieldOption = {
  id?: string;
  value?: unknown;
  name?: string;
  label?: string;
};

type ClickUpCustomField = {
  name?: string;
  value?: unknown;
  type_config?: {
    options?: ClickUpCustomFieldOption[];
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getCustomFieldValueByName(
  customFields: ClickUpCustomField[] | undefined,
  fieldName: string
) {
  return customFields?.find((field) => field.name === fieldName);
}

function normalizeTextFromField(field: ClickUpCustomField | undefined) {
  if (!field || field.value === null || field.value === undefined) {
    return null;
  }

  const { value } = field;

  if (isRecord(value)) {
    const namedValue = value.name ?? value.label ?? value.value;

    if (typeof namedValue === "string" || typeof namedValue === "number") {
      return String(namedValue);
    }
  }

  if (typeof value === "string" || typeof value === "number") {
    const option = field.type_config?.options?.find(
      (fieldOption) =>
        fieldOption.id === String(value) || fieldOption.value === value
    );

    if (option?.name) {
      return option.name;
    }

    if (option?.label) {
      return option.label;
    }

    if (
      typeof option?.value === "string" ||
      typeof option?.value === "number"
    ) {
      return String(option.value);
    }

    return String(value);
  }

  return null;
}

function normalizeNumberFromField(field: ClickUpCustomField | undefined) {
  if (!field || field.value === null || field.value === undefined) {
    return null;
  }

  const value = isRecord(field.value) ? field.value.value : field.value;
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(/[^0-9.-]/g, ""))
        : NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

export async function createClickUpLeadTask(params: {
  lead: LeadInput;
  zohoLeadId?: string;
}) {
  const { lead, zohoLeadId } = params;

  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  if (!process.env.CLICKUP_LIST_ID) {
    throw new Error("Missing CLICKUP_LIST_ID");
  }

  const description = [
    "New website lead received.",
    "",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Company: ${lead.company || "Not provided"}`,
    `Service: ${lead.service}`,
    `Source: ${lead.source}`,
    zohoLeadId ? `Zoho Lead ID: ${zohoLeadId}` : "Zoho Lead ID: Not created yet",
    "",
    "Message:",
    lead.message,
  ].join("\n");

  const response = await fetch(
    `https://api.clickup.com/api/v2/list/${process.env.CLICKUP_LIST_ID}/task`,
    {
      method: "POST",
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `New Lead: ${lead.name} — ${lead.service}`,
        description,
        tags: ["website-lead", "phase-1-intake"],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`ClickUp task creation failed: ${JSON.stringify(data)}`);
  }

  return {
    id: data.id as string,
    url: data.url as string | undefined,
  };
}

export async function createClickUpPortalRequestTask({
  clientName,
  clientEmail,
  clientPhone,
  company,
  service,
  message,
  preferredContactMethod,
  urgency,
  billingNotes,
  portalRequestId,
}: PortalRequestTaskInput) {
  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  if (!process.env.CLICKUP_LIST_ID) {
    throw new Error("Missing CLICKUP_LIST_ID");
  }

  const description = [
    "New client portal request.",
    "",
    "Client:",
    `- Name: ${clientName}`,
    `- Email: ${clientEmail}`,
    `- Phone: ${clientPhone || "Not provided"}`,
    `- Company: ${company || "Not provided"}`,
    "",
    "Request:",
    `- Service: ${service}`,
    `- Urgency: ${urgency}`,
    `- Preferred Contact Method: ${preferredContactMethod}`,
    `- Message: ${message}`,
    "",
    "Billing Preparation:",
    "- Billing Type: To Be Reviewed",
    "- Estimated Fee: To Be Reviewed",
    "- Deposit Required: To Be Reviewed",
    "- Amount Paid: 0",
    "- Balance Due: To Be Reviewed",
    "- Invoice Status: Not Ready",
    `- Billing Notes: ${billingNotes || "None"}`,
    "",
    "Portal:",
    `- Portal Request ID: ${portalRequestId}`,
    "- Source: Client Portal",
  ].join("\n");

  const response = await fetch(
    `https://api.clickup.com/api/v2/list/${process.env.CLICKUP_LIST_ID}/task`,
    {
      method: "POST",
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Client Request: ${clientName} — ${service}`,
        description,
        tags: ["client-portal", "service-request"],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `ClickUp portal request task creation failed: ${JSON.stringify(data)}`
    );
  }

  return {
    id: data.id as string,
    url: data.url as string | undefined,
  };
}

export async function addClickUpDocumentUploadComment({
  clickUpTaskId,
  clientName,
  clientEmail,
  clientPhone,
  company,
  documentType,
  fileName,
  notes,
  requestService,
  requestStatus,
  documentId,
}: DocumentUploadCommentInput) {
  if (!clickUpTaskId) {
    throw new Error("Missing ClickUp task ID.");
  }

  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  const commentText = [
    "Client document uploaded.",
    "",
    `Client: ${clientName}`,
    `Email: ${clientEmail}`,
    `Phone: ${clientPhone || "Not provided"}`,
    `Company: ${company || "Not provided"}`,
    "",
    `Document Type: ${documentType}`,
    `File Name: ${fileName}`,
    "",
    `Related Request: ${requestService || "Not available"}`,
    `Request Status: ${requestStatus || "Not available"}`,
    "",
    `Notes: ${notes || "None"}`,
    "",
    `Document ID: ${documentId || "Not available"}`,
    "Stored securely in the Younity Client Portal storage.",
  ].join("\n");

  const response = await fetch(
    `https://api.clickup.com/api/v2/task/${clickUpTaskId}/comment`,
    {
      method: "POST",
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment_text: commentText,
        notify_all: false,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`ClickUp comment creation failed: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function getClickUpTaskStatus(clickUpTaskId: string) {
  if (!clickUpTaskId) {
    throw new Error("Missing ClickUp task ID.");
  }

  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  const response = await fetch(
    `https://api.clickup.com/api/v2/task/${clickUpTaskId}`,
    {
      method: "GET",
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  const data = (await response.json()) as ClickUpTaskResponse;

  if (!response.ok) {
    throw new Error(`ClickUp task fetch failed: ${JSON.stringify(data)}`);
  }

  const status =
    typeof data.status === "string" ? data.status : data.status?.status;

  if (!status) {
    throw new Error(`ClickUp task status missing for task ${clickUpTaskId}.`);
  }

  return {
    id: data.id || clickUpTaskId,
    status,
    name: data.name,
  };
}

export async function getClickUpTaskBillingFields(clickUpTaskId: string) {
  if (!clickUpTaskId) {
    throw new Error("Missing ClickUp task ID.");
  }

  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  const response = await fetch(
    `https://api.clickup.com/api/v2/task/${clickUpTaskId}`,
    {
      method: "GET",
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  const data = (await response.json()) as ClickUpTaskResponse;

  if (!response.ok) {
    throw new Error(`ClickUp task fetch failed: ${JSON.stringify(data)}`);
  }

  const customFields = data.custom_fields;

  return {
    id: data.id || clickUpTaskId,
    billingType: normalizeTextFromField(
      getCustomFieldValueByName(customFields, "Billing Type")
    ),
    estimatedFee: normalizeNumberFromField(
      getCustomFieldValueByName(customFields, "Estimated Fee")
    ),
    depositRequired: normalizeNumberFromField(
      getCustomFieldValueByName(customFields, "Deposit Required")
    ),
    amountPaid: normalizeNumberFromField(
      getCustomFieldValueByName(customFields, "Amount Paid")
    ),
    balanceDue: normalizeNumberFromField(
      getCustomFieldValueByName(customFields, "Balance Due")
    ),
    invoiceStatus: normalizeTextFromField(
      getCustomFieldValueByName(customFields, "Invoice Status")
    ),
    zohoBooksInvoiceId: normalizeTextFromField(
      getCustomFieldValueByName(customFields, "Zoho Books Invoice ID")
    ),
  };
}
