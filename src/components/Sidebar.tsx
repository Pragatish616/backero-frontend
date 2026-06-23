import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Film, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const phaseColors: Record<string, string> = {
  '/': '#6366F1',
  '/phase/1': '#06D6A0',
  '/phase/2': '#F59E0B',
  '/phase/3': '#EF4444',
  '/phase/4': '#8B5CF6',
  '/phase/5': '#0EA5E9',
  '/phase/6': '#F59E0B',
};

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, phase: 0 },
  { path: '/phase/1', label: 'Phase 1: Input', phase: 1 },
  { path: '/phase/2', label: 'Phase 2: Structure', phase: 2 },
  { path: '/phase/3', label: 'Phase 3: Execution', phase: 3 },
  { path: '/phase/4', label: 'Phase 4: Validation', phase: 4 },
  { path: '/phase/5', label: 'Phase 5: Output', phase: 5 },
  { path: '/phase/6', label: 'Phase 6: Node Editor', phase: 6 },
];

// Sample status for demo
const phaseStatus: Record<number, 'completed' | 'in-progress' | 'pending' | 'not-started'> = {
  0: 'in-progress',
  1: 'completed',
  2: 'completed',
  3: 'in-progress',
  4: 'pending',
  5: 'not-started',
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const currentPath = location.pathname;
  const accentColor = phaseColors[currentPath] || '#6366F1';

  const getStatusDot = (phase: number) => {
    const status = phaseStatus[phase];
    if (status === 'completed') return { color: '#22C55E', label: 'Completed' };
    if (status === 'in-progress') return { color: phaseColors[`/phase/${phase}`] || '#6366F1', label: 'In Progress' };
    if (status === 'pending') return { color: '#F59E0B', label: 'Pending' };
    return { color: '#5C6370', label: 'Not Started' };
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-bg-secondary border-r border-border-subtle z-50 flex flex-col transition-all duration-300',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
      )}
      style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border-subtle overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Film size={18} style={{ color: accentColor }} />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-bold text-text-primary whitespace-nowrap"
            >
              ViralForm
            </motion.span>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const itemColor = phaseColors[item.path] || '#6366F1';
            const status = getStatusDot(item.phase);

            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 h-12 px-3 rounded-lg transition-all duration-200 relative group',
                    isActive && 'bg-[var(--active-bg)]',
                    !isActive && 'hover:bg-bg-tertiary'
                  )}
                  style={isActive ? {
                    '--active-bg': `${itemColor}14`,
                    borderLeft: `3px solid ${itemColor}`,
                  } as React.CSSProperties : {
                    borderLeft: '3px solid transparent',
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Phase number badge or icon */}
                  {item.phase === 0 ? (
                    <LayoutDashboard size={18} className="flex-shrink-0" style={{ color: isActive ? itemColor : '#9BA3B4' }} />
                  ) : (
                    <span
                      className={cn(
                        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        isActive ? 'text-text-inverse' : 'text-text-secondary'
                      )}
                      style={{ backgroundColor: isActive ? itemColor : '#252932' }}
                    >
                      {item.phase}
                    </span>
                  )}

                  {!collapsed && (
                    <>
                      <span
                        className={cn(
                          'flex-1 text-left text-sm-medium truncate',
                          isActive ? 'text-text-primary' : 'text-text-secondary'
                        )}
                      >
                        {item.label}
                      </span>
                      {/* Status dot */}
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: status.color }}
                        title={status.label}
                      />
                    </>
                  )}

                  {collapsed && (
                    <span
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border-subtle">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center h-10 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
