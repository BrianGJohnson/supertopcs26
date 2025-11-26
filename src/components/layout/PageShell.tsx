import React from "react";

interface PageShellProps {
  children: React.ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
        {children}
      </div>
    </div>
  );
}
