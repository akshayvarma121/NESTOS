import { Router } from "express";
import { supabase } from "../supabase.js";
import { sendPushToUser } from "../cron/index.js";
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

router.post("/test-trigger", async (req: AuthRequest, res) => {
  try {
    const { type } = req.body;
    const userId = req.user!.id;

    // Check if subscription exists first
    const { data: subs, error: subError } = await supabase
      .from("pos_push_subscriptions")
      .select("id, endpoint")
      .eq("user_id", userId);

    if (subError) {
      return res.status(500).json({ error: "DB error: " + subError.message });
    }

    if (!subs || subs.length === 0) {
      return res.status(400).json({
        error: "No push subscription found. Click 'Enable Notifications' in the app banner first.",
        userId
      });
    }

    let payload = { title: "Test", body: "This is a test notification.", url: "/" };

    if (type === "backlog") {
      const { data } = await supabase.from("pos_micro_tasks").select("id").eq("user_id", userId).eq("status", "pending").is("scheduled_date", null);
      payload = {
        title: "Backlog Check",
        body: `You've got ${data?.length || 0} tasks rotting in your backlog. Check your analytics and clean house.`,
        url: "/analytics"
      };
    } else if (type === "routine") {
      payload = { title: "Heads up!", body: `Your routine "Deep Work" kicks off in 15 mins. Get ready.`, url: "/focus" };
    } else if (type === "morning") {
      payload = { title: "Morning Check-in", body: `Rise and grind! You've got 5 missions lined up for today. Let's crush them.`, url: "/today" };
    } else if (type === "evening") {
      payload = { title: "Day's Almost Up", body: `You still have 3 tasks hanging around. Wrap 'em up before midnight!`, url: "/today" };
    }

    await sendPushToUser(userId, payload);
    res.json({ success: true, subscriptionsFound: subs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Debug route — open in browser to diagnose push issues
router.get("/debug-subs", async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from("pos_push_subscriptions")
    .select("id, endpoint, created_at")
    .eq("user_id", req.user!.id);

  res.json({
    userId: req.user!.id,
    subscriptions: data || [],
    error: error?.message || null,
    vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
  });
});

export default router;
