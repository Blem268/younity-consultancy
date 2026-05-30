export default function ClientLoading() {
  return (
    <div className="animate-pulse space-y-6 py-2">
      <div className="space-y-3 border-b border-[#50A9C0]/20 pb-6">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-10 w-2/3 max-w-md rounded-xl bg-slate-200" />
        <div className="h-4 w-full max-w-lg rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-64 rounded-3xl border border-slate-200/80 bg-white p-6"
          >
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-10 w-16 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="h-48 rounded-3xl border border-slate-200/80 bg-white" />
    </div>
  );
}
