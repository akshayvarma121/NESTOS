import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickCapturePanel({ isOpen, onClose }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setText(""); // Reset on close
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (tag: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post("/captures", { raw_text: text, tag });
      onClose(); // Close instantly, let backend resolve
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white brutal-border brutal-shadow-lg overflow-hidden animate-in zoom-in-95 duration-200 mb-[calc(env(safe-area-inset-bottom)+80px)] sm:mb-0">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full bg-transparent p-6 text-xl font-bold outline-none resize-none placeholder-[var(--text-tertiary)] text-black"
          rows={4}
          disabled={loading}
        />

        <div className="flex p-4 gap-3 bg-[#fdfbf7] border-t-[3px] border-black">
          <button
            disabled={!text.trim() || loading}
            onClick={() => handleSubmit("dsa_win")}
            className="flex-1 py-3 px-2 text-sm font-bold bg-[#ffeb3b] text-black brutal-border hover:translate-x-1 hover:translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            DSA Win
          </button>
          <button
            disabled={!text.trim() || loading}
            onClick={() => handleSubmit("dev_milestone")}
            className="flex-1 py-3 px-2 text-sm font-bold bg-[#2ed573] text-black brutal-border hover:translate-x-1 hover:translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            Dev Milestone
          </button>
          <button
            disabled={!text.trim() || loading}
            onClick={() => handleSubmit("random")}
            className="flex-1 py-3 px-2 text-sm font-bold bg-[#a8e6cf] text-black brutal-border hover:translate-x-1 hover:translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            Random
          </button>
        </div>
      </div>
    </div>
  );
}
