"use client";

import React, { useEffect, useCallback, ReactNode } from "react";
import { IconX } from "@tabler/icons-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Lock scroll and attach escape listener
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-[#1A1E24] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <IconX size={20} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-black/20 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable button styles for modal footers
export function ModalButton({
  children,
  onClick,
  variant = "secondary",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
}) {
  const base = "px-5 py-2.5 rounded-lg font-semibold text-sm transition-all";
  const variants = {
    primary:
      "bg-gradient-to-b from-[#4A90D9] to-[#3A7BC8] text-white hover:from-[#5A9DE6] hover:to-[#4A8BD8] shadow-lg",
    secondary:
      "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10",
    danger:
      "bg-gradient-to-b from-[#D95555] to-[#C94545] text-white hover:from-[#E66565] hover:to-[#D95555] shadow-lg",
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}
