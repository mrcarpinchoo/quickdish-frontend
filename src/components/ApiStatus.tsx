import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";

type Status = "checking" | "online" | "offline";

const labels: Record<Status, string> = {
  checking: "Comprobando API…",
  online: "API en línea",
  offline: "API sin conexión"
};

/** Calls GET /health once on mount, so the header shows whether the API answers. */
export function ApiStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;

    apiRequest<{ status: string }>("/health").then(
      () => {
        if (active) setStatus("online");
      },
      () => {
        if (active) setStatus("offline");
      }
    );

    return () => {
      active = false;
    };
  }, []);

  return (
    <span
      role="status"
      className="text-xs text-stone-600"
    >
      {labels[status]}
    </span>
  );
}
