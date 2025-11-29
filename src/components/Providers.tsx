"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Client-side providers wrapper
 * Add any context providers here that need to wrap the entire app
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
