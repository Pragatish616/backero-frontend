import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="ml-sidebar">
        {/* Top Bar */}
        <TopBar />

        {/* Page content */}
        <main className={cn('p-8', className)}>
          <div className="max-w-content mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
