import './Assignments.css';
import type { KanbanStage, Task } from '../types/task';

interface StageConfig {
  id: KanbanStage;
  name: string;
  emoji: string;
  background: string;
}

interface AssignmentsProps {
  tasks: Task[];
  stages: StageConfig[];
}

const statusColor = (status?: string) => {
  switch (status) {
    case 'completed':
      return 'status-pill status-pill--done';
    case 'overdue':
      return 'status-pill status-pill--danger';
    default:
      return 'status-pill status-pill--pending';
  }
};

const formatDue = (dueAt?: string) => {
  if (!dueAt) return null;
  return new Date(dueAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export default function Assignments({ tasks, stages }: AssignmentsProps) {
  if (!tasks.length) {
    return <div className="empty-board">No assignments yet — time to manifest some free time ✨</div>;
  }

  const stageBuckets = stages.map((stage) => ({
    stage,
    items: tasks.filter((task) => (task.kanbanStage ?? 'brain_dump') === stage.id)
  }));

  return (
    <div className="kanban">
      {stageBuckets.map(({ stage, items }) => (
        <section key={stage.id} className="kanban__column" style={{ background: stage.background }}>
          <header className="kanban__column-header">
            <span>
              {stage.emoji} {stage.name}
            </span>
            <strong>{items.length}</strong>
          </header>
          <div className="kanban__stack">
            {items.length === 0 ? (
              <p className="kanban__empty">Nothing here yet</p>
            ) : (
              items.map((task) => (
                <article key={task.id} className="assignment-card">
                  <div className="assignment-card__top">
                    <p className="assignment-card__tag">{task.tag || task.type}</p>
                    {task.status && <span className={statusColor(task.status)}>{task.status}</span>}
                  </div>
                  <h4>{task.title}</h4>
                  {task.courseCode && <p className="assignment-card__course">{task.courseCode}</p>}
                  {formatDue(task.dueAt) && <p className="assignment-card__due">Due {formatDue(task.dueAt)}</p>}
                  {task.metadata?.canvasUrl && (
                    <a className="assignment-card__link" href={task.metadata.canvasUrl} target="_blank" rel="noreferrer">
                      open in canvas →
                    </a>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
