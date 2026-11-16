import { useEffect } from "react";

/** Runs `load` now and then every `intervalMs`, until the component unmounts. */
export function usePoll(load: () => Promise<void>, intervalMs: number) {
  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), intervalMs);
    return () => window.clearInterval(id);
  }, [load, intervalMs]);
}

/** How often order screens reload, so admin changes show up without a refresh. */
export const ORDER_REFRESH_MS = 15_000;
