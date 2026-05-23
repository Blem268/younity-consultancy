"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ErrorActionsProps = {
  errorId: string;
  resolved: boolean;
  retryable: boolean;
};

type ActionResponse = {
  message?: string;
};

export function ErrorActions({ errorId, resolved, retryable }: ErrorActionsProps) {
  const router = useRouter();
  const [resolutionNote, setResolutionNote] = useState("");
  const [activeAction, setActiveAction] = useState<
    "resolve" | "reopen" | "retry" | null
  >(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function runAction(action: "resolve" | "reopen" | "retry") {
    setActiveAction(action);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/internal/errors/${errorId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body:
          action === "resolve"
            ? JSON.stringify({ resolutionNote })
            : JSON.stringify({}),
      });
      const result = (await response.json().catch(() => ({}))) as ActionResponse;

      if (!response.ok) {
        setError(result.message || "Action failed.");
        return;
      }

      setMessage(result.message || "Updated.");
      if (action === "resolve") {
        setResolutionNote("");
      }
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setActiveAction(null);
    }
  }

  if (resolved) {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={Boolean(activeAction)}
          onClick={() => runAction("reopen")}
          className="w-fit rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {activeAction === "reopen" ? "Reopening..." : "Reopen"}
        </button>
        {message ? <p className="text-sm font-medium text-green-700">{message}</p> : null}
        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-2">
      <label className="grid gap-1 text-sm font-semibold text-slate-800">
        Resolution note
        <textarea
          value={resolutionNote}
          onChange={(event) => setResolutionNote(event.target.value)}
          rows={3}
          maxLength={1000}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          placeholder="Brief note for future review..."
        />
      </label>
      <button
        type="button"
        disabled={Boolean(activeAction)}
        onClick={() => runAction("resolve")}
        className="w-fit rounded-md bg-[#244285] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {activeAction === "resolve" ? "Resolving..." : "Mark Resolved"}
      </button>
      {retryable ? (
        <button
          type="button"
          disabled={Boolean(activeAction)}
          onClick={() => runAction("retry")}
          className="w-fit rounded-md border border-[#50A9C0]/30 bg-[#50A9C0]/10 px-3 py-2 text-sm font-semibold text-[#244285] transition hover:border-[#50A9C0] hover:bg-[#50A9C0]/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {activeAction === "retry" ? "Retrying..." : "Retry"}
        </button>
      ) : null}
      {message ? <p className="text-sm font-medium text-green-700">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
