export type AnswerValue = 0 | 1 | 2 | 3;

export type GameArchetype = 
  | "premium_singleplayer"
  | "f2p_mobile"
  | "live_service"
  | "early_stage"
  | "aa_premium";

export interface GameMetadata {
  title: string;
  developer?: string;
  publisher?: string;
  platforms: string[];
  platform: 'steam' | 'mobile' | 'console' | 'web' | 'indie';
  price: number | "free";
  genre: string[];
  releaseState: 'upcoming' | 'early_access' | 'live';
  isMultiplayer: boolean;
  reviewScore?: number;
  reviewCount?: number;
  currentPlayers?: number;
  peakPlayers?: number;
  estimatedOwners?: string;
  estimatedRevenue?: string;
  copiesSold?: number;
  salesMilestone?: string;
  earningsRank?: number;
  lastUpdateDate?: string;
  imageUrl?: string;
  archetype: GameArchetype;
}

export interface Opportunity {
  category: string;
  diagnosis: string;
  actions: [string, string];
  relevance: "critical" | "high" | "medium";
}

export interface AIAnalysisResult {
  gameContext: GameMetadata;
  overallScore: number;
  opportunities: Opportunity[];
  gameUrl: string;
  timestamp: string;
}

export interface LeadData {
  email: string;
  name?: string;
  company?: string;
}

// Legacy types for backward compatibility
export interface Question {
  id: string;
  text: string;
  descriptions: {
    0: string;
    1: string;
    2: string;
    3: string;
  };
}

export interface Category {
  id: string;
  name: string;
  questions: Question[];
}

export interface Answer {
  categoryId: string;
  questionId: string;
  value: AnswerValue;
}

export interface CategoryScore {
  categoryId: string;
  categoryName: string;
  score: number;
  rawTotal: number;
  maxPossible: number;
}

export interface AnalysisResult {
  overallScore: number;
  categoryScores: CategoryScore[];
  lowestCategories: CategoryScore[];
  answers: Answer[];
  timestamp: string;
}
