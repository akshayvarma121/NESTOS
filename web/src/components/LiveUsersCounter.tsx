import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function LiveUsersCounter({ showText = true }: { showText?: boolean }) {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channelName = 'public:online-users';

    // Cleanup any existing channel to prevent errors during React Strict Mode double-mounts
    const activeChannels = supabase.getChannels();
    for (const c of activeChannels) {
      if (c.topic === channelName || c.topic === `realtime:${channelName}`) {
        supabase.removeChannel(c);
      }
    }

    // Create a public room for all online users
    const room = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    room
      .on('presence', { event: 'sync' }, () => {
        const presenceState = room.presenceState();
        setOnlineCount(Object.keys(presenceState).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(room);
    };
  }, [user]);

  if (onlineCount === 0) return null;

  return (
    <div className={`flex items-center justify-center gap-2 px-2 py-1.5 bg-[var(--bg-surface-raised)] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded whitespace-nowrap transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${!showText ? 'w-8 h-8 !p-0' : ''}`}>
      <div className="w-2.5 h-2.5 rounded-full bg-[#2ed573] border border-black animate-pulse flex-shrink-0" title={`${onlineCount} online`} />
      {showText && (
        <span className="text-xs font-black font-mono tracking-widest text-[var(--text-primary)] uppercase">
          {onlineCount} {onlineCount === 1 ? "user" : "users"} online
        </span>
      )}
    </div>
  );
}
