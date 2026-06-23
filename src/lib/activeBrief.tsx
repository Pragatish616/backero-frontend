import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'backero.activeBriefId';

interface ActiveBriefContextValue {
  briefId: string | null;
  setBriefId: (id: string | null) => void;
  clearBriefId: () => void;
}

const ActiveBriefContext = createContext<ActiveBriefContextValue | undefined>(undefined);

export function ActiveBriefProvider({ children }: { children: ReactNode }) {
  const [briefId, setBriefIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setBriefId = useCallback((id: string | null) => {
    setBriefIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage unavailable — ignore, state still updates in-memory */
    }
  }, []);

  const clearBriefId = useCallback(() => setBriefId(null), [setBriefId]);

  return (
    <ActiveBriefContext.Provider value={{ briefId, setBriefId, clearBriefId }}>
      {children}
    </ActiveBriefContext.Provider>
  );
}

/**
 * Returns the currently active brief_id (persisted in localStorage) plus
 * setters. Every Phase page uses this so that data saved on Phase 1 is the
 * same brief read back on Phase 2, etc.
 */
export function useActiveBrief() {
  const ctx = useContext(ActiveBriefContext);
  if (!ctx) {
    throw new Error('useActiveBrief must be used within an ActiveBriefProvider');
  }
  return ctx;
}
