import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  // STRICTLY limit to req.user.id - ignore sharedSpaceIds
  const { data, error } = await supabase
    .from("pos_personal_todos")
    .select("*")
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: AuthRequest, res) => {
  const { title } = req.body;
  const { data, error } = await supabase
    .from("pos_personal_todos")
    .insert([{ user_id: req.user!.id, title }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Handle completed_at timestamp
  if (updates.status === "done") {
    updates.completed_at = new Date().toISOString();
  } else if (updates.status === "pending") {
    updates.completed_at = null;
  }

  const { data, error } = await supabase
    .from("pos_personal_todos")
    .update(updates)
    .eq("id", id)
    .eq("user_id", req.user!.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("pos_personal_todos")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user!.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
