import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const { month, year } = req.query; // optional, e.g. "07", "2026", else we return all for simplicity or current month.

  // To keep it simple and robust, let's just return all closeouts and events for the shared space,
  // or limit to a specific date range if passed. For now, let's return all.

  const yearToFetch = year || new Date().getFullYear();

  try {
    // Fetch US holidays from Nager.Date as a fast public API option (Option A)
    let publicHolidays = [];
    try {
      const holidayRes = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${yearToFetch}/US`);
      if (holidayRes.ok) {
        publicHolidays = await holidayRes.json();
      }
    } catch (err) {
      console.error("Failed to fetch public holidays:", err);
    }
    const [eventsRes, closeoutsRes, tasksRes, macroGoalsRes, deadlinesRes] = await Promise.all([
      supabase
        .from("pos_events")
        .select("*")
        .in("user_id", req.sharedSpaceIds!),
      supabase
        .from("pos_daily_closeouts")
        .select("*")
        .in("user_id", req.sharedSpaceIds!),
      supabase
        .from("pos_micro_tasks")
        .select("id, title, scheduled_date, status, description")
        .in("user_id", req.sharedSpaceIds!)
        .not("scheduled_date", "is", null),
      supabase
        .from("pos_macro_goals")
        .select("id, title, deadline, progress")
        .in("user_id", req.sharedSpaceIds!)
        .not("deadline", "is", null),
      supabase
        .from("pos_deadlines")
        .select("id, title, deadline")
        .in("user_id", req.sharedSpaceIds!)
        .not("deadline", "is", null),
    ]);

    res.json({
      events: eventsRes.data || [],
      closeouts: closeoutsRes.data || [],
      scheduledTasks: tasksRes.data || [],
      macroGoals: macroGoalsRes.data || [],
      deadlines: deadlinesRes.data || [],
      holidays: publicHolidays,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/events", async (req: AuthRequest, res) => {
  const { title, date } = req.body;

  const { data, error } = await supabase
    .from("pos_events")
    .insert([{ user_id: req.user!.id, title, date }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

router.delete("/events/:id", async (req: AuthRequest, res) => {
  const { error } = await supabase
    .from("pos_events")
    .delete()
    .eq("id", req.params.id)
    .in("user_id", req.sharedSpaceIds!);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
});

export default router;
