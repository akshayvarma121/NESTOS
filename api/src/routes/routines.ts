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

// Get routines history (past N days)
router.get("/history", async (req: AuthRequest, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("pos_routine_logs")
    .select("*, routine:pos_routines!inner(title, time_label)")
    .eq("user_id", req.user!.id)
    .gte("date", cutoffStr)
    .order("date", { ascending: false });

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
      .select("routine_id, completed_at, user_id, note, status")
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
      status: log?.status || "pending",
      note: log?.note || null,
    };
  });

  res.json(enriched);
});

router.get("/day/lock-status", async (req: AuthRequest, res) => {
  const dateStr = req.query.date as string;
  if (!dateStr) return res.status(400).json({ error: "Missing date" });

  const { data } = await supabase
    .from("pos_routine_locks")
    .select("date")
    .eq("user_id", req.user!.id)
    .eq("date", dateStr)
    .single();

  res.json({ isLocked: !!data });
});

router.post("/day/lock", async (req: AuthRequest, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: "Missing date" });

  const { error } = await supabase
    .from("pos_routine_locks")
    .insert([{ user_id: req.user!.id, date }]);

  // If it already exists, it will throw an error due to primary key, which is fine
  if (error && error.code !== "23505") { // 23505 is unique violation
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

router.post("/", async (req: AuthRequest, res) => {
  const { title, time_label, days_of_week, assigned_to, description } = req.body;
  const { data, error } = await supabase
    .from("pos_routines")
    .insert([
      { user_id: req.user!.id, title, time_label, days_of_week, assigned_to, description },
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

router.delete("/all", async (req: AuthRequest, res) => {
  const { error } = await supabase
    .from("pos_routines")
    .delete()
    .in("user_id", req.sharedSpaceIds!);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
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
  const { date, status } = req.body; // "done", "skipped", "pending"

  // Check lock
  const { data: lock } = await supabase
    .from("pos_routine_locks")
    .select("date")
    .eq("user_id", req.user!.id)
    .eq("date", date)
    .single();
    
  if (lock) {
    return res.status(403).json({ error: "Timeline is locked for this date." });
  }

  if (status === "pending" || !status) {
    await supabase
      .from("pos_routine_logs")
      .delete()
      .eq("routine_id", id)
      .eq("date", date);
    return res.json({ status: "unmarked" });
  }

  const { data: existing } = await supabase
    .from("pos_routine_logs")
    .select("id")
    .eq("routine_id", id)
    .eq("date", date)
    .single();

  if (existing) {
    await supabase.from("pos_routine_logs").update({ status }).eq("id", existing.id);
    return res.json({ status: "updated" });
  } else {
    await supabase.from("pos_routine_logs").insert([
      { routine_id: id, user_id: req.user!.id, date, status },
    ]);
    return res.json({ status: "marked" });
  }
});

router.patch("/:id/log", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { date, note } = req.body;

  // Check lock
  const { data: lock } = await supabase
    .from("pos_routine_locks")
    .select("date")
    .eq("user_id", req.user!.id)
    .eq("date", date)
    .single();
    
  if (lock) {
    return res.status(403).json({ error: "Timeline is locked for this date." });
  }

  const { data, error } = await supabase
    .from("pos_routine_logs")
    .update({ note })
    .eq("routine_id", id)
    .eq("date", date)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
