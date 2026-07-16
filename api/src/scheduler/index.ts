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
    for (const task of goal.tasks) {
      if (task.status !== "pending") continue;

      if (task.scheduled_date) {
        const schedDate = new Date(task.scheduled_date);
        schedDate.setUTCHours(0, 0, 0, 0);

        // If a task is in the past, un-schedule it to send it to the Backlog.
        if (schedDate.getTime() < today.getTime()) {
          tasksToUpdate.push({
            id: task.id,
            scheduled_date: null,
            pinned: false,
          });
        }
      }
    }
  }

  return { tasksToUpdate };
}
