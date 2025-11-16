export type TaskSource = 'canvas' | 'sio' | 'manual';

export type TaskStatus = 'pending' | 'completed' | 'overdue';

export type KanbanStage = 'brain_dump' | 'kinda_urgent' | 'in_progress' | 'done';

export interface Task {
  id: string | number;
  source?: TaskSource;
  title: string;
  description?: string;
  courseCode?: string;
  courseName?: string;
  dueAt?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  type?: string;
  status?: TaskStatus;
  kanbanStage?: KanbanStage;
  priority?: 'low' | 'medium' | 'high';
  tag?: string;
  metadata?: Record<string, unknown> & {
    canvasUrl?: string;
  };
}
