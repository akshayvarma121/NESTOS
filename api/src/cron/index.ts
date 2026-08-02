import cron from "node-cron";
import webpush from "web-push";
import { supabase } from "../supabase.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

webpush.setVapidDetails(
  "mailto:test@example.com",
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || "",
);

// Map of userId -> array of subscriptions (Cached to reduce DB load)
let pushSubscriptionsCache: Record<string, any[]> = {};
let lastSubCacheUpdate = 0;

async function getSubscriptions(userId: string) {
  const now = Date.now();
  // Cache for 5 minutes
  if (now - lastSubCacheUpdate > 5 * 60 * 1000) {
    const { data } = await supabase.from("pos_push_subscriptions").select("*");
    pushSubscriptionsCache = {};
    if (data) {
      data.forEach(sub => {
        if (!pushSubscriptionsCache[sub.user_id]) pushSubscriptionsCache[sub.user_id] = [];
        pushSubscriptionsCache[sub.user_id].push(sub);
      });
    }
    lastSubCacheUpdate = now;
  }
  return pushSubscriptionsCache[userId] || [];
}

async function sendPushToUser(userId: string, payload: any) {
  const subs = await getSubscriptions(userId);
  if (!subs.length) return;

  const promises = subs.map(async (sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
    };
    try {
      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    } catch (e: any) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        // Expired, delete it
        await supabase.from("pos_push_subscriptions").delete().eq("id", sub.id);
        pushSubscriptionsCache[userId] = pushSubscriptionsCache[userId].filter(s => s.id !== sub.id);
      }
    }
  });
  await Promise.allSettled(promises);
}

// Format Date to YYYY-MM-DD in a specific timezone
function getLocalDayString(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

// Format Date to HH:MM in a specific timezone
function getLocalTimeString(date: Date, timeZone: string) {
  try {
    const f = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(date);
    return f;
  } catch {
    return date.toISOString().split("T")[1].substring(0, 5);
  }
}

const getDayOfWeekName = (date: Date, timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone, weekday: 'long' }).format(date);
  } catch {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return days[date.getDay()];
  }
}

// ==========================================
// 1. Unified Mega-Cron (Every Minute)
// ==========================================
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    
    // 1. Fetch ALL users via admin API to get their timezones
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error || !users) return;

    // We fetch routines and deadlines in one go
    // For routines, we filter client side to avoid heavy JSON filtering in DB
    const [routinesRes, deadlinesRes, goalsRes] = await Promise.all([
      supabase.from("pos_routines").select("id, user_id, title, time_label, days_of_week, last_notified_date"),
      supabase.from("pos_deadlines").select("id, user_id, title, deadline").eq("alerted", false).not("deadline", "is", null),
      supabase.from("pos_macro_goals").select("id, user_id, title, deadline").eq("alerted", false).not("deadline", "is", null)
    ]);

    const allRoutines = routinesRes.data || [];
    const allDeadlines = deadlinesRes.data || [];
    const allGoals = goalsRes.data || [];

    const routinesToUpdate: string[] = [];
    const deadlinesToUpdate: string[] = [];
    const goalsToUpdate: string[] = [];

    // Process each user
    for (const u of users) {
      const tz = u.user_metadata?.timezone || "UTC";
      const localDateStr = getLocalDayString(now, tz);
      const localTimeStr = getLocalTimeString(now, tz);
      const dayName = getDayOfWeekName(now, tz);
      
      // Calculate 15 mins ahead in local time for routines warning
      const futureNow = new Date(now.getTime() + 15 * 60000);
      const localFutureTimeStr = getLocalTimeString(futureNow, tz);

      // --- ROUTINES ---
      const userRoutines = allRoutines.filter(r => r.user_id === u.id);
      for (const r of userRoutines) {
        if (r.last_notified_date === localDateStr) continue; // Already notified today
        if (!r.days_of_week || !r.days_of_week.includes(dayName)) continue; // Not today
        
        let routineStart = r.time_label;
        if (r.time_label && r.time_label.includes("-")) {
          routineStart = r.time_label.split("-")[0].trim();
        }

        // Notify if routine is exactly 15 minutes away
        if (routineStart === localFutureTimeStr) {
          await sendPushToUser(u.id, {
            title: "Routine Starting Soon",
            body: \`"\${r.title}" starts in 15 minutes (\${routineStart})\`,
            url: "/focus",
          });
          routinesToUpdate.push(r.id);
        }
      }

      // --- DEADLINES & GOALS (Next 24 hours) ---
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const userDeadlines = allDeadlines.filter(d => d.user_id === u.id);
      for (const d of userDeadlines) {
        const deadlineDate = new Date(d.deadline);
        if (deadlineDate > now && deadlineDate <= twentyFourHoursFromNow) {
          await sendPushToUser(u.id, {
            title: "Deadline Approaching",
            body: \`"\${d.title}" is due soon!\`,
            url: "/backlog",
          });
          deadlinesToUpdate.push(d.id);
        }
      }

      const userGoals = allGoals.filter(g => g.user_id === u.id);
      for (const g of userGoals) {
        const deadlineDate = new Date(g.deadline);
        if (deadlineDate > now && deadlineDate <= twentyFourHoursFromNow) {
          await sendPushToUser(u.id, {
            title: "Goal Deadline Approaching",
            body: \`"\${g.title}" is due soon!\`,
            url: "/goals",
          });
          goalsToUpdate.push(g.id);
        }
      }
    }

    // Batch Update DB using chunks if needed (Supabase can do in-queries for bulk updates)
    if (routinesToUpdate.length > 0) {
      await supabase.from("pos_routines").update({ last_notified_date: now.toISOString().split("T")[0] }).in("id", routinesToUpdate);
    }
    if (deadlinesToUpdate.length > 0) {
      await supabase.from("pos_deadlines").update({ alerted: true }).in("id", deadlinesToUpdate);
    }
    if (goalsToUpdate.length > 0) {
      await supabase.from("pos_macro_goals").update({ alerted: true }).in("id", goalsToUpdate);
    }

  } catch (err) {
    console.error("Unified Cron Error:", err);
  }
});


// 2. Automated Daily Closeout & Rollover (Runs Every Hour, checks timezone boundaries)
cron.schedule("0 * * * *", async () => {
  try {
    const now = new Date();
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error || !users) return;

    for (const u of users) {
      const tz = u.user_metadata?.timezone || "UTC";
      const localTimeStr = getLocalTimeString(now, tz);
      
      // If it's exactly 00:00 (Midnight) in their timezone, run rollover
      if (localTimeStr.startsWith("00:")) {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = getLocalDayString(yesterday, tz);

        const { data: tasks } = await supabase
          .from("pos_micro_tasks")
          .select("*")
          .eq("user_id", u.id)
          .eq("scheduled_date", yesterdayStr);

        if (!tasks || tasks.length === 0) continue;

        const completedCount = tasks.filter((t) => t.status === "completed").length;
        const scheduledCount = tasks.length;

        // Insert analytics
        await supabase.from("pos_daily_closeouts").upsert(
          {
            user_id: u.id,
            date: yesterdayStr,
            total_completed: completedCount,
            total_scheduled: scheduledCount,
          },
          { onConflict: "user_id,date" },
        );

        // Move pending tasks back to backlog
        const pendingTaskIds = tasks.filter((t) => t.status !== "completed").map((t) => t.id);
        if (pendingTaskIds.length > 0) {
          await supabase
            .from("pos_micro_tasks")
            .update({ scheduled_date: null })
            .in("id", pendingTaskIds);
        }
      }
    }
  } catch (err) {
    console.error("Daily Closeout Error:", err);
  }
});

// 3. Render Keep-Alive (Ping self every 4 minutes)
cron.schedule("*/4 * * * *", async () => {
  const pingUrl = process.env.RENDER_EXTERNAL_URL || process.env.API_URL;
  if (pingUrl) {
    try {
      await fetch(\`\${pingUrl}/health\`);
    } catch (err) { }
  }
});
