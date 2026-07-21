const fs = require('fs');
const file = 'web/src/components/EditTimetablePanel.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('formatTimeInput')) {
  content = content.replace(
    /import \{ getLocalDateString \} from "\.\.\/lib\/dateUtils";/,
    'import { getLocalDateString, formatTimeInput } from "../lib/dateUtils";'
  );
}

content = content.replace(
  /onChange=\{\(e\) => setStartTime\(e\.target\.value\)\}/g,
  'onChange={(e) => setStartTime(e.target.value)}\n                  onBlur={() => setStartTime(formatTimeInput(startTime))}'
);

content = content.replace(
  /onChange=\{\(e\) => setEndTime\(e\.target\.value\)\}/g,
  'onChange={(e) => setEndTime(e.target.value)}\n                  onBlur={() => setEndTime(formatTimeInput(endTime))}'
);

fs.writeFileSync(file, content);
console.log('Updated EditTimetablePanel.tsx');
