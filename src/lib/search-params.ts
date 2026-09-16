import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

// Small helper over useSearchParams: read a param and patch several at once,
// dropping empty values so the URL stays clean. Used to keep table filters in
// the URL.
export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = useCallback((key: string) => searchParams.get(key) ?? "", [searchParams]);
  const getAll = useCallback((key: string) => searchParams.getAll(key), [searchParams]);

  const patch = useCallback(
    (changes: Record<string, string | string[] | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            next.delete(key);
            if (Array.isArray(value)) {
              for (const v of value) if (v) next.append(key, v);
            } else if (value) {
              next.set(key, value);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { get, getAll, patch, searchParams };
}
