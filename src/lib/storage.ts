import { AnalysisResult, LeadData } from "@/types/analyzer";

const STORAGE_KEY = "evergreen_analysis_results";

export function saveResultToLocal(result: AnalysisResult, lead?: LeadData) {
  const stored = {
    result,
    lead,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function getStoredResult(): { result: AnalysisResult; lead?: LeadData } | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearStoredResult() {
  localStorage.removeItem(STORAGE_KEY);
}
