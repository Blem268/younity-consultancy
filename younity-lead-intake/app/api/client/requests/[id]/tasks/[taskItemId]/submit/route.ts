import { NextResponse } from "next/server";
import {
  addClickUpTaskItemClientUpdateComment,
  attachFileToClickUpTask,
  completeClickUpTaskItem,
  getClickUpTaskProgress,
} from "@/lib/integrations/clickup";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { rateLimit } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const maxFileSizeBytes = 10 * 1024 * 1024;
const allowedExtensions = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
]);
const allowedMimeTypesByExtension: Record<string, Set<string>> = {
  pdf: new Set(["application/pdf"]),
  jpg: new Set(["image/jpeg"]),
  jpeg: new Set(["image/jpeg"]),
  png: new Set(["image/png"]),
  doc: new Set(["application/msword"]),
  docx: new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  xls: new Set(["application/vnd.ms-excel"]),
  xlsx: new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]),
  csv: new Set(["text/csv", "application/csv", "application/vnd.ms-excel"]),
};
const allowedTaskItemTypes = new Set(["subtask", "checklist"]);

type ClientProfile = {
  id: string;
  full_name: string;
  email: string;
};

type ClientRequest = {
  id: string;
  service: string;
  clickup_task_id: string | null;
};

type InsertedDocument = {
  id: string;
};

type SupabaseLogError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function logSupabaseError(label: string, error: SupabaseLogError | null) {
  console.error(label, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

function getSafeFileName(fileName: string) {
  const cleaned = fileName
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  return cleaned || "document";
}

function isAllowedMimeType(extension: string, mimeType: string) {
  if (!mimeType || mimeType === "application/octet-stream") {
    return true;
  }

  return allowedMimeTypesByExtension[extension]?.has(mimeType) ?? false;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskItemId: string }> }
) {
  const { id, taskItemId } = await params;
  const requestId = typeof id === "string" ? id.trim() : "";
  const itemId = typeof taskItemId === "string" ? decodeURIComponent(taskItemId) : "";

  if (!requestId || !isUuid(requestId) || !itemId) {
    return NextResponse.json(
      { success: false, message: "Invalid task update request." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const rateLimitResult = await rateLimit({
    key: `client-task-submit:${user.id}`,
    limit: 20,
    windowSeconds: 60 * 60,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many task updates. Please wait before submitting more updates.",
      },
      { status: 429 }
    );
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id, full_name, email")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    logSupabaseError("Client profile lookup failed:", clientProfileError);
    return NextResponse.json(
      { success: false, message: "Unable to verify your portal profile." },
      { status: 500 }
    );
  }

  if (!clientProfile) {
    return NextResponse.json(
      { success: false, message: "Portal profile has not been set up." },
      { status: 403 }
    );
  }

  const { data: clientRequest, error: requestError } = await supabase
    .from("client_requests")
    .select("id, service, clickup_task_id")
    .eq("id", requestId)
    .eq("client_id", clientProfile.id)
    .maybeSingle<ClientRequest>();

  if (requestError) {
    logSupabaseError("Client task update request lookup failed:", requestError);
    return NextResponse.json(
      { success: false, message: "Unable to load this request." },
      { status: 500 }
    );
  }

  if (!clientRequest) {
    return NextResponse.json(
      { success: false, message: "Request not found." },
      { status: 404 }
    );
  }

  if (!clientRequest.clickup_task_id) {
    return NextResponse.json(
      { success: false, message: "No operational task is linked to this request yet." },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const typeValue = getStringValue(formData.get("type"));
  const notes = getStringValue(formData.get("notes"));
  const documentType = getStringValue(formData.get("documentType"));
  const markComplete = getStringValue(formData.get("markComplete")) === "true";
  const fileValue = formData.get("file");
  const file =
    fileValue instanceof File && fileValue.size > 0 && fileValue.name
      ? fileValue
      : null;

  if (!allowedTaskItemTypes.has(typeValue)) {
    return NextResponse.json(
      { success: false, message: "Task item type is not valid." },
      { status: 400 }
    );
  }

  const itemType = typeValue as "subtask" | "checklist";

  if (!notes && !file && !markComplete) {
    return NextResponse.json(
      {
        success: false,
        message: "Please add a note, upload a document, or mark the task complete.",
      },
      { status: 400 }
    );
  }

  if (file && !documentType) {
    return NextResponse.json(
      { success: false, message: "Document type is required." },
      { status: 400 }
    );
  }

  if (file && file.size > maxFileSizeBytes) {
    return NextResponse.json(
      { success: false, message: "File size must be 10MB or smaller." },
      { status: 400 }
    );
  }

  const fileExtension = file ? getFileExtension(file.name) : "";

  if (file && !allowedExtensions.has(fileExtension)) {
    return NextResponse.json(
      { success: false, message: "This file type is not allowed." },
      { status: 400 }
    );
  }

  if (file && !isAllowedMimeType(fileExtension, file.type)) {
    return NextResponse.json(
      { success: false, message: "This file type is not allowed." },
      { status: 400 }
    );
  }

  let taskProgress;

  try {
    taskProgress = await getClickUpTaskProgress(clientRequest.clickup_task_id);
  } catch (error) {
    console.error("ClickUp task progress lookup failed:", error);
    await logWorkflowError({
      source: "client-task-submit.clickup-progress",
      severity: "error",
      message: "ClickUp task progress lookup failed.",
      context: {
        error,
        clickUpTaskId: clientRequest.clickup_task_id,
        taskItemId: itemId,
      },
      relatedClientId: clientProfile.id,
      relatedRequestId: clientRequest.id,
    });
    return NextResponse.json(
      { success: false, message: "Unable to verify this task item." },
      { status: 500 }
    );
  }

  const taskItem = taskProgress.items.find(
    (item) => item.id === itemId && item.type === itemType
  );

  if (!taskItem) {
    return NextResponse.json(
      { success: false, message: "Task item not found or no longer available." },
      { status: 404 }
    );
  }

  const warnings: string[] = [];
  let insertedDocument: InsertedDocument | null = null;
  let clickUpAttachmentSucceeded = false;

  if (file) {
    const safeFileName = getSafeFileName(file.name);
    const storagePath = [
      "clients",
      clientProfile.id,
      clientRequest.id,
      `${Date.now()}-${safeFileName}`,
    ].join("/");
    const supabaseAdmin = createAdminClient();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("client-documents")
      .upload(storagePath, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase task document upload failed:", {
        message: uploadError.message,
      });
      await logWorkflowError({
        source: "client-task-submit.storage",
        severity: "error",
        message: "Supabase task document upload failed.",
        context: {
          error: uploadError,
          taskItemId: itemId,
          documentType,
          fileSize: file.size,
          fileType: file.type,
        },
        relatedClientId: clientProfile.id,
        relatedRequestId: clientRequest.id,
      });
      return NextResponse.json(
        { success: false, message: "Document upload failed." },
        { status: 500 }
      );
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("client_documents")
      .insert({
        client_id: clientProfile.id,
        request_id: clientRequest.id,
        document_type: documentType,
        file_name: file.name,
        file_path: storagePath,
        file_url: null,
        notes: notes || null,
        status: "Submitted",
      })
      .select("id")
      .single<InsertedDocument>();

    if (insertError) {
      logSupabaseError("Task document metadata insert failed:", insertError);
      await logWorkflowError({
        source: "client-task-submit.metadata",
        severity: "error",
        message: "Task document metadata insert failed.",
        context: {
          error: insertError,
          taskItemId: itemId,
          documentType,
          fileSize: file.size,
          fileType: file.type,
        },
        relatedClientId: clientProfile.id,
        relatedRequestId: clientRequest.id,
      });
      return NextResponse.json(
        { success: false, message: "Document metadata could not be saved." },
        { status: 500 }
      );
    }

    insertedDocument = data;

    try {
      if (taskItem.type === "subtask") {
        try {
          await attachFileToClickUpTask({
            taskId: taskItem.id,
            file,
          });
          clickUpAttachmentSucceeded = true;
        } catch (subtaskAttachmentError) {
          console.error(
            "ClickUp subtask file attachment failed:",
            subtaskAttachmentError
          );
          await logWorkflowError({
            source: "client-task-submit.clickup-subtask-attachment",
            severity: "warning",
            message: "ClickUp subtask file attachment failed; trying parent task.",
            context: {
              error: subtaskAttachmentError,
              parentTaskId: taskProgress.parentTaskId,
              taskItemId: taskItem.id,
              documentId: insertedDocument.id,
            },
            relatedClientId: clientProfile.id,
            relatedRequestId: clientRequest.id,
            relatedDocumentId: insertedDocument.id,
          });
          await attachFileToClickUpTask({
            taskId: taskProgress.parentTaskId,
            file,
          });
          clickUpAttachmentSucceeded = true;
        }
      } else {
        await attachFileToClickUpTask({
          taskId: taskProgress.parentTaskId,
          file,
        });
        clickUpAttachmentSucceeded = true;
      }
    } catch (error) {
      console.error("ClickUp task item file attachment failed:", error);
      await logWorkflowError({
        source: "client-task-submit.clickup-attachment",
        severity: "warning",
        message: "ClickUp task item file attachment failed.",
        context: {
          error,
          parentTaskId: taskProgress.parentTaskId,
          taskItemId: taskItem.id,
          documentId: insertedDocument?.id,
        },
        relatedClientId: clientProfile.id,
        relatedRequestId: clientRequest.id,
        relatedDocumentId: insertedDocument?.id,
      });
      warnings.push("Document saved, but ClickUp file attachment failed.");
    }
  }

  try {
    const commentResult = await addClickUpTaskItemClientUpdateComment({
      parentTaskId: taskProgress.parentTaskId,
      taskItemId: taskItem.id,
      type: taskItem.type,
      requestService: clientRequest.service,
      taskItemName: taskItem.name,
      clientName: clientProfile.full_name,
      clientEmail: clientProfile.email,
      notes,
      fileName: file?.name,
      documentId: insertedDocument?.id,
      markedComplete: markComplete,
      clickUpAttachmentSucceeded: file ? clickUpAttachmentSucceeded : null,
    });
    warnings.push(...commentResult.warnings);
  } catch (error) {
    console.error("ClickUp task item comment failed:", error);
    await logWorkflowError({
      source: "client-task-submit.clickup-comment",
      severity: "warning",
      message: "ClickUp task item comment failed.",
      context: {
        error,
        parentTaskId: taskProgress.parentTaskId,
        taskItemId: taskItem.id,
        documentId: insertedDocument?.id,
      },
      relatedClientId: clientProfile.id,
      relatedRequestId: clientRequest.id,
      relatedDocumentId: insertedDocument?.id,
    });
    warnings.push("The update was saved, but the ClickUp comment could not be added.");
  }

  if (markComplete && !taskItem.completed) {
    try {
      await completeClickUpTaskItem({
        parentTaskId: taskProgress.parentTaskId,
        taskItemId: taskItem.id,
        type: taskItem.type,
        checklistId: taskItem.checklistId,
        statusName: "complete",
      });
    } catch (error) {
      console.error("ClickUp task item completion failed:", error);
      await logWorkflowError({
        source: "client-task-submit.clickup-completion",
        severity: "warning",
        message: "ClickUp task item completion failed.",
        context: {
          error,
          parentTaskId: taskProgress.parentTaskId,
          taskItemId: taskItem.id,
          taskItemType: taskItem.type,
        },
        relatedClientId: clientProfile.id,
        relatedRequestId: clientRequest.id,
      });
      warnings.push("Completion could not be applied automatically.");
    }
  }

  const supabaseAdmin = createAdminClient();
  const { error: timelineError } = await supabaseAdmin
    .from("client_updates")
    .insert({
      client_id: clientProfile.id,
      request_id: clientRequest.id,
      title: "Task update submitted",
      message: `An update was submitted for ${taskItem.name}.`,
      created_by: clientProfile.full_name || "Client",
    });

  if (timelineError) {
    logSupabaseError("Task update timeline insert failed:", timelineError);
    await logWorkflowError({
      source: "client-task-submit.timeline",
      severity: "warning",
      message: "Task update timeline insert failed.",
      context: {
        error: timelineError,
        taskItemId: taskItem.id,
        documentId: insertedDocument?.id,
      },
      relatedClientId: clientProfile.id,
      relatedRequestId: clientRequest.id,
      relatedDocumentId: insertedDocument?.id,
    });
    warnings.push("The portal timeline could not be updated.");
  }

  return NextResponse.json({
    success: true,
    message: "Task update submitted successfully.",
    ...(insertedDocument ? { documentId: insertedDocument.id } : {}),
    ...(warnings.length ? { warnings } : {}),
  });
}
