import { useEffect, useState } from "react";

export default function BuddyPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Force transparency for this specific route
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";
    document.body.style.backgroundImage = "none";
    document.documentElement.style.backgroundImage = "none";

    let windowShowTimeout: ReturnType<typeof setTimeout>;

    async function initWindow() {
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        try {
          const { getCurrentWindow, LogicalPosition } = await import('@tauri-apps/api/window');
          const { primaryMonitor } = await import('@tauri-apps/api/window');
          
          const appWindow = getCurrentWindow();
          const monitor = await primaryMonitor();
          
          if (monitor) {
            // Monitor bounds and scale factor
            const scaleFactor = monitor.scaleFactor;
            const logicalWidth = monitor.size.width / scaleFactor;
            const logicalHeight = monitor.size.height / scaleFactor;
            
            const windowWidth = 140;
            const windowHeight = 170;
            // Margin from the edge (e.g. above taskbar on windows)
            const marginX = 20;
            const marginY = 60; 
            
            const x = logicalWidth - windowWidth - marginX;
            const y = logicalHeight - windowHeight - marginY;
            
            await appWindow.setPosition(new LogicalPosition(x, y));
          }
          
          // Show the window slightly after the animation starts to prevent flash
          setMounted(true);
          windowShowTimeout = setTimeout(() => {
            appWindow.show();
          }, 50);
        } catch (e) {
          console.error("Failed to init buddy window", e);
          setMounted(true);
        }
      } else {
        // Fallback if testing in browser
        setMounted(true);
      }
    }

    initWindow();

    return () => {
      clearTimeout(windowShowTimeout);
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col items-center justify-start relative select-none">
      <style>{`
        body { background: transparent !important; }
        html { background: transparent !important; }
        #root { background: transparent !important; }
        
        @keyframes spider-drop {
          0% { transform: translateY(-100%); }
          60% { transform: translateY(10%); }
          80% { transform: translateY(-5%); }
          100% { transform: translateY(0); }
        }
        
        @keyframes spider-swing {
          0% { transform: rotate(-5deg); }
          100% { transform: rotate(5deg); }
        }
        
        .animate-spider-drop {
          animation: spider-drop 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards,
                     spider-swing 3s ease-in-out 1.2s infinite alternate;
        }
      `}</style>

      {mounted && (
        <div className="animate-spider-drop origin-top">
          {/* Thread */}
          <div className="w-[2px] h-[50px] bg-gray-400 mx-auto opacity-70" />
          
          {/* Character */}
          <div className="w-[48px] h-[48px] bg-[var(--text-primary)] rounded-full mx-auto relative brutal-shadow">
             {/* Eyes */}
             <div className="absolute top-3 left-3 w-2.5 h-2.5 bg-[var(--bg-base)] rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-[var(--text-primary)] rounded-full" />
             </div>
             <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-[var(--bg-base)] rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-[var(--text-primary)] rounded-full" />
             </div>
             {/* Smile */}
             <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-1.5 border-b-2 border-[var(--bg-base)] rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}
