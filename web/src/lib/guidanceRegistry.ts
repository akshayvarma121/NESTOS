export type GuidanceEntry = {
  id: string;
  title: string;
  text: string;
  group: string;
};

export const guidanceRegistry: Record<string, GuidanceEntry> = {
  // Tour Steps
  focus_dashboard: {
    id: "focus_dashboard",
    title: "Focus Dashboard",
    text: "This view only shows what is scheduled for today. Completed tasks vanish. Private tasks are hidden from your partner.",
    group: "Execution",
  },
  backlog_philosophy: {
    id: "backlog_philosophy",
    title: "The Backlog",
    text: "Unscheduled tasks and half-formed ideas live here. If it isn't scheduled, it won't clutter your Focus Dashboard.",
    group: "Planning",
  },
  goal_engine: {
    id: "goal_engine",
    title: "Goal Engine",
    text: "Slice macro goals into micro-tasks. You can even import goals instantly using the JSON format (see docs for schema).",
    group: "Planning",
  },
  calendar_deadlines: {
    id: "calendar_deadlines",
    title: "Calendar & Deadlines",
    text: "Track your hard deadlines here. If a task must be done on a specific day, lock it in the calendar.",
    group: "Planning",
  },
  notes_scratchpad: {
    id: "notes_scratchpad",
    title: "Notes Tab",
    text: "A quick scratchpad for your daily thoughts, meeting notes, or temporary dumps that don't belong in tasks.",
    group: "Execution",
  },
  analytics_dashboard: {
    id: "analytics_dashboard",
    title: "Analytics",
    text: "At midnight, the system automatically calculates your adherence score. No manual self-reporting. Just the hard truth.",
    group: "System",
  },
  partner_beta: {
    id: "partner_beta",
    title: "Partner Sync (Beta)",
    text: "Link your account with a partner to keep each other accountable. Note: This feature is currently in Beta and under testing.",
    group: "System",
  },
  vault_intro: {
    id: "vault_intro",
    title: "The Vault",
    text: "A separate encrypted space with its own PIN. It auto-locks when you leave. Forgetting the PIN triggers a factory reset of this space.",
    group: "System",
  },
  settings_overview: {
    id: "settings_overview",
    title: "Settings",
    text: "Configure your themes, layout preferences, timezone, and manage your account details here.",
    group: "System",
  },
  help_page: {
    id: "help_page",
    title: "Help & Guidance",
    text: "You are here! Access all system documentation. You can reset tooltips or restart this tour anytime from this page.",
    group: "System",
  },

  // Contextual Tooltips
  json_import: {
    id: "json_import",
    title: "JSON Import",
    text: "Expects an array of objects matching the schema. Check the documentation for the exact format to bulk import items instantly.",
    group: "Planning",
  },
  timetable_import: {
    id: "timetable_import",
    title: "Timetable Import",
    text: "Paste a JSON array of routines to instantly set up your recurring habits without manual entry.",
    group: "Planning",
  },
  "11pm_lock": {
    id: "11pm_lock",
    title: "11PM Lock",
    text: "You cannot edit routines after 11PM. Commit to the plan or accept the failure.",
    group: "Planning",
  },
  partner_privacy: {
    id: "partner_privacy",
    title: "Partner Settings",
    text: "You control exactly what is shared and what stays completely private from your partner.",
    group: "System",
  },
};
