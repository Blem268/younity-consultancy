type ZohoLeadInput = {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  serviceRequested?: string;
  message?: string;
  preferredContactMethod?: string;
  natureOfBusiness?: string;
  websiteFormId?: string;
  sourcePage?: string;
};

function splitFullName(fullName: string) {
  const cleaned = fullName.trim();
  const parts = cleaned.split(" ").filter(Boolean);

  if (parts.length === 1) {
    return {
      firstName: "",
      lastName: parts[0],
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function formatZohoDateTime(date: Date) {
  const pad = (num: number) => String(num).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
  const offsetMins = pad(Math.abs(offsetMinutes) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMins}`;
}

async function getZohoAccessToken() {
  const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_ACCOUNTS_URL,
  } = process.env;

  if (
    !ZOHO_CLIENT_ID ||
    !ZOHO_CLIENT_SECRET ||
    !ZOHO_REFRESH_TOKEN ||
    !ZOHO_ACCOUNTS_URL
  ) {
    throw new Error("Missing Zoho environment variables.");
  }

  const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("Zoho token error:", {
      status: response.status,
      error: data?.error,
    });
    throw new Error("Failed to generate Zoho access token.");
  }

  return data.access_token as string;
}

export async function createZohoLead(input: ZohoLeadInput) {
  const accessToken = await getZohoAccessToken();

  const zohoApiDomain =
    process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";

  const { firstName, lastName } = splitFullName(input.fullName);

  const leadPayload = {
    First_Name: firstName,
    Last_Name: lastName,
    Company: input.company || "Not Provided",
    Email: input.email,
    Phone: input.phone || "",

    Service_Requested: input.serviceRequested || "Other",
    Specific_Request_Details: input.message || "",
    Preferred_Contact_Method: input.preferredContactMethod || "No Preference",
    Nature_of_Business: input.natureOfBusiness || "",

    Lead_Source: "Website",
    Website_Form_ID: input.websiteFormId || "website-lead-form",
    Submission_Date_Time: formatZohoDateTime(new Date()),
    Source_Page: input.sourcePage || "/contact",

    Assigned_Picklist: "General",
    Lead_Status: "New Website Lead",

    Whatsapp_Notify: false,
    Client_Confirmation: false,

    Integration_Status: "Zoho Created",
    Integration_Error_log: "",
  };

  const response = await fetch(`${zohoApiDomain}/crm/v8/Leads`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [leadPayload],
    }),
  });

  const data = await response.json();

  if (!response.ok || data?.data?.[0]?.status === "error") {
    console.error("Zoho lead creation error:", {
      status: response.status,
      code: data?.data?.[0]?.code,
      message: data?.data?.[0]?.message,
    });

    throw new Error(
      data?.data?.[0]?.message || "Failed to create Zoho lead."
    );
  }

  return data;
}

export async function updateZohoLeadIntegrationStatus({
  zohoLeadId,
  whatsappNotificationSent = false,
  clientConfirmationSent = false,
  integrationStatus,
  integrationErrorLog = "",
}: {
  zohoLeadId: string;
  whatsappNotificationSent?: boolean;
  clientConfirmationSent?: boolean;
  integrationStatus: "Complete" | "Partial Success" | "Failed" | "Retry Needed";
  integrationErrorLog?: string;
}) {
  if (!zohoLeadId) {
    throw new Error("Missing Zoho Lead ID.");
  }

  const accessToken = await getZohoAccessToken();

  const zohoApiDomain =
    process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";

  const updatePayload = {
    Whatsapp_Notify: whatsappNotificationSent,
    Client_Confirmation: clientConfirmationSent,
    Integration_Status: integrationStatus,
    Integration_Error_log: integrationErrorLog,
  };

  const response = await fetch(`${zohoApiDomain}/crm/v8/Leads/${zohoLeadId}`, {
    method: "PUT",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [updatePayload],
    }),
  });

  const data = await response.json();

  if (!response.ok || data?.data?.[0]?.status === "error") {
    console.error("Zoho lead update error:", {
      status: response.status,
      code: data?.data?.[0]?.code,
      message: data?.data?.[0]?.message,
    });

    throw new Error(
      data?.data?.[0]?.message || "Failed to update Zoho lead."
    );
  }

  return data;
}
