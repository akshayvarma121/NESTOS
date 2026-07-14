import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: AuthRequest, res) => {
  const { title, category, total_units, unit_label, deadline, customSlices } =
    req.body;

  const { data: goal, error: goalError } = await supabase
    .from("pos_macro_goals")
    .insert([
      {
        user_id: req.user!.id,
        title,
        category,
        total_units,
        unit_label,
        deadline,
      },
    ])
    .select()
    .single();

  if (goalError) return res.status(500).json({ error: goalError.message });

  // 2. Insert Micro Tasks
  let tasksToInsert = [];
  if (customSlices && Array.isArray(customSlices) && customSlices.length > 0) {
    tasksToInsert = customSlices.map((slice: any) => ({
      user_id: req.user!.id,
      macro_id: goal.id,
      title: slice.title,
      description: slice.description || null,
      scheduled_date: slice.scheduled_date || null,
      pinned: slice.scheduled_date ? true : false,
    }));
  } else {
    tasksToInsert = Array.from({ length: total_units }, (_, i) => ({
      user_id: req.user!.id,
      macro_id: goal.id,
      title: `${unit_label} ${i + 1}`,
      description: null,
      scheduled_date: null,
      pinned: false,
    }));
  }

  const { error: tasksError } = await supabase
    .from("pos_micro_tasks")
    .insert(tasksToInsert);

  if (tasksError) return res.status(500).json({ error: tasksError.message });

  res.status(201).json({ ...goal, completed_units: 0 });
});

router.get("/", async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("pos_macro_goals")
    .select("*, micro_tasks:pos_micro_tasks(status)")
    .in("user_id", req.sharedSpaceIds!);

  if (error) return res.status(500).json({ error: error.message });

  // Map progress correctly
  const enriched = data.map((goal: any) => {
    const total_completed = goal.micro_tasks.filter(
      (t: any) => t.status === "done",
    ).length;
    return {
      ...goal,
      completed_units: total_completed,
    };
  });

  res.json(enriched);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;

  // Verify ownership
  const { data: existing } = await supabase
    .from("pos_macro_goals")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || !req.sharedSpaceIds!.includes(existing.user_id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Delete associated micro tasks
  await supabase.from("pos_micro_tasks").delete().eq("macro_id", id);
  
  // Unlink any captures
  await supabase.from("pos_content_capture").update({ linked_macro_id: null }).eq("linked_macro_id", id);

  // Delete macro goal
  const { error } = await supabase.from("pos_macro_goals").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
