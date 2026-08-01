import fs from 'fs';

let content = fs.readFileSync('web/src/pages/FocusPage.tsx', 'utf8');

const eventManagerBlock = `
              {/* SELECTED DATE EVENTS */}
              <div className="bg-[var(--bg-surface-raised)] border-t-4 border-[var(--border-brutal)] brutal-shadow-sm p-4 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] border-b-2 border-[var(--border-brutal)] pb-2 flex justify-between">
                  <span>Events & Deadlines</span>
                  <span className="text-[var(--text-secondary)]">{selectedDateStr}</span>
                </h3>
                
                <div className="space-y-2">
                  {events.filter(e => e.date === selectedDateStr).map(event => (
                    <div key={event.id} className="flex items-center justify-between group text-sm font-bold text-[var(--text-primary)] p-2 hover:bg-[var(--bg-surface)] transition-colors rounded">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#ff6b6b]" />
                        {event.title}
                      </span>
                      <button 
                         onClick={async () => {
                           try {
                             await api.delete(\`/calendar/events/\${event.id}\`);
                             setEvents(prev => prev.filter(e => e.id !== event.id));
                           } catch (err) {
                             console.error("Failed to delete event", err);
                           }
                         }}
                         className="opacity-0 group-hover:opacity-100 text-[#ff6b6b] text-xs uppercase font-black hover:underline transition-all"
                      >
                         Del
                      </button>
                    </div>
                  ))}
                  {events.filter(e => e.date === selectedDateStr).length === 0 && (
                    <p className="text-xs italic text-[var(--text-secondary)] py-2 text-center">No important dates scheduled.</p>
                  )}
                </div>

                <input
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
                          date: selectedDateStr
                        });
                        setEvents(prev => [...prev, res.data]);
                      } catch (err) {
                        console.error("Failed to add event");
                      }
                    }
                  }}
                />
              </div>
`;

// Insert right after BrutalistCalendar
const searchStr = '<BrutalistCalendar\n                currentDate={currentCalendarDate}\n                selectedDateStr={selectedDateStr}\n                events={events}\n                closeouts={closeouts}\n                onSelectDate={setSelectedDateStr}\n                onMonthChange={setCurrentCalendarDate}\n              />';

const insertIdx = content.indexOf(searchStr);

if (insertIdx !== -1) {
    const splitPoint = insertIdx + searchStr.length;
    content = content.slice(0, splitPoint) + "\n" + eventManagerBlock + content.slice(splitPoint);
    fs.writeFileSync('web/src/pages/FocusPage.tsx', content);
    console.log("Events added");
} else {
    console.error("Could not find BrutalistCalendar in FocusPage.tsx");
}
