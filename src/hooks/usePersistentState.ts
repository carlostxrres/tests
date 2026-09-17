import { useCallback, useState } from "react";

// useState backed by localStorage. Storage can be unavailable (private mode) or
// hold stale JSON, so every access is guarded and falls back to the initial
// value — same shape as useTheme's reader/writer.
export function usePersistentState<T>(
  key: string,
  initial: T,
  // Narrows whatever was stored back to T; returning null falls back.
  parse: (stored: unknown) => T | null,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      return parse(JSON.parse(raw)) ?? initial;
    } catch {
      return initial;
    }
  });

  const store = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage may be unavailable (private mode); the in-memory value still applies.
      }
    },
    [key],
  );

  return [value, store];
}
