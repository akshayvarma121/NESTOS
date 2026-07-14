import { useState } from "react";
import { X, ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function CreateGoalPanel({ isOpen, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "dev",
    total_units: 10 as number | string,
    unit_label: "chapters",
    deadline: new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
  });

  const [slices, setSlices] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const units = typeof form.total_units === "number" ? form.total_units : (parseInt(form.total_units) || 0);
    // Generate initial slices
    const initialSlices = Array.from({ length: units }, (_, i) => ({
      id: `temp-${i}`,
      title: `${form.unit_label} ${i + 1}`,
      scheduled_date: "", // Optional date assignment
    }));
    setSlices(initialSlices);
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit({
      ...form,
      total_units: slices.length,
      customSlices: slices,
    });
    setLoading(false);
    // Reset state and close
    setStep(1);
    onClose();
  };

  const updateSlice = (id: string, field: string, value: string) => {
    setSlices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[var(--bg-surface-raised)] border-l border-[var(--border-hairline)] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="p-1 hover:bg-[var(--border-hairline)] rounded-md text-[var(--text-secondary)]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {step === 1 ? "New Macro Goal" : "Edit Goal Slices"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--border-hairline)] rounded-md text-[var(--text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <form
            onSubmit={handleNext}
            className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Goal Title
              </label>
              <input
                required
                autoFocus
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                placeholder="e.g. Operating Systems Syllabus"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="academic">Academic</option>
                <option value="dsa">DSA</option>
                <option value="dev">Dev</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Total Units (Slices)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max="500"
                  value={form.total_units}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      total_units: e.target.value === "" ? "" : parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Unit Label
                </label>
                <input
                  required={(typeof form.total_units === "number" ? form.total_units : parseInt(form.total_units || "0")) > 0}
                  value={form.unit_label}
                  onChange={(e) =>
                    setForm({ ...form, unit_label: e.target.value })
                  }
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  placeholder="e.g. Chapter"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Deadline
              </label>
              <input
                required
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[var(--text-primary)] text-[var(--bg-base)] font-medium py-2 rounded-md hover:bg-white transition-colors mt-4"
            >
              Next: Edit Slices
            </button>
          </form>
        ) : (
          <div className="p-4 md:p-6 flex-1 overflow-hidden space-y-4 flex flex-col">
            <p className="text-xs text-[var(--text-secondary)] mb-2 flex-shrink-0">
              Your goal has been sliced into {slices.length} micro-tasks. You
              can rename them or pre-assign them to specific dates. Any task
              without a date will go to the Canvas Backlog.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-xl p-3">
              {slices.map((slice, i) => (
                <div
                  key={slice.id}
                  className="flex flex-col gap-1 pb-3 border-b border-[var(--border-hairline)] last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--text-tertiary)] w-6 text-right">
                      {i + 1}.
                    </span>
                    <input
                      value={slice.title}
                      onChange={(e) =>
                        updateSlice(slice.id, "title", e.target.value)
                      }
                      placeholder="Task Title"
                      className="flex-1 bg-transparent border-b border-transparent focus:border-[var(--accent)] outline-none text-sm text-[var(--text-primary)] px-1 py-0.5 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setSlices(slices.filter(s => s.id !== slice.id))}
                      className="p-1 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-8">
                    <input
                      type="date"
                      value={slice.scheduled_date || ""}
                      onChange={(e) =>
                        updateSlice(slice.id, "scheduled_date", e.target.value)
                      }
                      className="bg-transparent border border-[var(--border-hairline)] rounded px-1.5 py-0.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--text-primary)] font-mono"
                    />
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      Optional Date
                    </span>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setSlices([...slices, { id: `manual-${Date.now()}`, title: `${form.unit_label} ${slices.length + 1}`, scheduled_date: "" }])}
                className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-[var(--border-hairline)] rounded-lg text-sm text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors mt-2"
              >
                <Plus className="w-4 h-4" />
                Add Sub-Slice
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-shrink-0 w-full bg-[#10b981] text-[var(--bg-base)] font-medium py-2 rounded-md hover:bg-opacity-90 transition-colors mt-4 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Confirm & Create Goal"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
