import fs from 'fs';

let content = fs.readFileSync('web/src/pages/FocusPage.tsx', 'utf8');

const getBlock = (startMarker, endMarker) => {
    const start = content.indexOf(startMarker);
    const end = content.indexOf(endMarker, start);
    if (start === -1 || end === -1) {
        console.error("Missing marker: ", startMarker, " or ", endMarker);
        process.exit(1);
    }
    return content.slice(start, end);
};

const calendar = getBlock('<BrutalistCalendar', '{/* UPCOMING */}');
const upcoming = getBlock('{/* UPCOMING */}', '{/* OVERDUE */}');
const overdue = getBlock('{/* OVERDUE */}', '</div>\n\n            {/* COLUMN 2: DAILY ROUTINE & STICKY NOTES */}');

const sticky = getBlock('{/* STICKY NOTES */}', '{/* DAILY ROUTINE TIMETABLE */}');
const timetable = getBlock('{/* DAILY ROUTINE TIMETABLE */}', '{partnerRoutines.length > 0 && (');
const partner = getBlock('{partnerRoutines.length > 0 && (', '</div>\n\n            {/* COLUMN 3: TODAY\'S TASKS & PRIVATE FOCUS */}');

const today = getBlock('<div className="bg-[var(--bg-surface-raised)] brutal-border brutal-shadow p-6">', '{/* PRIVATE FOCUS */}');
const privateFocus = getBlock('{/* PRIVATE FOCUS */}', '</div>\n          </div>\n        </>\n      )}');

const newGrid = `
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
            {/* LEFT COLUMN: MAIN FOCUS */}
            <div className="space-y-8 min-w-0">
              ${calendar.trim()}

              ${timetable.trim()}

              ${partner.trim()}
            </div>

            {/* RIGHT COLUMN: SIDEBAR */}
            <div className="space-y-6 min-w-0">
              <div className="bg-[var(--bg-surface-raised)] brutal-border brutal-shadow p-6">
                ${today.replace('<div className="bg-[var(--bg-surface-raised)] brutal-border brutal-shadow p-6">', '').trim()}

              ${overdue.trim()}

              ${upcoming.trim()}

              ${privateFocus.trim()}

              ${sticky.trim()}
            </div>
          </div>
`;

const gridStart = content.indexOf('<div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_350px] gap-8 items-start">');
const gridEnd = content.indexOf('</>\n      )}', gridStart);

if (gridStart !== -1 && gridEnd !== -1) {
    content = content.slice(0, gridStart) + newGrid.trim() + '\n        ' + content.slice(gridEnd);
    
    // Contrast Fixes:
    // Fix Timetable Done Text
    content = content.replace(
        'todo.status === "done" ? "text-[var(--text-primary)]/40 line-through" : "text-[var(--text-primary)]"',
        'todo.status === "done" ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)]"'
    );
    content = content.replace(
        'routine.status === "done"\n                                        ? "line-through text-[var(--text-primary)]/40"',
        'routine.status === "done"\n                                        ? "line-through text-[var(--text-tertiary)]"'
    );
    
    // Fix Partner Timeline Opacity
    content = content.replace(
        '<div className="relative border-l-2 border-[var(--border-hairline)] ml-3 space-y-8 opacity-70">',
        '<div className="relative border-l-2 border-[var(--border-hairline)] ml-3 space-y-8">'
    );
    
    // Fix Private Focus placeholder color
    content = content.replace(
        'placeholder-black/40',
        'placeholder-[var(--text-tertiary)]'
    );
    
    fs.writeFileSync('web/src/pages/FocusPage.tsx', content);
    console.log("Restructure successful!");
} else {
    console.error("Grid start or end not found!");
}
