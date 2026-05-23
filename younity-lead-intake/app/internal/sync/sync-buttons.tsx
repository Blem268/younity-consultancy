"use client";

import { useState } from "react";

type SyncResult = {
  success: boolean;
  checked: number;
  updated: number;
  skipped: number;
  errors: Array<{
    requestId: string;
    clickUpTaskId?: string;
    message: string;
  }>;
};

type SyncErrorResponse = {
  message?: string;
  error?: string;
};

type SyncState = {
  isLoading: boolean;
  result: SyncResult | null;
  error: string;
};

type RegisterState = {
  isLoading: boolean;
  message: string;
  error: string;
  webhookId: string | null;
};

const initialSyncState: SyncState = {
  isLoading: false,
  result: null,
  error: "",
};

const initialRegisterState: RegisterState = {
  isLoading: false,
  message: "",
  error: "",
  webhookId: null,
};

function SyncResultPanel({ state }: { state: SyncState }) {
  if (state.error) {
    return <p className="mt-4 text-sm font-medium text-red-700">{state.error}</p>;
  }

  if (!state.result) {
    return null;
  }

  return (
    <div className="mt-4 rounded-md border border-teal-900/10 bg-teal-50/40 p-4">
      <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
        <p>
          <span className="font-semibold text-slate-950">Checked:</span>{" "}
          {state.result.checked}
        </p>
        <p>
          <span className="font-semibold text-slate-950">Updated:</span>{" "}
          {state.result.updated}
        </p>
        <p>
          <span className="font-semibold text-slate-950">Skipped:</span>{" "}
          {state.result.skipped}
        </p>
      </div>

      {state.result.errors.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-slate-950">Errors</p>
          {state.result.errors.map((error) => (
            <p
              key={`${error.requestId}-${error.clickUpTaskId || "no-task"}`}
              className="text-sm leading-6 text-red-700"
            >
              {error.requestId}: {error.message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SyncButtons() {
  const [statusSync, setStatusSync] = useState<SyncState>(initialSyncState);
  const [billingSync, setBillingSync] = useState<SyncState>(initialSyncState);
  const [webhookRegistration, setWebhookRegistration] =
    useState<RegisterState>(initialRegisterState);

  async function runSync(
    endpoint: string,
    setState: React.Dispatch<React.SetStateAction<SyncState>>
  ) {
    setState({
      isLoading: true,
      result: null,
      error: "",
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as
        | SyncResult
        | SyncErrorResponse;

      if (!response.ok) {
        const errorMessage =
          "message" in result
            ? result.message
            : "error" in result
              ? result.error
              : "";

        setState({
          isLoading: false,
          result: null,
          error: errorMessage || "Sync failed.",
        });
        return;
      }

      setState({
        isLoading: false,
        result: result as SyncResult,
        error: "",
      });
    } catch (error) {
      setState({
        isLoading: false,
        result: null,
        error: error instanceof Error ? error.message : "Sync failed.",
      });
    }
  }

  async function registerWebhook() {
    setWebhookRegistration({
      isLoading: true,
      message: "",
      error: "",
      webhookId: null,
    });

    try {
      const response = await fetch("/api/internal/clickup-webhook/register", {
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        webhookId?: string | null;
      };

      if (!response.ok) {
        setWebhookRegistration({
          isLoading: false,
          message: "",
          error: result.message || "Webhook registration failed.",
          webhookId: null,
        });
        return;
      }

      setWebhookRegistration({
        isLoading: false,
        message: result.message || "ClickUp webhook registered.",
        error: "",
        webhookId: result.webhookId || null,
      });
    } catch (error) {
      setWebhookRegistration({
        isLoading: false,
        message: "",
        error:
          error instanceof Error
            ? error.message
            : "Webhook registration failed.",
        webhookId: null,
      });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 lg:col-span-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          ClickUp Webhook Status
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          ClickUp webhooks can update request status and billing fields
          automatically. Manual sync remains available below as a fallback.
        </p>
        <button
          type="button"
          disabled={webhookRegistration.isLoading}
          onClick={registerWebhook}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {webhookRegistration.isLoading
            ? "Registering..."
            : "Register ClickUp Webhook"}
        </button>
        {webhookRegistration.error ? (
          <p className="mt-4 text-sm font-medium text-red-700">
            {webhookRegistration.error}
          </p>
        ) : null}
        {webhookRegistration.message ? (
          <div className="mt-4 rounded-md border border-teal-900/10 bg-teal-50/40 p-4 text-sm leading-6 text-slate-700">
            <p>{webhookRegistration.message}</p>
            {webhookRegistration.webhookId ? (
              <p className="mt-2 font-mono text-xs text-slate-600">
                Webhook ID: {webhookRegistration.webhookId}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          ClickUp Status Sync
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pull task status updates from ClickUp into client portal requests.
        </p>
        <button
          type="button"
          disabled={statusSync.isLoading}
          onClick={() => runSync("/api/internal/run-status-sync", setStatusSync)}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {statusSync.isLoading ? "Running..." : "Run Status Sync"}
        </button>
        <SyncResultPanel state={statusSync} />
      </section>

      <section className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          ClickUp Billing Sync
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pull billing preparation fields from ClickUp into client portal
          requests.
        </p>
        <button
          type="button"
          disabled={billingSync.isLoading}
          onClick={() =>
            runSync("/api/internal/run-billing-sync", setBillingSync)
          }
          className="mt-5 inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {billingSync.isLoading ? "Running..." : "Run Billing Sync"}
        </button>
        <SyncResultPanel state={billingSync} />
      </section>
    </div>
  );
}
