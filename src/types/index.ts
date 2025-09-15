export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export interface School {
  school: string;
  program: string;
  match_score: number;
  ranking: number;
  deadline: string;
  application_opens?: string; // New field for application opening date
  tuition: string;
  duration: string;
  gpa_requirement: string;
  language_requirement: string;
  prerequisite_courses: string;
  degree_requirement: string;
  other_requirements: string;
  gaps?: string[];
  suggestions?: string;
}

export interface TimelineTask {
  task: string;
  deadline: string;
  status: 'pending' | 'upcoming' | 'completed';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  cost: string;
}

export interface TimelinePhase {
  phase: string;
  period: string;
  color: string;
  tasks: TimelineTask[];
}

export interface KeyDeadline {
  date: string;
  event: string;
  type: 'application' | 'milestone';
}

export interface AnalysisResponse {
  analysis_id: string;
  status: string;
  message: string;
}

export interface SchoolsResponse {
  target_schools: School[];
  reach_schools: School[];
  safe_schools?: School[];
}

export interface TimelineResponse {
  timeline: TimelinePhase[];
  key_deadlines: KeyDeadline[];
  total_estimated_cost: string;
  total_tasks: number;
  completion_rate: number;
}

// 简单的用户档案接口
export interface UserProfile {
  name: string;
  gpa: number;
  toefl?: number;
  ielts?: number;
  background: string[];
  degree: string;
  experience: string[];
}