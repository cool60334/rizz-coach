export interface ProfileAnalysis {
  basicInfo: {
    age?: string;
    occupation?: string;
    constellation?: string;
    location?: string;
  };
  interests: string[];
  personalityTraits: string[];
  summary: string;
}

export interface ReplySuggestion {
  style: string;
  content: string;
  explanation: string;
}

export interface ChatAdvice {
  situationAnalysis: string;
  suggestions: ReplySuggestion[];
  coachTip: string;
}

export enum AnalysisStage {
  IDLE = 'IDLE',
  ANALYZING_PROFILE = 'ANALYZING_PROFILE',
  PROFILE_COMPLETE = 'PROFILE_COMPLETE',
  ANALYZING_CHAT = 'ANALYZING_CHAT',
  CHAT_COMPLETE = 'CHAT_COMPLETE',
}