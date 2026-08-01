import fs from 'fs';
let content = fs.readFileSync('web/src/pages/FocusPage.tsx', 'utf8');

// 1. Fix task badges color (ensure text-black so it shows up on yellow)
content = content.replace(
    '<span className="text-[10px] font-bold bg-[#ffeb3b] brutal-border px-2 py-0.5">',
    '<span className="text-[10px] font-black text-black bg-[#ffeb3b] border border-black brutal-shadow-sm px-2 py-0.5">'
);
content = content.replace(
    '<span className="text-[10px] font-bold bg-[var(--bg-surface-raised)] brutal-border px-2 py-0.5">',
    '<span className="text-[10px] font-black text-black bg-[#ffeb3b] border border-black brutal-shadow-sm px-2 py-0.5">'
);
// Make sure overdue badges (if any) are also text-black if they use a colored background, though overdue usually uses #ff6b6b (red) which is okay with white text or black text. Let's make it consistent.
content = content.replace(
    '<span className="text-[10px] font-bold bg-[#ff6b6b] text-white brutal-border px-2 py-0.5">',
    '<span className="text-[10px] font-black bg-[#ff6b6b] text-white border border-black brutal-shadow-sm px-2 py-0.5">'
);


// 2. Make "+ Add Event" button much more visible
content = content.replace(
    '<button \n                    onClick={() => setShowEventInput(true)}\n                    className="mt-2 text-xs font-black uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"\n                  >',
    '<button \n                    onClick={() => setShowEventInput(true)}\n                    className="mt-2 bg-[var(--text-primary)] text-[var(--bg-base)] px-3 py-1.5 text-xs font-black uppercase brutal-border brutal-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"\n                  >'
);

// 3. Make "+ Add Focus Target" button more visible too, to match
content = content.replace(
    '<button \n                    onClick={() => setShowFocusInput(true)}\n                    className="mt-2 text-xs font-black uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"\n                  >',
    '<button \n                    onClick={() => setShowFocusInput(true)}\n                    className="mt-2 bg-[#2ed573] text-black px-3 py-1.5 text-xs font-black uppercase brutal-border brutal-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"\n                  >'
);

fs.writeFileSync('web/src/pages/FocusPage.tsx', content);
console.log("Badges and buttons fixed");
