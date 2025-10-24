import { AnalysisResult, LeadData, AIAnalysisResult } from "@/types/analyzer";
import { APP_CONFIG } from "@/config/appConfig";

export async function sendToWebhook(result: AIAnalysisResult | AnalysisResult, lead: LeadData): Promise<boolean> {
  if (!APP_CONFIG.webhookUrl) {
    return false;
  }

  try {
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

    const response = await fetch(APP_CONFIG.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error("Webhook error:", error);
    return false;
  }
}
