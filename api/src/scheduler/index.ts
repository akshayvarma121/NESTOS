export interface Task {
  id: string;
  macro_id: string;
  scheduled_date: string | null;
  status: 'pending' | 'done' | 'skipped';
}

export interface MacroGoal {
  id: string;
  deadline: string;
  tasks: Task[];
}

export interface RecomputeResult {
  tasksToUpdate: { id: string; scheduled_date: string | null }[];
}

/**
 * Pure function to recompute task distribution.
 * @param goals Array of active macro goals with their tasks.
 * @param todayDateStr String representation of today's date (YYYY-MM-DD).
 */
export function recomputeSchedule(goals: MacroGoal[], todayDateStr: string): RecomputeResult {
  const tasksToUpdate: { id: string; scheduled_date: string | null }[] = [];
  const today = new Date(todayDateStr);
  today.setHours(0, 0, 0, 0);

  for (const goal of goals) {
    const deadline = new Date(goal.deadline);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    let remaining_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    remaining_days = Math.max(1, remaining_days); // At least 1 day even if overdue

    // 1. Recalibration: Missed tasks (scheduled before today and pending) become unscheduled
    const unscheduledTasks: Task[] = [];

    for (const task of goal.tasks) {
      if (task.status !== 'pending') continue;

      if (task.scheduled_date) {
        const schedDate = new Date(task.scheduled_date);
        schedDate.setHours(0, 0, 0, 0);

        if (schedDate.getTime() < today.getTime()) {
          // Missed task, recalibrate
          unscheduledTasks.push(task);
          tasksToUpdate.push({ id: task.id, scheduled_date: null });
        } else if (schedDate.getTime() >= today.getTime()) {
          // Already scheduled in the future/today. 
          // For a fully dynamic scheduler, we might want to reschedule everything,
          // but FR-3.2 says "Unscheduled pending tasks are assigned to upcoming dates"
          // We will reset all future scheduled dates for a full clean redistribution,
          // UNLESS the user pinned it. (For now, FR-3 assumes we auto-distribute all).
          // Actually, let's treat all pending tasks >= today as unscheduled for full fluid distribution,
          // except if they were manually pinned (not implemented yet). 
          // Assuming full dynamic redistribution of pending tasks:
          unscheduledTasks.push(task);
        }
      } else {
        unscheduledTasks.push(task);
      }
    }

    if (unscheduledTasks.length === 0) continue;

    const tasks_per_day = Math.ceil(unscheduledTasks.length / remaining_days);

    // 2. Distribute tasks
    let currentTaskIndex = 0;
    
    // We iterate day by day starting from today
    for (let dayOffset = 0; currentTaskIndex < unscheduledTasks.length; dayOffset++) {
      const assignDate = new Date(today);
      assignDate.setDate(today.getDate() + dayOffset);
      const assignDateStr = assignDate.toISOString().split('T')[0];

      // Assign up to tasks_per_day tasks to this day
      for (let i = 0; i < tasks_per_day && currentTaskIndex < unscheduledTasks.length; i++) {
        const task = unscheduledTasks[currentTaskIndex];
        tasksToUpdate.push({ id: task.id, scheduled_date: assignDateStr });
        currentTaskIndex++;
      }
    }
  }

  // Filter out updates where the scheduled_date didn't actually change
  // to minimize DB writes. We assume we have the old state in memory.
  // We will let the route handler filter it or just bulk update.
  return { tasksToUpdate };
}
