import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("pos_reminder_rules")
    .select("*")
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("pos_reminder_rules")
    .insert([
      {
        user_id: req.user!.id,
        label: req.body.label,
        message: req.body.message,
        icon: req.body.icon || null,
        enabled: req.body.enabled !== false,
        schedule_type: req.body.schedule_type,
        interval_minutes: req.body.interval_minutes || null,
        daily_time: req.body.daily_time || null,
        days_of_week: req.body.days_of_week || null,
        last_fired_at: null,
      },
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  // Verify ownership
  const { data: existing } = await supabase
    .from("pos_reminder_rules")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { data, error } = await supabase
    .from("pos_reminder_rules")
    .update({
      label: req.body.label,
      message: req.body.message,
      icon: req.body.icon || null,
      enabled: req.body.enabled,
      schedule_type: req.body.schedule_type,
      interval_minutes: req.body.interval_minutes || null,
      daily_time: req.body.daily_time || null,
      days_of_week: req.body.days_of_week || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch("/:id/fire", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { last_fired_at } = req.body;
  
  // Verify ownership
  const { data: existing } = await supabase
    .from("pos_reminder_rules")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { data, error } = await supabase
    .from("pos_reminder_rules")
    .update({ last_fired_at: last_fired_at || new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  // Verify ownership
  const { data: existing } = await supabase
    .from("pos_reminder_rules")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { error } = await supabase
    .from("pos_reminder_rules")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
