import { useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "../lib/toast";

// DiceBear styles that look great in Neo-Brutalist context
const AVATAR_STYLES = [
  { style: "bottts-neutral", label: "Robo" },
  { style: "shapes", label: "Shapes" },
  { style: "identicon", label: "Grid" },
  { style: "rings", label: "Rings" },
  { style: "pixel-art-neutral", label: "Pixel" },
  { style: "lorelei-neutral", label: "Minimal" },
];

// A fixed set of seeds for each style — gives the "gallery" feel
const SEEDS = ["alpha","bravo","charlie","delta","echo","foxtrot","golf","hotel","india","juliet","kilo","lima"];

function getDiceBearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=transparent`;
}

interface AvatarPickerProps {
  currentAvatarStyle?: string;
  currentAvatarSeed?: string;
  onClose: () => void;
}

export function AvatarPicker({ currentAvatarStyle, currentAvatarSeed, onClose }: AvatarPickerProps) {
  const [selectedStyle, setSelectedStyle] = useState(currentAvatarStyle || AVATAR_STYLES[0].style);
  const [selectedSeed, setSelectedSeed] = useState(currentAvatarSeed || SEEDS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: { avatarStyle: selectedStyle, avatarSeed: selectedSeed },
      });
      toast("Avatar updated.", "success");
      onClose();
    } catch (e: any) {
      toast("Failed to save avatar: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[var(--bg-surface)] brutal-border brutal-shadow flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-[var(--border-brutal)]">
          <h2 className="text-lg font-black uppercase tracking-widest">Choose Avatar</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 brutal-border flex items-center justify-center font-black hover:bg-[var(--text-primary)] hover:text-[var(--bg-base)] transition-colors"
          >
            X
          </button>
        </div>

        {/* Style Tabs */}
        <div className="flex gap-2 p-4 border-b border-[var(--border-hairline)] overflow-x-auto">
          {AVATAR_STYLES.map((s) => (
            <button
              key={s.style}
              onClick={() => setSelectedStyle(s.style)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-2 transition-all ${
                selectedStyle === s.style
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-base)] brutal-shadow-sm translate-x-[-2px] translate-y-[-2px]"
                  : "border-[var(--border-hairline)] hover:border-[var(--text-primary)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Avatar Grid */}
        <div className="p-4 grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-72 overflow-y-auto">
          {SEEDS.map((seed) => {
            const isSelected = selectedSeed === seed && selectedStyle === selectedStyle;
            return (
              <button
                key={seed}
                onClick={() => setSelectedSeed(seed)}
                className={`aspect-square border-2 p-1.5 transition-all hover:scale-105 ${
                  selectedSeed === seed
                    ? "border-[var(--text-primary)] brutal-shadow-sm translate-x-[-2px] translate-y-[-2px]"
                    : "border-[var(--border-hairline)] hover:border-[var(--text-primary)]"
                }`}
              >
                <img
                  src={getDiceBearUrl(selectedStyle, seed)}
                  alt={`Avatar ${seed}`}
                  className="w-full h-full"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>

        {/* Preview + Save */}
        <div className="p-5 border-t-2 border-[var(--border-brutal)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 border-2 border-[var(--border-brutal)] bg-[var(--bg-base)] flex items-center justify-center brutal-shadow-sm">
              <img
                src={getDiceBearUrl(selectedStyle, selectedSeed)}
                alt="Preview"
                className="w-11 h-11"
              />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest font-bold">Preview</p>
              <p className="text-sm font-bold mt-0.5 capitalize">{AVATAR_STYLES.find(s => s.style === selectedStyle)?.label}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg-base)] font-black text-sm uppercase tracking-widest brutal-border brutal-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Set Avatar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small reusable avatar component for use anywhere in the app
interface UserAvatarProps {
  avatarStyle?: string;
  avatarSeed?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ avatarStyle, avatarSeed, initials = "?", size = "md", className = "" }: UserAvatarProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-14 h-14",
  };

  const sizeClass = sizeMap[size];

  if (avatarStyle && avatarSeed) {
    return (
      <div className={`${sizeClass} flex-shrink-0 border-2 border-black bg-[var(--bg-base)] flex items-center justify-center rounded-full overflow-hidden ${className}`}>
        <img
          src={getDiceBearUrl(avatarStyle, avatarSeed)}
          alt="User avatar"
          className="w-full h-full"
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div className={`${sizeClass} flex-shrink-0 bg-[#d5ff66] text-[#172000] border-2 border-black flex items-center justify-center rounded-full font-black text-xs ${className}`}>
      {initials}
    </div>
  );
}
