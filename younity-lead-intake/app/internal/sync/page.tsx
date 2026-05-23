import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { AccessDenied, InternalPage } from "../internal-ui";
import { SyncButtons } from "./sync-buttons";

export default async function InternalSyncPage() {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Younity Internal Sync Controls" />;
  }

  return (
    <InternalPage
      active="sync"
      title="Younity Internal Sync Controls"
      description="Run manual ClickUp syncs without exposing internal secrets in the browser."
    >
      <section className="py-8">
        <SyncButtons />
      </section>
    </InternalPage>
  );
}
