import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ClientProfile = {
  id: string;
};

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id")
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

  const { data: document, error: documentError } = await supabase
    .from("client_documents")
    .select("id, file_path, file_name")
    .eq("id", documentId)
    .eq("client_id", clientProfile.id)
    .maybeSingle<ClientDocument>();

  if (documentError) {
    console.error("Client document lookup failed:", documentError);
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

  const supabaseAdmin = createAdminClient();
  const { data, error: signedUrlError } = await supabaseAdmin.storage
    .from("client-documents")
    .createSignedUrl(document.file_path, 60);

  if (signedUrlError || !data?.signedUrl) {
    console.error("Signed document URL creation failed:", signedUrlError);
    return NextResponse.json(
      { message: "Unable to open this document right now." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
