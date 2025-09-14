import { AnalysisResponse, SchoolsResponse, TimelineResponse, ChatMessage } from '../types';

const API_BASE = process.env.NODE_ENV === 'production' ? '' : '';

export const analyzeChat = async (chatHistory: ChatMessage[]): Promise<AnalysisResponse> => {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chatHistory }),
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
