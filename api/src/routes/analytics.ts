import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const days = parseInt(req.query.days as string) || 14;
  const target_user_id = req.query.target_user_id as string;
  
  const uid = target_user_id && req.sharedSpaceIds!.includes(target_user_id) 
    ? target_user_id 
    : req.user!.id;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  try {
    const [logsRes, closeoutsRes, microTasksRes, personalRes] = await Promise.all([
      // Routine Logs (done vs skipped)
      supabase
        .from("pos_routine_logs")
        .select("date, status")
        .eq("user_id", uid)
        .gte("date", cutoffStr),

      // Daily Closeouts (macro slices scheduled vs completed)
      supabase
        .from("pos_daily_closeouts")
        .select("date, total_scheduled, total_completed")
        .eq("user_id", uid)
        .gte("date", cutoffStr),

      // Micro Tasks completed
      supabase
        .from("pos_micro_tasks")
        .select("title, completed_at, status")
        .eq("user_id", uid)
        .not("completed_at", "is", null)
        .gte("completed_at", cutoffDate.toISOString())
        .order("completed_at", { ascending: false }),

      // Personal Todos completed
      supabase
        .from("pos_personal_todos")
        .select("title, completed_at, status")
        .eq("user_id", uid)
        .not("completed_at", "is", null)
        .gte("completed_at", cutoffDate.toISOString())
        .order("completed_at", { ascending: false }),
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

    // Generate Smart Suggestions
    let totalRoutinesDone = 0;
    let totalRoutinesSkipped = 0;
    for (const stat of Object.values(routineStats)) {
      totalRoutinesDone += stat.done;
      totalRoutinesSkipped += stat.skipped;
    }
    const totalRoutines = totalRoutinesDone + totalRoutinesSkipped;
    const adherenceRate = totalRoutines > 0 ? (totalRoutinesDone / totalRoutines) * 100 : 0;
    
    let suggestion = { text: "Keep tracking your routines to get AI suggestions.", type: "info" as "warning" | "success" | "info" };
    if (totalRoutines > 5) {
      if (adherenceRate < 60) {
        suggestion = { text: "Burnout Warning: Your routine adherence is dropping below 60%. Consider reviewing your timetable and dropping overly ambitious routines.", type: "warning" };
      } else if (adherenceRate > 85) {
        suggestion = { text: "Great Job: You are maintaining a highly consistent rhythm. Keep up the excellent work!", type: "success" };
      } else {
        suggestion = { text: "You are doing okay, but there is room for improvement. Try to stick to your scheduled routines more closely.", type: "info" };
      }
    }

    const taskLogs = [
      ...(microTasksRes.data || []).map((t: any) => ({ ...t, type: "macro" })),
      ...(personalRes.data || []).map((t: any) => ({ ...t, type: "personal" })),
    ].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

    res.json({
      routineTrends: aggregatedRoutines,
      sliceTrends: formattedCloseouts,
      suggestion,
      taskLogs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
