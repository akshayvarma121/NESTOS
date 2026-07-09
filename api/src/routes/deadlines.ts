import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("pos_deadlines")
    .select("*, creator:pos_user_profiles!pos_deadlines_user_id_fkey(username)")
    .in("user_id", req.sharedSpaceIds!)
    .order("deadline", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: AuthRequest, res) => {
  const { title, url, deadline } = req.body;
  const { data, error } = await supabase
    .from("pos_deadlines")
    .insert([{ user_id: req.user!.id, title, url, deadline }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("pos_deadlines")
    .delete()
    .eq("id", id)
    .in("user_id", req.sharedSpaceIds!);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
