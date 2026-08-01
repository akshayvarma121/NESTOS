import fs from 'fs';

let content = fs.readFileSync('web/src/pages/FocusPage.tsx', 'utf8');

// 1. Swap Calendar import
content = content.replace(
    'import BrutalistCalendar from "../components/BrutalistCalendar";',
    'import BrutalistWeekView from "../components/BrutalistWeekView";'
);

// 2. Swap Calendar usage
content = content.replace(
    /<BrutalistCalendar\s+currentDate={currentCalendarDate}\s+selectedDateStr={selectedDateStr}\s+events={events}\s+closeouts={closeouts}\s+onSelectDate={setSelectedDateStr}\s+onMonthChange={setCurrentCalendarDate}\s+\/>/g,
    `<BrutalistWeekView
                currentDate={currentCalendarDate}
                selectedDateStr={selectedDateStr}
                events={events}
                closeouts={closeouts}
                onSelectDate={setSelectedDateStr}
                onWeekChange={setCurrentCalendarDate}
              />`
);

// 3. Update main grid wrapper
content = content.replace(
    'className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start"',
    'className="flex flex-col xl:grid xl:grid-cols-[1fr_minmax(300px,_400px)] gap-16 items-start"'
);

// 4. Overdue box removal
content = content.replace(
    '<div className="p-4 bg-[var(--bg-surface-raised)] brutal-border brutal-shadow-sm space-y-4">',
    '<div className="space-y-4">'
);
content = content.replace(
    '<h2 className="text-sm font-black uppercase tracking-widest text-[#ff6b6b] border-b-2 border-[#ff6b6b] pb-2">',
    '<h2 className="text-2xl font-black uppercase tracking-tighter text-[#ff6b6b]">'
);

// 5. Upcoming box removal
content = content.replace(
    '<h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]/70 border-b-2 border-[var(--border-brutal)] pb-2 flex items-center justify-between">',
    '<h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)] flex items-center justify-between">'
);

// 6. Today box removal
content = content.replace(
    '<h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-[var(--border-brutal)] pb-3 mb-6 flex items-center justify-between text-[var(--text-primary)]">',
    '<h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center justify-between text-[var(--text-primary)]">'
);
content = content.replace(
    '<div className="mb-12">',
    '<div className="mb-12">'
); // Wait, this replace was flawed previously because I replaced it with mb-12. Let's fix this specifically:
content = content.replace(
    '<div className="bg-[var(--bg-surface-raised)] border-t-4 border-[var(--border-brutal)] brutal-shadow p-6">',
    '<div className="mb-12">'
);

// 7. Private Focus box removal
content = content.replace(
    '<h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-[var(--border-brutal)] pb-2 flex items-center justify-between text-[var(--text-primary)]">',
    '<h2 className="text-2xl font-black uppercase tracking-tighter flex items-center justify-between text-[var(--text-primary)]">'
);
content = content.replace(
    '<div className="space-y-3 bg-[var(--bg-surface-raised)] brutal-border brutal-shadow-sm p-4">',
    '<div className="space-y-4 pt-4">'
);

// 8. Daily Routine typography
content = content.replace(
    '<h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] border-b-2 border-[var(--border-brutal)] pb-2 flex items-center justify-between">',
    '<h2 className="text-3xl font-black uppercase tracking-tighter text-[var(--text-primary)] mb-4 flex items-center justify-between">'
);

// 9. Sticky Notes flow layout
content = content.replace(
    '<section className="grid grid-cols-2 gap-4">',
    '<section className="flex flex-wrap gap-6">'
);
// Randomize sticky note rotation for organic feel
let noteRotationIdx = 0;
content = content.replace(/transform -rotate-1 hover:rotate-0/g, (match) => {
    noteRotationIdx++;
    return noteRotationIdx % 2 === 0 ? "transform rotate-2 hover:rotate-0 hover:-translate-y-1 w-[180px]" : "transform -rotate-2 hover:rotate-0 hover:-translate-y-1 w-[180px]";
});

// 10. Events Manager style
content = content.replace(
    '<h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] border-b-2 border-[var(--border-brutal)] pb-2 flex justify-between">',
    '<h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] border-b-2 border-[var(--border-hairline)] pb-2 flex justify-between">'
);
content = content.replace(
    '<div className="bg-[var(--bg-surface-raised)] border-t-4 border-[var(--border-brutal)] brutal-shadow-sm p-4 space-y-4">',
    '<div className="space-y-4 pt-2">'
);


fs.writeFileSync('web/src/pages/FocusPage.tsx', content);
console.log("Dashboard Updated");
