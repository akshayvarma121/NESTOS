import fs from 'fs';
let content = fs.readFileSync('web/src/pages/FocusPage.tsx', 'utf8');

// Add states for popups
if (!content.includes('const [showEventInput, setShowEventInput] = useState(false);')) {
    content = content.replace(
        'const [events, setEvents] = useState<any[]>([]);',
        'const [events, setEvents] = useState<any[]>([]);\n  const [showEventInput, setShowEventInput] = useState(false);\n  const [showFocusInput, setShowFocusInput] = useState(false);'
    );
}

// 1. Clean up Events Manager
const oldEventsInput = `<input
                  type="text"
                  placeholder="Mark a new date... (Press Enter)"
                  className="w-full bg-[var(--bg-surface)] outline-none text-sm font-bold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] p-3 border-2 border-[var(--border-brutal)] focus:border-[var(--accent)] transition-colors"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      const title = e.currentTarget.value.trim();
                      e.currentTarget.value = "";
                      try {
                        const res = await api.post("/calendar/events", {
                          title,
                          date: selectedDateStr,
                        });
                        setEvents((prev) => [...prev, res.data]);
                      } catch (err) {
                        console.error("Failed to add event");
                      }
                    }
                  }}
                />`;
const newEventsInput = `
                {showEventInput ? (
                  <div className="relative mt-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Mark a new date... (Press Enter)"
                      className="w-full bg-[var(--bg-surface-raised)] outline-none text-sm font-bold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] p-3 border-b-2 border-[var(--accent)] transition-colors shadow-lg"
                      onBlur={() => setShowEventInput(false)}
                      onKeyDown={async (e) => {
                        if (e.key === "Escape") setShowEventInput(false);
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          const title = e.currentTarget.value.trim();
                          e.currentTarget.value = "";
                          try {
                            const res = await api.post("/calendar/events", {
                              title,
                              date: selectedDateStr,
                            });
                            setEvents((prev) => [...prev, res.data]);
                            setShowEventInput(false);
                          } catch (err) {
                            console.error("Failed to add event");
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowEventInput(true)}
                    className="mt-2 text-xs font-black uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                  >
                    + Add Event
                  </button>
                )}
`;
content = content.replace(oldEventsInput, newEventsInput);

fs.writeFileSync('web/src/pages/FocusPage.tsx', content);
console.log("Events Cleaned");
