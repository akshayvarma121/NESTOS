import cron from 'node-cron';
import webpush from 'web-push';
import { supabase } from '../supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

webpush.setVapidDetails(
  'mailto:test@example.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

async function sendPushToAll(payload: any) {
  const { data: subs } = await supabase.from('pos_push_subscriptions').select('*');
  if (!subs) return;
  
  for (const sub of subs) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth }
    };
    try {
      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    } catch (e: any) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        // Subscription expired or invalid, remove it
        await supabase.from('pos_push_subscriptions').delete().eq('id', sub.id);
      } else {
        console.error('Error sending push:', e);
      }
    }
  }
}

// 1. Morning Briefing: Runs every minute, checks if current time matches configured time
cron.schedule('* * * * *', async () => {
  try {
    const { data: setting } = await supabase
      .from('pos_settings')
      .select('value')
      .eq('key', 'morning_briefing_time')
      .single();

    const targetTime = setting?.value || '07:00';
    
    // Get current time in local timezone (assuming system time matches user or using UTC if preferred)
    // For simplicity, comparing server local HH:MM with targetTime
    const now = new Date();
    const currentHHMM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    if (currentHHMM === targetTime) {
      // Tally today's tasks
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: microTasks } = await supabase
        .from('pos_micro_tasks')
        .select('id, macro_id, status')
        .eq('scheduled_date', todayStr)
        .eq('status', 'pending');

      const count = microTasks ? microTasks.length : 0;
      const message = count > 0 
        ? `You have ${count} pending tasks scheduled for today. Time to get to work!`
        : `No tasks scheduled for today. Enjoy your day!`;

      await sendPushToAll({
        title: 'Morning Briefing',
        body: message,
        url: '/today'
      });
    }
  } catch (err) {
    console.error('Morning Briefing Error:', err);
  }
});

// 2. Deadline Alerts (FR-14.2): Every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: opps } = await supabase
      .from('pos_opportunities')
      .select('*')
      .eq('alerted', false)
      .not('deadline', 'is', null)
      .lt('deadline', twentyFourHoursFromNow.toISOString())
      .gt('deadline', now.toISOString()); // Exclude already past

    if (!opps || opps.length === 0) return;

    for (const opp of opps) {
      await sendPushToAll({
        title: 'Deadline Approaching!',
        body: `Your application for ${opp.role} at ${opp.company} is due in less than 24 hours.`,
        url: '/opportunities'
      });
      // Mark as alerted
      await supabase.from('pos_opportunities').update({ alerted: true }).eq('id', opp.id);
    }
  } catch (err) {
    console.error('Deadline Alert Error:', err);
  }
});

console.log("Push Notification Cron Jobs initialized.");
