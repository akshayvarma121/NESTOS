import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { getLocalDateString } from "../lib/dateUtils";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import {
  GripVertical,
  ListTodo,
  Plus,
  Trash2,
  Calendar,
  Folder,
  LayoutGrid,
  List,
  CheckCircle2,
  Circle,
  AlertCircle,
  Info,
} from "lucide-react";

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
  // Very snappy, no spring bounce
  duration: 150,
  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
};

function DraggableTask({ task }: { task: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: task,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 bg-[var(--bg-surface)] border rounded-lg flex items-center gap-3 cursor-grab active:cursor-grabbing select-none transition-colors ${
        isDragging
          ? "opacity-50 border-[var(--accent)] bg-[var(--bg-surface-raised)]"
          : "border-[var(--border-hairline)] hover:border-[var(--text-secondary)]"
      }`}
    >
      <GripVertical className="w-4 h-4 text-[var(--text-tertiary)]" />
      <span className="text-sm text-[var(--text-primary)]">{task.title}</span>
    </div>
  );
}

function DroppableToday({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: "today-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] p-4 rounded-xl border-2 border-dashed transition-colors ${
        isOver
          ? "border-[var(--accent)] bg-[var(--accent)]/5"
          : "border-[var(--border-hairline)]"
      }`}
    >
      {children}
    </div>
  );
}

export default function BacklogPage() {
  const [backlogTasks, setBacklogTasks] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any | null>(null);

  const fetchTasks = async () => {
    try {
      const todayStr = getLocalDateString();

      // Fetch both backlog and today's tasks
      const allPending = await api.get("/micro-tasks?backlog=true");
      const today = allPending.filter(
        (t: any) => t.scheduled_date === todayStr,
      );

      // Backlog is everything pending that is NOT strictly scheduled for today or pinned/scheduled for tomorrow
      // For simplicity: backlog is any pending task not in todayTasks
      const backlog = allPending.filter(
        (t: any) => t.scheduled_date !== todayStr,
      );

      setBacklogTasks(backlog);
      setTodayTasks(today);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTask(active.data.current);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && over.id === "today-zone") {
      const draggedTask = backlogTasks.find((t) => t.id === active.id);
      if (draggedTask) {
        // Optimistic UI update
        setBacklogTasks((prev) => prev.filter((t) => t.id !== draggedTask.id));
        setTodayTasks((prev) => [
          ...prev,
          {
            ...draggedTask,
            scheduled_date: getLocalDateString(),
            pinned: true,
          },
        ]);

        try {
          const todayStr = getLocalDateString();
          await api.patch(`/micro-tasks/${draggedTask.id}`, {
            scheduled_date: todayStr,
            pinned: true,
          });
        } catch (e) {
          console.error("Failed to pin task", e);
          // Revert optimistic update on failure
          fetchTasks();
        }
      }
    }
  };

  // Group backlog by macro goal title
  const groupedBacklog = backlogTasks.reduce(
    (acc, task) => {
      const macroTitle = task.macro_title || "Uncategorized";
      if (!acc[macroTitle]) acc[macroTitle] = [];
      acc[macroTitle].push(task);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  if (loading)
    return (
      <div className="p-6 text-[var(--text-secondary)]">Loading Canvas...</div>
    );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-[var(--accent)]" />
          <h1 className="text-2xl font-semibold">Canvas Backlog</h1>
          <div className="relative group cursor-help ml-2 mt-1">
            <Info className="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" />
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-xs text-[var(--text-secondary)] font-normal">
              A brain dump for micro-tasks. Items here are not scheduled yet.
              You can pick tasks from here during your morning planning or
              assign them to a macro goal later.
            </div>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid md:grid-cols-2 gap-8 overflow-hidden">
          {/* Left Column: Backlog */}
          <div className="flex flex-col h-full border border-[var(--border-hairline)] rounded-xl bg-[var(--bg-surface)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border-hairline)] bg-[var(--bg-surface-raised)]">
              <h2 className="font-medium text-[var(--text-primary)]">
                Backlog
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {Object.keys(groupedBacklog).length === 0 ? (
                <p className="text-center text-sm text-[var(--text-secondary)] mt-10">
                  No backlogged tasks found.
                </p>
              ) : (
                Object.entries(groupedBacklog).map(([macroTitle, tasks]) => (
                  <div key={macroTitle} className="space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                      {macroTitle}
                    </h3>
                    <div className="space-y-2">
                      {(tasks as any[]).map((task: any) => (
                        <DraggableTask key={task.id} task={task} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Today */}
          <div className="flex flex-col h-full">
            <h2 className="font-medium text-[var(--text-primary)] mb-4 px-1">
              Today's Schedule
            </h2>
            <DroppableToday>
              <div className="space-y-2 min-h-[150px]">
                {todayTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                    Drop tasks here to pin them to today
                  </div>
                ) : (
                  todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg flex items-center gap-3"
                    >
                      <div className="w-[3px] h-4 bg-[var(--accent)] rounded-full" />
                      <span className="text-sm text-[var(--text-primary)]">
                        {task.title}
                      </span>

                      {task.assignee && (
                        <span className="ml-auto text-xs text-[var(--text-secondary)]">
                          {task.assignee.username}
                        </span>
                      )}

                      {task.pinned && (
                        <span
                          className={`${task.assignee ? "ml-2" : "ml-auto"} text-[10px] uppercase font-mono bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.5 rounded`}
                        >
                          Pinned
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DroppableToday>
          </div>
        </div>

        {/* Drag overlay to give that nice visual lift without dropping layout */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? (
            <div className="p-3 bg-[var(--bg-surface-raised)] border border-[var(--accent)] rounded-lg flex items-center gap-3 shadow-none scale-105 cursor-grabbing">
              <GripVertical className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm text-[var(--text-primary)]">
                {activeTask.title}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
