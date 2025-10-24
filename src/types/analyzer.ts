export type AnswerValue = 0 | 1 | 2 | 3;

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

export interface LeadData {
  name?: string;
  email?: string;
  company?: string;
}
