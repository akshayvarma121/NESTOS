import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Get all routines for editing
router.get("/", async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("pos_routines")
    .select(
      "*, assignee:pos_user_profiles!pos_routines_assigned_to_fkey(username)",
    )
    .in("user_id", req.sharedSpaceIds!)
    .order("time_label", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get routines strictly scheduled for a specific day of the week, with their completion log
router.get("/day", async (req: AuthRequest, res) => {
  const dayStr = req.query.day as string; // 'Mon', 'Tue', etc.
  const dateStr = req.query.date as string; // 'YYYY-MM-DD'

  if (!dayStr || !dateStr)
    return res.status(400).json({ error: "Missing day or date" });

  const { data: routines, error } = await supabase
    .from("pos_routines")
    .select(
      "*, assignee:pos_user_profiles!pos_routines_assigned_to_fkey(username)",
    )
    .in("user_id", req.sharedSpaceIds!)
    .contains("days_of_week", [dayStr])
    .order("time_label", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const routineIds = routines?.map((r) => r.id) || [];
  let logs: any[] = [];

  if (routineIds.length > 0) {
    const { data: logsData } = await supabase
      .from("pos_routine_logs")
      .select("routine_id, completed_at, user_id")
      .in("routine_id", routineIds)
      .eq("date", dateStr);

    if (logsData) logs = logsData;
  }

  // Merge logs into routines
  const enriched = routines?.map((r) => {
    const log = logs.find((l) => l.routine_id === r.id);
    return {
      ...r,
      is_completed: !!log,
      completed_at: log?.completed_at,
      completed_by: log?.user_id,
    };
  });

  res.json(enriched);
});

router.post("/", async (req: AuthRequest, res) => {
  const { title, time_label, days_of_week, assigned_to } = req.body;
  const { data, error } = await supabase
    .from("pos_routines")
    .insert([
      { user_id: req.user!.id, title, time_label, days_of_week, assigned_to },
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Strip out anything we shouldn't update directly (like assignee object from join)
  delete updates.assignee;

  const { data, error } = await supabase
    .from("pos_routines")
    .update(updates)
    .eq("id", id)
    .in("user_id", req.sharedSpaceIds!)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("pos_routines")
    .delete()
    .eq("id", id)
    .in("user_id", req.sharedSpaceIds!);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.post("/:id/toggle", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { date } = req.body; // 'YYYY-MM-DD'

  // Check if log exists
  const { data: existing } = await supabase
    .from("pos_routine_logs")
    .select("id")
    .eq("routine_id", id)
    .eq("date", date)
    .single();

  if (existing) {
    // Uncheck
    const { error } = await supabase
      .from("pos_routine_logs")
      .delete()
      .eq("id", existing.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ is_completed: false });
  } else {
    // Check
    const { error } = await supabase.from("pos_routine_logs").insert([
      {
        routine_id: id,
        user_id: req.user!.id,
        date,
      },
    ]);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ is_completed: true });
  }
});

export default router;
