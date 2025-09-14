import { AnalysisResponse, SchoolsResponse, TimelineResponse, ChatMessage } from '../types';

// 本地开发和生产环境都使用相对路径（vercel dev 会处理路由）
const API_BASE = '';

// 新的智能聊天API
export const intelligentChat = async (chatHistory: ChatMessage[]): Promise<{
  reply: string;
  extractedProfile: any;
  hasBasicInfo: boolean;
  shouldAnalyze: boolean;
}> => {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages: chatHistory }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const analyzeChat = async (userProfile: any): Promise<AnalysisResponse> => {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userProfile }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const getSchools = async (analysisId: string): Promise<SchoolsResponse> => {
  const response = await fetch(`${API_BASE}/api/schools?analysisId=${analysisId}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const getTimeline = async (analysisId: string): Promise<TimelineResponse> => {
  const response = await fetch(`${API_BASE}/api/timeline?analysisId=${analysisId}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// 学校调整API
export const adjustSchools = async (
  analysisId: string, 
  action: string, 
  schoolId: number, 
  schoolType: string
): Promise<{
  success: boolean;
  updatedTargetSchools: any[];
  updatedReachSchools: any[];
  updatedTimeline: any;
  adjustmentMessage: string;
}> => {
  const response = await fetch(`${API_BASE}/api/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ analysisId, action, schoolId, schoolType }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
