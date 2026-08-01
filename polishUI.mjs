import fs from 'fs';

let content = fs.readFileSync('web/src/pages/FocusPage.tsx', 'utf8');

// 1. Soften Today's Horizon
content = content.replace(
    'className="bg-[var(--bg-surface-raised)] brutal-border brutal-shadow p-6"',
    'className="bg-[var(--bg-surface-raised)] border-t-4 border-[var(--border-brutal)] brutal-shadow p-6"'
);

// 2. Soften Daily Routine Items
content = content.replace(
    'className={`flex flex-col p-4 brutal-border transition-colors ${',
    'className={`flex flex-col p-4 border-l-4 border-[var(--border-brutal)] transition-colors ${'
);

// 3. Fix duration badge contrast
content = content.replace(
    'className="text-[11px] font-black uppercase text-[#ffeb3b] bg-[var(--text-primary)] px-2 py-0.5 brutal-border"',
    'className="text-[11px] font-black uppercase text-black bg-[#ffeb3b] border-2 border-black px-2 py-0.5 brutal-shadow-sm"'
);

fs.writeFileSync('web/src/pages/FocusPage.tsx', content);
console.log("Replaced");
