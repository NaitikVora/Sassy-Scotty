import { useState, useEffect } from 'react';
import type { Task } from '../types/task';
import './PreferencesModal.css';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  selectedCourses: string[];
  onSavePreferences: (courses: string[]) => void;
}

export default function PreferencesModal({
  isOpen,
  onClose,
  tasks,
  selectedCourses,
  onSavePreferences,
}: PreferencesModalProps) {
  const [tempSelectedCourses, setTempSelectedCourses] = useState<string[]>(selectedCourses);

  useEffect(() => {
    setTempSelectedCourses(selectedCourses);
  }, [selectedCourses, isOpen]);

  if (!isOpen) return null;

  // Extract unique courses from tasks with their names
  const courseMap = tasks.reduce((acc, task) => {
    if (task.courseCode && !acc[task.courseCode]) {
      acc[task.courseCode] = task.courseName || task.courseCode;
    }
    return acc;
  }, {} as Record<string, string>);

  const allCourses = Object.keys(courseMap).sort();

  const handleToggleCourse = (courseCode: string) => {
    setTempSelectedCourses((prev) =>
      prev.includes(courseCode)
        ? prev.filter((code) => code !== courseCode)
        : [...prev, courseCode]
    );
  };

  const handleSelectAll = () => {
    setTempSelectedCourses(allCourses);
  };

  const handleDeselectAll = () => {
    setTempSelectedCourses([]);
  };

  const handleSave = () => {
    onSavePreferences(tempSelectedCourses);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const taskCountByCourse = tasks.reduce((acc, task) => {
    if (task.courseCode) {
      acc[task.courseCode] = (acc[task.courseCode] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content preferences-modal">
        <div className="modal-header">
          <div>
            <h2>preferences</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              choose which courses to display on your board
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="preferences-body">
          <div className="preferences-actions">
            <button onClick={handleSelectAll} className="btn-text">
              select all
            </button>
            <span style={{ color: 'var(--color-text-muted)' }}>•</span>
            <button onClick={handleDeselectAll} className="btn-text">
              deselect all
            </button>
            <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {tempSelectedCourses.length} of {allCourses.length} selected
            </span>
          </div>

          <div className="course-list">
            {allCourses.length === 0 ? (
              <div className="empty-state">
                <p>No courses found. Sync with Canvas to see your courses.</p>
              </div>
            ) : (
              allCourses.map((courseCode) => {
                const isSelected = tempSelectedCourses.includes(courseCode);
                const count = taskCountByCourse[courseCode] || 0;
                const courseName = courseMap[courseCode];

                return (
                  <label
                    key={courseCode}
                    className={`course-item ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCourse(courseCode)}
                    />
                    <div className="course-info">
                      <strong>{courseName}</strong>
                      <span>{count} {count === 1 ? 'task' : 'tasks'}</span>
                    </div>
                    <div className="course-check">
                      {isSelected && <span>✓</span>}
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {allCourses.length > 0 && tempSelectedCourses.length === 0 && (
            <div className="warning-message">
              <span>⚠️</span>
              <p>No courses selected. Your board will be empty!</p>
            </div>
          )}
        </div>

        <div className="preferences-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
