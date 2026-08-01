import React from "react";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 brutal-border brutal-shadow bg-[#fdfbf7]">
      <div className="p-4 bg-[#ffeb3b] brutal-border brutal-shadow-sm mb-6">
        <Icon className="w-10 h-10 text-black" />
      </div>
      <h3 className="text-2xl font-black text-black mb-2 uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-base font-bold text-black/70 max-w-sm mb-8">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="brutal-btn bg-[#a8e6cf] text-black px-6 py-3 text-base font-black uppercase tracking-wide"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
