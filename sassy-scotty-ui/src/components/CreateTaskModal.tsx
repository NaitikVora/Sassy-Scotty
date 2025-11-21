import { useState } from 'react';
import type { KanbanStage, Task } from '../types/task';
import './CreateTaskModal.css';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Omit<Task, 'id'>) => void;
}

export default function CreateTaskModal({ isOpen, onClose, onCreateTask }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [type, setType] = useState<string>('assignment');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [kanbanStage, setKanbanStage] = useState<KanbanStage>('brain_dump');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    const dueAt = dueDate && dueTime
      ? new Date(`${dueDate}T${dueTime}`).toISOString()
      : undefined;

    const newTask: Omit<Task, 'id'> = {
      source: 'manual',
      title: title.trim(),
      description: description.trim() || undefined,
      courseCode: courseCode.trim() || undefined,
      dueAt,
      type,
      status: 'pending',
      kanbanStage,
      priority,
      tag: type,
    };

    onCreateTask(newTask);

    // Reset form
    setTitle('');
    setDescription('');
    setCourseCode('');
    setDueDate('');
    setDueTime('23:59');
    setType('assignment');
    setPriority('medium');
    setKanbanStage('brain_dump');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>create a new task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="courseCode">course code</label>
              <input
                id="courseCode"
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., 15-213"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">type</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="assignment">assignment</option>
                <option value="project">project</option>
                <option value="exam">exam</option>
                <option value="studio">studio</option>
                <option value="personal">personal</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate">due date</label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueTime">due time</label>
              <input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">priority</label>
              <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="kanbanStage">initial stage</label>
              <select id="kanbanStage" value={kanbanStage} onChange={(e) => setKanbanStage(e.target.value as KanbanStage)}>
                <option value="brain_dump">brain dump</option>
                <option value="kinda_urgent">kinda urgent</option>
                <option value="in_progress">in progress</option>
                <option value="done">done</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              cancel
            </button>
            <button type="submit" className="btn-primary">
              create task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
