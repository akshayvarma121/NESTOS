import { type Reminder } from "../contexts/ReminderContext";
import { useAuth } from "../contexts/AuthContext";
import { UserAvatar } from "./AvatarPicker";

interface BuddyCharacterProps {
  activeReminder: Reminder | null;
  onDismiss: () => void;
  isPip?: boolean;
}

export function BuddyCharacter({ activeReminder, onDismiss, isPip }: BuddyCharacterProps) {
  const { user } = useAuth();
  
  if (!activeReminder) return null;

  const lines = activeReminder.message.split('\n');
  const title = lines[0]?.replace(/\*\*/g, '');
  const body = lines.slice(1).join('\n');

  return (
    <div className="w-full h-full relative flex flex-col items-center pointer-events-none">
      <div className="buddy-animate-enter flex flex-col items-center relative pointer-events-auto origin-top">
        
        {/* The Thread */}
        <div className="w-[2px] h-12 bg-[var(--border-hairline)]" />
        
        {/* The Character (Avatar) */}
        <div className="z-10 bg-[var(--bg-base)] rounded-full p-1 border-2 border-[var(--border-brutal)] brutal-shadow-sm">
          <UserAvatar 
            avatarStyle={user?.user_metadata?.avatarStyle} 
            avatarSeed={user?.user_metadata?.avatarSeed} 
            size="lg"
            className="border-none"
          />
        </div>
        
        {/* Speech Bubble */}
        <div className={`absolute brutal-border brutal-shadow-lg p-3 font-mono z-20 bg-[var(--text-primary)] text-[var(--bg-base)] ${
          isPip 
            ? 'top-24 w-[140px] left-1/2 -translate-x-1/2' // Stacks below the avatar in PiP mode (160px wide)
            : 'top-16 right-[110%] mr-2 w-64' // Standard layout (right to left)
        }`}>
          {/* Tail of speech bubble */}
          {!isPip ? (
            <>
              <div className="absolute top-4 -right-[10px] w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[10px] border-l-[var(--border-brutal)]"></div>
              <div className="absolute top-[16px] -right-[7px] w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-[var(--text-primary)] z-10"></div>
            </>
          ) : (
            <>
              <div className="absolute -top-[10px] left-[50%] -translate-x-[50%] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-[var(--border-brutal)]"></div>
              <div className="absolute -top-[7px] left-[50%] -translate-x-[50%] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[var(--text-primary)] z-10"></div>
            </>
          )}
          
          <div className="flex justify-between items-start gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1">
              {activeReminder.icon && <span className="text-xl flex-shrink-0">{activeReminder.icon}</span>}
              <h4 className="font-bold text-sm m-0 leading-tight uppercase tracking-wider">{title}</h4>
            </div>
            <button 
              onClick={onDismiss} 
              className="text-[var(--bg-base)] opacity-70 hover:opacity-100 font-bold transition-opacity px-1 flex-shrink-0"
              aria-label="Dismiss reminder"
            >
              ✕
            </button>
          </div>
          
          {body && (
            <p className="text-xs m-0 mt-2 opacity-90 leading-relaxed whitespace-pre-wrap">{body}</p>
          )}
        </div>

      </div>
    </div>
  );
}
