# Cursor Task: Phase 7 — Internal Settings Page

## What to build

Create a new Settings page at `/internal/settings` for the Younity internal ops backend.

---

## Codebase context

**Stack:** Next.js App Router, TypeScript (strict), Tailwind CSS v4, Supabase.

**Auth pattern:** Every internal page starts with:
```tsx
const admin = await requireInternalAdmin();
if (!admin.isAdmin) return <AccessDenied title="Settings" />;
```

**Import paths:**
```tsx
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  AdminCard,       // use sparingly — prefer inline cards
  EmptyCard,
  InternalPage,
  logInternalQueryError,
  MutedBadge,
  StatusBadge,
} from "../internal-ui";
```

**`InternalPage` renders a white topbar + scrollable `bg-[#f6f9fc]` content area:**
```tsx
<InternalPage
  active="settings"          // must be "settings" — matches sidebar active state
  title="Settings"
  description="..."
  actions={<OptionalButton />}
>
  {/* content goes here */}
</InternalPage>
```

**`AdminCard` style (use for grouped content sections):**
```tsx
<article className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-sm">
```

**Brand tokens:**
- Dark navy: `#06111f`
- Blue: `#244285`
- Teal: `#50A9C0`
- Light bg: `#f6f9fc`
- Primary button: `bg-[#244285] text-white rounded-xl px-4 py-2 text-sm font-black uppercase tracking-[0.08em] transition hover:-translate-y-0.5 hover:brightness-110`
- Muted/secondary button: `border border-slate-200 bg-white text-slate-700 rounded-xl px-4 py-2 text-sm font-semibold transition hover:bg-slate-50`

**No emojis. No ClickUp. No Google Sheets. Zoho Books is the invoicing system.**

---

## Page structure

The Settings page uses an in-page sub-navigation (not the sidebar). The sub-nav sits below the `InternalPage` header and switches content sections.

Use a `?tab=` URL search param to control which section is active. Default tab is `notifications`.

### Sub-nav tabs

| Tab key | Label |
|---|---|
| `notifications` | Notifications |
| `integrations` | Integrations |
| `admins` | Admin users |
| `errors` | Error logs |

Render sub-nav as a row of links:
```tsx
// Active tab style
"border-b-2 border-[#244285] text-[#244285] font-semibold"
// Inactive tab style
"text-slate-500 hover:text-[#06111f]"
```

---

## Section content

### Tab: Notifications

**No database writes needed — this is a read/display section for now.**

Show a card titled "WhatsApp Notifications" with a description:
> "Configure which internal events trigger WhatsApp alerts via Twilio. Webhook endpoint: `/api/webhooks/twilio`."

Render a static list of notification toggles (display only — no real-time toggle functionality needed yet):

| Event | Status |
|---|---|
| New client request submitted | Enabled |
| Document uploaded by client | Enabled |
| Request status changed | Enabled |
| Invoice marked Ready for Billing | Enabled |
| Workflow error logged | Enabled |

Display each row as: event label on the left, a green "Enabled" badge on the right.
Use `<MutedBadge>` or an inline green pill: `rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold`.

Add a note at the bottom of the card:
> "Twilio is currently in sandbox mode. To enable production WhatsApp delivery, complete Meta Business Verification and upgrade to a registered number."

---

### Tab: Integrations

Show a grid of integration cards (2 columns on desktop, 1 on mobile). Each card shows: logo placeholder (coloured initials circle), integration name, status badge, short description, and a "Configure" or "Connected" button.

**Integrations to show:**

| Name | Status | Description |
|---|---|---|
| Zoho CRM | Connected | Leads and contacts synced from the intake form. |
| Zoho Books | Connected | Invoicing and payment tracking. |
| Twilio | Sandbox | WhatsApp notifications for internal events. |
| Resend | Paused | Transactional email delivery. |

Status badge colours:
- "Connected" → green pill: `bg-emerald-100 text-emerald-700`
- "Sandbox" → amber pill: `bg-amber-100 text-amber-700`
- "Paused" → slate pill: `bg-slate-100 text-slate-600`

Each card has a "Manage" link button (secondary style, no real href needed — use `href="#"` and `prefetch={false}`).

Add a note at the top of this section:
> "Integration credentials are managed via environment variables. Contact your developer to update API keys or OAuth tokens."

**Do not show ClickUp. Do not show Google Sheets. Do not add any other integrations.**

---

### Tab: Admin users

**Fetch real data from Supabase.**

Query the `internal_admins` table:
```tsx
const { data: admins, error } = await supabaseAdmin
  .from("internal_admins")
  .select("id, email, created_at")
  .order("created_at", { ascending: true });
```

The `internal_admins` table schema:
```sql
id uuid, email text, created_at timestamptz
```

Show a table with columns: Email, Added. Use the same table style as other internal pages:
```tsx
<table className="w-full text-left text-sm">
  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
```

If the query errors, show an error message. If empty, show `<EmptyCard>No admin users found.</EmptyCard>`.

Below the table, add a static note in a `rounded-lg bg-amber-50 border border-amber-200 p-4` box:
> "Admin access is controlled server-side via the `internal_admins` table. To add or remove admins, update the table directly in Supabase or via a migration."

---

### Tab: Error logs

**Fetch real data from Supabase.**

This replaces the old `/internal/errors` page. Fetch unresolved workflow errors:
```tsx
const { data: errors, error } = await supabaseAdmin
  .from("workflow_errors")
  .select("id, created_at, source, severity, message, resolved")
  .eq("resolved", false)
  .order("created_at", { ascending: false })
  .limit(50);
```

`workflow_errors` schema:
```sql
id uuid, created_at timestamptz, source text, severity text, message text, resolved boolean
```

Show a count badge next to "Error logs" in the sub-nav if there are unresolved errors:
```tsx
// Only show if unresolvedCount > 0
<span className="ml-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
  {unresolvedCount}
</span>
```

Render errors as a list. Each item shows:
- Severity badge (use `<StatusBadge>` from internal-ui — it handles colour mapping)
- Timestamp (use `formatDateTime` from internal-ui)
- Message (bold)
- Source (muted, `text-slate-500 text-sm`)

If no unresolved errors, show:
```tsx
<EmptyCard>No unresolved workflow errors. The active queue is clear.</EmptyCard>
```

Add a note: "Errors are logged automatically by internal workflows. Manual resolution requires a database update (`resolved = true`)."

---

## File to create

**`app/internal/(protected)/settings/page.tsx`**

This is a server component (no `"use client"` at the top level). The sub-nav links are plain `<Link>` components using `?tab=` params. No client-side state needed.

PageProps type:
```tsx
type PageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};
```

Tab resolution:
```tsx
const params = await searchParams;
const rawTab = Array.isArray(params.tab) ? params.tab[0] : (params.tab ?? "notifications");
const tab = ["notifications", "integrations", "admins", "errors"].includes(rawTab)
  ? rawTab
  : "notifications";
```

Fetch `internal_admins` and `workflow_errors` unconditionally at the top (for the error count badge in the sub-nav), or conditionally if you prefer to optimise — either approach is fine.

---

## Rules

- TypeScript strict — no `any`, no `as unknown as X` unless necessary
- No `console.log` — use `logInternalQueryError` for query failures
- No hardcoded secrets or API keys
- No ClickUp, no Google Sheets references anywhere
- No emojis in UI text
- All `<Link>` elements must have `prefetch={false}`
- Use `formatDateTime` from `../internal-ui` for all date formatting
- Keep the file under ~350 lines — split into sub-components within the same file if needed
