"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Badge,
  StatusBadge,
  TaskCompletionBadge,
} from "@/app/components/ui/status-badges";

type TaskProgressItem = {
  id: string;
  name: string;
  status: string;
  type: "subtask" | "checklist";
  completed: boolean;
  parentTaskId: string;
  checklistId?: string | null;
};

type TaskProgressResponse = {
  success: boolean;
  linked: boolean;
  parentTaskId: string | null;
  parentTaskName: string | null;
  parentStatus: string | null;
  parentStatusType?: string | null;
  items: TaskProgressItem[];
  progressPercent: number;
  message?: string;
};

function clampProgress(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function TypeBadge({ type }: { type: TaskProgressItem["type"] }) {
  const label = type === "subtask" ? "Subtask" : "Checklist";

  return <Badge tone="slate">{label}</Badge>;
}

export function TaskProgress({ requestId }: { requestId: string }) {
  const [data, setData] = useState<TaskProgressResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadTaskProgress() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/client/requests/${requestId}/tasks`);
        const result = (await response.json().catch(() => ({}))) as
          | TaskProgressResponse
          | { message?: string };

        if (!isActive) {
          return;
        }

        if (!response.ok) {
          setError(
            "message" in result && result.message
              ? result.message
              : "Unable to load task progress."
          );
          setData(null);
          return;
        }

        setData(result as TaskProgressResponse);
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load task progress."
        );
        setData(null);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadTaskProgress();

    return () => {
      isActive = false;
    };
  }, [requestId]);

  if (isLoading) {
    return <p className="mt-4 text-sm text-slate-600">Loading task progress...</p>;
  }

  if (error) {
    return <p className="mt-4 text-sm font-medium text-red-700">{error}</p>;
  }

  if (!data) {
    return null;
  }

  if (!data.linked) {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-[#50A9C0]/25 bg-[#50A9C0]/10 p-5">
        <p className="text-sm font-semibold text-slate-950">
          {data.message || "No operational task has been linked yet."}
        </p>
      </div>
    );
  }

  const progressPercent = clampProgress(data.progressPercent);

  return (
    <div className="mt-5 space-y-5">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {data.parentTaskName ? (
              <p className="text-sm font-semibold text-slate-950">
                {data.parentTaskName}
              </p>
            ) : null}
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {progressPercent}% complete
            </p>
          </div>
          {data.parentStatus ? <StatusBadge>{data.parentStatus}</StatusBadge> : null}
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#244285] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {data.items.length ? (
        <div className="divide-y divide-slate-200">
          {data.items.map((item) => (
            <Link
              key={item.id}
              href={`/client/requests/${requestId}/tasks/${encodeURIComponent(
                item.id
              )}?type=${item.type}`}
              prefetch={false}
              className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{item.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <TypeBadge type={item.type} />
                  <StatusBadge>{item.status}</StatusBadge>
                </div>
              </div>
              <TaskCompletionBadge completed={item.completed} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#50A9C0]/25 bg-[#50A9C0]/10 p-5">
          <p className="text-sm font-semibold text-slate-950">
            Detailed task steps have not been published yet.
          </p>
        </div>
      )}
    </div>
  );
}
