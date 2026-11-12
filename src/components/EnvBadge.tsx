type EnvBadgeProps = {
  environment: string;
  version: string;
};

const toneByEnvironment: Record<string, string> = {
  PROD: "bg-red-100 text-red-900 ring-red-300",
  DEV: "bg-amber-100 text-amber-900 ring-amber-300",
  LOCAL: "bg-sky-100 text-sky-900 ring-sky-300"
};

const fallbackTone = "bg-stone-100 text-stone-800 ring-stone-300";

/** Shows which environment and build the page is running, so Dev and Prod are easy to tell apart. */
export function EnvBadge({ environment, version }: EnvBadgeProps) {
  const tone = toneByEnvironment[environment] ?? fallbackTone;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone}`}
    >
      {environment} · {version}
    </span>
  );
}
