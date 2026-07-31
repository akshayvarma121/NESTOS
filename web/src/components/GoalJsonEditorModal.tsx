import { useState, useEffect } from "react";
import { X, Code } from "lucide-react";
import { api } from "../lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: any;
}

export default function GoalJsonEditorModal({ isOpen, onClose, onSuccess, goal }: Props) {
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && goal) {
      const formattedGoal = {
        title: goal.title,
        category: goal.category,
        deadline: goal.deadline ? goal.deadline.split('T')[0] : goal.deadline,
        total_units: goal.total_units,
        unit_label: goal.unit_label,
        customSlices: goal.micro_tasks || [],
      };
      setJsonText(JSON.stringify(formattedGoal, null, 2));
      setError(null);
    }
  }, [isOpen, goal]);

  if (!isOpen || !goal) return null;

  const handleSave = async () => {
    setError(null);
    setLoading(true);

    try {
      let data;
      try {
        data = JSON.parse(jsonText);
      } catch (e) {
        throw new Error("Invalid JSON format.");
      }

      if (!data.title || !data.category || !data.deadline || !data.total_units || !data.unit_label) {
        throw new Error("Missing required fields (title, category, deadline, total_units, unit_label).");
      }

      await api.put(`/macro-goals/${goal.id}`, data);

      setJsonText("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update goal");
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
            <h2 className="text-lg font-semibold">Edit Goal JSON</h2>
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
            Edit the JSON for this goal.
          </p>
          
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
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
            onClick={handleSave}
            disabled={loading || !jsonText.trim()}
            className="px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-base)] text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save JSON"}
          </button>
        </div>
      </div>
    </>
  );
}
