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

async function sendPushToUser(userId: string, payload: any) {
  const { data: subs } = await supabase.from('pos_push_subscriptions').select('*').eq('user_id', userId);
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
        await supabase.from('pos_push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }
}

// 1. Morning Briefing
cron.schedule('* * * * *', async () => {
  try {
    const { data: users } = await supabase.from('pos_user_profiles').select('user_id');
    if (!users) return;

    const now = new Date();
    const currentHHMM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const todayStr = now.toISOString().split('T')[0];

    for (const u of users) {
      // Default time is 07:00, or user configured
      // Note: for scalability, pos_settings should be queried more efficiently.
      // Doing it simply for now.
      const { data: setting } = await supabase
        .from('pos_settings')
        .select('value')
        .eq('user_id', u.user_id)
        .eq('key', 'morning_briefing_time')
        .single();
        
      const targetTime = setting?.value || '07:00';

      if (currentHHMM === targetTime) {
        const { data: microTasks } = await supabase
          .from('pos_micro_tasks')
          .select('id')
          .eq('user_id', u.user_id)
          .eq('scheduled_date', todayStr)
          .eq('status', 'pending');

        const count = microTasks ? microTasks.length : 0;
        const message = count > 0 
          ? `You have ${count} pending tasks scheduled for today. Time to get to work!`
          : `No tasks scheduled for today. Enjoy your day!`;

        await sendPushToUser(u.user_id, {
          title: 'Morning Briefing',
          body: message,
          url: '/today'
        });
      }
    }
  } catch (err) {
    console.error('Morning Briefing Error:', err);
  }
});

// 2. Deadline Alerts (Every 15 minutes)
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
      .gt('deadline', now.toISOString()); 

    if (!opps || opps.length === 0) return;

    for (const opp of opps) {
      await sendPushToUser(opp.user_id, {
        title: 'Deadline Approaching!',
        body: `Your application for ${opp.role} at ${opp.company} is due in less than 24 hours.`,
        url: '/opportunities'
      });
      await supabase.from('pos_opportunities').update({ alerted: true }).eq('id', opp.id);
    }
  } catch (err) {
    console.error('Deadline Alert Error:', err);
  }
});
