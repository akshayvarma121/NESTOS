import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { StickyNote, Plus, Trash2, Edit2, Check } from "lucide-react";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("general");
  const [newColor, setNewColor] = useState("yellow");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const colors = [
    {
      value: "yellow",
      label: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    },
    { value: "pink", label: "bg-pink-500/20 text-pink-500 border-pink-500/30" },
    { value: "blue", label: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
    {
      value: "green",
      label: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    },
  ];

  const fetchNotes = async () => {
    try {
      const data = await api.get("/notes");
      setNotes(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const data = await api.post("/notes", {
      content: newContent,
      type: newType,
      color: newColor,
    });
    setNotes((prev) => [data, ...prev]);
    setNewContent("");
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/notes/${id}`);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const startEditing = (note: any) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = async (id: string, originalData: any) => {
    if (!editContent.trim()) return setEditingId(null);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content: editContent } : n)),
    );
    await api.patch(`/notes/${id}`, { ...originalData, content: editContent });
    setEditingId(null);
  };

  const toggleType = async (note: any) => {
    const newT = note.type === "dashboard" ? "general" : "dashboard";
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, type: newT } : n)),
    );
    await api.patch(`/notes/${note.id}`, { ...note, type: newT });
  };

  if (loading)
    return (
      <div className="p-6 text-[var(--text-secondary)]">Loading notes...</div>
    );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-8">
        <StickyNote className="w-5 h-5 text-[var(--accent)]" />
        <h1 className="text-2xl font-semibold">Notes & Stickies</h1>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-4 mb-8">
        <form onSubmit={handleAdd} className="space-y-4">
          <textarea
            required
            placeholder="Jot something down..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)] min-h-[80px]"
          />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-1.5 rounded text-sm outline-none"
              >
                <option value="general">General Note</option>
                <option value="dashboard">Dashboard Sticky</option>
              </select>

              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 ${c.label.split(" ")[0]} ${newColor === c.value ? "border-white" : "border-transparent"}`}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="bg-[var(--text-primary)] text-[var(--bg-base)] px-4 py-1.5 rounded text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Note
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] col-span-2">
            No notes yet.
          </p>
        ) : (
          notes.map((note) => {
            const colorClass =
              colors.find((c) => c.value === note.color)?.label ||
              colors[0].label;

            return (
              <div
                key={note.id}
                className={`p-4 border rounded-xl flex flex-col justify-between gap-4 ${colorClass}`}
              >
                {editingId === note.id ? (
                  <textarea
                    autoFocus
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-black/10 border border-black/20 rounded p-2 text-sm outline-none resize-none"
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap flex-1">
                    {note.content}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-current/10 pt-3 mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleType(note)}
                      className="text-xs bg-black/10 px-2 py-1 rounded hover:bg-black/20 transition-colors flex items-center gap-1"
                    >
                      {note.type === "dashboard"
                        ? "📌 Dashboard"
                        : "📝 General"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId === note.id ? (
                      <button
                        onClick={() => saveEdit(note.id, note)}
                        className="p-1 hover:bg-black/10 rounded transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(note)}
                        className="p-1 hover:bg-black/10 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 hover:bg-black/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
