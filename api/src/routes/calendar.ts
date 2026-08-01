import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import ical from "node-ical";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const { month, year } = req.query; // optional, e.g. "07", "2026", else we return all for simplicity or current month.

  // To keep it simple and robust, let's just return all closeouts and events for the shared space,
  // or limit to a specific date range if passed. For now, let's return all.

  const yearToFetch = year ? parseInt(year as string) : new Date().getFullYear();
  const userCountry = req.user?.user_metadata?.country || "US";

  const countryMapping: Record<string, string> = {
    IN: "indian",
    US: "usa",
    GB: "uk",
    CA: "canadian",
    AU: "australian",
    DE: "german",
  };

  try {
    let publicHolidays: any[] = [];
    try {
      const gName = countryMapping[userCountry] || "usa";
      const url = `https://calendar.google.com/calendar/ical/en.${gName}%23holiday%40group.v.calendar.google.com/public/basic.ics`;
      const data = await ical.async.fromURL(url);
      
      for (const k in data) {
        const ev = data[k];
        if (ev.type === "VEVENT" && ev.start) {
          const d = ev.start as Date;
          if (d.getFullYear() === yearToFetch) {
            const yy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            publicHolidays.push({
              date: `${yy}-${mm}-${dd}`,
              name: ev.summary,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to generate public holidays via ICS:", err);
    }
    const [eventsRes, closeoutsRes, tasksRes, macroGoalsRes, deadlinesRes] = await Promise.all([
      supabase
        .from("pos_events")
        .select("*")
        .in("user_id", req.sharedSpaceIds!),
      supabase
        .from("pos_daily_closeouts")
        .select("*")
        .in("user_id", req.sharedSpaceIds!),
      supabase
        .from("pos_micro_tasks")
        .select("id, title, scheduled_date, status, description")
        .in("user_id", req.sharedSpaceIds!)
        .not("scheduled_date", "is", null),
      supabase
        .from("pos_macro_goals")
        .select("id, title, deadline, progress")
        .in("user_id", req.sharedSpaceIds!)
        .not("deadline", "is", null),
      supabase
        .from("pos_deadlines")
        .select("id, title, deadline")
        .in("user_id", req.sharedSpaceIds!)
        .not("deadline", "is", null),
    ]);

    res.json({
      events: eventsRes.data || [],
      closeouts: closeoutsRes.data || [],
      scheduledTasks: tasksRes.data || [],
      macroGoals: macroGoalsRes.data || [],
      deadlines: deadlinesRes.data || [],
      holidays: publicHolidays,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/events", async (req: AuthRequest, res) => {
  const { title, date } = req.body;

  const { data, error } = await supabase
    .from("pos_events")
    .insert([{ user_id: req.user!.id, title, date }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

router.delete("/events/:id", async (req: AuthRequest, res) => {
  const { error } = await supabase
    .from("pos_events")
    .delete()
    .eq("id", req.params.id)
    .in("user_id", req.sharedSpaceIds!);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
});

export default router;
