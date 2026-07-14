import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const days = parseInt(req.query.days as string) || 14;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  try {
    const [logsRes, closeoutsRes] = await Promise.all([
      // Routine Logs (done vs skipped)
      supabase
        .from("pos_routine_logs")
        .select("date, status")
        .eq("user_id", req.user!.id)
        .gte("date", cutoffStr),

      // Daily Closeouts (macro slices scheduled vs completed)
      supabase
        .from("pos_daily_closeouts")
        .select("date, total_scheduled, total_completed")
        .eq("user_id", req.user!.id)
        .gte("date", cutoffStr),
    ]);

    const logs = logsRes.data || [];
    const closeouts = closeoutsRes.data || [];

    // Aggregate Routine Data per day
    const routineStats: Record<string, { done: number; skipped: number }> = {};
    for (const log of logs) {
      if (!routineStats[log.date]) {
        routineStats[log.date] = { done: 0, skipped: 0 };
      }
      if (log.status === "done") routineStats[log.date].done++;
      else if (log.status === "skipped") routineStats[log.date].skipped++;
    }

    const aggregatedRoutines = Object.keys(routineStats)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((date) => ({
        date,
        ...routineStats[date],
      }));

    // Format Closeouts Data
    const formattedCloseouts = closeouts
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .map((c) => ({
        date: c.date,
        scheduled: c.total_scheduled,
        completed: c.total_completed,
      }));

    res.json({
      routineTrends: aggregatedRoutines,
      sliceTrends: formattedCloseouts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
