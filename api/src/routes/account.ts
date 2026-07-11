import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.delete("/clear-data", async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    // We must manually delete from tables where ON DELETE CASCADE is not set to the user profile,
    // or just delete from everything explicitly to be safe.
    
    // 1. pos_micro_tasks (depends on pos_macro_goals)
    await supabase.from("pos_micro_tasks").delete().eq("user_id", userId);
    
    // 2. pos_macro_goals
    await supabase.from("pos_macro_goals").delete().eq("user_id", userId);
    
    // 3. pos_routines (pos_routine_logs will cascade, but we can delete logs explicitly just in case)
    await supabase.from("pos_routine_logs").delete().eq("user_id", userId);
    await supabase.from("pos_routines").delete().eq("user_id", userId);
    
    // 4. Standalone entities
    await supabase.from("pos_personal_todos").delete().eq("user_id", userId);
    await supabase.from("pos_deadlines").delete().eq("user_id", userId);
    await supabase.from("pos_notes").delete().eq("user_id", userId);
    await supabase.from("pos_content_capture").delete().eq("user_id", userId);
    await supabase.from("pos_opportunities").delete().eq("user_id", userId);
    await supabase.from("pos_daily_closeouts").delete().eq("user_id", userId);
    
    // 5. Vault
    await supabase.from("pos_vault_entries").delete().eq("user_id", userId);
    await supabase.from("pos_vault_security").delete().eq("user_id", userId);
    
    // 6. Settings
    await supabase.from("pos_settings").delete().eq("user_id", userId);

    res.json({ success: true, message: "All data cleared successfully." });
  } catch (err: any) {
    console.error("Error clearing data:", err);
    res.status(500).json({ error: "Failed to clear data completely." });
  }
});

export default router;
