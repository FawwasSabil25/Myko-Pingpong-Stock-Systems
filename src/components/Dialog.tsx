"use client";

import { useEffect } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Base dialog shell — overlay + centered card */
export function Dialog({ open, onClose, children }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
      />
      {/* Card */}
      <div
        className="relative bg-white rounded-2xl w-full max-w-[358px] animate-[scaleIn_200ms_ease-out]"
        style={{
          boxShadow:
            "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Confirmation Dialog ─── */

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "default" | "danger";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Simpan",
  cancelLabel = "Batal",
  loading = false,
  variant = "default",
}: ConfirmDialogProps) {
  const iconBg =
    variant === "danger" ? "bg-red-50" : "bg-[rgba(0,100,124,0.1)]";
  const iconColor = variant === "danger" ? "text-red-500" : "text-[#00647C]";
  const btnBg = variant === "danger" ? "#DC2626" : "#00647C";

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex flex-col items-center pt-6 pb-6 px-6">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center mb-4`}
        >
          {variant === "danger" ? (
            <svg
              className={iconColor}
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          ) : (
            <svg
              className={iconColor}
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
            </svg>
          )}
        </div>

        {/* Text */}
        <h3
          className="text-2xl font-semibold text-center mb-2"
          style={{ color: "#191C1E" }}
        >
          {title}
        </h3>
        <p
          className="text-base text-center leading-6 mb-6"
          style={{ color: "#3E484D" }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-12 rounded-lg text-white font-medium text-base transition-opacity disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
            style={{
              backgroundColor: btnBg,
              boxShadow:
                "0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full h-12 rounded-lg font-medium text-base border border-[#BDC8CE] transition-colors hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
            style={{ color: "#3E484D" }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/* ─── Success Dialog ─── */

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttonLabel?: string;
}

export function SuccessDialog({
  open,
  onClose,
  title,
  message,
  buttonLabel = "Kembali ke Daftar Produk",
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex flex-col items-center pt-8 pb-6 px-8">
        {/* Checkmark icon */}
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <svg
            className="text-green-500"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <h3
          className="text-xl font-semibold text-center mb-2"
          style={{ color: "#191C1E" }}
        >
          {title}
        </h3>
        {message && (
          <p
            className="text-sm text-center leading-5 mb-4"
            style={{ color: "#3E484D" }}
          >
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-lg text-white font-medium text-base cursor-pointer mt-2"
          style={{ backgroundColor: "#00647C" }}
        >
          {buttonLabel}
        </button>
      </div>
    </Dialog>
  );
}
