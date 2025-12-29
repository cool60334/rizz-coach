export interface ProfileAnalysis {
  basicInfo: {
    name?: string; // Extracted or inferred name
    age?: string;
    occupation?: string;
    constellation?: string;
    location?: string;
  };
  interests: string[];
  personalityTraits: string[];
  summary: string;
  // New: Opening line suggestions based on the profile
  openingLines: {
    style: string;
    content: string;
    explanation: string;
  }[];
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

export type MessageType = 'text' | 'profile_analysis' | 'chat_advice' | 'error';

export interface Message {
  id: string;
  role: 'user' | 'model';
  type: MessageType;
  content?: string;
  image?: string; // Base64
  profileData?: ProfileAnalysis; // If type is profile_analysis
  chatAdvice?: ChatAdvice; // If type is chat_advice
  timestamp: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  activeProfile?: ProfileAnalysis; // The profile context for this session
  lastUpdated: number;
}
