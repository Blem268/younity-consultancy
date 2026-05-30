/**
 * Portal resources for the client resources page.
 * Each resource with an href will show "Open resource →" on the card.
 * Resources with content will render a detail page at /client/resources/[id].
 */

export type PortalResourceItem =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: { title: string; detail: string }[] };

export type PortalResource = {
  id: string;
  title: string;
  description: string;
  category: "Guide" | "Checklist" | "Template" | "Reference";
  href?: string;
  content?: PortalResourceItem[];
};

export const portalResources: PortalResource[] = [
  {
    id: "getting-started",
    title: "Getting started with your portal",
    description:
      "A short overview of dashboard actions, requests, documents, and how updates appear.",
    category: "Guide",
    href: "/client/welcome",
  },
  {
    id: "document-checklist",
    title: "Common document checklist",
    description:
      "Typical files clients prepare for bookkeeping, payroll, and compliance requests.",
    category: "Checklist",
    href: "/client/resources/document-checklist",
    content: [
      {
        type: "paragraph",
        text: "The documents you need will depend on your specific service request. The list below covers the files most commonly requested across bookkeeping, payroll, and compliance work. Having these ready at the start of a request helps the team move faster.",
      },
      {
        type: "list",
        items: [
          "Government-issued photo ID (passport or national ID card)",
          "Proof of business registration or certificate of incorporation",
          "Recent bank statements — typically the last 3 months",
          "Prior year financial statements or tax returns (if applicable)",
          "Payroll records and employment contracts (for payroll requests)",
          "Invoices, receipts, and expense records for the relevant period",
          "Utility bills or lease agreements for address or business verification",
          "VAT or tax registration documents (if registered)",
        ],
      },
      {
        type: "paragraph",
        text: "You do not need to upload everything at once. The Younity team will request specific documents as your work progresses. You can upload files directly from any open request or from the Document Library.",
      },
    ],
  },
  {
    id: "request-template",
    title: "How to write a clear request",
    description:
      "What to include in your message so the team can respond quickly and accurately.",
    category: "Template",
    href: "/client/resources/request-template",
    content: [
      {
        type: "paragraph",
        text: "A well-written request helps the Younity team understand your needs quickly and reduces back-and-forth. You do not need to be formal — just clear. Here is what to include.",
      },
      {
        type: "steps",
        items: [
          {
            title: "Name the service you need",
            detail:
              'Start with the specific service — for example, "bookkeeping for Q1 2025" or "payroll for February." This lets the team assign your request correctly from the start.',
          },
          {
            title: "Include the time period",
            detail:
              "If your request covers a specific period (a quarter, a month, a tax year), state it clearly. This avoids assumptions and helps with scoping.",
          },
          {
            title: "Describe what you are working toward",
            detail:
              'Note any goal or deadline behind the request — for example, "preparing for our annual audit" or "filing due end of March." Context helps the team prioritise correctly.',
          },
          {
            title: "Mention anything unusual",
            detail:
              "Flag any changes since your last request: new employees, large purchases, a new business line, or gaps in records. Small details can save significant time.",
          },
          {
            title: "State your deadline clearly",
            detail:
              "If there is a hard deadline, say so. If the work is not urgent, you can note that too — it helps the team schedule accurately.",
          },
        ],
      },
      {
        type: "paragraph",
        text: 'Example: "I need help with Q1 2025 bookkeeping. We had a new employee start in January and some equipment purchases I need properly categorised. Our accountant needs the reports by April 30."',
      },
    ],
  },
  {
    id: "status-reference",
    title: "Request status reference",
    description:
      "Plain-language explanations of common request statuses you may see in the portal.",
    category: "Reference",
    href: "/client/resources/status-reference",
    content: [
      {
        type: "paragraph",
        text: "Every request in your portal has a status that reflects where the work currently stands. Here is what each status means.",
      },
      {
        type: "steps",
        items: [
          {
            title: "New",
            detail:
              "Your request has been received and is in the queue. The Younity team will review it and begin work or reach out if they need more information.",
          },
          {
            title: "In Progress",
            detail:
              "The team is actively working on your request. You may receive document requests or updates during this stage.",
          },
          {
            title: "Waiting on Client",
            detail:
              "The team needs something from you before they can continue — usually a document or a clarification. Check the Documents Needed section of your request.",
          },
          {
            title: "Under Review",
            detail:
              "Work is complete or near-complete and is being reviewed internally before delivery or the next step.",
          },
          {
            title: "Completed",
            detail:
              "The work is done. Any deliverables or final documents will be available in the Uploaded Documents section of your request.",
          },
          {
            title: "Closed",
            detail:
              "The request has been resolved and archived. Closed requests remain visible in your request history for reference.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "If your request status does not seem right or has not moved in a while, reach out through the Support page and reference your request.",
      },
    ],
  },
];

export const resourceCategoryTone: Record<
  PortalResource["category"],
  string
> = {
  Guide: "bg-[#244285]/10 text-[#244285]",
  Checklist: "bg-[#50A9C0]/15 text-[#06111f]",
  Template: "bg-emerald-50 text-emerald-800",
  Reference: "bg-slate-100 text-slate-700",
};
