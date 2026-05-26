/**
 * Mock portal resources for the client resources page.
 * Replace with CMS or database-backed content when available.
 */
export type PortalResource = {
  id: string;
  title: string;
  description: string;
  category: "Guide" | "Checklist" | "Template" | "Reference";
  href?: string;
};

export const portalResources: PortalResource[] = [
  {
    id: "getting-started",
    title: "Getting started with your portal",
    description:
      "A short overview of dashboard actions, requests, documents, and how updates appear.",
    category: "Guide",
  },
  {
    id: "document-checklist",
    title: "Common document checklist",
    description:
      "Typical files clients prepare for bookkeeping, payroll, and compliance requests.",
    category: "Checklist",
  },
  {
    id: "request-template",
    title: "How to write a clear request",
    description:
      "What to include in your message so the team can respond quickly and accurately.",
    category: "Template",
  },
  {
    id: "status-reference",
    title: "Request status reference",
    description:
      "Plain-language explanations of common request statuses you may see in the portal.",
    category: "Reference",
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
