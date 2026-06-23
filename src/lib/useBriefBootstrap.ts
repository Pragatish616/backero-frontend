import { useEffect, useRef, useState } from 'react';
import { useActiveBrief } from './activeBrief';
import { dashboard, ApiError } from './api';

interface BootstrapResult {
  briefId: string | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Guarantees there is an active brief_id to work with.
 *
 * - If one is already active (set on Home.tsx, or a previous phase), it's reused.
 * - If not (e.g. the user opened /phase/1 directly with a clean localStorage),
 *   a new Draft brief is created automatically via POST /api/dashboard/briefs
 *   so the page is never stuck with nothing to save to.
 */
export function useBriefBootstrap(): BootstrapResult {
  const { briefId, setBriefId } = useActiveBrief();
  const [loading, setLoading] = useState(!briefId);
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  const createDraft = () => {
    setLoading(true);
    setError(null);
    dashboard
      .createBrief({
        title: 'Untitled Video Brief',
        creator_name: 'Local Tester',
        creator_initials: 'LT',
      })
      .then((res) => {
        setBriefId(res.brief_id);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Could not create a new brief. Is the backend running on http://localhost:8000?';
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (briefId) {
      setLoading(false);
      return;
    }
    if (attempted.current) return;
    attempted.current = true;
    createDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefId]);

  return {
    briefId,
    loading,
    error,
    retry: () => {
      attempted.current = false;
      createDraft();
    },
  };
}
