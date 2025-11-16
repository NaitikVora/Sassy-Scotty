/**
 * TypeScript interfaces for Canvas API responses
 * Based on Canvas LMS REST API documentation
 */

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  account_id: number;
  start_at?: string;
  end_at?: string;
  enrollment_term_id?: number;
  enrollments?: CanvasEnrollment[];
}

export interface CanvasEnrollment {
  type: string;
  role: string;
  enrollment_state: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description?: string;
  due_at?: string;
  unlock_at?: string;
  lock_at?: string;
  points_possible?: number;
  submission_types: string[];
  has_submitted_submissions?: boolean;
  course_id: number;
  html_url: string;
  is_quiz_assignment?: boolean;
  quiz_id?: number;
  submission?: CanvasSubmission;
}

export interface CanvasSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  submitted_at?: string;
  workflow_state: string;
  grade?: string;
  score?: number;
  late?: boolean;
  missing?: boolean;
}

export interface CanvasCalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  location_name?: string;
  location_address?: string;
  context_code?: string;
  workflow_state: string;
  hidden?: boolean;
  all_day?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanvasQuiz {
  id: number;
  title: string;
  description?: string;
  quiz_type: string;
  time_limit?: number;
  due_at?: string;
  lock_at?: string;
  unlock_at?: string;
  published?: boolean;
  course_id: number;
}
