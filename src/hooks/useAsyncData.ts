import { useState, useEffect, useCallback } from "react";

/**
 * Hook that loads data asynchronously and provides a reload function.
 * Replaces the synchronous `useMemo(() => service.getAll(companyId), [refresh])` pattern.
 */
export function useAsyncData<T>(
    fetcher: () => Promise<T>,
    deps: any[] = []
): { data: T | undefined; loading: boolean; error: string | null; reload: () => void } {
    const [data, setData] = useState<T | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trigger, setTrigger] = useState(0);

    const reload = useCallback(() => setTrigger((t) => t + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetcher()
            .then((result) => {
                if (!cancelled) { setData(result); setError(null); }
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || "Erro ao carregar dados.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [trigger, ...deps]);

    return { data, loading, error, reload };
}
