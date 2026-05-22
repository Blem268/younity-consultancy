import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addClickUpDocumentUploadComment,
  attachFileToClickUpTask,
} from "@/lib/integrations/clickup";
import { sendDocumentUploadNotificationEmail } from "@/lib/integrations/email";
import { sendInternalWhatsAppDocumentUploadNotification } from "@/lib/integrations/whatsapp";

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

type ClientProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
};

type LinkedRequest = {
  id: string;
  service: string;
  status: string;
  clickup_task_id: string | null;
};

type InsertedDocument = {
  id: string;
};

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isAllowedMimeType(extension: string, mimeType: string) {
  if (!mimeType || mimeType === "application/octet-stream") {
    return true;
  }

  return allowedMimeTypesByExtension[extension]?.has(mimeType) ?? false;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, company")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
    return NextResponse.json(
      { message: "Unable to verify your portal profile." },
      { status: 500 }
    );
  }

  if (!clientProfile) {
    return NextResponse.json(
      { message: "Portal profile has not been set up." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const fileValue = formData.get("file");
  const documentType = getStringValue(formData.get("documentType"));
  const requestId = getStringValue(formData.get("requestId"));
  const notes = getStringValue(formData.get("notes"));

  if (!(fileValue instanceof File)) {
    return NextResponse.json(
      { message: "Please choose a file to upload." },
      { status: 400 }
    );
  }

  if (!documentType) {
    return NextResponse.json(
      { message: "Document type is required." },
      { status: 400 }
    );
  }

  if (fileValue.size > maxFileSizeBytes) {
    return NextResponse.json(
      { message: "File size must be 10MB or smaller." },
      { status: 400 }
    );
  }

  const extension = getFileExtension(fileValue.name);

  if (!allowedExtensions.has(extension)) {
    return NextResponse.json(
      { message: "This file type is not allowed." },
      { status: 400 }
    );
  }

  if (!isAllowedMimeType(extension, fileValue.type)) {
    return NextResponse.json(
      { message: "This file type is not allowed." },
      { status: 400 }
    );
  }

  let linkedRequest: LinkedRequest | null = null;

  if (requestId) {
    if (!isUuid(requestId)) {
      return NextResponse.json(
        { message: "Selected request was not found." },
        { status: 404 }
      );
    }

    const { data, error: linkedRequestError } = await supabase
      .from("client_requests")
      .select("id, service, status, clickup_task_id")
      .eq("id", requestId)
      .eq("client_id", clientProfile.id)
      .maybeSingle<LinkedRequest>();

    if (linkedRequestError) {
      console.error("Linked request lookup failed:", linkedRequestError);
      return NextResponse.json(
        { message: "Unable to verify the selected request." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { message: "Selected request was not found." },
        { status: 403 }
      );
    }

    linkedRequest = data;
  }

  const safeFileName = getSafeFileName(fileValue.name);
  const storagePath = [
    "clients",
    clientProfile.id,
    requestId || "general",
    `${Date.now()}-${safeFileName}`,
  ].join("/");

  const supabaseAdmin = createAdminClient();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("client-documents")
    .upload(storagePath, fileValue, {
      contentType: fileValue.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase storage upload failed:", {
      message: uploadError.message,
    });
    return NextResponse.json(
      { message: "Document upload failed." },
      { status: 500 }
    );
  }

  const { data: insertedDocument, error: insertError } = await supabaseAdmin
    .from("client_documents")
    .insert({
      client_id: clientProfile.id,
      request_id: requestId || null,
      document_type: documentType,
      file_name: fileValue.name,
      file_path: storagePath,
      file_url: null,
      notes: notes || null,
      status: "Submitted",
    })
    .select("id")
    .single<InsertedDocument>();

  if (insertError) {
    console.error("Client document metadata insert failed:", {
      message: insertError.message,
      code: insertError.code,
    });
    return NextResponse.json(
      { message: "Document metadata could not be saved." },
      { status: 500 }
    );
  }

  const notificationWarnings: string[] = [];
  const notificationInput = {
    clientName: clientProfile.full_name,
    clientEmail: clientProfile.email,
    clientPhone: clientProfile.phone,
    company: clientProfile.company,
    documentType,
    fileName: fileValue.name,
    notes,
    requestId: linkedRequest?.id,
    requestService: linkedRequest?.service,
    requestStatus: linkedRequest?.status,
  };

  try {
    await sendDocumentUploadNotificationEmail(notificationInput);
  } catch (error) {
    console.error("Document upload email notification failed:", error);
    notificationWarnings.push("Document uploaded, but the email notification failed.");
  }

  try {
    await sendInternalWhatsAppDocumentUploadNotification(notificationInput);
  } catch (error) {
    console.error("Document upload WhatsApp notification failed:", error);
    notificationWarnings.push("Document uploaded, but the WhatsApp notification failed.");
  }

  if (linkedRequest?.clickup_task_id) {
    let clickUpAttachmentSucceeded = false;

    try {
      await attachFileToClickUpTask({
        taskId: linkedRequest.clickup_task_id,
        file: fileValue,
      });
      clickUpAttachmentSucceeded = true;
    } catch (error) {
      console.error("ClickUp document attachment failed:", error);
      notificationWarnings.push("Document saved, but the ClickUp file attachment failed.");
    }

    try {
      await addClickUpDocumentUploadComment({
        ...notificationInput,
        clickUpTaskId: linkedRequest.clickup_task_id,
        documentId: insertedDocument.id,
        clickUpAttachmentSucceeded,
      });
    } catch (error) {
      console.error("ClickUp document upload comment failed:", error);
      notificationWarnings.push("Document saved, but the ClickUp comment failed.");
    }
  }

  return NextResponse.json({
    success: true,
    message: "Document uploaded successfully.",
    documentId: insertedDocument.id,
    ...(notificationWarnings.length ? { notificationWarnings } : {}),
  });
}
