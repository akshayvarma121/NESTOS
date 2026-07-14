export interface Task {
  id: string;
  macro_id: string;
  scheduled_date: string | null;
  status: "pending" | "done" | "skipped";
  pinned: boolean;
}

export interface MacroGoal {
  id: string;
  deadline: string;
  tasks: Task[];
}

export interface RecomputeResult {
  tasksToUpdate: {
    id: string;
    scheduled_date: string | null;
    pinned?: boolean;
  }[];
}

/**
 * Pure function to recompute task distribution.
 * @param goals Array of active macro goals with their tasks.
 * @param todayDateStr String representation of today's date (YYYY-MM-DD).
 */
export function recomputeSchedule(
  goals: MacroGoal[],
  todayDateStr: string,
): RecomputeResult {
  const tasksToUpdate: {
    id: string;
    scheduled_date: string | null;
    pinned?: boolean;
  }[] = [];
  
  // Use UTC methods exclusively to prevent local timezone offsets from shifting the day backwards
  const today = new Date(todayDateStr);
  today.setUTCHours(0, 0, 0, 0);

  for (const goal of goals) {
    const deadline = new Date(goal.deadline);
    deadline.setUTCHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    let remaining_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both today and deadline
    remaining_days = Math.max(1, remaining_days); // At least 1 day even if overdue

    const unscheduledTasks: Task[] = [];

    for (const task of goal.tasks) {
      if (task.status !== "pending") continue;

      if (task.scheduled_date) {
        const schedDate = new Date(task.scheduled_date);
        schedDate.setUTCHours(0, 0, 0, 0);

        if (schedDate.getTime() < today.getTime()) {
          // Missed task, recalibrate. If it was pinned, unpin it per FR-3.3 self-healing.
          unscheduledTasks.push(task);
          tasksToUpdate.push({
            id: task.id,
            scheduled_date: null,
            pinned: false,
          });
        } else if (schedDate.getTime() >= today.getTime()) {
          // If it's pinned to today or future, respect it and skip auto-scheduling.
          if (!task.pinned) {
            unscheduledTasks.push(task);
          }
        }
      } else {
        unscheduledTasks.push(task);
      }
    }

    if (unscheduledTasks.length === 0) continue;

    // Overdue macro goals should dump their unscheduled tasks to the backlog
    // per user request: "the goal even if the deadline reached it should be sahown in backlog"
    if (diffTime < 0) {
      for (const task of unscheduledTasks) {
        const existingUpdate = tasksToUpdate.find((u) => u.id === task.id);
        if (existingUpdate) {
          existingUpdate.scheduled_date = null;
        } else {
          tasksToUpdate.push({ id: task.id, scheduled_date: null });
        }
      }
      continue;
    }

    const tasks_per_day = Math.ceil(unscheduledTasks.length / remaining_days);

    let currentTaskIndex = 0;

    for (
      let dayOffset = 0;
      currentTaskIndex < unscheduledTasks.length;
      dayOffset++
    ) {
      const assignDate = new Date(today);
      assignDate.setUTCDate(today.getUTCDate() + dayOffset);
      const assignDateStr = assignDate.toISOString().split("T")[0];

      for (
        let i = 0;
        i < tasks_per_day && currentTaskIndex < unscheduledTasks.length;
        i++
      ) {
        const task = unscheduledTasks[currentTaskIndex];
        // Only push to tasksToUpdate if we didn't already push an unpin update for this task above
        const existingUpdate = tasksToUpdate.find((u) => u.id === task.id);
        if (existingUpdate) {
          existingUpdate.scheduled_date = assignDateStr;
        } else {
          tasksToUpdate.push({ id: task.id, scheduled_date: assignDateStr });
        }
        currentTaskIndex++;
      }
    }
  }

  return { tasksToUpdate };
}
