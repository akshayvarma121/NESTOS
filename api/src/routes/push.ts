import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/subscribe", async (req: AuthRequest, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  // Delete existing for this user/endpoint if exists
  await supabase
    .from("pos_push_subscriptions")
    .delete()
    .eq("user_id", req.user!.id)
    .eq("endpoint", subscription.endpoint);

  const { error } = await supabase.from("pos_push_subscriptions").insert([
    {
      user_id: req.user!.id,
      endpoint: subscription.endpoint,
      keys_p256dh: subscription.keys.p256dh,
      keys_auth: subscription.keys.auth,
    },
  ]);

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true });
});

export default router;
