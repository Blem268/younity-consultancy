function getServiceAccent(service: string) {
  const normalized = service.toLowerCase();

  if (normalized.includes("bookkeeping")) {
    return { bg: "bg-[#244285]/12", text: "text-[#244285]", stroke: "#244285" };
  }

  if (normalized.includes("payroll")) {
    return { bg: "bg-[#50A9C0]/15", text: "text-[#244285]", stroke: "#50A9C0" };
  }

  if (normalized.includes("tax")) {
    return { bg: "bg-amber-100", text: "text-amber-800", stroke: "#d97706" };
  }

  if (normalized.includes("compliance")) {
    return { bg: "bg-[#071a33]/10", text: "text-[#071a33]", stroke: "#071a33" };
  }

  if (normalized.includes("hr")) {
    return { bg: "bg-green-100", text: "text-green-800", stroke: "#15803d" };
  }

  if (normalized.includes("administration")) {
    return { bg: "bg-slate-100", text: "text-slate-700", stroke: "#475569" };
  }

  if (normalized.includes("strategic") || normalized.includes("advisory")) {
    return { bg: "bg-[#50A9C0]/12", text: "text-[#244285]", stroke: "#244285" };
  }

  return { bg: "bg-[#244285]/10", text: "text-[#244285]", stroke: "#244285" };
}

export function ServiceIcon({ service }: { service: string }) {
  const accent = getServiceAccent(service);
  const normalized = service.toLowerCase();

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.bg} ${accent.text}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        {normalized.includes("bookkeeping") ? (
          <path
            d="M5 6h14v12H5zM8 10h8M8 14h5"
            stroke={accent.stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : normalized.includes("payroll") ? (
          <path
            d="M7 8h10v8H7zM10 11h4M10 14h3"
            stroke={accent.stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : normalized.includes("tax") ? (
          <path
            d="M8 7h8l-1 10H9L8 7zM10 10h4"
            stroke={accent.stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M6 8h12v8H6zM9 11h6M9 14h4"
            stroke={accent.stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </span>
  );
}
