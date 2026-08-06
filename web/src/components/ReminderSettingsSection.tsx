import { useState } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { toast } from "../lib/toast";
import { useReminders, type ReminderRule } from "../contexts/ReminderContext";
import { useAuth } from "../contexts/AuthContext";

export function ReminderSettingsSection() {
  const { user } = useAuth();
  const { rules, fetchRules } = useReminders();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newRule, setNewRule] = useState<Partial<ReminderRule>>({
    label: "",
    message: "",
    icon: "🔔",
    enabled: true,
    schedule_type: "interval",
    interval_minutes: 60,
    daily_time: "09:00",
    days_of_week: [],
  });

  const buddyRemindersEnabled = user?.user_metadata?.buddyRemindersEnabled !== false;
  const buddyPipEnabled = user?.user_metadata?.buddyPipEnabled === true;
  const routineRemindersEnabled = user?.user_metadata?.routineRemindersEnabled !== false;
  const pomodoroRemindersEnabled = user?.user_metadata?.pomodoroRemindersEnabled !== false;
  const goalDeadlineRemindersEnabled = user?.user_metadata?.goalDeadlineRemindersEnabled === true;
  const goalDeadlineThresholds = user?.user_metadata?.goalDeadlineThresholds || [3, 1, 0];

  const updatePreference = async (key: string, value: any) => {
    try {
      await supabase.auth.updateUser({ data: { [key]: value } });
      // Toast omitted to prevent spam when typing thresholds, or we can use a save button for thresholds
    } catch (e: any) {
      toast("Failed to update preference: " + e.message, "error");
    }
  };

  const handleToggle = async (rule: ReminderRule) => {
    try {
      await api.put(`/reminders/${rule.id}`, { ...rule, enabled: !rule.enabled });
      fetchRules();
    } catch (e: any) {
      toast("Failed to toggle rule: " + e.message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      await api.delete(`/reminders/${id}`);
      fetchRules();
    } catch (e: any) {
      toast("Failed to delete rule: " + e.message, "error");
    }
  };

  const handleSaveNew = async () => {
    if (!newRule.label || !newRule.message) {
      return toast("Label and message are required.", "error");
    }
    
    setIsSaving(true);
    try {
      await api.post("/reminders", newRule);
      fetchRules();
      setIsAdding(false);
      setNewRule({
        label: "",
        message: "",
        icon: "🔔",
        enabled: true,
        schedule_type: "interval",
        interval_minutes: 60,
        daily_time: "09:00",
        days_of_week: [],
      });
      toast("Reminder saved!", "success");
    } catch (e: any) {
      toast("Failed to save rule: " + e.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Reminders</h2>
      </div>

      {/* Master Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg gap-4 mb-6">
        <div>
          <h3 className="text-sm font-medium">Buddy Reminders (Master Toggle)</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Turn off to hide the buddy visual entirely across the app, without losing your configured rules below.
          </p>
        </div>
        <button
          onClick={() => {
            updatePreference("buddyRemindersEnabled", !buddyRemindersEnabled);
            if (!buddyRemindersEnabled) toast("Buddy reminders enabled", "success");
            else toast("Buddy reminders disabled", "success");
          }}
          className="bg-[var(--text-primary)] text-[var(--bg-base)] font-bold px-4 py-2 text-xs uppercase tracking-wider brutal-border brutal-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all whitespace-nowrap"
        >
          {buddyRemindersEnabled ? "Disable Buddy" : "Enable Buddy"}
        </button>
      </div>

      <div className={`transition-opacity ${!buddyRemindersEnabled ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* PiP Mode Toggle (Only if supported) */}
        {('documentPictureInPicture' in window) && (
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium">Buddy PiP Mode</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Pop the buddy out into a floating window that stays on top even when you switch tabs or minimize the browser.
              </p>
            </div>
            <button
              onClick={() => updatePreference("buddyPipEnabled", !buddyPipEnabled)}
              className="text-xs bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-3 py-1.5 rounded hover:bg-[var(--bg-surface-raised)]"
            >
              {buddyPipEnabled ? "Disable PiP" : "Enable PiP"}
            </button>
          </div>
        )}

        {/* Built-in Reminders */}
        <div className="mb-8">
          <h3 className="text-md font-medium mb-3">Built-in Reminders</h3>
          <div className="space-y-2">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg gap-4">
              <div>
                <h4 className="text-sm font-medium">Routine Reminders</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Fires when a scheduled routine's time arrives and it's still Pending.
                </p>
              </div>
              <button
                onClick={() => updatePreference("routineRemindersEnabled", !routineRemindersEnabled)}
                className="text-xs bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-3 py-1.5 rounded hover:bg-[var(--bg-surface-raised)]"
              >
                {routineRemindersEnabled ? "Disable" : "Enable"}
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg gap-4">
              <div>
                <h4 className="text-sm font-medium">Pomodoro Reminders</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Fires on focus and break session transitions.
                </p>
              </div>
              <button
                onClick={() => updatePreference("pomodoroRemindersEnabled", !pomodoroRemindersEnabled)}
                className="text-xs bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-3 py-1.5 rounded hover:bg-[var(--bg-surface-raised)]"
              >
                {pomodoroRemindersEnabled ? "Disable" : "Enable"}
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg gap-4">
              <div className="flex-1">
                <h4 className="text-sm font-medium">Goal Deadline Reminders</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Applies globally across all your macro goals with deadlines.
                </p>
                {goalDeadlineRemindersEnabled && (
                  <div className="mt-3">
                    <label className="text-xs text-[var(--text-secondary)] block mb-1">Days Before Deadline (e.g., 3, 1, 0)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        defaultValue={goalDeadlineThresholds.join(', ')}
                        onBlur={(e) => {
                          const vals = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                          updatePreference("goalDeadlineThresholds", vals);
                          toast("Thresholds updated", "success");
                        }}
                        className="w-full md:w-64 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--text-primary)] text-[var(--text-primary)]"
                        placeholder="3, 1, 0"
                      />
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => updatePreference("goalDeadlineRemindersEnabled", !goalDeadlineRemindersEnabled)}
                className="text-xs bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-3 py-1.5 rounded hover:bg-[var(--bg-surface-raised)] self-start md:self-center"
              >
                {goalDeadlineRemindersEnabled ? "Disable" : "Enable"}
              </button>
            </div>

          </div>
        </div>

        {/* Custom Reminders */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium">Custom Reminders</h3>
            {!isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="brutal-btn bg-[var(--text-primary)] text-[var(--bg-base)] px-3 py-1.5 text-xs font-bold"
              >
                + Add Rule
              </button>
            )}
          </div>

          {isAdding && (
            <div className="mb-4 p-4 border border-[var(--border-hairline)] rounded-lg bg-[var(--bg-base)] space-y-4">
              <h4 className="font-medium text-sm border-b border-[var(--border-hairline)] pb-2 mb-2">New Reminder Rule</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">Label</label>
                  <input 
                    value={newRule.label}
                    onChange={e => setNewRule({...newRule, label: e.target.value})}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--text-primary)]"
                    placeholder="e.g. Hydrate"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">Icon (Emoji)</label>
                  <input 
                    value={newRule.icon}
                    onChange={e => setNewRule({...newRule, icon: e.target.value})}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--text-primary)]"
                    placeholder="🔔"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">Message</label>
                  <input 
                    value={newRule.message}
                    onChange={e => setNewRule({...newRule, message: e.target.value})}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--text-primary)]"
                    placeholder="Drink some water!"
                  />
                </div>
              </div>

              <div className="border-t border-[var(--border-hairline)] pt-4 mt-2">
                <label className="text-xs text-[var(--text-secondary)] block mb-2">Schedule Type</label>
                <select 
                  value={newRule.schedule_type}
                  onChange={e => setNewRule({...newRule, schedule_type: e.target.value as any})}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded px-3 py-1.5 text-sm mb-4 text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
                >
                  <option value="interval">Recurring Interval</option>
                  <option value="dailyTime">Daily at Time</option>
                  <option value="daysOfWeek">Specific Days at Time</option>
                </select>

                {newRule.schedule_type === 'interval' && (
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] block mb-1">Interval (minutes)</label>
                    <input 
                      type="number"
                      value={newRule.interval_minutes}
                      onChange={e => setNewRule({...newRule, interval_minutes: parseInt(e.target.value)})}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--text-primary)]"
                    />
                  </div>
                )}

                {(newRule.schedule_type === 'dailyTime' || newRule.schedule_type === 'daysOfWeek') && (
                  <div className="mb-4">
                    <label className="text-xs text-[var(--text-secondary)] block mb-1">Time of Day (HH:MM)</label>
                    <input 
                      type="time"
                      value={newRule.daily_time}
                      onChange={e => setNewRule({...newRule, daily_time: e.target.value})}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--text-primary)] text-[var(--text-primary)]"
                    />
                  </div>
                )}

                {newRule.schedule_type === 'daysOfWeek' && (
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] block mb-1">Days of Week</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => (
                        <label key={i} className="flex items-center gap-1 text-sm bg-[var(--bg-surface)] px-2 py-1 rounded border border-[var(--border-hairline)] cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={newRule.days_of_week?.includes(i)}
                            onChange={(e) => {
                              const days = newRule.days_of_week || [];
                              if (e.target.checked) setNewRule({...newRule, days_of_week: [...days, i]});
                              else setNewRule({...newRule, days_of_week: days.filter(d => d !== i)});
                            }}
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-bold bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded hover:bg-[var(--bg-surface-raised)]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveNew}
                  disabled={isSaving}
                  className="brutal-btn bg-[var(--text-primary)] text-[var(--bg-base)] px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Rule"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {rules.length === 0 && !isAdding && (
              <p className="text-sm text-[var(--text-secondary)]">No custom rules configured yet.</p>
            )}
            {rules.map(rule => (
              <div key={rule.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{rule.icon}</span>
                    <h3 className="text-sm font-bold">{rule.label}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${rule.enabled ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{rule.message}</p>
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase font-mono">
                    {rule.schedule_type} {rule.schedule_type === 'interval' ? `every ${rule.interval_minutes}m` : `@ ${rule.daily_time}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggle(rule)}
                    className="text-xs bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-2 py-1 rounded hover:bg-[var(--bg-surface-raised)]"
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button 
                    onClick={() => handleDelete(rule.id)}
                    className="text-xs text-red-500 bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-2 py-1 rounded hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
