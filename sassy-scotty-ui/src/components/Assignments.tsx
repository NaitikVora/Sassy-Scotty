import './Assignments.css';
import type { KanbanStage, Task } from '../types/task';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

interface StageConfig {
  id: KanbanStage;
  name: string;
  emoji: string;
  background: string;
}

interface AssignmentsProps {
  tasks: Task[];
  stages: StageConfig[];
  onTaskMove?: (taskId: string | number, newStage: KanbanStage) => void;
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

interface DraggableCardProps {
  task: Task;
}

function DraggableCard({ task }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="assignment-card"
    >
      <div className="assignment-card__top">
        <p className="assignment-card__tag">{task.tag || task.type}</p>
        {task.status && <span className={statusColor(task.status)}>{task.status}</span>}
      </div>
      <h4>{task.title}</h4>
      {task.courseCode && <p className="assignment-card__course">{task.courseCode}</p>}
      {formatDue(task.dueAt) && <p className="assignment-card__due">Due {formatDue(task.dueAt)}</p>}
      {task.metadata?.canvasUrl && (
        <a className="assignment-card__link" href={task.metadata.canvasUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          open in canvas →
        </a>
      )}
    </article>
  );
}

interface DroppableColumnProps {
  stage: StageConfig;
  items: Task[];
}

function DroppableColumn({ stage, items }: DroppableColumnProps) {
  const itemIds = items.map((item) => item.id.toString());

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy} id={stage.id}>
      <section className="kanban__column" style={{ background: stage.background }} data-stage={stage.id}>
        <header className="kanban__column-header">
          <span>
            {stage.emoji} {stage.name}
          </span>
          <strong>{items.length}</strong>
        </header>
        <div className="kanban__stack" style={{ minHeight: '200px' }}>
          {items.length === 0 ? (
            <p className="kanban__empty">Nothing here yet</p>
          ) : (
            items.map((task) => <DraggableCard key={task.id} task={task} />)
          )}
        </div>
      </section>
    </SortableContext>
  );
}

export default function Assignments({ tasks, stages, onTaskMove }: AssignmentsProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!tasks.length) {
    return <div className="empty-board">No assignments yet — time to manifest some free time ✨</div>;
  }

  const stageBuckets = stages.map((stage) => ({
    stage,
    items: tasks.filter((task) => (task.kanbanStage ?? 'brain_dump') === stage.id)
  }));

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id.toString() === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const overId = over.id.toString();

    // Check if dropped over a stage
    const targetStage = stages.find((s) => s.id === overId);
    if (targetStage) {
      onTaskMove?.(taskId, targetStage.id);
      return;
    }

    // Check if dropped over another task - find the stage of that task
    const targetTask = tasks.find((t) => t.id.toString() === overId);
    if (targetTask && targetTask.kanbanStage) {
      onTaskMove?.(taskId, targetTask.kanbanStage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban">
        {stageBuckets.map(({ stage, items }) => (
          <DroppableColumn key={stage.id} stage={stage} items={items} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <article className="assignment-card" style={{ opacity: 0.9 }}>
            <div className="assignment-card__top">
              <p className="assignment-card__tag">{activeTask.tag || activeTask.type}</p>
              {activeTask.status && <span className={statusColor(activeTask.status)}>{activeTask.status}</span>}
            </div>
            <h4>{activeTask.title}</h4>
            {activeTask.courseCode && <p className="assignment-card__course">{activeTask.courseCode}</p>}
            {formatDue(activeTask.dueAt) && <p className="assignment-card__due">Due {formatDue(activeTask.dueAt)}</p>}
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
