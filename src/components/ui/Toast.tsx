"use client";

import React, { useEffect, useState, useCallback, createContext, useContext, ReactNode } from "react";
import { IconX, IconCheck, IconInfoCircle, IconAlertTriangle } from "@tabler/icons-react";

// ============================================================================
// TYPES
// ============================================================================

type ToastType = "success" | "info" | "warning" | "error";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  duration?: number; // ms, 0 = no auto-dismiss
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000, // Default 5 seconds
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// TOAST CONTAINER (renders in bottom-right corner)
// ============================================================================

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ============================================================================
// INDIVIDUAL TOAST ITEM
// ============================================================================

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 150); // Wait for exit animation
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 150);
  };

  const handleAction = () => {
    if (toast.action?.onClick) {
      toast.action.onClick();
    }
    if (toast.action?.href) {
      window.location.href = toast.action.href;
    }
    handleDismiss();
  };

  // Icon and accent color based on type
  const config = {
    success: {
      icon: IconCheck,
      accentColor: "#2BD899",
      bgAccent: "bg-[#2BD899]/10",
      borderAccent: "border-[#2BD899]/30",
    },
    info: {
      icon: IconInfoCircle,
      accentColor: "#4A90D9",
      bgAccent: "bg-[#4A90D9]/10",
      borderAccent: "border-[#4A90D9]/30",
    },
    warning: {
      icon: IconAlertTriangle,
      accentColor: "#F5A623",
      bgAccent: "bg-[#F5A623]/10",
      borderAccent: "border-[#F5A623]/30",
    },
    error: {
      icon: IconAlertTriangle,
      accentColor: "#D95555",
      bgAccent: "bg-[#D95555]/10",
      borderAccent: "border-[#D95555]/30",
    },
  };

  const { icon: Icon, accentColor, bgAccent, borderAccent } = config[toast.type];

  return (
    <div
      className={`
        pointer-events-auto w-[360px] bg-[#1A1E24] border border-white/10 rounded-xl shadow-2xl
        ${isExiting ? "animate-out fade-out slide-out-to-right duration-150" : "animate-in fade-in slide-in-from-right duration-200"}
      `}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${bgAccent} border ${borderAccent}`}
        >
          <Icon size={20} style={{ color: accentColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[0.9375rem] font-semibold text-white leading-snug">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-[0.875rem] text-white/60 leading-relaxed mt-1">
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={handleAction}
              className="mt-2 text-[0.875rem] font-semibold text-[#6B9BD1] hover:text-[#8BB5E8] transition-colors"
            >
              {toast.action.label} →
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// CONVENIENCE FUNCTIONS (for use without context if needed)
// ============================================================================

// Export types for external use
export type { Toast, ToastType };
