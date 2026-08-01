import { useState, useRef, useEffect } from "react";
import { Plus, Calendar, Lightbulb, StickyNote } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDial = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setIsOpen(!isOpen);
  };

  const handleAction = (action: () => void) => {
    if (navigator.vibrate) navigator.vibrate(10);
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative flex justify-center items-center" ref={menuRef}>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`absolute bottom-full mb-6 flex flex-col items-end gap-4 transition-all duration-300 z-50 ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-10 scale-50 pointer-events-none"
        }`}
      >
        <button
          onClick={() =>
            handleAction(() => window.dispatchEvent(new Event("open_timetable_creator")))
          }
          className="flex items-center gap-3 bg-[#a8e6cf] text-black px-4 py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-wider text-sm hover:-translate-y-1 transition-transform"
        >
          <span>New Routine</span>
          <Calendar className="w-5 h-5" />
        </button>

        <button
          onClick={() =>
            handleAction(() => window.dispatchEvent(new Event("open_opportunity_creator")))
          }
          className="flex items-center gap-3 bg-[#ffeb3b] text-black px-4 py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-wider text-sm hover:-translate-y-1 transition-transform"
        >
          <span>New Deadline</span>
          <Lightbulb className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleAction(() => navigate("/notes"))}
          className="flex items-center gap-3 bg-[#ff6b6b] text-black px-4 py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-wider text-sm hover:-translate-y-1 transition-transform"
        >
          <span>New Note</span>
          <StickyNote className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={toggleDial}
        className={`relative z-50 w-14 h-14 border-2 border-black flex flex-col items-center justify-center rounded-full -translate-y-4 hover:scale-105 active:scale-95 transition-all duration-300 ${
          isOpen ? "rotate-[135deg] bg-white text-black shadow-none" : "bg-[#ff6b6b] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        }`}
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
