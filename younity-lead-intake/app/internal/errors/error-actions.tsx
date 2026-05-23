"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ErrorActionsProps = {
  errorId: string;
  resolved: boolean;
};

type ActionResponse = {
  message?: string;
};

export function ErrorActions({ errorId, resolved }: ErrorActionsProps) {
  const router = useRouter();
  const [resolutionNote, setResolutionNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function runAction(action: "resolve" | "reopen") {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }

  if (resolved) {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => runAction("reopen")}
          className="w-fit rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Reopening..." : "Reopen"}
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
        disabled={isLoading}
        onClick={() => runAction("resolve")}
        className="w-fit rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Resolving..." : "Mark Resolved"}
      </button>
      {message ? <p className="text-sm font-medium text-green-700">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
