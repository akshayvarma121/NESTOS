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
    text: "Slice macro goals into micro-tasks here, then pull them into your Backlog or schedule them for today.",
    group: "Planning",
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
  vault_intro: {
    id: "vault_intro",
    title: "The Vault",
    text: "A separate encrypted space with its own PIN. It auto-locks when you leave. Forgetting the PIN triggers a factory reset of this space.",
    group: "System",
  },
  partner_privacy: {
    id: "partner_privacy",
    title: "Partner Sync",
    text: "Invite a partner using a token. You control exactly what is shared and what stays completely private.",
    group: "System",
  },
};
