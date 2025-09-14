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
  tuition: string;
  duration: string;
  language_requirements: string;
  admission_requirements: string;
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
}

export interface TimelineResponse {
  timeline: TimelinePhase[];
  key_deadlines: KeyDeadline[];
  total_estimated_cost: string;
  total_tasks: number;
  completion_rate: number;
}