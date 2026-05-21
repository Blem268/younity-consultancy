import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClickUpTaskProgress } from "@/lib/integrations/clickup";
import {
  BackLinks,
  Card,
  EmptyState,
  PageHeader,
  PortalPage,
  RequestStatusBadge,
} from "../../../../portal-ui";
import { SubtaskActionForm } from "./subtask-action-form";

type ClientProfile = {
  id: string;
};

type ClientRequest = {
  id: string;
  service: string;
  status: string;
  clickup_task_id: string | null;
};

type PageProps = {
  params: Promise<{ id: string; taskItemId: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function SafeState({ title, requestId }: { title: string; requestId?: string }) {
  return (
    <PortalPage>
      <PageHeader
        eyebrow={
          <BackLinks
            links={[
              { href: "/client/requests", label: "Back to Requests" },
              ...(requestId
                ? [{ href: `/client/requests/${requestId}`, label: "Back to Request" }]
                : []),
            ]}
          />
        }
        title="Task Workspace"
      />
      <Card className="mt-8">
        <EmptyState title={title} />
      </Card>
    </PortalPage>
  );
}

export default async function ClientTaskItemPage({
  params,
  searchParams,
}: PageProps) {
  const { id, taskItemId } = await params;
  const { type } = await searchParams;
  const requestId = typeof id === "string" ? id.trim() : "";
  const itemId = typeof taskItemId === "string" ? decodeURIComponent(taskItemId) : "";
  const itemType = Array.isArray(type) ? type[0] : type;

  if (!requestId || !isUuid(requestId) || !itemId) {
    return (
      <SafeState title="Task not found or you do not have access to this request." />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const { data: clientProfile } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (!clientProfile) {
    return (
      <SafeState
        title="Task not found or you do not have access to this request."
        requestId={requestId}
      />
    );
  }

  const { data: clientRequest } = await supabase
    .from("client_requests")
    .select("id, service, status, clickup_task_id")
    .eq("id", requestId)
    .eq("client_id", clientProfile.id)
    .maybeSingle<ClientRequest>();

  if (!clientRequest) {
    return (
      <SafeState
        title="Task not found or you do not have access to this request."
        requestId={requestId}
      />
    );
  }

  if (!clientRequest.clickup_task_id) {
    return (
      <SafeState
        title="No operational task is linked to this request yet."
        requestId={requestId}
      />
    );
  }

  let taskProgress;

  try {
    taskProgress = await getClickUpTaskProgress(clientRequest.clickup_task_id);
  } catch (error) {
    console.error("ClickUp task item lookup failed:", error);
    return (
      <SafeState
        title="Task item not found or no longer available."
        requestId={requestId}
      />
    );
  }

  const taskItem = taskProgress.items.find(
    (item) =>
      item.id === itemId &&
      (!itemType || item.type === itemType)
  );

  if (!taskItem) {
    return (
      <SafeState
        title="Task item not found or no longer available."
        requestId={requestId}
      />
    );
  }

  return (
    <PortalPage>
      <PageHeader
        eyebrow={
          <BackLinks
            links={[{ href: `/client/requests/${requestId}`, label: "Back to Request" }]}
          />
        }
        title="Task Workspace"
        description={clientRequest.service}
      />

      <section className="grid gap-6 py-8 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Work Item
          </h2>
          <dl className="mt-4 divide-y divide-slate-200">
            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Request
              </dt>
              <dd className="mt-1 text-sm text-slate-800">
                {clientRequest.service}
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Parent Status
              </dt>
              <dd className="mt-2">
                <RequestStatusBadge status={taskProgress.parentStatus || "Not available"} />
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Task Item
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {taskItem.name}
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Item Status
              </dt>
              <dd className="mt-2">
                <RequestStatusBadge status={taskItem.status} />
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Completion
              </dt>
              <dd className="mt-2">
                <span
                  className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    taskItem.completed
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {taskItem.completed ? "Completed" : "Action available"}
                </span>
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Submit Update
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add notes, upload a supporting document, or mark this work item
            complete.
          </p>
          <SubtaskActionForm
            requestId={requestId}
            taskItemId={taskItem.id}
            type={taskItem.type}
          />
        </Card>
      </section>
    </PortalPage>
  );
}
