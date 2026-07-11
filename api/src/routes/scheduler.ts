import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { recomputeSchedule, MacroGoal } from "../scheduler/index.js";

const router = Router();
router.use(requireAuth);

router.post("/recompute", async (req: AuthRequest, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Fetch all active macro goals with their tasks
    const { data: goalsData, error: goalsError } = await supabase
      .from("pos_macro_goals")
      .select("*, tasks:pos_micro_tasks(*)")
      .in("user_id", req.sharedSpaceIds!)
      .neq("status", "completed");

    if (goalsError) return res.status(500).json({ error: goalsError.message });
    if (!goalsData || goalsData.length === 0) return res.json({ success: true, updated: 0 });

    const result = recomputeSchedule(goalsData as unknown as MacroGoal[], todayStr);

    if (result.tasksToUpdate.length > 0) {
      // Bulk update using Promise.all for simplicity
      const promises = result.tasksToUpdate.map(t => {
        const updateData: any = { scheduled_date: t.scheduled_date };
        if (t.is_pinned !== undefined) updateData.is_pinned = t.is_pinned;
        return supabase.from("pos_micro_tasks").update(updateData).eq("id", t.id);
      });
      
      await Promise.all(promises);
    }

    res.json({ success: true, updated: result.tasksToUpdate.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/focus", async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("pos_micro_tasks")
    .select(
      "*, macro:pos_macro_goals(category), assignee:pos_user_profiles!pos_micro_tasks_assigned_to_fkey(username)",
    )
    .not("scheduled_date", "is", null)
    .in("user_id", req.sharedSpaceIds!);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get("/unscheduled", async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("pos_micro_tasks")
    .select(
      "*, macro:pos_macro_goals(title, category), assignee:pos_user_profiles!pos_micro_tasks_assigned_to_fkey(username)",
    )
    .is("scheduled_date", null)
    .eq("status", "pending")
    .in("user_id", req.sharedSpaceIds!);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
