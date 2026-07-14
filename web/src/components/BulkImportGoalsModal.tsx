import { useState } from "react";
import { X, Code } from "lucide-react";
import { api } from "../lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportGoalsModal({ isOpen, onClose, onSuccess }: Props) {
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    setError(null);
    setLoading(true);

    try {
      let data;
      try {
        data = JSON.parse(jsonText);
      } catch (e) {
        throw new Error("Invalid JSON format. Please ensure it is a valid JSON array.");
      }

      if (!Array.isArray(data)) {
        throw new Error("The imported data must be a JSON array.");
      }

      // Loop through and POST each goal
      for (const goal of data) {
        if (!goal.title || !goal.category || !goal.deadline || !goal.total_units || !goal.unit_label) {
          throw new Error(`Goal "${goal.title || 'Untitled'}" is missing required fields (title, category, deadline, total_units, unit_label).`);
        }
        await api.post("/macro-goals", goal);
      }

      setJsonText("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to import goals");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-full md:w-[600px] bg-[var(--bg-surface-raised)] rounded-xl border border-[var(--border-hairline)] z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-[var(--text-secondary)]" />
            <h2 className="text-lg font-semibold">Bulk Import JSON</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--border-hairline)] rounded-md text-[var(--text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Paste a JSON array of goals. Each goal should have <code className="text-xs bg-[var(--bg-base)] px-1 py-0.5 rounded border border-[var(--border-hairline)]">title</code>, <code className="text-xs bg-[var(--bg-base)] px-1 py-0.5 rounded border border-[var(--border-hairline)]">category</code>, <code className="text-xs bg-[var(--bg-base)] px-1 py-0.5 rounded border border-[var(--border-hairline)]">deadline</code>, <code className="text-xs bg-[var(--bg-base)] px-1 py-0.5 rounded border border-[var(--border-hairline)]">total_units</code>, and <code className="text-xs bg-[var(--bg-base)] px-1 py-0.5 rounded border border-[var(--border-hairline)]">unit_label</code>. You can optionally provide a <code className="text-xs bg-[var(--bg-base)] px-1 py-0.5 rounded border border-[var(--border-hairline)]">customSlices</code> array (with optional <code className="text-xs bg-[var(--bg-base)] px-1 py-0.5 rounded border border-[var(--border-hairline)]">description</code> or <code className="text-xs bg-[var(--bg-base)] px-1 py-0.5 rounded border border-[var(--border-hairline)]">scheduled_date</code>).
          </p>
          
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`[
  {
    "title": "Example Goal",
    "category": "dev",
    "deadline": "2026-12-31",
    "total_units": 3,
    "unit_label": "Part",
    "customSlices": [
      { "title": "Part 1", "description": "What exactly to do" }
    ]
  }
]`}
            className="w-full h-64 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg p-3 text-sm font-mono outline-none focus:border-[var(--accent)] resize-none"
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--border-hairline)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !jsonText.trim()}
            className="px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-base)] text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Importing..." : "Import JSON"}
          </button>
        </div>
      </div>
    </>
  );
}
