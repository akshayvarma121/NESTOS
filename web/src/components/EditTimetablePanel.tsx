import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { X, Plus, Trash2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function EditTimetablePanel({
  isOpen,
  onClose,
  onUpdate,
}: Props) {
  const [routines, setRoutines] = useState<any[]>([]);
  const [spaceMembers, setSpaceMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Routine Form State
  const [title, setTitle] = useState("");
  const [timeLabel, setTimeLabel] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>("");

  // JSON Import State
  const [isJSONMode, setIsJSONMode] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [routinesData, membersData] = await Promise.all([
        api.get("/routines"),
        api.get("/partner/space"),
      ]);
      setRoutines(routinesData);
      setSpaceMembers(membersData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) return alert("Select at least one day");

    setIsSubmitting(true);
    try {
      await api.post("/routines", {
        title,
        time_label: timeLabel,
        days_of_week: selectedDays,
        assigned_to: assignedTo || null,
      });

      setTitle("");
      setTimeLabel("");
      setSelectedDays([]);
      setAssignedTo("");
      fetchData();
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkCreate = async () => {
    try {
      setIsSubmitting(true);
      
      let parsed;
      try {
        parsed = JSON.parse(jsonInput);
      } catch (err: any) {
        throw new Error("Failed to parse JSON: " + err.message);
      }
      
      if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array");

      for (const item of parsed) {
        if (!item.title || !Array.isArray(item.days_of_week) || item.days_of_week.length === 0) continue;
        await api.post("/routines", {
          title: item.title,
          time_label: item.time_label || "",
          days_of_week: item.days_of_week,
          assigned_to: item.assigned_to || null,
        });
      }
      setJsonInput("");
      setIsJSONMode(false);
      fetchData();
      onUpdate();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/routines/${id}`);
    fetchData();
    onUpdate();
  };

  const handleAssignChange = async (id: string, newAssignee: string | null) => {
    // Optimistic update
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, assigned_to: newAssignee } : r)),
    );
    await api.patch(`/routines/${id}`, { assigned_to: newAssignee });
    fetchData();
    onUpdate();
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[var(--bg-surface-raised)] border-l border-[var(--border-hairline)] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border-hairline)]">
          <div>
            <h2 className="text-lg font-semibold">Timetable Editor</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Configure your daily repeating routines
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--border-hairline)] rounded-md text-[var(--text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
          {/* Create Form */}
          <div className="space-y-4 p-4 border border-[var(--border-hairline)] rounded-lg bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Add Routine Block</h3>
              <button
                type="button"
                onClick={() => setIsJSONMode(!isJSONMode)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] underline"
              >
                {isJSONMode ? "Manual Entry" : "Bulk Paste JSON"}
              </button>
            </div>

            {isJSONMode ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-tertiary)]">
                  Paste a JSON array of routines. Format: <br />
                  <code className="bg-[var(--bg-base)] px-1 rounded">
                    {`[{"title": "Wake up", "time_label": "07:00", "days_of_week": ["Mon", "Tue"]}]`}
                  </code>
                </p>
                <textarea
                  rows={6}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste JSON here..."
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)] font-mono resize-none"
                />
                <button
                  onClick={handleBulkCreate}
                  disabled={isSubmitting || !jsonInput.trim()}
                  className="w-full bg-[var(--accent)] text-white py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Importing..." : "Import JSON"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="Title (e.g. Wake up)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)]"
              />
              <input
                placeholder="Time (optional, HH:MM)"
                value={timeLabel}
                onChange={(e) => setTimeLabel(e.target.value)}
                className="bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>

            <div className="flex gap-1.5 justify-between">
              {DAYS.map((day) => (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`flex-1 py-1 text-[10px] uppercase font-mono rounded border transition-colors ${
                    selectedDays.includes(day)
                      ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-base)]"
                      : "border-[var(--border-hairline)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]"
                  }`}
                >
                  {day.slice(0, 2)}
                </button>
              ))}
            </div>

            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">Assign to: Anyone (Shared)</option>
              {spaceMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.username}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--accent)] text-white py-2 rounded text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
              </form>
            )}
          </div>

          {/* List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
              <h3 className="text-sm font-medium">Active Routines</h3>
              {routines.length > 0 && (
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete ALL routines? This cannot be undone.")) {
                      try {
                        await api.delete("/routines/all");
                        fetchData();
                        onUpdate();
                      } catch (e) {
                        console.error(e);
                      }
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors"
                >
                  Reset Timetable
                </button>
              )}
            </div>
            {loading ? (
              <p className="text-sm text-[var(--text-tertiary)]">Loading...</p>
            ) : routines.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">
                No routines configured yet.
              </p>
            ) : (
              routines.map((routine) => (
                <div
                  key={routine.id}
                  className="p-3 border border-[var(--border-hairline)] rounded-lg flex items-center gap-4 bg-[var(--bg-surface)] flex-wrap"
                >
                  <div className="w-[45px] text-xs font-mono text-[var(--text-secondary)] shrink-0">
                    {routine.time_label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">
                      {routine.title}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase truncate mt-0.5">
                      {routine.days_of_week.join(", ")}
                    </p>
                  </div>
                  <select
                    className="text-xs bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded px-1.5 py-1 outline-none max-w-[100px]"
                    value={routine.assigned_to || ""}
                    onChange={(e) =>
                      handleAssignChange(routine.id, e.target.value || null)
                    }
                  >
                    <option value="">Shared</option>
                    {spaceMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.username}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDelete(routine.id)}
                    className="p-1.5 text-[var(--text-tertiary)] hover:text-red-500 rounded hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
