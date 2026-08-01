import fs from 'fs';
let content = fs.readFileSync('web/src/pages/FocusPage.tsx', 'utf8');

const oldFocusInput = `<div className="flex gap-2">
                  <input
                    type="text"
                    value={focusTitle}
                    onChange={(e) => setFocusTitle(e.target.value)}
                    placeholder="E.g., Complete UI Mockup"
                    className="flex-1 bg-[var(--bg-surface)] p-2 outline-none text-sm font-bold placeholder-[var(--text-tertiary)] brutal-border"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addFocus();
                    }}
                  />
                  <button
                    onClick={addFocus}
                    className="bg-[#2ed573] text-black px-4 font-black uppercase text-xs brutal-border brutal-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                  >
                    Add
                  </button>
                </div>`;

const newFocusInput = `
                {showFocusInput ? (
                  <div className="flex gap-2 relative mt-2">
                    <input
                      type="text"
                      autoFocus
                      value={focusTitle}
                      onChange={(e) => setFocusTitle(e.target.value)}
                      placeholder="E.g., Complete UI Mockup"
                      className="flex-1 bg-[var(--bg-surface-raised)] p-2 outline-none text-sm font-bold placeholder-[var(--text-tertiary)] border-b-2 border-[#2ed573] shadow-lg"
                      onBlur={() => setShowFocusInput(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setShowFocusInput(false);
                        if (e.key === "Enter") {
                          addFocus();
                          setShowFocusInput(false);
                        }
                      }}
                    />
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent onBlur from firing before click
                        addFocus();
                        setShowFocusInput(false);
                      }}
                      className="bg-[#2ed573] text-black px-4 font-black uppercase text-xs hover:bg-[#28b965] transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowFocusInput(true)}
                    className="mt-2 text-xs font-black uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                  >
                    + Add Focus Target
                  </button>
                )}
`;

content = content.replace(oldFocusInput, newFocusInput);

fs.writeFileSync('web/src/pages/FocusPage.tsx', content);
console.log("Private Focus Cleaned");
