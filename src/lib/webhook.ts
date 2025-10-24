import { AnalysisResult, LeadData, AIAnalysisResult } from "@/types/analyzer";
import { APP_CONFIG } from "@/config/appConfig";
import { retryWithBackoff } from "./retryUtils";
import { addToWebhookQueue } from "./webhookQueue";

export async function sendToWebhook(result: AIAnalysisResult | AnalysisResult, lead: LeadData): Promise<boolean> {
  if (!APP_CONFIG.webhookUrl) {
    return false;
  }

  try {
    const success = await retryWithBackoff(
      () => sendWebhookRequest(result, lead),
      {
        maxAttempts: 3,
        delayMs: 2000,
        timeoutMs: 10000,
        onRetry: (attempt, error) => {
          console.log(`Webhook attempt ${attempt} failed:`, error.message);
        }
      }
    );
    return success;
  } catch (error) {
    console.error("All webhook attempts failed, adding to queue:", error);
    addToWebhookQueue(result as AIAnalysisResult, lead);
    return false;
  }
}

async function sendWebhookRequest(result: AIAnalysisResult | AnalysisResult, lead: LeadData): Promise<boolean> {
  // Check if it's the new AI analysis or legacy format
  const isAIAnalysis = 'gameContext' in result;

    const payload = isAIAnalysis ? {
      lead,
      gameUrl: (result as AIAnalysisResult).gameUrl,
      gameTitle: (result as AIAnalysisResult).gameContext.title,
      platform: (result as AIAnalysisResult).gameContext.platform,
      archetype: (result as AIAnalysisResult).gameContext.archetype,
      analysis: {
        overallScore: result.overallScore,
        opportunities: (result as AIAnalysisResult).opportunities.map(o => ({
          category: o.category,
          diagnosis: o.diagnosis,
          actions: o.actions,
          relevance: o.relevance
        })),
        timestamp: result.timestamp
      }
    } : {
      lead,
      analysis: {
        overallScore: result.overallScore,
        categoryScores: (result as AnalysisResult).categoryScores,
        lowestCategories: (result as AnalysisResult).lowestCategories.map(c => c.categoryName),
        timestamp: result.timestamp
      }
    };

  const response = await fetch(APP_CONFIG.webhookUrl!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}`);
  }

  return true;
}
