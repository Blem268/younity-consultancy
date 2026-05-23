import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

type ClientDocument = {
  id: string;
  file_path: string;
  file_name: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const documentId = typeof id === "string" ? id.trim() : "";

  if (!documentId || !isUuid(documentId)) {
    return NextResponse.json({ message: "Invalid document ID." }, { status: 400 });
  }

  const { errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  const supabaseAdmin = createAdminClient();
  const { data: document, error: documentError } = await supabaseAdmin
    .from("client_documents")
    .select("id, file_path, file_name")
    .eq("id", documentId)
    .maybeSingle<ClientDocument>();

  if (documentError) {
    console.error("Internal document lookup failed:", {
      message: documentError.message,
      code: documentError.code,
    });
    return NextResponse.json(
      { message: "Unable to find this document." },
      { status: 500 }
    );
  }

  if (!document) {
    return NextResponse.json({ message: "Document not found." }, { status: 404 });
  }

  if (document.file_path === "pending" || document.file_name === "Pending upload") {
    return NextResponse.json(
      { message: "This document has not been uploaded yet." },
      { status: 404 }
    );
  }

  const { data, error: signedUrlError } = await supabaseAdmin.storage
    .from("client-documents")
    .createSignedUrl(document.file_path, 60);

  if (signedUrlError || !data?.signedUrl) {
    console.error("Internal signed document URL creation failed:", {
      message: signedUrlError?.message,
    });
    return NextResponse.json(
      { message: "Unable to open this document right now." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
