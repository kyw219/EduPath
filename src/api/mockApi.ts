import { AnalysisResponse, SchoolsResponse, TimelineResponse, ChatMessage } from '../types';

// Mock API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
const mockSchoolsData: SchoolsResponse = {
  target_schools: [
    {
      school: "UC Irvine",
      program: "MS Computer Science", 
      match_score: 88,
      deadline: "2025-01-15",
      requirements: "No programming prereq required",
      tuition: "$43,000",
      employment_rate: "92%",
      reason: "Perfect for career changers, West Coast location"
    },
    {
      school: "Cal State Long Beach",
      program: "MS Computer Science",
      match_score: 85,
      deadline: "2025-02-01", 
      requirements: "Basic math background sufficient",
      tuition: "$18,000",
      employment_rate: "89%",
      reason: "Budget-friendly, strong industry connections"
    }
  ],
  reach_schools: [
    {
      school: "Stanford",
      program: "MS Computer Science",
      match_score: 65,
      gaps: ["Calculus I-III", "Data Structures", "Programming Fundamentals"],
      suggestions: "Complete UC Berkeley Extension programming sequence",
      deadline: "2025-12-01",
      tuition: "$77,000",
      requirements: "Strong math and programming background",
      employment_rate: "98%",
      reason: "Top-tier program, extensive industry connections"
    },
    {
      school: "UC Berkeley", 
      program: "MEng EECS",
      match_score: 72,
      gaps: ["Linear Algebra", "Discrete Math", "Python/Java"],
      suggestions: "Take Berkeley Extension courses + coding bootcamp",
      deadline: "2025-11-30",
      tuition: "$65,000",
      requirements: "Technical background required",
      employment_rate: "95%",
      reason: "Excellent reputation, Silicon Valley location"
    }
  ]
};

const mockTimelineData: TimelineResponse = {
  timeline: [
    {
      phase: "Background Building",
      period: "2025-01 to 2025-03",
      color: "#10B981", 
      tasks: [
        {
          task: "UC Berkeley Extension: Python Programming",
          deadline: "2025-02-15",
          status: "pending",
          priority: "high",
          reason: "Required for Stanford/UC Berkeley applications",
          cost: "$1,200"
        },
        {
          task: "Coursera: Calculus Specialization", 
          deadline: "2025-03-01",
          status: "pending", 
          priority: "medium",
          reason: "Math foundation for reach schools",
          cost: "$49/month"
        }
      ]
    },
    {
      phase: "Application Prep",
      period: "2025-04 to 2025-08",
      color: "#3B82F6",
      tasks: [
        {
          task: "GRE Preparation & Test",
          deadline: "2025-06-15", 
          status: "upcoming",
          priority: "high",
          reason: "Required for most programs",
          cost: "$220"
        },
        {
          task: "Personal Statement Draft",
          deadline: "2025-07-30",
          status: "upcoming",
          priority: "high", 
          reason: "Career change story critical",
          cost: "$0"
        }
      ]
    },
    {
      phase: "Application Season", 
      period: "2025-09 to 2025-12",
      color: "#8B5CF6",
      tasks: [
        {
          task: "UC Irvine Application Submit",
          deadline: "2025-01-15",
          status: "upcoming",
          priority: "high",
          reason: "Top target school",
          cost: "$120"
        },
        {
          task: "Stanford Application Submit",
          deadline: "2025-12-01", 
          status: "upcoming",
          priority: "medium",
          reason: "Reach school",
          cost: "$125"
        }
      ]
    }
  ],
  key_deadlines: [
    {"date": "2025-01-15", "event": "UC Irvine MS CS Due", "type": "application"},
    {"date": "2025-02-01", "event": "Cal State LB MS CS Due", "type": "application"},
    {"date": "2025-06-15", "event": "GRE Test Date", "type": "milestone"},
    {"date": "2025-12-01", "event": "Stanford MS CS Due", "type": "application"}
  ],
  total_estimated_cost: "$8,500",
  total_tasks: 18,
  completion_rate: 0
};


export const getSchools = async (analysisId: string): Promise<SchoolsResponse> => {
  await delay(2000);
  return mockSchoolsData;
};

export const getTimeline = async (analysisId: string): Promise<TimelineResponse> => {
  await delay(1000);
  return mockTimelineData;
};