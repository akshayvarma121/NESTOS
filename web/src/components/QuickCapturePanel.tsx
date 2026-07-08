import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickCapturePanel({ isOpen, onClose }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setText(''); // Reset on close
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (tag: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post('/captures', { raw_text: text, tag });
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
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-150" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 mb-16 sm:mb-0">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full bg-transparent p-6 text-lg outline-none resize-none placeholder-[var(--text-tertiary)] text-[var(--text-primary)]"
          rows={4}
          disabled={loading}
        />
        
        <div className="flex p-2 gap-2 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)]">
          <button 
            disabled={!text.trim() || loading}
            onClick={() => handleSubmit('dsa_win')}
            className="flex-1 py-3 px-2 rounded-xl text-sm font-medium bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 disabled:hover:border-[var(--border-hairline)] disabled:hover:text-[var(--text-primary)]"
          >
            DSA Win
          </button>
          <button 
            disabled={!text.trim() || loading}
            onClick={() => handleSubmit('dev_milestone')}
            className="flex-1 py-3 px-2 rounded-xl text-sm font-medium bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] hover:border-[#10b981] hover:text-[#10b981] transition-colors disabled:opacity-50 disabled:hover:border-[var(--border-hairline)] disabled:hover:text-[var(--text-primary)]"
          >
            Dev Milestone
          </button>
          <button 
            disabled={!text.trim() || loading}
            onClick={() => handleSubmit('random')}
            className="flex-1 py-3 px-2 rounded-xl text-sm font-medium bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors disabled:opacity-50 disabled:hover:border-[var(--border-hairline)] disabled:hover:text-[var(--text-primary)]"
          >
            Random
          </button>
        </div>
      </div>
    </div>
  );
}
