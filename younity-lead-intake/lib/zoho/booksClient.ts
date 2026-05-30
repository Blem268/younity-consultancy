/**
 * Zoho Books API client
 * Requires env vars: ZOHO_BOOKS_CLIENT_ID, ZOHO_BOOKS_CLIENT_SECRET,
 *                    ZOHO_BOOKS_REFRESH_TOKEN, ZOHO_BOOKS_ORG_ID
 */

export function isZohoBooksConfigured() {
  return Boolean(
    process.env.ZOHO_BOOKS_CLIENT_ID &&
      process.env.ZOHO_BOOKS_CLIENT_SECRET &&
      process.env.ZOHO_BOOKS_REFRESH_TOKEN &&
      process.env.ZOHO_BOOKS_ORG_ID
  );
}

type ZohoTokenResponse = {
  access_token?: string;
  error?: string;
};

export async function getZohoBooksAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_BOOKS_REFRESH_TOKEN ?? "",
    client_id: process.env.ZOHO_BOOKS_CLIENT_ID ?? "",
    client_secret: process.env.ZOHO_BOOKS_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
  });

  const response = await fetch(
    `https://accounts.zoho.com/oauth/v2/token?${params.toString()}`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error(`Zoho token refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as ZohoTokenResponse;

  if (!data.access_token) {
    throw new Error(
      `Zoho token refresh returned no access_token: ${data.error ?? "unknown"}`
    );
  }

  return data.access_token;
}

export type ZohoLineItem = {
  name: string;
  rate: number;
  quantity: number;
  description?: string;
};

export type CreateZohoInvoiceParams = {
  customerName: string;
  customerEmail: string;
  lineItems: ZohoLineItem[];
  referenceNumber?: string;
  notes?: string;
};

type ZohoCreateInvoiceResponse = {
  code: number;
  message: string;
  invoice?: {
    invoice_id: string;
    invoice_number: string;
    status: string;
  };
};

export async function createZohoInvoice(
  accessToken: string,
  params: CreateZohoInvoiceParams
): Promise<{ invoiceId: string; invoiceNumber: string }> {
  const orgId = process.env.ZOHO_BOOKS_ORG_ID ?? "";

  const body = {
    customer_name: params.customerName,
    contact_persons_details: [{ email: params.customerEmail }],
    reference_number: params.referenceNumber ?? "",
    notes: params.notes ?? "",
    line_items: params.lineItems.map((item) => ({
      name: item.name,
      rate: item.rate,
      quantity: item.quantity,
      description: item.description ?? "",
    })),
  };

  const response = await fetch(
    `https://www.zohoapis.com/books/v3/invoices?organization_id=${orgId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = (await response.json()) as ZohoCreateInvoiceResponse;

  if (!response.ok || data.code !== 0) {
    throw new Error(
      `Zoho Books create invoice failed: ${data.message ?? response.status}`
    );
  }

  const invoice = data.invoice;

  if (!invoice?.invoice_id) {
    throw new Error("Zoho Books returned no invoice_id.");
  }

  return {
    invoiceId: invoice.invoice_id,
    invoiceNumber: invoice.invoice_number,
  };
}
