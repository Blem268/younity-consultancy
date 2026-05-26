import type { LeadInput } from "@/lib/validators/leadSchema";
import {
  CLICKUP_CLIENT_REQUESTS_LIST_NAME,
  CLICKUP_CLIENT_REQUESTS_LIST_PATH,
  CLICKUP_CUSTOM_FIELD,
} from "@/lib/clickup/setup";

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
  clickUpAttachmentSucceeded?: boolean;
};

type TaskItemClientUpdateCommentInput = {
  parentTaskId: string;
  taskItemId: string;
  type: "subtask" | "checklist";
  requestService: string;
  taskItemName?: string | null;
  clientName: string;
  clientEmail: string;
  notes?: string | null;
  fileName?: string | null;
  documentId?: string | null;
  markedComplete: boolean;
  clickUpAttachmentSucceeded?: boolean | null;
};

type CompleteTaskItemInput = {
  parentTaskId: string;
  taskItemId: string;
  type: "subtask" | "checklist";
  checklistId?: string | null;
  statusName?: string | null;
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
  portalRequestId: string;
};

type ClickUpTaskResponse = {
  id?: string;
  name?: string;
  status?: ClickUpStatusInput;
  custom_fields?: ClickUpCustomField[];
  subtasks?: Array<ClickUpTaskItem | string>;
  checklists?: ClickUpChecklist[];
};

type ClickUpWebhookResponse = {
  id?: string;
  webhook?: {
    id?: string;
    secret?: string;
  };
  secret?: string;
};

type ClickUpTaskItem = {
  id?: string;
  name?: string;
  status?: ClickUpStatusInput;
};

type ClickUpStatusInput =
  | string
  | {
      status?: unknown;
      name?: unknown;
      type?: unknown;
    }
  | null
  | undefined;

type ClickUpChecklist = {
  id?: string;
  name?: string;
  items?: Array<{
    id?: string;
    name?: string;
    resolved?: boolean;
    checked?: boolean;
    status?: string;
  }>;
};

type ClickUpTaskProgressItem = {
  id: string;
  name: string;
  status: string;
  type: "subtask" | "checklist";
  completed: boolean;
  parentTaskId: string;
  checklistId?: string | null;
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

export type ClickUpTaskProgress = {
  parentTaskId: string;
  parentTaskName?: string;
  parentStatus?: string;
  parentStatusType?: string | null;
  progressPercent: number;
  items: ClickUpTaskProgressItem[];
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

export function normalizeClickUpStatus(statusInput: ClickUpStatusInput) {
  if (!statusInput) {
    return "";
  }

  if (typeof statusInput === "string") {
    return statusInput;
  }

  const status =
    statusInput.status ?? statusInput.name ?? statusInput.type ?? undefined;

  return typeof status === "string" || typeof status === "number"
    ? String(status)
    : "";
}

function normalizeClickUpStatusType(statusInput: ClickUpStatusInput) {
  if (!statusInput || typeof statusInput === "string") {
    return null;
  }

  return typeof statusInput.type === "string" ? statusInput.type : null;
}

export function isCompletedStatus(status: string) {
  const normalized = status.toLowerCase();

  return (
    normalized.includes("complete") ||
    normalized.includes("closed") ||
    normalized.includes("done")
  );
}

function isInProgressStatus(status: string) {
  const normalized = status.toLowerCase();

  return (
    normalized.includes("in progress") ||
    normalized.includes("review") ||
    normalized.includes("internal review") ||
    normalized.includes("working")
  );
}

function isWaitingStatus(status: string) {
  const normalized = status.toLowerCase();

  return (
    normalized.includes("waiting") ||
    normalized.includes("waiting on client") ||
    normalized.includes("blocked")
  );
}

function isNewStatus(status: string) {
  const normalized = status.toLowerCase();

  return (
    normalized.includes("new") ||
    normalized.includes("submitted") ||
    normalized.includes("to do") ||
    normalized.includes("todo") ||
    normalized.includes("open")
  );
}

function clampProgressPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function getProgressFromParentStatus(status: string) {
  const normalized = status.toLowerCase();

  if (isCompletedStatus(normalized)) {
    return 100;
  }

  if (normalized.includes("ready for billing")) {
    return 80;
  }

  if (isInProgressStatus(normalized)) {
    return 50;
  }

  if (isWaitingStatus(normalized)) {
    return 35;
  }

  if (isNewStatus(normalized)) {
    return 10;
  }

  return status ? 25 : 0;
}

async function fetchClickUpTask(clickUpTaskId: string, includeSubtasks = false) {
  const searchParams = new URLSearchParams();

  if (includeSubtasks) {
    searchParams.set("include_subtasks", "true");
  }

  const queryString = searchParams.toString();
  const response = await fetch(
    `https://api.clickup.com/api/v2/task/${clickUpTaskId}${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN!,
        "Content-Type": "application/json",
      },
    }
  );

  const data = (await response.json().catch(() => ({}))) as ClickUpTaskResponse;

  if (!response.ok) {
    throw new Error(`ClickUp task fetch failed with status ${response.status}.`);
  }

  return data;
}

async function createClickUpTaskComment(taskId: string, commentText: string) {
  const response = await fetch(
    `https://api.clickup.com/api/v2/task/${taskId}/comment`,
    {
      method: "POST",
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment_text: commentText,
        notify_all: false,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `ClickUp comment creation failed with status ${response.status}.`
    );
  }

  return data;
}

export async function registerClickUpWebhook({
  endpoint,
  events = ["taskUpdated", "taskStatusUpdated"],
}: {
  endpoint: string;
  events?: string[];
}) {
  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  if (!process.env.CLICKUP_TEAM_ID) {
    throw new Error("Missing CLICKUP_TEAM_ID");
  }

  const response = await fetch(
    `https://api.clickup.com/api/v2/team/${process.env.CLICKUP_TEAM_ID}/webhook`,
    {
      method: "POST",
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint,
        events,
      }),
    }
  );

  const data = (await response.json().catch(() => ({}))) as ClickUpWebhookResponse;

  if (!response.ok) {
    throw new Error(`ClickUp webhook registration failed with status ${response.status}.`);
  }

  const webhookId = data.webhook?.id || data.id || null;
  const secretReturned = Boolean(data.webhook?.secret || data.secret);

  return {
    webhookId,
    secretReturned,
  };
}

export async function attachFileToClickUpTask({
  taskId,
  file,
}: {
  taskId: string;
  file: File;
}) {
  if (!taskId) {
    throw new Error("Missing ClickUp task ID.");
  }

  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  const formData = new FormData();
  formData.append("attachment", file, file.name);

  const response = await fetch(
    `https://api.clickup.com/api/v2/task/${taskId}/attachment`,
    {
      method: "POST",
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN,
      },
      body: formData,
    }
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `ClickUp file attachment failed with status ${response.status}.`
    );
  }

  return data;
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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`ClickUp task creation failed with status ${response.status}.`);
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
  portalRequestId,
}: PortalRequestTaskInput) {
  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  if (!process.env.CLICKUP_LIST_ID) {
    throw new Error("Missing CLICKUP_LIST_ID");
  }

  const description = [
    `New client portal request for the ${CLICKUP_CLIENT_REQUESTS_LIST_NAME} list.`,
    `Operations list: ${CLICKUP_CLIENT_REQUESTS_LIST_PATH}`,
    "",
    "Client / Portal Fields:",
    `- ${CLICKUP_CUSTOM_FIELD.portalRequestId}: ${portalRequestId}`,
    `- ${CLICKUP_CUSTOM_FIELD.clientName}: ${clientName}`,
    `- ${CLICKUP_CUSTOM_FIELD.clientEmail}: ${clientEmail}`,
    `- ${CLICKUP_CUSTOM_FIELD.clientPhone}: ${clientPhone || "Not provided"}`,
    `- ${CLICKUP_CUSTOM_FIELD.company}: ${company || "Not provided"}`,
    `- ${CLICKUP_CUSTOM_FIELD.serviceRequested}: ${service}`,
    `- ${CLICKUP_CUSTOM_FIELD.preferredContactMethod}: ${preferredContactMethod}`,
    `- ${CLICKUP_CUSTOM_FIELD.urgency}: ${urgency}`,
    `- ${CLICKUP_CUSTOM_FIELD.source}: Client Portal`,
    "",
    "Client Details:",
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
    "Document / Workflow Fields:",
    `- ${CLICKUP_CUSTOM_FIELD.documentStatus}: Not Started`,
    `- ${CLICKUP_CUSTOM_FIELD.integrationStatus}: Created from portal`,
    "",
    "Billing preparation:",
    "- Billing Type: To Be Reviewed",
    "- Estimated Fee: To Be Reviewed",
    "- Deposit Required: To Be Reviewed",
    "- Amount Paid: 0",
    "- Balance Due: To Be Reviewed",
    "- Invoice Status: Not Ready",
    "- Invoice ID: Not assigned",
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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `ClickUp portal request task creation failed with status ${response.status}.`
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
  clickUpAttachmentSucceeded,
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
    fileName
      ? clickUpAttachmentSucceeded
        ? "File was also attached to this ClickUp task."
        : "File is stored securely in the Younity Client Portal storage, but ClickUp attachment failed."
      : "",
    "",
    `Document ID: ${documentId || "Not available"}`,
    "Stored securely in the Younity Client Portal storage.",
  ].filter(Boolean).join("\n");

  return createClickUpTaskComment(clickUpTaskId, commentText);
}

export async function getClickUpTaskStatus(clickUpTaskId: string) {
  if (!clickUpTaskId) {
    throw new Error("Missing ClickUp task ID.");
  }

  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  const data = await fetchClickUpTask(clickUpTaskId);
  const status = normalizeClickUpStatus(data.status);

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

  const data = await fetchClickUpTask(clickUpTaskId);
  const customFields = data.custom_fields;

  return {
    id: data.id || clickUpTaskId,
    billingType: normalizeTextFromField(
      getCustomFieldValueByName(customFields, CLICKUP_CUSTOM_FIELD.billingType)
    ),
    estimatedFee: normalizeNumberFromField(
      getCustomFieldValueByName(customFields, CLICKUP_CUSTOM_FIELD.estimatedFee)
    ),
    depositRequired: normalizeNumberFromField(
      getCustomFieldValueByName(customFields, CLICKUP_CUSTOM_FIELD.depositRequired)
    ),
    amountPaid: normalizeNumberFromField(
      getCustomFieldValueByName(customFields, CLICKUP_CUSTOM_FIELD.amountPaid)
    ),
    balanceDue: normalizeNumberFromField(
      getCustomFieldValueByName(customFields, CLICKUP_CUSTOM_FIELD.balanceDue)
    ),
    invoiceStatus: normalizeTextFromField(
      getCustomFieldValueByName(customFields, CLICKUP_CUSTOM_FIELD.invoiceStatus)
    ),
    invoiceId: normalizeTextFromField(
      getCustomFieldValueByName(customFields, CLICKUP_CUSTOM_FIELD.invoiceId)
    ),
  };
}

async function normalizeSubtaskItems(
  subtasks: Array<ClickUpTaskItem | string>,
  parentTaskId: string
) {
  const normalizedItems = await Promise.all(
    subtasks.map(async (subtask) => {
      if (typeof subtask === "string") {
        try {
          const subtaskData = await fetchClickUpTask(subtask);
          const status = normalizeClickUpStatus(subtaskData.status);

          return {
            id: subtaskData.id || subtask,
            name: subtaskData.name || "Untitled subtask",
            status: status || "Not started",
            type: "subtask" as const,
            completed: isCompletedStatus(status),
            parentTaskId,
            checklistId: null,
          };
        } catch (error) {
          console.error(`ClickUp subtask ${subtask} fetch failed:`, error);
          return null;
        }
      }

      const status = normalizeClickUpStatus(subtask.status);

      return {
        id: subtask.id || subtask.name || "unknown-subtask",
        name: subtask.name || "Untitled subtask",
        status: status || "Not started",
        type: "subtask" as const,
        completed: isCompletedStatus(status),
        parentTaskId,
        checklistId: null,
      };
    })
  );

  return normalizedItems.filter(
    (item): item is NonNullable<(typeof normalizedItems)[number]> => {
      if (!item) {
        return false;
      }

      return item.id !== "unknown-subtask" || item.name !== "Untitled subtask";
    }
  );
}

function normalizeChecklistItems(
  checklists: ClickUpChecklist[],
  parentTaskId: string
) {
  return checklists
    .flatMap((checklist) =>
      (Array.isArray(checklist.items) ? checklist.items : []).map((item) => {
        const completed = Boolean(item.resolved || item.checked);
        const status = item.status || (completed ? "Completed" : "Open");

        return {
          id:
            item.id ||
            `${checklist.id || checklist.name || "checklist"}-${item.name || "item"}`,
          name: item.name || "Untitled checklist item",
          status,
          type: "checklist" as const,
          completed: completed || isCompletedStatus(status),
          parentTaskId,
          checklistId: checklist.id || null,
        };
      })
    )
    .filter((item) => item.id && item.name);
}

export async function getClickUpTaskProgress(
  clickUpTaskId: string
): Promise<ClickUpTaskProgress> {
  if (!clickUpTaskId) {
    throw new Error("Missing ClickUp task ID.");
  }

  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  const data = await fetchClickUpTask(clickUpTaskId, true);
  const parentStatus = normalizeClickUpStatus(data.status);
  const parentStatusType = normalizeClickUpStatusType(data.status);
  const parentTaskId = data.id || clickUpTaskId;
  const subtaskItems = await normalizeSubtaskItems(
    Array.isArray(data.subtasks) ? data.subtasks : [],
    parentTaskId
  );
  const checklistItems = normalizeChecklistItems(
    Array.isArray(data.checklists) ? data.checklists : [],
    parentTaskId
  );
  const items = [...subtaskItems, ...checklistItems];
  const progressPercent = items.length
    ? clampProgressPercent(
        (items.filter((item) => item.completed).length / items.length) * 100
      )
    : clampProgressPercent(getProgressFromParentStatus(parentStatus));

  return {
    parentTaskId,
    parentTaskName: data.name,
    parentStatus,
    parentStatusType,
    items,
    progressPercent,
  };
}

export async function getClickUpTaskSubtasksOrChecklist(clickUpTaskId: string) {
  return getClickUpTaskProgress(clickUpTaskId);
}

export async function addClickUpTaskItemClientUpdateComment({
  parentTaskId,
  taskItemId,
  type,
  requestService,
  taskItemName,
  clientName,
  clientEmail,
  notes,
  fileName,
  documentId,
  markedComplete,
  clickUpAttachmentSucceeded,
}: TaskItemClientUpdateCommentInput) {
  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  const warnings: string[] = [];
  const commentText = [
    "Client task update submitted.",
    "",
    `Request: ${requestService}`,
    `Task Item: ${taskItemName || "Not available"}`,
    `Item Type: ${type}`,
    `Client: ${clientName}`,
    `Email: ${clientEmail}`,
    "",
    `Notes: ${notes || "None"}`,
    `Document Uploaded: ${fileName || "None"}`,
    fileName
      ? clickUpAttachmentSucceeded
        ? "File was also attached to this ClickUp task."
        : "File is stored securely in the Younity Client Portal storage, but ClickUp attachment failed."
      : "",
    `Document ID: ${documentId || "Not available"}`,
    `Marked Complete: ${markedComplete ? "Yes" : "No"}`,
    "",
    "Stored securely in Younity Client Portal storage.",
  ].filter(Boolean).join("\n");

  if (type === "subtask") {
    try {
      await createClickUpTaskComment(taskItemId, commentText);
      return { warnings };
    } catch (error) {
      console.error("ClickUp subtask comment failed:", error);
      warnings.push(
        "Could not add the comment directly to the subtask, so it was added to the parent task."
      );
    }
  }

  await createClickUpTaskComment(parentTaskId, commentText);
  return { warnings };
}

export async function completeClickUpTaskItem({
  taskItemId,
  type,
  checklistId,
  statusName,
}: CompleteTaskItemInput) {
  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error("Missing CLICKUP_API_TOKEN");
  }

  if (type === "checklist") {
    if (!checklistId) {
      throw new Error("Checklist completion is not supported for this item yet.");
    }

    const response = await fetch(
      `https://api.clickup.com/api/v2/checklist/${checklistId}/checklist_item/${taskItemId}`,
      {
        method: "PUT",
        headers: {
          Authorization: process.env.CLICKUP_API_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolved: true }),
      }
    );
    await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        `Checklist completion update failed with status ${response.status}.`
      );
    }

    return;
  }

  const candidateStatuses = [
    statusName,
    "complete",
    "completed",
    "closed",
    "done",
  ].filter((status): status is string => Boolean(status));
  let lastStatus: number | null = null;

  for (const status of candidateStatuses) {
    const response = await fetch(
      `https://api.clickup.com/api/v2/task/${taskItemId}`,
      {
        method: "PUT",
        headers: {
          Authorization: process.env.CLICKUP_API_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );
    await response.json().catch(() => ({}));

    if (response.ok) {
      return;
    }

    lastStatus = response.status;
  }

  throw new Error(
    `ClickUp subtask completion update failed${
      lastStatus ? ` with status ${lastStatus}` : ""
    }.`
  );
}
