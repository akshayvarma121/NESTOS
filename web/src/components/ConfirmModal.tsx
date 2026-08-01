import React from "react";
import { AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-[var(--bg-base)] border-4 border-[var(--border-brutal)] brutal-shadow flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`p-4 border-b-4 border-[var(--border-brutal)] flex items-center gap-3 ${danger ? 'bg-[#ff4757] text-white' : 'bg-[var(--text-primary)] text-[var(--bg-base)]'}`}>
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
        </div>
        
        <div className="p-6">
          <p className="text-[var(--text-primary)] font-medium text-sm leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="p-4 bg-[var(--bg-surface-raised)] border-t-4 border-[var(--border-brutal)] flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-black uppercase bg-[var(--bg-base)] text-[var(--text-primary)] brutal-border brutal-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 text-sm font-black uppercase brutal-border brutal-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform ${
              danger 
                ? 'bg-[#ff4757] text-white' 
                : 'bg-[var(--text-primary)] text-[var(--bg-base)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
