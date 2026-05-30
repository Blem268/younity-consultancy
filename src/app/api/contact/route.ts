import { Resend } from "resend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

export async function POST(request: Request) {
  const resend = getResendClient();

  if (!resend) {
    console.error("Contact form: RESEND_API_KEY is not configured.");
    return NextResponse.json(
      { error: "Contact form is temporarily unavailable." },
      { status: 503 }
    );
  }

  try {
    const { name, email, company, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "Younity Website <onboarding@resend.dev>";
    const toEmail =
      process.env.CONTACT_FORM_TO_EMAIL?.trim() || "sionmartinez02@gmail.com";

    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New Website Inquiry from ${name}`,
      replyTo: email,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form send failed:", error);
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}
