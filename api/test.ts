import { supabase } from './src/supabase.js'; supabase.from('pos_micro_tasks').select('scheduled_date').not('scheduled_date', 'is', null).limit(1).then(console.log);
