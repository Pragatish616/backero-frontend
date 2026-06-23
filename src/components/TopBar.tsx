import { useLocation } from 'react-router';
import { Bell } from 'lucide-react';
import { PhaseProgress } from './PhaseProgress';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/phase/1': 'Phase 1: Input',
  '/phase/2': 'Phase 2: Structure',
  '/phase/3': 'Phase 3: Execution',
  '/phase/4': 'Phase 4: Validation',
  '/phase/5': 'Phase 5: Output',
};

const currentPhaseMap: Record<string, number> = {
  '/': 0,
  '/phase/1': 1,
  '/phase/2': 2,
  '/phase/3': 3,
  '/phase/4': 4,
  '/phase/5': 5,
};

export function TopBar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const pageTitle = pageTitles[currentPath] || 'Dashboard';
  const currentPhase = currentPhaseMap[currentPath] || 0;

  return (
    <header className="sticky top-0 z-40 h-topbar bg-bg-primary/80 backdrop-blur-xl border-b border-border-subtle flex items-center px-6">
      <div className="flex items-center flex-1 min-w-0">
        <h1 className="text-base-medium text-text-primary truncate">{pageTitle}</h1>
      </div>

      {/* Phase Progress - center */}
      <div className="flex-1 flex justify-center">
        <PhaseProgress currentPhase={currentPhase} completedPhases={[1, 2]} />
      </div>

      {/* Right side */}
      <div className="flex items-center justify-end gap-4 flex-1">
        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-lg hover:bg-bg-tertiary flex items-center justify-center transition-colors text-text-secondary hover:text-text-primary">
          <Bell size={18} />
          {/* Unread badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse-dot" />
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-accent-dashboard/20 border border-accent-dashboard/30 flex items-center justify-center text-xs font-semibold text-accent-dashboard cursor-pointer">
          JD
        </div>
      </div>
    </header>
  );
}
