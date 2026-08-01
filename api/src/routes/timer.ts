import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/sessions", async (req: AuthRequest, res) => {
  const { mode, duration_seconds } = req.body;
  if (!mode || typeof duration_seconds !== "number") {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    const { data, error } = await supabase
      .from("pos_focus_sessions")
      .insert({
        user_id: req.user!.id,
        mode,
        duration_seconds,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
