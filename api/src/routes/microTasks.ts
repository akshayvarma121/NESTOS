import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const date = req.query.date as string;
  const backlog = req.query.backlog === 'true';

  let query = supabase
    .from("pos_micro_tasks")
    .select("*, macro:pos_macro_goals(category, title), assignee:pos_user_profiles!pos_micro_tasks_assigned_to_fkey(username)")
    .in("user_id", req.sharedSpaceIds!);

  if (backlog) {
    query = query.neq("status", "done").order("created_at", { ascending: true });
  } else {
    query = query.neq("status", "skipped");
    if (date) {
      query = query.eq("scheduled_date", date).order("created_at", { ascending: true });
    }
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  
  const formatted = data.map((task: any) => ({
    ...task,
    category: task.macro?.category,
    macro_title: task.macro?.title
  }));

  res.json(formatted);
});

router.post("/", async (req: AuthRequest, res) => {
  const { macro_id, title, description, urgency, assigned_to } = req.body;
  const { data, error } = await supabase
    .from("pos_micro_tasks")
    .insert([{ user_id: req.user!.id, macro_id, title, description, urgency, assigned_to }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Can only update if it belongs to the shared space
  const { data: existing } = await supabase
    .from("pos_micro_tasks")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || !req.sharedSpaceIds!.includes(existing.user_id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Handle completed_at timestamp
  if (updates.status === "done") {
    updates.completed_at = new Date().toISOString();
  } else if (updates.status === "pending") {
    updates.completed_at = null;
  }

  const { data, error } = await supabase
    .from("pos_micro_tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
